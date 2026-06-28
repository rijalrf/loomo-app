#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver').default || require('archiver');

const env = process.argv[2] || 'prod';

let extFolder = 'ext-prod';
if (env === 'local') extFolder = 'ext-local';
else if (env === 'qa') extFolder = 'ext-qa';

const rootDir = path.join(__dirname);
const extPath = path.join(rootDir, extFolder);
const outputPath = path.join(rootDir, 'web', 'public', `loomo-extension-${env}.zip`);

if (!fs.existsSync(extPath)) {
  console.error(`Error: ${extFolder} folder not found`);
  process.exit(1);
}

console.log(`Building extension package for: ${env}`);
console.log(`Source: ${extPath}`);
console.log(`Output: ${outputPath}`);

const output = fs.createWriteStream(outputPath);
const archive = new archiver.ZipArchive();

output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✓ Extension packaged successfully: ${sizeInMB} MB`);
  
  if (env === 'prod') {
    const symlinkPath = path.join(rootDir, 'web', 'public', 'loomo-extension.zip');
    if (fs.existsSync(symlinkPath)) {
      fs.unlinkSync(symlinkPath);
    }
    fs.copyFileSync(outputPath, symlinkPath);
    console.log(`✓ Copied to loomo-extension.zip (default)`);
  }
});

archive.on('error', (err) => {
  console.error('Error creating zip:', err);
  process.exit(1);
});

archive.pipe(output);
archive.directory(extPath, false);
archive.finalize();
