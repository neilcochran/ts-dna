import { execSync } from 'child_process';

(function main() {
    console.log('\n*** Running eslint ***\n');
    execSync('eslint --ext .ts --fix .', {stdio: 'inherit'});
    console.log('\n*** Running cspell ***\n');
    try {
        execSync('cspell lint --unique --words-only "src/**/*"', {stdio: 'inherit'});
    } catch (error) {
        //suppress the node error and print a much simpler one since all the needed error info is printed by cspell
        throw new Error('CSpell found the above spelling issues. Either fix them, or add them to project-words.txt to be ignored');
    }
})();