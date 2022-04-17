# **ts-dna**
A simple typescript utility library for working with nucleic acids, amino acids, and polypeptides. Going from DNA -> RNA -> Polypeptides has never been easier!

## Description
ts-dna aims to model and offer utilities for the biological relationship between nucleic acids, amino acids, and polypeptides. All classes are immutable, and validation is enforced on construction. Therefor, all instances of the classes will always be valid once constructed. ts-dna is a zero dependency library.

## Installing
npm:
```
npm install ts-dna
``` 

yarn:
```
yarn add ts-dna
```
## Library Documentation
Check out the full library documentation <a href="/doc/">here</a>.

## Examples
Below is a very brief and very contrived example of how some of this library's classes and its utilities might be used.

```typescript
const dnaSequence = 'ATGTGCGACGAATTC';
if(isValidNucleicAcidSequence(dnaSequence, NucleicAcidType.DNA)) {
    const dna = new DNA(dnaSequence);
    const rna = convertToRNA(dna);
    const polypeptide = new Polypeptide(rna);
}
const met1 = getAminoAcidByCodon(new RNA('AUG'));
const met2 = new AminoAcid(new RNA('AUG'));
met1?.equals(met2); // --> true
```

## License
This project is licensed under the MIT License - see the <a href="/LICENSE.md">LICENSE.md</a> file for details