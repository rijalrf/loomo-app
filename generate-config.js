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
    if (!line || line.startsWith('#') || line.startsWith('=')) return;
    
    const [key, ...valueParts] = line.split('=');
    if (!key || !valueParts.length) return;
    
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

function generateExtensionConfig(allConfig, env) {
  let apiBaseUrl;
  
  if (env === 'local') {
    apiBaseUrl = allConfig.EXT_API_BASE_URL_LOCAL || 'http://localhost:8999';
  } else if (env === 'qa') {
    apiBaseUrl = allConfig.EXT_API_BASE_URL_QA || 'https://qa.loomo.my.id';
  } else {
    apiBaseUrl = allConfig.EXT_API_BASE_URL || 'https://www.loomo.my.id';
  }
  
  return {
    API_BASE_URL: apiBaseUrl,
    MAX_RECORDING_MINUTES: allConfig.EXT_MAX_RECORDING_MINUTES || 4,
    WARNING_RECORDING_MINUTES: allConfig.EXT_WARNING_RECORDING_MINUTES || 2,
    DEBUG: allConfig.EXT_DEBUG !== undefined ? allConfig.EXT_DEBUG : true
  };
}

function generateConfigJs(config, outputPath) {
  const configContent = `// Loomo Capture Engine Configuration
// Auto-generated from .env - DO NOT EDIT MANUALLY
globalThis.LoomoConfig = ${JSON.stringify(config, null, 2)};
`;

  fs.writeFileSync(outputPath, configContent, 'utf-8');
  console.log(`✓ Generated ${outputPath}`);
}

const envPath = path.join(__dirname, '.env');
const allConfig = parseEnv(envPath);

const targets = [
  { path: path.join(__dirname, 'ext-local', 'config.js'), env: 'local' },
  { path: path.join(__dirname, 'ext-qa', 'config.js'), env: 'qa' },
  { path: path.join(__dirname, 'ext-prod', 'config.js'), env: 'prod' }
];

targets.forEach(target => {
  if (fs.existsSync(path.dirname(target.path))) {
    const extensionConfig = generateExtensionConfig(allConfig, target.env);
    generateConfigJs(extensionConfig, target.path);
  }
});

console.log('\n✓ Extension config generated successfully from .env!');
