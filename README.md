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
console.log(aminoAcid.name); // "Phenylalanine"
console.log(aminoAcid.molecularWeight); // 165.19
console.log(aminoAcid.polarity); // AminoAcidPolarity.NONPOLAR
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

## Complete Transcription Example

Here's a comprehensive example showing gene transcription with promoter recognition, exon/intron structure, and pre-mRNA processing:

```typescript
import { DNA, Gene, NucleotidePattern, transcribe, isSuccess } from 'ts-dna';

// Create a gene with TATA box promoter and exon structure
const geneSequence =
    // Promoter region with TATA box
    'GCGCGCGCGCGCGCGCGCGCGCGCGCTATAAAAGGCGCGCGCGCGCGCGCGC' +
    // Transcription start site and first exon
    'ATGAAGGCCTACGTGAAGCTG' +
    // First intron with GT...AG splice sites
    'GTAAGTGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCAG' +
    // Second exon
    'TCCGAGCTGAAGATCGTG' +
    // Second intron
    'GTAAGTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG' +
    // Third exon with polyadenylation signal
    'CCCAAGTGCAAGCTGAATAAAAGGCGCGCGCGC';

// Define exon boundaries
const exons = [
    { start: 50, end: 71, name: 'exon1' },
    { start: 118, end: 136, name: 'exon2' },
    { start: 181, end: 213, name: 'exon3' }
];

// Create gene and transcribe it
const gene = new Gene(geneSequence, exons);
const tataPattern = new NucleotidePattern('TATAAA');
const result = transcribe(gene, tataPattern);

if (isSuccess(result)) {
    const preMRNA = result.data;
    console.log(`Pre-mRNA length: ${preMRNA.getSequence().length} bp`);
    console.log(`Exons: ${preMRNA.getExonRegions().length}`);
    console.log(`Introns: ${preMRNA.getIntronRegions().length}`);
    console.log(`Coding sequence: ${preMRNA.getCodingSequence()}`);

    // Shows: DNA→RNA transcription, promoter recognition,
    // splice site detection, and polyadenylation signals
}
```

## API Documentation

Full API documentation with detailed examples is available at [neilcochran.com/ts-dna](http://www.neilcochran.com/ts-dna/).

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.