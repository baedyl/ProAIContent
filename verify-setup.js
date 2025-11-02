#!/usr/bin/env node

/**
 * ProAIContent Setup Verification Script
 * Run this script to verify your installation is correct
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 ProAIContent Setup Verification\n');
console.log('=' .repeat(50));

let allChecksPassed = true;

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
  allChecksPassed = false;
}

function warning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function info(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

// Check 1: Node.js version
console.log('\n1. Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion >= 18) {
  success(`Node.js ${nodeVersion} (✓ >= 18.0.0)`);
} else {
  error(`Node.js ${nodeVersion} (requires >= 18.0.0)`);
  info('  Download from: https://nodejs.org/');
}

// Check 2: Required files
console.log('\n2. Checking required files...');
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'tailwind.config.js',
  'next.config.js',
  'app/layout.tsx',
  'app/page.tsx',
  'app/globals.css',
  'app/api/generate/route.ts',
  'components/Dashboard.tsx',
  'components/ContentGenerator.tsx',
  'components/GenerationForm.tsx',
  'components/ContentPreview.tsx',
  'components/ProjectsManager.tsx',
  'components/Sidebar.tsx',
  'lib/seo-optimizer.ts',
  'lib/humanization.ts'
];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    success(`${file}`);
  } else {
    error(`${file} is missing`);
  }
});

// Check 3: Environment variables
console.log('\n3. Checking environment configuration...');
const envPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  success('.env.local exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('OPENAI_API_KEY=')) {
    const keyMatch = envContent.match(/OPENAI_API_KEY=(.+)/);
    if (keyMatch && keyMatch[1] && keyMatch[1].trim() !== 'your_openai_api_key_here' && keyMatch[1].trim() !== '') {
      success('OPENAI_API_KEY is configured');
    } else {
      error('OPENAI_API_KEY is not properly configured');
      info('  Set your OpenAI API key in .env.local');
    }
  } else {
    error('OPENAI_API_KEY not found in .env.local');
  }
} else {
  error('.env.local does not exist');
  info('  Copy .env.example to .env.local and add your OpenAI API key');
  
  if (fs.existsSync(path.join(process.cwd(), '.env.example'))) {
    info('  Run: cp .env.example .env.local');
  }
}

// Check 4: Dependencies
console.log('\n4. Checking dependencies...');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');

if (fs.existsSync(nodeModulesPath)) {
  success('node_modules exists');
  
  // Check key dependencies
  const keyDeps = [
    'next',
    'react',
    'react-dom',
    'typescript',
    'tailwindcss',
    'openai',
    'framer-motion'
  ];
  
  keyDeps.forEach(dep => {
    const depPath = path.join(nodeModulesPath, dep);
    if (fs.existsSync(depPath)) {
      success(`${dep} installed`);
    } else {
      error(`${dep} not installed`);
    }
  });
} else {
  error('node_modules not found');
  info('  Run: npm install');
}

// Check 5: Build directory
console.log('\n5. Checking build status...');
const nextPath = path.join(process.cwd(), '.next');

if (fs.existsSync(nextPath)) {
  success('Next.js build directory exists');
} else {
  warning('No build found (run npm run dev or npm run build)');
}

// Check 6: Documentation
console.log('\n6. Checking documentation...');
const docFiles = [
  'README.md',
  'SETUP.md',
  'FEATURES.md',
  'QUICKSTART.md',
  'API_DOCUMENTATION.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md'
];

docFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    success(`${file}`);
  } else {
    warning(`${file} not found`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Verification Summary\n');

if (allChecksPassed) {
  console.log(`${colors.green}✓ All checks passed!${colors.reset}`);
  console.log('\n🚀 You\'re ready to start generating content!');
  console.log('\nNext steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open: http://localhost:3000');
  console.log('  3. Start creating amazing content!');
} else {
  console.log(`${colors.red}✗ Some checks failed${colors.reset}`);
  console.log('\nPlease fix the errors above and run this script again.');
  console.log('\nFor help, check:');
  console.log('  - SETUP.md for detailed setup instructions');
  console.log('  - QUICKSTART.md for quick setup guide');
  console.log('  - README.md for general information');
}

console.log('\n' + '='.repeat(50) + '\n');

process.exit(allChecksPassed ? 0 : 1);


