import fs from 'fs';
import pngToIco from 'png-to-ico';

(async () => {
  try {
    const buf = await pngToIco('./public/logo.png');
    fs.writeFileSync('./public/favicon.ico', buf);
    console.log('favicon.ico written to ./public/favicon.ico');
  } catch (err) {
    console.error('failed to create favicon.ico', err);
    process.exit(1);
  }
})();
