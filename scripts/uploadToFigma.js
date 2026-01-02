const fs = require('fs');
const path = require('path');
const https = require('https');

function get(url, token) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'GET', headers: { 'X-Figma-Token': token, 'User-Agent': 'capture-upload-helper' } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async function uploadHelp() {
  const token = process.env.FIGMA_TOKEN;
  const capturesDir = path.join(process.cwd(), 'captures');
  if (!fs.existsSync(capturesDir)) {
    console.error('No captures folder found. Run `npm run capture:figma` first to generate screenshots.');
    process.exit(1);
  }

  const files = fs.readdirSync(capturesDir).filter((f) => f.endsWith('.png'));
  if (!files.length) {
    console.error('No PNG captures found in ./captures. Run the capture script first.');
    process.exit(1);
  }

  if (!token) {
    console.log('\nFIGMA_TOKEN not provided.');
    console.log('Please set FIGMA_TOKEN and re-run for a token validation check, e.g.:');
    console.log('\n  FIGMA_TOKEN=your_token_here npm run capture:figma:upload-help\n');
    console.log('Meanwhile, your captures are available in ./captures for manual upload into Figma (drag into a new file).');
    process.exit(0);
  }

  console.log('Validating FIGMA_TOKEN with GET https://api.figma.com/v1/me');
  try {
    const res = await get('https://api.figma.com/v1/me', token);
    if (res.status !== 200) {
      console.error(`Token check failed: HTTP ${res.status}`);
      console.error(res.body);
      process.exit(1);
    }
    const me = JSON.parse(res.body);
    console.log(`Token valid. Authenticated as: ${me.email} (name: ${me.handle || me.name || 'unknown'})`);
  } catch (err) {
    console.error('Token validation request failed:', err.message);
    process.exit(1);
  }

  console.log('\nImportant: The Figma REST API does not provide a public endpoint to create a new Figma document and populate it with images programmatically.');
  console.log('Recommended next steps:');
  console.log('- Create a new file in Figma (https://www.figma.com/).');
  console.log('- Open that file and drag the PNGs from the project `captures/` folder into the canvas to create frames.');
  console.log('- Alternatively, if you want a fully automated import into a specific existing Figma file, we can try to place these images into an existing file using a plugin-driven workflow (requires a plugin or interactive authentication).');

  console.log('\nLocal captures:');
  files.forEach((f) => console.log(` - ${path.join('captures', f)}`));
  console.log('\nIf you want, provide the destination Figma file key and I can generate a short step-by-step script (curl commands + mapping) to help paste these as image fills into selected frames, or we can attempt a plugin-based automation next.');
})();
