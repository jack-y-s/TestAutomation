const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Ensure public/js directory exists
const outdir = path.join(__dirname, 'public', 'js');
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

// Build all client TypeScript files
const clientFiles = [
  'welcome',
  'login',
  'products',
  'cart',
  'checkout',
  'order-confirmation',
  'register',
  'reset-password'
];

Promise.all(
  clientFiles.map(file =>
    esbuild.build({
      entryPoints: [path.join(__dirname, 'src', 'client', `${file}.ts`)],
      bundle: true,
      outfile: path.join(outdir, `${file}.js`),
      platform: 'browser',
      target: 'es2020',
      sourcemap: true,
      minify: process.env.NODE_ENV === 'production'
    })
  )
)
  .then(() => {
    console.log('Frontend TypeScript compiled successfully!');
  })
  .catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
  });
