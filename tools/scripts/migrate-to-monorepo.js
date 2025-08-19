#!/usr/bin/env node
/**
 * LicitaReview - Migration Script to Monorepo Structure
 * 
 * This script migrates the existing project structure to the new
 * organized monorepo layout.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
// import { fileURLToPath } from 'url'; // Comentado - não utilizado no momento

// const __filename = fileURLToPath(import.meta.url); // Comentado - não utilizado no momento
// const __dirname = path.dirname(__filename); // Comentado - não utilizado no momento

const CURRENT_DIR = process.cwd();
const BACKUP_DIR = path.join(CURRENT_DIR, '.migration-backup');

console.log('🚀 LicitaReview - Monorepo Migration Script');
console.log('============================================');

async function createBackup() {
  console.log('\n📦 Creating backup of current structure...');
  
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // Backup important files
    const filesToBackup = [
      'src',
      'public', 
      'docs',
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'index.html'
    ];
    
    for (const file of filesToBackup) {
      const srcPath = path.join(CURRENT_DIR, file);
      const destPath = path.join(BACKUP_DIR, file);
      
      try {
        await fs.access(srcPath);
        execSync(`cp -r "${srcPath}" "${destPath}"`);
        console.log(`✅ Backed up: ${file}`);
      } catch (error) {
        console.log(`⚠️  Skipped: ${file} (not found)`);
      }
    }
    
    console.log('✅ Backup completed successfully');
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

async function migrateToMonorepo() {
  console.log('\n🏗️ Migrating to monorepo structure...');
  
  try {
    // Create new directory structure
    const newDirs = [
      'apps/web/src',
      'apps/web/public',
      'services/api/src',
      'services/analyzer/src',
      'packages/types/src',
      'packages/ui/src',
      'packages/utils/src',
      'tools/scripts',
      'tools/config',
      'docs/api',
      'docs/architecture',
      'tests/e2e',
      'tests/integration',
      'deployment/gcp'
    ];
    
    for (const dir of newDirs) {
      await fs.mkdir(path.join(CURRENT_DIR, dir), { recursive: true });
      console.log(`📁 Created: ${dir}`);
    }
    
    // Move existing frontend files
    console.log('\n🔄 Moving frontend files...');
    
    const frontendMoves = [
      { from: 'src', to: 'apps/web/src' },
      { from: 'public', to: 'apps/web/public' },
      { from: 'index.html', to: 'apps/web/index.html' },
      { from: 'vite.config.ts', to: 'apps/web/vite.config.ts' },
      { from: 'tailwind.config.ts', to: 'apps/web/tailwind.config.ts' },
      { from: 'tsconfig.json', to: 'apps/web/tsconfig.json' },
      { from: 'tsconfig.app.json', to: 'apps/web/tsconfig.app.json' },
      { from: 'tsconfig.node.json', to: 'apps/web/tsconfig.node.json' },
      { from: 'postcss.config.js', to: 'apps/web/postcss.config.js' }
    ];
    
    for (const move of frontendMoves) {
      const fromPath = path.join(CURRENT_DIR, move.from);
      const toPath = path.join(CURRENT_DIR, move.to);
      
      try {
        await fs.access(fromPath);
        execSync(`mv "${fromPath}" "${toPath}"`);
        console.log(`✅ Moved: ${move.from} → ${move.to}`);
      } catch (error) {
        console.log(`⚠️  Skipped: ${move.from} (not found)`);
      }
    }
    
    // Move backend files
    console.log('\n🔄 Moving backend files...');
    
    const backendMoves = [
      { from: 'cloud-run-services/document-analyzer/functions', to: 'services/api' },
      { from: 'cloud-run-services/document-analyzer/models', to: 'services/analyzer/src/models' },
      { from: 'cloud-run-services/document-analyzer/requirements.txt', to: 'services/analyzer/requirements.txt' }
    ];
    
    for (const move of backendMoves) {
      const fromPath = path.join(CURRENT_DIR, move.from);
      const toPath = path.join(CURRENT_DIR, move.to);
      
      try {
        await fs.access(fromPath);
        execSync(`cp -r "${fromPath}/" "${toPath}/"`);
        console.log(`✅ Copied: ${move.from} → ${move.to}`);
      } catch (error) {
        console.log(`⚠️  Skipped: ${move.from} (not found)`);
      }
    }
    
    console.log('✅ File migration completed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function updatePackageJson() {
  console.log('\n📝 Updating package.json files...');
  
  try {
    // Replace root package.json
    const newPackageJsonPath = path.join(CURRENT_DIR, 'package.json.new');
    const packageJsonPath = path.join(CURRENT_DIR, 'package.json');
    
    await fs.access(newPackageJsonPath);
    execSync(`mv "${newPackageJsonPath}" "${packageJsonPath}"`);
    console.log('✅ Updated root package.json');
    
    // Update README
    const newReadmePath = path.join(CURRENT_DIR, 'README.md.new');
    const readmePath = path.join(CURRENT_DIR, 'README.md');
    
    await fs.access(newReadmePath);
    execSync(`mv "${newReadmePath}" "${readmePath}"`);
    console.log('✅ Updated README.md');
    
  } catch (error) {
    console.error('❌ Failed to update package.json:', error);
  }
}

async function installDependencies() {
  console.log('\n📦 Installing dependencies...');
  
  try {
    // Install root dependencies
    console.log('Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error);
  }
}

async function cleanupOldStructure() {
  console.log('\n🧹 Cleaning up old structure...');
  
  const filesToCleanup = [
    'cloud-run-services',
    'node_modules',
    'package-lock.json'
  ];
  
  for (const file of filesToCleanup) {
    try {
      const filePath = path.join(CURRENT_DIR, file);
      await fs.access(filePath);
      execSync(`rm -rf "${filePath}"`);
      console.log(`✅ Cleaned up: ${file}`);
    } catch (error) {
      console.log(`⚠️  Skipped: ${file} (not found)`);
    }
  }
}

async function displaySuccess() {
  console.log('\n🎉 Migration completed successfully!');
  console.log('=====================================');
  console.log('\n📁 New structure created:');
  console.log('├── apps/web/          # Frontend React');
  console.log('├── services/api/      # Cloud Functions');
  console.log('├── services/analyzer/ # Python analyzer');
  console.log('├── packages/          # Shared packages');
  console.log('├── tools/             # Development tools');
  console.log('└── docs/              # Documentation');
  
  console.log('\n🚀 Next steps:');
  console.log('1. npm run dev         # Start development');
  console.log('2. npm run build       # Build all packages');
  console.log('3. npm run test        # Run tests');
  
  console.log('\n💾 Backup available at: .migration-backup/');
  console.log('\n🎯 Happy coding with the new monorepo structure!');
}

async function main() {
  try {
    await createBackup();
    await migrateToMonorepo();
    await updatePackageJson();
    await installDependencies();
    await cleanupOldStructure();
    await displaySuccess();
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\n🔄 You can restore from backup: .migration-backup/');
    process.exit(1);
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}