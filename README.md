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
Check out the full library documentation <a href="http://www.neilcochran.com/ts-dna/">here</a>.

## Examples
Below are some very brief (and contrived) examples of how some of this library's classes and its utilities might be used.

```typescript
//Create complex IUPAC nucleotide symbol pattern regular expressions
const nucleotidePattern = new NucleotidePattern('^N*Y?A+(WY){3}$');
const dnaMatch = new DNA('ATCGATCGATCGATCGCAAAACTCTC');
nucleotidePattern.matches(dnaMatch); // --> true
nucleotidePattern.patternRegex; // --> '^[AaGgCcTt]*[CcTt]?[Aa]+([AaTt][CcTt]){3}$'

//Go from DNA -> RNA -> Polypeptide
const dna = new DNA('ATGTGCGACGAATTC');
const rna = convertToRNA(dna);
const polypeptide = new Polypeptide(rna);


//Get and compare amino acids
const met1 = getAminoAcidByCodon(new RNA('AUG'));
const met2 = new AminoAcid(new RNA('AUG'));
met1?.equals(met2); // --> true
```

## License
This project is licensed under the MIT License - see the <a href="/LICENSE.md">LICENSE.md</a> file for details