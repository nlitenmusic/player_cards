Playwright capture + Figma upload helper

1) Install Playwright (you said you'll install it):

   npm install -D playwright

2) Start your dev server (in background):

   npm run dev

3) Capture screenshots (mobile viewport):

   npm run capture:figma

4) Validate Figma token (optional):

   FIGMA_TOKEN=fig_token_here npm run capture:figma:upload-help

Notes:
- The `capture` script saves PNGs to `./captures`.
- The helper checks your Figma token but cannot create a new Figma file via the public REST API; you'll need to drag the images into a new Figma file or use a Figma plugin for full automation.
- If you'd like, I can next implement a Playwright-driven browser automation that opens Figma's web UI and uploads images to a new file, but that requires an interactive session (email/password/2FA) or a pre-authenticated browser profile.
