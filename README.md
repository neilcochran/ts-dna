# **ts-dna**
A simple typescript utility library for working with nucleic acids, amino acids, and polypeptides. Going from DNA -> RNA -> Polypeptides has never been easier!

## Description
ts-dna aims to model and offer utilites for the biological relationship between nucleic acids, amino acids, and polypeptides. All classes are immutable, and validation is enforced on construction. Therefor, all instances of the classes will always be valid once constructed. ts-dna is a zero dependency library.

## Installing
npm:
```
npm install ts-dna
``` 

yarn:
```
yarn add ts-dna
```

## Examples
Below is a very brief and very contrieved example of how some of this library's classes and its utilities might be used.

```typescript
const dnaSequence = 'ATGTGCGACGAATTC';
if(isValidNucleicAcidSequence(dnaSequence, NucleicAcidType.DNA)) {
    const dna = new DNA(dnaSequence);
    const rna = convertToRNA(dna);
    const polypeptide = new Polypeptide(rna);
    console.log(${JSON.stringify(polypeptide, undefined, 2)});
}
const met1 = getAminoAcidByCodon(new RNA('AUG'));
const met2 = new AminoAcid(new RNA('AUG'));
console.log(met1?.equals(met2)); // --> true
```

Resulting polypeptide:

```json
{
  "nucleicAcid": {
    "nucleicAcidType": "RNA",
    "sequence": "AUGUGCGACGAAUUC"
  },
  "aminoAcidSequence": [
    {
      "name": "Methionine",
      "abbrv": "Met",
      "slc": "M",
      "acidType": "RNA",
      "codon": {
        "nucleicAcidType": "RNA",
        "sequence": "AUG"
      }
    },
    {
      "name": "Cysteine",
      "abbrv": "Cys",
      "slc": "C",
      "acidType": "RNA",
      "codon": {
        "nucleicAcidType": "RNA",
        "sequence": "UGC"
      }
    },
    {
      "name": "Aspartic acid",
      "abbrv": "Asp",
      "slc": "D",
      "acidType": "RNA",
      "codon": {
        "nucleicAcidType": "RNA",
        "sequence": "GAC"
      }
    },
    {
      "name": "Glutamic acid",
      "abbrv": "Glu",
      "slc": "E",
      "acidType": "RNA",
      "codon": {
        "nucleicAcidType": "RNA",
        "sequence": "GAA"
      }
    },
    {
      "name": "Phenylalanine",
      "abbrv": "Phe",
      "slc": "F",
      "acidType": "RNA",
      "codon": {
        "nucleicAcidType": "RNA",
        "sequence": "UUC"
      }
    }
  ]
}
```

## License

This project is licensed under the MIT License - see the <a href="/LICENSE.md">LICENSE.md</a> file for details