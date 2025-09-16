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

## Complete Gene Expression Example

Here's a comprehensive example showing the complete gene expression pathway from DNA to protein, including alternative splicing using a BRCA1-inspired gene:

```typescript
import {
    DNA,
    Gene,
    NucleotidePattern,
    transcribe,
    processAllSplicingVariants,
    SpliceVariantPatterns,
    AlternativeSplicingProfile,
    Polypeptide,
    isSuccess
} from 'ts-dna';

// Create a simplified BRCA1-like gene with alternative splicing
const brca1Sequence =
    // Promoter region with TATA box
    'GCGCGCGCGCGCGCGCGCGCTATAAAAGGCGCGCGCGCGCGCGCGC' +
    // Exon 1: Start codon + DNA binding domain
    'ATGGATTTATCTGCTCTTCGCGTTGAAGAAGTACAAAATGTCA' +
    // Intron 1 with GT...AG splice sites
    'GTAAGTGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCAG' +
    // Exon 2: BRCT domain part 1
    'TTCGATGCCATGGATGAAGCAGAGGCTGGGATAGTATTG' +
    // Intron 2
    'GTAAGTAAAAAAAAAAAAAAAAAAAAAAAAAAAG' +
    // Exon 3: BRCT domain part 2 (cancer-critical)
    'AAGATCCGGAAGCTTCTGACAAAGCTGTATCGTGAG' +
    // Intron 3
    'GTAAGTCCCCCCCCCCCCCCCCCCCCCCCCCCAG' +
    // Exon 4: C-terminal + stop codon
    'CTGAAGGACCTGCGCTACAAGTAAGGCGCGCGC';

// Define exon boundaries
const exons = [
    { start: 47, end: 89, name: 'exon1' },   // DNA binding domain
    { start: 128, end: 166, name: 'exon2' },  // BRCT domain part 1
    { start: 200, end: 236, name: 'exon3' },  // BRCT domain part 2
    { start: 270, end: 300, name: 'exon4' }   // C-terminal region
];

// Define alternative splicing profile for BRCA1
const splicingProfile: AlternativeSplicingProfile = {
    geneId: 'BRCA1',
    defaultVariant: 'full-length',
    variants: [
        // Full-length functional protein
        SpliceVariantPatterns.fullLength('full-length', 4,
            'Complete BRCA1 with all domains'),

        // Cancer-associated splice variant (skips critical BRCT domain)
        SpliceVariantPatterns.exonSkipping('cancer-variant', 4, [2],
            'Oncogenic variant missing BRCT domain part 1'),

        // Tissue-specific shorter isoform
        SpliceVariantPatterns.truncation('short-isoform', 3,
            'Truncated isoform missing C-terminus')
    ]
};

// Create gene with alternative splicing capability
const brca1Gene = new Gene(brca1Sequence, exons, 'BRCA1', splicingProfile);

// Transcribe the gene
const transcriptionResult = transcribe(brca1Gene);

if (isSuccess(transcriptionResult)) {
    const preMRNA = transcriptionResult.data;
    console.log(`BRCA1 pre-mRNA transcribed: ${preMRNA.getSequence().length} bp`);

    // Process all splice variants
    const splicingResult = processAllSplicingVariants(preMRNA, {
        validateReadingFrames: true,
        allowSkipLastExon: true, // Allow truncation variants
        validateCodons: true     // Ensure proper start/stop codons
    });

    if (isSuccess(splicingResult)) {
        const outcomes = splicingResult.data;
        console.log(`\nBRCA1 Alternative Splice Variants:`);

        for (const outcome of outcomes) {
            const variant = outcome.variant;
            const matureRNA = outcome.matureMRNA;

            console.log(`\n🧬 ${variant.name}:`);
            console.log(`   Description: ${variant.description}`);
            console.log(`   Exons included: [${variant.includedExons.join(', ')}]`);
            console.log(`   mRNA length: ${outcome.getMRNALength()} bp`);
            console.log(`   Protein length: ${outcome.getAminoAcidCount()} amino acids`);
            console.log(`   Reading frame intact: ${outcome.hasValidReadingFrame()}`);

            // Create protein from mature mRNA
            try {
                const protein = new Polypeptide(matureRNA);
                console.log(`   First amino acid: ${protein.aminoAcidSequence[0].name}`);
                console.log(`   Last amino acid: ${protein.aminoAcidSequence[protein.aminoAcidSequence.length - 1].name}`);

                // Check for functional domains
                if (variant.name === 'cancer-variant') {
                    console.log(`   ⚠️  WARNING: Missing critical BRCT domain - may be oncogenic`);
                } else if (variant.name === 'full-length') {
                    console.log(`   ✅ Complete functional protein with all domains`);
                }
            } catch (error) {
                console.log(`   ❌ Cannot translate: ${error.message}`);
            }
        }

        // Compare variant effects
        console.log(`\n📊 Clinical Significance:`);
        const fullLength = outcomes.find(o => o.variant.name === 'full-length');
        const cancerVariant = outcomes.find(o => o.variant.name === 'cancer-variant');

        if (fullLength && cancerVariant) {
            const proteinLoss = fullLength.getAminoAcidCount() - cancerVariant.getAminoAcidCount();
            console.log(`   Cancer variant loses ${proteinLoss} amino acids`);
            console.log(`   Represents ${((proteinLoss / fullLength.getAminoAcidCount()) * 100).toFixed(1)}% protein loss`);
        }
    }
}

// Output example:
// BRCA1 pre-mRNA transcribed: 253 bp
//
// 🧬 BRCA1 Alternative Splice Variants:
//
// 🧬 full-length:
//    Description: Complete BRCA1 with all domains
//    Exons included: [0, 1, 2, 3]
//    mRNA length: 144 bp
//    Protein length: 48 amino acids
//    Reading frame intact: true
//    First amino acid: Methionine
//    Last amino acid: Lysine
//    ✅ Complete functional protein with all domains
//
// 🧬 cancer-variant:
//    Description: Oncogenic variant missing BRCT domain part 1
//    Exons included: [0, 2, 3]
//    mRNA length: 106 bp
//    Protein length: 35 amino acids
//    Reading frame intact: true
//    First amino acid: Methionine
//    Last amino acid: Lysine
//    ⚠️  WARNING: Missing critical BRCT domain - may be oncogenic
//
// 📊 Clinical Significance:
//    Cancer variant loses 13 amino acids
//    Represents 27.1% protein loss
```

This example demonstrates the complete molecular biology pipeline: **Gene → Pre-mRNA → Alternative Splicing → Mature mRNA → Protein**, showing how alternative splicing can create functionally different protein isoforms with varying clinical significance.

## API Documentation

Full API documentation with detailed examples is available at [neilcochran.com/ts-dna](http://www.neilcochran.com/ts-dna/).

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.