const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async function capture() {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const routes = ['/', '/mockups/playercard', '/achievements', '/admin', '/admin/achievements'];
  const outDir = path.join(process.cwd(), 'captures');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'capture-script' });
    for (const route of routes) {
      const page = await context.newPage();
      const url = base.replace(/\/$/, '') + route;
      console.log(`Capturing ${url}`);
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        // admin has multiple client-side views — interact and capture sub-views when on /admin
        if (route === '/admin') {
          // capture the default admin landing
          await page.waitForTimeout(600);
          const adminFile = path.join(outDir, `admin.png`);
          await page.screenshot({ path: adminFile, fullPage: true });
          console.log(`Saved ${adminFile}`);

          // Capture Cards view
          try {
            await page.click('text=Cards');
            await page.waitForSelector('button:has-text("View Sessions"), button:has-text("Update Sessions")', { timeout: 8000 });
            await page.waitForTimeout(600);
            const cardsFile = path.join(outDir, `admin_cards.png`);
            await page.screenshot({ path: cardsFile, fullPage: true });
            console.log(`Saved ${cardsFile}`);
          } catch (e) {
            console.warn('Could not capture admin cards view:', e.message || e);
          }

          // Capture Leaderboards view
          try {
            await page.click('text=Leaderboards');
            await Promise.race([
              page.waitForSelector('text=Reference:', { timeout: 8000 }),
              page.waitForSelector('table tbody tr', { timeout: 10000 })
            ]);
            await page.waitForTimeout(600);
            const lbFile = path.join(outDir, `admin_leaderboard.png`);
            await page.screenshot({ path: lbFile, fullPage: true });
            console.log(`Saved ${lbFile}`);
          } catch (e) {
            console.warn('Could not capture admin leaderboards view:', e.message || e);
          }

          // Capture Add Session modal (open from Cards)
          try {
            await page.click('text=Cards');
            await page.waitForSelector('button:has-text("Update Sessions"), button:has-text("View Sessions")', { timeout: 8000 });
            const sessionButtonsSelector = 'button:has-text("Update Sessions"), button:has-text("View Sessions")';
            const vs = await page.$$(sessionButtonsSelector);
            if (vs && vs.length) {
              await vs[0].click();
              // Wait for modal UI to appear (Save button or Serve label)
              await Promise.race([
                page.waitForSelector('text=Save session', { timeout: 10000 }),
                page.waitForSelector('text=Serve', { timeout: 10000 })
              ]);
              // Also wait for backend data to load (player sessions + latest stats) and for the modal to populate
              try {
                await Promise.all([
                  page.waitForResponse((r) => r.url().includes('/api/admin/player-sessions') && r.status() === 200, { timeout: 10000 }),
                  page.waitForResponse((r) => r.url().includes('/api/admin/player-latest-stats') && r.status() === 200, { timeout: 10000 }).catch(() => {})
                ]);
              } catch (e) {
                // ignore if responses not observed in time
              }
              // Poll inside the modal until we see either session-date buttons, populated inputs, or computed values
              try {
                await page.waitForFunction(() => {
                  const hs = Array.from(document.querySelectorAll('h3')).find(h => h.textContent && h.textContent.includes('Add / Edit Session'));
                  if (!hs) return false;
                  const modal = hs.closest('div');
                  if (!modal) return false;
                  // session date buttons like 2025-12-30
                  const btns = Array.from(modal.querySelectorAll('button')).map(b => (b.textContent||'').trim());
                  if (btns.some(t => /\d{4}-\d{2}-\d{2}/.test(t))) return true;
                  // inputs with non-empty value
                  const inputs = Array.from(modal.querySelectorAll('table tbody tr input'));
                  if (inputs.some(i => (i.value || '').trim() !== '')) return true;
                  // computed column (last td) has text
                  const rows = Array.from(modal.querySelectorAll('table tbody tr'));
                  for (const r of rows) {
                    const last = r.querySelector('td:last-child');
                    if (last && (last.textContent||'').trim() !== '') return true;
                  }
                  return false;
                }, { timeout: 15000 });
              } catch (e) {
                // if polling times out, proceed anyway
              }
              await page.waitForTimeout(300);
              // Improve modal capture: enlarge viewport and clip to modal bounding box for a component screenshot
              let originalViewport = null;
              try {
                originalViewport = page.viewportSize();
              } catch (e) {
                originalViewport = null;
              }
              try {
                await page.setViewportSize({ width: 900, height: 1200 });
              } catch (e) {
                // ignore if not supported
              }
              await page.waitForTimeout(300);
              const modalLocator = page.locator('div:has(h3:has-text("Add / Edit Session"))').first();
              const box = await modalLocator.boundingBox();
              if (box) {
                const compFile = path.join(outDir, `admin_addsession_component.png`);
                await page.screenshot({ path: compFile, clip: { x: Math.max(0, Math.floor(box.x)), y: Math.max(0, Math.floor(box.y)), width: Math.ceil(box.width), height: Math.ceil(box.height) } });
                console.log(`Saved ${compFile}`);
              } else {
                const modalFile = path.join(outDir, `admin_addsession.png`);
                await page.screenshot({ path: modalFile, fullPage: true });
                console.log(`Saved ${modalFile}`);
              }
              // restore viewport
              if (originalViewport && originalViewport.width && originalViewport.height) {
                try { await page.setViewportSize(originalViewport); } catch (e) {}
              }
            }
          } catch (e) {
            console.warn('Could not capture add-session modal:', e.message || e);
          }
          // Capture Add New Player modal (open from top-right Add New Player)
          try {
            // If Add / Edit Session modal is open, close it first so the top bar button is clickable
            try {
              const sessionClose = page.locator('div:has(h3:has-text("Add / Edit Session")) button:has-text("Close")').first();
              if (await sessionClose.count() > 0) {
                await sessionClose.click().catch(() => {});
                // wait for modal to be removed
                await page.waitForSelector('h3:has-text("Add / Edit Session")', { state: 'detached', timeout: 4000 }).catch(() => {});
              }
            } catch (e) {}
            // ensure top is visible
            await page.evaluate(() => window.scrollTo(0, 0));
            // Click and capture immediately — modal is empty for new player
            await page.click('text=Add New Player');
            // tiny pause for DOM update only (capture should be instant)
            await page.waitForTimeout(120);
            // Try to clip to the modal that contains the name inputs; fallback to h3 match or full page
            const modalByInputs = page.locator('div:has(input[placeholder="First name"])').first();
            let box2 = null;
            try { box2 = await modalByInputs.boundingBox(); } catch (e) { box2 = null; }
            if (!box2) {
              try {
                const modalByH3 = page.locator('div:has(h3:has-text("Add / Edit Session"))').first();
                box2 = await modalByH3.boundingBox();
              } catch (e) { box2 = null; }
            }
            // temporarily enlarge viewport for component screenshot accuracy
            let orig = null;
            try { orig = page.viewportSize(); } catch (e) { orig = null; }
            try { await page.setViewportSize({ width: 1200, height: 1600 }); } catch (e) {}
            await page.waitForTimeout(80);

            // Expand modal to full scroll height so clipped screenshot captures all content (prevents cut-off)
            try {
              await page.evaluate(() => {
                const hs = Array.from(document.querySelectorAll('h3')).find(h => h.textContent && h.textContent.includes('Add / Edit Session'));
                if (!hs) return false;
                const modal = hs.closest('div');
                if (!modal) return false;
                // relax height constraints and allow overflow to be visible
                try {
                  modal.style.maxHeight = 'none';
                  modal.style.height = modal.scrollHeight + 'px';
                  modal.style.overflow = 'visible';
                  const overlay = modal.parentElement;
                  if (overlay) overlay.style.overflow = 'visible';
                } catch (e) {}
                return true;
              });
            } catch (e) {}

            // Recompute bounding box after expansion
            try {
              const modalLocator3 = page.locator('div:has(h3:has-text("Add / Edit Session"))').first();
              const expandedBox = await modalLocator3.boundingBox();
              if (expandedBox) {
                const compFile2 = path.join(outDir, `admin_addplayer_component.png`);
                await page.screenshot({ path: compFile2, clip: { x: Math.max(0, Math.floor(expandedBox.x)), y: Math.max(0, Math.floor(expandedBox.y)), width: Math.ceil(expandedBox.width), height: Math.ceil(expandedBox.height) } });
                console.log(`Saved ${compFile2}`);
              } else {
                const fallback = path.join(outDir, `admin_addplayer.png`);
                await page.screenshot({ path: fallback, fullPage: true });
                console.log(`Saved ${fallback}`);
              }
            } catch (e) {
              const fallback = path.join(outDir, `admin_addplayer.png`);
              await page.screenshot({ path: fallback, fullPage: true });
              console.log(`Saved ${fallback}`);
            }

            if (orig && orig.width && orig.height) {
              try { await page.setViewportSize(orig); } catch (e) {}
            }
          } catch (e) {
            console.warn('Could not capture add-player modal:', e.message || e);
          }
        } else {
          // default single-page capture (home, mockup, achievements, admin/achievements)
          await page.waitForTimeout(600); // let animations settle
          const name = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');
          const file = path.join(outDir, `${name}.png`);
          await page.screenshot({ path: file, fullPage: true });
          console.log(`Saved ${file}`);
        }
      } catch (err) {
        console.error(`Failed capturing ${url}:`, err.message);
      } finally {
        await page.close();
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }
  console.log(`All captures saved to ${outDir}`);
})();
