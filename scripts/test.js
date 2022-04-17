import child_process from 'child_process';

(function main () {
    console.log('\n*** Running tests ***\n');
    try {
        child_process.execSync('jest');
    } catch(error) {
        //suppress the node error and print a much simpler one since all the needed error info is printed jest
        throw new Error('Tests did not pass.');
    }
})();
