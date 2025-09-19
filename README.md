# ts-dna

A comprehensive TypeScript library for molecular biology simulation, modeling the gene expression pathway from DNA transcription to polypeptide translation with biological accuracy.

[![npm version](https://badge.fury.io/js/ts-dna.svg)](https://www.npmjs.com/package/ts-dna)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://badges.frapsoft.com/typescript/version/typescript-next.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Features

🧬 **Complete Gene Expression Pipeline**
- Gene structure modeling with exons, introns, and promoters
- Realistic transcription with promoter recognition
- RNA processing including 5' capping, splicing, and polyadenylation
- Alternative splicing with multiple variant support
- Translation to amino acid sequences

🛡️ **Type-Safe & Immutable**
- Full TypeScript support with strict typing
- Immutable objects with validation enforced at construction
- Functional error handling with `ValidationResult` pattern
- Zero runtime dependencies

🔬 **Biologically Accurate**
- IUPAC-compliant nucleotide patterns and symbols
- Real splice site consensus sequences (GT-AG, GC-AG)
- Accurate promoter elements (TATA, Inr, DPE, CAAT, GC boxes)
- Proper polyadenylation signals and cleavage sites
- Codon usage tables and amino acid properties

🚀 **Performance Optimized**
- O(n log n) exon validation with interval trees
- O(1) codon lookups with optimized maps
- Efficient pattern matching with compiled regex
- Memory-efficient processing for large genes

## Installation

```bash
npm install ts-dna
```

```bash
yarn add ts-dna
```

## Requirements

- Node.js ≥18.0.0
- TypeScript ≥5.0 (recommended)

## API Documentation

Complete API documentation with detailed examples is available at [GitHub pages](https://neilcochran.github.io/ts-dna/).

## Quick Start

### Basic DNA/RNA Operations

```typescript
import { DNA, RNA, convertToRNA, NucleicAcidType } from 'ts-dna';

// Create and manipulate nucleic acids
const dna = new DNA('ATGTGCGACGAATTC');
const rna = convertToRNA(dna);

console.log(dna.getComplement()); // 'TACGCGCTGTTAAG'
console.log(rna.getSequence());   // 'AUGUGCGACGAAUC'
```

### Gene Expression Pipeline

```typescript
import {
  Gene,
  transcribe,
  processRNA,
  Polypeptide,
  isSuccess
} from 'ts-dna';

// Define a simple gene
const geneSequence =
  'GCGCTATAAAAGGCGC' +           // Promoter with TATA box
  'ATGAAAGCCTTTGAG' +            // Exon 1: start codon + coding
  'GTAAGTCCCCCCCAG' +            // Intron 1: GT...AG splice sites
  'TTCGATGCCATGGAG' +            // Exon 2: more coding
  'GTAAGTAAAAAAAAG' +            // Intron 2
  'CTGAAGGACCTGTAG';             // Exon 3: coding + stop codon

const exons = [
  { start: 16, end: 31 },         // Exon 1
  { start: 46, end: 61 },         // Exon 2
  { start: 76, end: 91 }          // Exon 3
];

// Complete gene expression pathway
const gene = new Gene(geneSequence, exons);
const preMRNA = transcribe(gene).unwrap();
const mRNA = processRNA(preMRNA).unwrap();
const polypeptide = new Polypeptide(mRNA);

console.log(`Gene length: ${gene.getSequence().length} bp`);
console.log(`mRNA length: ${mRNA.getCodingSequence().length} bp`);
console.log(`Polypeptide length: ${polypeptide.aminoAcidSequence.length} amino acids`);
console.log(`First amino acid: ${polypeptide.aminoAcidSequence[0].name}`);
```

### Alternative Splicing

```typescript
import {
  Gene,
  AlternativeSplicingProfile,
  transcribe,
  processAllSplicingVariants
} from 'ts-dna';

// Define splicing variants
const splicingProfile: AlternativeSplicingProfile = {
  geneId: 'EXAMPLE',
  defaultVariant: 'full-length',
  variants: [
    {
      name: 'full-length',
      includedExons: [0, 1, 2, 3],
      description: 'Complete polypeptide with all domains'
    },
    {
      name: 'short-isoform',
      includedExons: [0, 1, 3],
      description: 'Alternative splicing skips exon 2'
    }
  ]
};

const gene = new Gene(sequence, exons, 'EXAMPLE', splicingProfile);
const preMRNA = transcribe(gene).unwrap();
const outcomes = processAllSplicingVariants(preMRNA).unwrap();

for (const outcome of outcomes) {
  console.log(`${outcome.variant.name}: ${outcome.proteinLength} amino acids`);
}
```

### Pattern Matching

```typescript
import { NucleotidePattern, DNA } from 'ts-dna';

// IUPAC pattern matching
const tataBox = new NucleotidePattern('TATAAWAW');
const promoterDNA = new DNA('GCGCTATAAAAGGCGC');

console.log(tataBox.test(promoterDNA));           // true
console.log(tataBox.findFirst(promoterDNA));      // { start: 4, end: 12 }

// Find all TATA box occurrences
const matches = tataBox.findAll(promoterDNA);
console.log(`Found ${matches.length} TATA boxes`);
```

### Amino Acid Analysis

```typescript
import { AminoAcid, RNA, getAminoAcidByCodon } from 'ts-dna';

// Single amino acid properties
const phe = new AminoAcid(new RNA('UUU'));
console.log(phe.name);                    // 'Phenylalanine'
console.log(phe.singleLetterCode);        // 'F'
console.log(phe.molecularWeight);         // 165.19
console.log(phe.polarity);                // AminoAcidPolarity.NONPOLAR
console.log(phe.getAllAlternateCodons()); // ['UUU', 'UUC']

// Direct codon lookup
const codonData = getAminoAcidByCodon('UUU');
console.log(codonData.name);              // 'Phenylalanine'
```

## Advanced Features

### Promoter Recognition

```typescript
import { findPromoters, TATA_BOX, GC_BOX } from 'ts-dna';

const dna = new DNA('GCGCTATAAAAGGCCAATCGGGGCGG');
const promoters = findPromoters(dna, {
  elements: [TATA_BOX, GC_BOX],
  maxDistance: 200,
  minStrength: 0.7
});

for (const promoter of promoters) {
  console.log(`Promoter at ${promoter.transcriptionStartSite}`);
  console.log(`Elements: ${promoter.elements.map(e => e.name).join(', ')}`);
}
```

### RNA Processing Control

```typescript
import {
  processRNA,
  findPolyadenylationSites,
  add5PrimeCap,
  add3PrimePolyATail
} from 'ts-dna';

// Custom RNA processing
const preMRNA = transcribe(gene).unwrap();

// Manual processing steps
const cappedRNA = add5PrimeCap(preMRNA);
const splicedRNA = spliceRNA(cappedRNA).unwrap();

// Find poly-A sites
const polyASites = findPolyadenylationSites(splicedRNA);
const strongestSite = polyASites[0];

const mRNA = add3PrimePolyATailAtSite(
  splicedRNA,
  strongestSite.position,
  200  // tail length
);
```

### Error Handling

```typescript
import { DNA, ValidationResult, isSuccess, isFailure } from 'ts-dna';

// Safe construction with validation
const result: ValidationResult<DNA> = DNA.create('INVALID_SEQUENCE');

if (isSuccess(result)) {
  console.log('Valid DNA:', result.data.getSequence());
} else {
  console.log('Validation error:', result.error);
}

// Functional error handling
const processedResult = transcribe(gene)
  .chain(preMRNA => processRNA(preMRNA))
  .map(mRNA => new Polypeptide(mRNA));

if (isSuccess(processedResult)) {
  console.log('Polypeptide created successfully');
} else {
  console.log('Pipeline failed:', processedResult.error);
}
```

## Biological Constants

The library includes comprehensive biological constants for realistic simulations:

```typescript
import {
  // Genetic code
  START_CODON,
  STOP_CODONS,
  CODON_LENGTH,

  // Splice sites
  DONOR_SPLICE_CONSENSUS,
  ACCEPTOR_SPLICE_CONSENSUS,

  // Promoter elements
  TATA_BOX_CONSENSUS,
  INITIATOR_CONSENSUS,
  GC_BOX_CONSENSUS,

  // Polyadenylation
  DEFAULT_POLYA_SIGNALS,
  CANONICAL_POLYA_SIGNAL_DNA,

  // Gene structure
  MIN_EXON_SIZE,
  MAX_EXON_SIZE,
  MIN_INTRON_SIZE,
  MAX_INTRON_SIZE
} from 'ts-dna';
```

## Module Support

ts-dna supports both ES modules and CommonJS:

```typescript
// ES modules
import { DNA, RNA, Gene } from 'ts-dna';

// CommonJS
const { DNA, RNA, Gene } = require('ts-dna');
```

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.