#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${filePath} not found`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const config = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=').trim();
    
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (!isNaN(value) && value !== '') value = Number(value);
    
    config[key.trim()] = value;
  });

  return config;
}

function generateConfigJs(config, outputPath) {
  const configContent = `// Loomo Capture Engine Configuration
// Auto-generated from .env.extension - DO NOT EDIT MANUALLY
globalThis.LoomoConfig = ${JSON.stringify(config, null, 2)};
`;

  fs.writeFileSync(outputPath, configContent, 'utf-8');
  console.log(`✓ Generated ${outputPath}`);
}

const envPath = path.join(__dirname, '.env.extension');
const config = parseEnv(envPath);

const targets = [
  path.join(__dirname, 'ext-local', 'config.js'),
  path.join(__dirname, 'ext-prod', 'config.js'),
  path.join(__dirname, 'ext-qa', 'config.js')
];

targets.forEach(target => {
  if (fs.existsSync(path.dirname(target))) {
    generateConfigJs(config, target);
  }
});

console.log('\n✓ Extension config generated successfully!');
