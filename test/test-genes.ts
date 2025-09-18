/**
 * Realistic gene sequences for testing that meet biological constraints:
 * - Introns ≥ 20 bp with proper GT...AG splice sites
 * - Exons ≥ 3 bp and ≤ 50,000 bp
 * - Proper start codons (ATG) and biological sequences
 */

import { GenomicRegion } from '../src/types/genomic-region';

// Simple two-exon gene with 20bp intron and stop codon
export const SIMPLE_TWO_EXON_GENE = {
  dnaSequence: 'ATGAAAGTATGCCCAAGTTTCGGGAGTTCTAGGG', // 34bp total, proper GT...AG splice sites with stop codon
  rnaSequence: 'AUGAAAGUAUGCCCAAGUUUCGGGAGUUCUAGGG',
  exons: [
    { start: 0, end: 6, name: 'exon1' }, // ATGAAA -> AUGAAA
    { start: 26, end: 34, name: 'exon2' }, // TTCTAGG -> UUCUAGGG (includes UAG stop codon)
  ] as GenomicRegion[],
  splicedRNA: 'AUGAAAUUCUAGGG', // AUG AAA UUC UAG GG (start + 2 amino acids + stop + extra)
  intronLength: 20, // positions 6-26 (GT...AG splice sites)
};

// Three-exon gene with proper splice sites and 20bp+ introns and stop codon
export const THREE_EXON_GENE = {
  dnaSequence: 'ATGAAAGTAAGGGGGGGGGGGGGGAGTTCGTCGTAAGGGGGGGGGGGGGGAGTAGAAACCC', // 60bp total
  rnaSequence: 'AUGAAAGUAAGGGGGGGGGGGGGGGAGUUCGUCGUAAGGGGGGGGGGGGGGGAGUAGAAACCC',
  exons: [
    { start: 0, end: 6, name: 'exon1' }, // ATGAAA -> AUGAAA
    { start: 26, end: 32, name: 'exon2' }, // TTCGTC -> UUCGUC
    { start: 52, end: 58, name: 'exon3' }, // TAGAAA -> UAGAAA (includes UAG stop codon)
  ] as GenomicRegion[],
  splicedRNA: 'AUGAAAGUUCGUAGUAGA', // includes UAG stop codon
  intron1Length: 20, // positions 6-26 (GT...AG splice sites)
  intron2Length: 20, // positions 32-52 (GT...AG splice sites)
};

// Single exon gene (no splicing needed) with stop codon
export const SINGLE_EXON_GENE = {
  dnaSequence: 'ATGAAACCCGGGTAG', // 15bp with UAG stop codon
  rnaSequence: 'AUGAAACCCGGGUAG',
  exons: [{ start: 0, end: 15, name: 'exon1' }] as GenomicRegion[],
  splicedRNA: 'AUGAAACCCGGGUAG', // Same as input since no splicing, includes UAG stop
};

// Gene with invalid splice sites (for negative testing)
export const INVALID_SPLICE_GENE = {
  dnaSequence: 'ATGAAACACGCCCAAATTCGGGAAATTCGGG', // 31bp - invalid AC...AA splice sites
  rnaSequence: 'AUGAAACACGCCCAAAUUCGGGAAAUUCGGG',
  exons: [
    { start: 0, end: 6, name: 'exon1' }, // ATGAAA
    { start: 26, end: 31, name: 'exon2' }, // TCGGG - 20bp intron but AC...AA splice sites
  ] as GenomicRegion[],
  // This should fail splice site validation due to AC...AA instead of GT...AG
};

// Larger gene for complex testing
export const COMPLEX_GENE = {
  dnaSequence: 'GGGCCCATGAAAGTACGCCCAAGAGAGGGTAGATAAAAATAAA',
  rnaSequence: 'GGGCCCAUGAAAGUACGCCCAAGAGAGGGUAGAUAAAAAAUAAA',
  exons: [
    { start: 6, end: 12, name: 'exon1' }, // ATGAAA
    { start: 32, end: 41, name: 'exon2' }, // ATAAAAAAT -> AUAAAAAAU
  ] as GenomicRegion[],
  splicedRNA: 'AUGAAAUAAAAAAU',
  intronLength: 20, // positions 12-32
};

// Short gene that meets minimum constraints
export const MINIMAL_GENE = {
  dnaSequence: 'ATGAAAGGGGGGGGGGGGGGGGGAGCCC',
  rnaSequence: 'AUGAAAGGGGGGGGGGGGGGGGGAGCCC',
  exons: [
    { start: 0, end: 6, name: 'exon1' }, // ATGAAA (6bp)
    { start: 26, end: 29, name: 'exon2' }, // CCC (3bp - minimum)
  ] as GenomicRegion[],
  splicedRNA: 'AUGAAACCC',
  intronLength: 20, // positions 6-26 = exactly 20bp
};

// Four-exon gene for alternative splicing tests
export const FOUR_EXON_GENE = {
  dnaSequence: 'ATGAAAGTAAGGGGGGGGGGGGGGAGCCCGGGGTAAGGGGGGGGGGGGGGAGGGGTTTGTAAGGGGGGGGGGGGGGAGTAG', // 80bp
  rnaSequence:
    'AUGAAAGUAAGGGGGGGGGGGGGGGAGCCCGGGGUAAGGGGGGGGGGGGGGGAGGGGGUUUGUAAGGGGGGGGGGGGGGGAGUAG',
  exons: [
    { start: 0, end: 6, name: 'exon1' }, // ATGAAA (6bp) -> AUGAAA
    { start: 26, end: 32, name: 'exon2' }, // CCCGGG (6bp) -> CCCGGG
    { start: 52, end: 58, name: 'exon3' }, // GGGTTT (6bp) -> GGGUUU
    { start: 78, end: 81, name: 'exon4' }, // TAG (3bp) -> UAG (stop codon)
  ] as GenomicRegion[],
  splicedRNA: 'AUGAAACCCGGGGGGUUUUAG', // includes UAG stop codon
  intron1Length: 20, // positions 6-26
  intron2Length: 20, // positions 32-52
  intron3Length: 20, // positions 58-78
};
