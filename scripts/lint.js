import child_process from 'child_process';

(function main() {
    console.log('\n*** Running eslint ***\n');
    child_process.execSync('eslint --ext .ts --fix .');
    console.log('\n*** Running cspell ***\n');
    try {
        //with CSpell we lose the specific spelling error occurrence if we dont pass {stdio: 'inherit'}
        child_process.execSync('cspell lint "src/**/*"', {stdio: 'inherit'});
    } catch (error) {
        //suppress the node error and print a much simpler one since all the needed error info is printed by cspell
        throw new Error('CSpell found the above spelling issues. Either fix them, or add them to project-words.txt to be ignored');
    }
})();