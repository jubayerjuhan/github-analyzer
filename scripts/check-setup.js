#!/usr/bin/env node

/**
 * Setup verification script for GoodHive GitHub Analyzer
 * Checks if all required environment variables are configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking GoodHive GitHub Analyzer setup...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('\n📝 Please create a .env file:');
  console.log('   cp .env.example .env');
  console.log('   Then edit .env with your API keys\n');
  process.exit(1);
}

console.log('✅ .env file found');

// Load environment variables
require('dotenv').config();

const checks = [
  {
    name: 'GITHUB_TOKEN',
    value: process.env.GITHUB_TOKEN,
    required: true,
    hint: 'Get one at: https://github.com/settings/tokens',
  },
  {
    name: 'OPENAI_API_KEY',
    value: process.env.OPENAI_API_KEY,
    required: true,
    hint: 'Get one at: https://platform.openai.com/api-keys',
  },
  {
    name: 'OPENAI_MODEL',
    value: process.env.OPENAI_MODEL,
    required: false,
    hint: 'Optional, defaults to gpt-4-turbo-preview',
  },
];

let allValid = true;

console.log('\n🔐 Checking environment variables:\n');

for (const check of checks) {
  const hasValue = check.value && check.value.trim() !== '';

  if (check.required) {
    if (hasValue) {
      const masked = check.value.substring(0, 8) + '...' + check.value.substring(check.value.length - 4);
      console.log(`✅ ${check.name}: ${masked}`);
    } else {
      console.log(`❌ ${check.name}: Missing!`);
      console.log(`   ${check.hint}`);
      allValid = false;
    }
  } else {
    if (hasValue) {
      console.log(`✅ ${check.name}: ${check.value}`);
    } else {
      console.log(`⚠️  ${check.name}: Not set (using default)`);
    }
  }
}

console.log('');

if (allValid) {
  console.log('🎉 All required environment variables are configured!\n');
  console.log('📦 Next steps:');
  console.log('   npm run dev     - Start development server');
  console.log('   npm run build   - Build for production');
  console.log('   npm start       - Run production server\n');
  process.exit(0);
} else {
  console.log('⚠️  Some required environment variables are missing.');
  console.log('   Please update your .env file and try again.\n');
  process.exit(1);
}
