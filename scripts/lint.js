const child_process = require('child_process');

(function main() {
    console.log('\n*** Running eslint ***\n');
    child_process.execSync('eslint --ext .ts --fix .', {stdio: 'inherit'});
    console.log('\n*** Running cspell ***\n');
    try {
        child_process.execSync('cspell lint --unique --words-only "src/**/*"', {stdio: 'inherit'});
    } catch (error) {
        //suppress the node error and print a much simpler one since all the needed error info is printed by cspell
        throw new Error('CSpell found the above spelling issues. Either fix them, or add them to project-words.txt to be ignored');
    }
})();