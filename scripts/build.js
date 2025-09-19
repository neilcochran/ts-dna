import { execSync } from 'child_process';
import { existsSync, copyFileSync } from 'fs';

(function main() {
    console.log('🏗️  Starting ts-dna build process...\n');

    // Run linting (ESLint + CSpell)
    console.log('🔍 Step 1: Linting code...');
    try {
        execSync('npm run lint', {stdio: 'inherit'});
        console.log('✅ Linting completed successfully - no issues found');
    } catch (error) {
        console.error('❌ Linting found issues that need to be fixed');
        process.exit(1);
    }

    // Run tests
    console.log('\n🧪 Step 2: Running tests...');
    console.log('Running Jest tests...');
    try {
        execSync('jest', {stdio: 'inherit'});
        console.log('✅ All tests passed!');
    } catch (error) {
        console.error('❌ Tests failed - see output above for details');
        process.exit(1);
    }

    // Clear previous build
    console.log('\n🧹 Step 3: Clearing previous build...');
    execSync('rimraf dist/ dist-cjs/');
    console.log('✅ Previous build cleared');

    // Build ESM
    console.log('\n📦 Step 4: Compiling ESM build...');
    try {
        execSync('tsc', {stdio: 'inherit'});
        console.log('✅ ESM build completed successfully');
    } catch (error) {
        console.log('\n🧹 Cleaning failed ESM build...');
        execSync('rimraf dist/');
        console.error('❌ TypeScript compilation failed for ESM build');
        process.exit(1);
    }

    // Build CommonJS
    console.log('\n📦 Step 5: Compiling CommonJS build...');
    try {
        execSync('tsc -p tsconfig.cjs.json', {stdio: 'inherit'});

        // Rename the main CommonJS file to .cjs extension
        if (existsSync('dist-cjs/index.js')) {
            copyFileSync('dist-cjs/index.js', 'dist/index.cjs');
            console.log('✅ CommonJS entry point created: dist/index.cjs');
        }

        execSync('rimraf dist-cjs/');
        console.log('✅ CommonJS build completed successfully');
    } catch (error) {
        console.log('\n🧹 Cleaning failed CommonJS build...');
        execSync('rimraf dist-cjs/');
        console.error('❌ TypeScript compilation failed for CommonJS build');
        process.exit(1);
    }

    console.log('\n🎉 Build completed successfully! Package is ready for publishing.');
    console.log('📁 Output: dist/ (ESM: .js, CommonJS: .cjs, Types: .d.ts)');
})();