#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver').default || require('archiver');

const environments = ['local', 'qa', 'prod'];

function buildExtension(env) {
  return new Promise((resolve, reject) => {
    const extFolder = `ext-${env}`;
    const rootDir = path.join(__dirname);
    const extPath = path.join(rootDir, extFolder);
    const outputPath = path.join(rootDir, 'web', 'public', `loomo-extension-${env}.zip`);

    if (!fs.existsSync(extPath)) {
      console.error(`Error: ${extFolder} folder not found`);
      reject(new Error(`${extFolder} not found`));
      return;
    }

    console.log(`\nBuilding extension package for: ${env}`);
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
      
      resolve();
    });

    archive.on('error', (err) => {
      console.error(`Error creating zip for ${env}:`, err);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(extPath, false);
    archive.finalize();
  });
}

async function buildAll() {
  console.log('Building all extension environments...\n');
  
  for (const env of environments) {
    try {
      await buildExtension(env);
    } catch (err) {
      console.error(`Failed to build ${env}:`, err.message);
      process.exit(1);
    }
  }
  
  console.log('\n✓ All extension packages built successfully!');
}

buildAll();
