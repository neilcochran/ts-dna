import child_process from 'child_process';

(function main() {
    //lint
    child_process.execSync('node scripts/lint.js', {stdio: 'inherit'});
    //test
    child_process.execSync('node scripts/test.js', {stdio: 'inherit'});
    //remove old build
    console.log('\n*** Clearing previous build ***\n');
    child_process.execSync('rimraf dist/');
    console.log('\n*** Compiling new build ***\n');
    //build
    try {
        //with tsc we lose the specific compilation error occurrences if we dont pass {stdio: 'inherit'}
        child_process.execSync('tsc', {stdio: 'inherit'});
    } catch(error) {
        //remove any code that may have been compiled before the error was encountered
        console.log('\n*** Cleaning failed build ***\n');
        child_process.execSync('rimraf dist/');
        //suppress the node error and print a much simpler one since all the needed error info is printed by tsc
        throw new Error('tsc failed to compile.');
    }

    //regenerate documentation
    child_process.execSync('node scripts/documentation.js', {stdio: 'inherit'});
})();