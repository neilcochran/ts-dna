import { execSync } from 'child_process';

console.log('\n*** Clearing previous documentation ***\n');
execSync('rimraf /doc');
console.log('\n*** Generating new documentation ***\n');
try {
    execSync('typedoc --includeVersion --readme none --out doc src/');
} catch (error) {
    //suppress the node error and print a much simpler one since all the needed error info is printed by TypeDoc
    throw new Error('TypeDoc failed to generate documentation');
}