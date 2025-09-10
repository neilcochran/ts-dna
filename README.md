# **ts-dna**

A modern TypeScript library for working with nucleic acids, amino acids, and polypeptides. Going from DNA → RNA → Polypeptides has never been easier!

## Features

- 🧬 **Type-safe** models for DNA, RNA, amino acids, and polypeptides
- 🛡️ **Immutable** objects with validation enforced at construction
- 🔄 **Functional error handling** with ValidationResult pattern (no exceptions)
- 📦 **Zero dependencies** - lightweight and secure
- 🌐 **Dual module support** - works with both ESM and CommonJS
- 🧪 **IUPAC compliant** nucleotide pattern matching

## Requirements

- Node.js ≥18.0.0
- TypeScript ≥5.0 (recommended)

## Installation

```bash
npm install ts-dna
```

```bash
yarn add ts-dna
```

## What You Can Do

### 🧬 Model Biological Sequences

```typescript
const dna = new DNA('ATGTGCGACGAATTC');
const rna = new RNA('AUGCCCAAAUUU', RNASubType.M_RNA);
console.log(dna.getComplement()); // "TACGCGCTCAAG"
```

### 🔄 Convert Between Nucleic Acids

```typescript
const dna = new DNA('ATGTGCGACGAATTC');
const rna = convertToRNA(dna);        // DNA → RNA
const backToDna = convertToDNA(rna);  // RNA → DNA
```

### 🧪 Work with Amino Acids & Proteins

```typescript
const rna = new RNA('AUGAAAGGG');  // 3 codons
const polypeptide = new Polypeptide(rna);
console.log(polypeptide.aminoAcidSequence.length); // 3
console.log(polypeptide.aminoAcidSequence[0].name); // "Methionine"

const aminoAcid = new AminoAcid(new RNA('UUU'));
console.log(aminoAcid.getAllAlternateCodons()); // All codons for Phenylalanine
```

### 🔍 Advanced Pattern Matching

```typescript
const pattern = new NucleotidePattern('^N*Y?A+(WY){3}$');
const dna = new DNA('ATCGATCGCAAAACTCTC');
console.log(pattern.matches(dna)); // true
console.log(pattern.patternRegex); // '^[AaGgCcTt]*[CcTt]?[Aa]+([AaTt][CcTt]){3}$'
```

### 🛡️ Safe Error Handling

```typescript
// No exceptions thrown - use ValidationResult pattern
const result = DNA.create('INVALID_SEQUENCE');
if (result.success) {
    console.log('Valid DNA:', result.data.getSequence());
} else {
    console.log('Error:', result.error); // Detailed validation message
}
```

## Quick Start

```typescript
import { DNA, RNA, AminoAcid, Polypeptide, convertToRNA } from 'ts-dna';

// Basic workflow: DNA → RNA → Polypeptide
const dna = new DNA('ATGTGCGACGAATTC');
const rna = convertToRNA(dna);
const polypeptide = new Polypeptide(rna);

console.log(`${dna.getSequence()} → ${rna.getSequence()}`);
console.log(`Amino acids: ${polypeptide.aminoAcidSequence.length}`);
```

## API Documentation

Full API documentation with detailed examples is available at [neilcochran.com/ts-dna](http://www.neilcochran.com/ts-dna/).

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.