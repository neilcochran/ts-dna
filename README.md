# nucleate

A comprehensive TypeScript library for molecular biology simulation, modeling DNA replication, gene expression, and polypeptide translation with biological accuracy.

<!-- npm version badge - uncomment once @neilcochran/nucleate is published to npm
[![npm version](https://img.shields.io/npm/v/@neilcochran/nucleate)](https://www.npmjs.com/package/@neilcochran/nucleate)
-->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://badges.frapsoft.com/typescript/version/typescript-next.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Features

🧬 **DNA Replication & Gene Expression Pipeline**
- **DNA Replication**: Biologically accurate enzyme simulation with leading/lagging strand synthesis
- **Gene Expression**: Structure modeling with exons, introns, and promoters
- **Transcription**: Realistic promoter recognition and RNA synthesis
- **RNA Processing**: 5' capping, splicing, and polyadenylation
- **Alternative Splicing**: Multiple variant support with functional impact analysis
- **Translation**: Accurate amino acid sequence generation

🛡️ **Type-Safe & Immutable**
- Full TypeScript support with strict typing
- Immutable objects with validation enforced at construction
- Functional error handling with `ValidationResult` pattern
- Zero runtime dependencies

🔬 **Biologically Accurate**
- **DNA Replication**: Enzyme coordination, Okazaki fragments, primer synthesis/removal
- **Organism Profiles**: E. coli and Human replication parameters (speed, fragment size)
- **Splice Sites**: Real consensus sequences (GT-AG, GC-AG) with validation
- **Promoters**: TATA, Initiator, DPE, CAAT, GC boxes with TSS identification
- **Polyadenylation**: AAUAAA signals, cleavage sites, USE/DSE elements
- **Genetic Code**: Complete codon tables and amino acid properties

🚀 **Performance Optimized**
- O(n log n) exon validation with interval trees
- O(1) codon lookups with optimized maps
- Efficient pattern matching with compiled regex
- Memory-efficient processing for large genes

## Installation

> Not yet published to npm. The package will be available as `@neilcochran/nucleate` once v0.1.0 is released.

<!-- Uncomment once @neilcochran/nucleate is published to npm:
```bash
npm install @neilcochran/nucleate
```

```bash
yarn add @neilcochran/nucleate
```
-->

## Requirements

- Node.js ≥18.0.0
- TypeScript ≥5.0 (recommended)

## API Documentation

Complete API documentation with detailed examples is available at [GitHub pages](https://neilcochran.github.io/nucleate/).

## Quick Start

### Basic DNA/RNA Operations

```typescript
import { DNA, RNA, convertToRNA, NucleicAcidType } from '@neilcochran/nucleate';

// Create and manipulate nucleic acids
const dna = new DNA('ATGTGCGACGAATTC');
const rna = convertToRNA(dna);

console.log(dna.getComplement()); // 'TACGCGCTGTTAAG'
console.log(rna.getSequence());   // 'AUGUGCGACGAAUC'
```

### DNA Replication

```typescript
import { DNA, replicateDNA, replicateDNASimple, E_COLI, HUMAN } from '@neilcochran/nucleate';

// Simple DNA replication
const originalDNA = new DNA('ATGTGCGACGAATTC');
const result = replicateDNASimple(originalDNA);

if (result.success) {
  const [strand1, strand2] = result.data;
  console.log('Original:', originalDNA.getSequence());
  console.log('Strand 1:', strand1.getSequence());
  console.log('Strand 2:', strand2.getSequence());
}

// Advanced replication with organism-specific parameters
const replicationResult = replicateDNA(originalDNA, {
  organism: E_COLI,  // 1000 bp/s, 1000-2000 nt Okazaki fragments
  includeStatistics: true,
  validateReplication: true
});

if (replicationResult.success) {
  const { replicatedStrands, statistics } = replicationResult.data;
  console.log(`Replication events: ${statistics.totalEvents}`);
  console.log(`Okazaki fragments: ${statistics.okazakiFragments.length}`);
  console.log(`Leading strand length: ${statistics.leadingStrandLength} bp`);
}
```

### Gene Expression Pipeline

```typescript
import {
  Gene,
  transcribe,
  processRNA,
  Polypeptide,
  isSuccess
} from '@neilcochran/nucleate';

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
} from '@neilcochran/nucleate';

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
import { NucleotidePattern, DNA } from '@neilcochran/nucleate';

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
import { AminoAcid, RNA, getAminoAcidByCodon } from '@neilcochran/nucleate';

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

### DNA Replication Simulation

```typescript
import {
  Replisome,
  ReplicationFork,
  EnzymeFactory,
  E_COLI,
  HUMAN,
  isSuccess
} from '@neilcochran/nucleate';

// Create replication machinery
const dna = new DNA('ATGTGCGACGAATTCGGCATGGCC');
const fork = new ReplicationFork(0, dna.length(), E_COLI);
const replisome = new Replisome(fork, E_COLI);

// Manual enzyme creation with validation
const helicaseResult = EnzymeFactory.createHelicase(100);
if (isSuccess(helicaseResult)) {
  const helicase = helicaseResult.data;
  console.log(`Helicase at position: ${helicase.position}`);
  console.log(`Enzyme type: ${helicase.type}`);
}

// Access replication statistics
const statistics = replisome.getStatistics();
console.log(`Fork position: ${statistics.forkPosition}`);
console.log(`Completion: ${statistics.completionPercentage}%`);
console.log(`Active Okazaki fragments: ${statistics.activeOkazakiFragments}`);
```

### Promoter Recognition

```typescript
import { findPromoters, TATA_BOX, GC_BOX } from '@neilcochran/nucleate';

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
} from '@neilcochran/nucleate';

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
import { DNA, ValidationResult, isSuccess, isFailure } from '@neilcochran/nucleate';

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
  MAX_INTRON_SIZE,

  // DNA Replication
  E_COLI_POLYMERASE_SPEED,
  HUMAN_POLYMERASE_SPEED,
  MIN_RNA_PRIMER_LENGTH,
  MAX_RNA_PRIMER_LENGTH,
  PROKARYOTIC_FRAGMENT_SIZE_RANGE,
  EUKARYOTIC_FRAGMENT_SIZE_RANGE
} from '@neilcochran/nucleate';
```

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.