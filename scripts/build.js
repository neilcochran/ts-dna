import { execSync } from 'child_process';
import { existsSync, copyFileSync } from 'fs';

(function main() {
    //lint
    execSync('node scripts/lint.js', {stdio: 'inherit'});
    //test
    execSync('node scripts/test.js', {stdio: 'inherit'});
    //remove old build
    console.log('\n*** Clearing previous build ***\n');
    execSync('rimraf dist/ dist-cjs/');
    console.log('\n*** Compiling ESM build ***\n');
    //build ESM
    try {
        //with tsc we lose the specific compilation error occurrences if we don't pass {stdio: 'inherit'}
        execSync('tsc', {stdio: 'inherit'});
    } catch(error) {
        //remove any code that may have been compiled before the error was encountered
        console.log('\n*** Cleaning failed ESM build ***\n');
        execSync('rimraf dist/');
        //suppress the node error and print a much simpler one since all the needed error info is printed by tsc
        throw new Error('tsc failed to compile ESM build.');
    }
    
    console.log('\n*** Compiling CommonJS build ***\n');
    //build CommonJS
    try {
        execSync('tsc -p tsconfig.cjs.json', {stdio: 'inherit'});
        // Rename the main CommonJS file to .cjs extension
        if (existsSync('dist-cjs/index.js')) {
            copyFileSync('dist-cjs/index.js', 'dist/index.cjs');
        }
        execSync('rimraf dist-cjs/');
    } catch(error) {
        console.log('\n*** Cleaning failed CommonJS build ***\n');
        execSync('rimraf dist-cjs/');
        throw new Error('tsc failed to compile CommonJS build.');
    }
})();