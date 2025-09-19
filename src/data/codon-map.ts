/**
 * Static codon-to-amino acid mapping for efficient lookups.
 */

import { AminoAcidCharge } from '../enums/amino-acid-charge.js';
import { AminoAcidPolarity } from '../enums/amino-acid-polarity.js';
import { AminoAcidSideChainType } from '../enums/amino-acid-side-chain-type.js';
import { AminoAcidData } from '../types/amino-acid-data.js';

/**
 * Complete amino acid data mapping with biochemical characteristics
 */
export const SLC_AMINO_ACID_DATA_MAP: Record<string, AminoAcidData> = {
  A: {
    name: 'Alanine',
    abbrv: 'Ala',
    slc: 'A',
    molecularWeight: 89.094,
    polarity: AminoAcidPolarity.NONPOLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: 1.8,
    sideChainType: AminoAcidSideChainType.ALIPHATIC,
  },
  C: {
    name: 'Cysteine',
    abbrv: 'Cys',
    slc: 'C',
    molecularWeight: 121.154,
    polarity: AminoAcidPolarity.POLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: 2.5,
    sideChainType: AminoAcidSideChainType.SULFUR_CONTAINING,
  },
  D: {
    name: 'Aspartic acid',
    abbrv: 'Asp',
    slc: 'D',
    molecularWeight: 133.104,
    polarity: AminoAcidPolarity.POLAR,
    charge: AminoAcidCharge.NEGATIVE,
    hydrophobicity: -3.5,
    sideChainType: AminoAcidSideChainType.ACIDIC,
  },
  E: {
    name: 'Glutamic acid',
    abbrv: 'Glu',
    slc: 'E',
    molecularWeight: 147.131,
    polarity: AminoAcidPolarity.POLAR,
    charge: AminoAcidCharge.NEGATIVE,
    hydrophobicity: -3.5,
    sideChainType: AminoAcidSideChainType.ACIDIC,
  },
  F: {
    name: 'Phenylalanine',
    abbrv: 'Phe',
    slc: 'F',
    molecularWeight: 165.192,
    polarity: AminoAcidPolarity.NONPOLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: 2.8,
    sideChainType: AminoAcidSideChainType.AROMATIC,
  },
  G: {
    name: 'Glycine',
    abbrv: 'Gly',
    slc: 'G',
    molecularWeight: 75.067,
    polarity: AminoAcidPolarity.NONPOLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: -0.4,
    sideChainType: AminoAcidSideChainType.ALIPHATIC,
  },
  H: {
    name: 'Histidine',
    abbrv: 'His',
    slc: 'H',
    molecularWeight: 155.156,
    polarity: AminoAcidPolarity.POLAR,
    charge: AminoAcidCharge.POSITIVE,
    hydrophobicity: -3.2,
    sideChainType: AminoAcidSideChainType.BASIC,
  },
  I: {
    name: 'Isoleucine',
    abbrv: 'Ile',
    slc: 'I',
    molecularWeight: 131.175,
    polarity: AminoAcidPolarity.NONPOLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: 4.5,
    sideChainType: AminoAcidSideChainType.ALIPHATIC,
  },
  K: {
    name: 'Lysine',
    abbrv: 'Lys',
    slc: 'K',
    molecularWeight: 146.189,
    polarity: AminoAcidPolarity.POLAR,
    charge: AminoAcidCharge.POSITIVE,
    hydrophobicity: -3.9,
    sideChainType: AminoAcidSideChainType.BASIC,
  },
  L: {
    name: 'Leucine',
    abbrv: 'Leu',
    slc: 'L',
    molecularWeight: 131.175,
    polarity: AminoAcidPolarity.NONPOLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: 3.8,
    sideChainType: AminoAcidSideChainType.ALIPHATIC,
  },
  M: {
    name: 'Methionine',
    abbrv: 'Met',
    slc: 'M',
    molecularWeight: 149.208,
    polarity: AminoAcidPolarity.NONPOLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: 1.9,
    sideChainType: AminoAcidSideChainType.SULFUR_CONTAINING,
  },
  N: {
    name: 'Asparagine',
    abbrv: 'Asn',
    slc: 'N',
    molecularWeight: 132.119,
    polarity: AminoAcidPolarity.POLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: -3.5,
    sideChainType: AminoAcidSideChainType.AMIDE,
  },
  P: {
    name: 'Proline',
    abbrv: 'Pro',
    slc: 'P',
    molecularWeight: 115.132,
    polarity: AminoAcidPolarity.NONPOLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: -1.6,
    sideChainType: AminoAcidSideChainType.IMINO,
  },
  Q: {
    name: 'Glutamine',
    abbrv: 'Gln',
    slc: 'Q',
    molecularWeight: 146.146,
    polarity: AminoAcidPolarity.POLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: -3.5,
    sideChainType: AminoAcidSideChainType.AMIDE,
  },
  R: {
    name: 'Arginine',
    abbrv: 'Arg',
    slc: 'R',
    molecularWeight: 174.203,
    polarity: AminoAcidPolarity.POLAR,
    charge: AminoAcidCharge.POSITIVE,
    hydrophobicity: -4.5,
    sideChainType: AminoAcidSideChainType.BASIC,
  },
  S: {
    name: 'Serine',
    abbrv: 'Ser',
    slc: 'S',
    molecularWeight: 105.093,
    polarity: AminoAcidPolarity.POLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: -0.8,
    sideChainType: AminoAcidSideChainType.HYDROXYL_CONTAINING,
  },
  T: {
    name: 'Threonine',
    abbrv: 'Thr',
    slc: 'T',
    molecularWeight: 119.119,
    polarity: AminoAcidPolarity.POLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: -0.7,
    sideChainType: AminoAcidSideChainType.HYDROXYL_CONTAINING,
  },
  V: {
    name: 'Valine',
    abbrv: 'Val',
    slc: 'V',
    molecularWeight: 131.175,
    polarity: AminoAcidPolarity.NONPOLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: 4.2,
    sideChainType: AminoAcidSideChainType.ALIPHATIC,
  },
  W: {
    name: 'Tryptophan',
    abbrv: 'Trp',
    slc: 'W',
    molecularWeight: 204.228,
    polarity: AminoAcidPolarity.NONPOLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: -0.9,
    sideChainType: AminoAcidSideChainType.AROMATIC,
  },
  Y: {
    name: 'Tyrosine',
    abbrv: 'Tyr',
    slc: 'Y',
    molecularWeight: 181.191,
    polarity: AminoAcidPolarity.POLAR,
    charge: AminoAcidCharge.NEUTRAL,
    hydrophobicity: -1.3,
    sideChainType: AminoAcidSideChainType.AROMATIC,
  },
} as const;

/**
 * Direct codon-to-single-letter-code mapping for lookups.
 * This is much more efficient than creating RNA objects and iterating through arrays.
 */
export const CODON_TO_SLC_MAP: Record<string, string> = {
  // Alanine (A)
  GCA: 'A',
  GCC: 'A',
  GCG: 'A',
  GCU: 'A',
  // Cysteine (C)
  UGC: 'C',
  UGU: 'C',
  // Aspartic acid (D)
  GAC: 'D',
  GAU: 'D',
  // Glutamic acid (E)
  GAA: 'E',
  GAG: 'E',
  // Phenylalanine (F)
  UUC: 'F',
  UUU: 'F',
  // Glycine (G)
  GGA: 'G',
  GGC: 'G',
  GGG: 'G',
  GGU: 'G',
  // Histidine (H)
  CAC: 'H',
  CAU: 'H',
  // Isoleucine (I)
  AUA: 'I',
  AUC: 'I',
  AUU: 'I',
  // Lysine (K)
  AAA: 'K',
  AAG: 'K',
  // Leucine (L)
  UUA: 'L',
  UUG: 'L',
  CUA: 'L',
  CUC: 'L',
  CUG: 'L',
  CUU: 'L',
  // Methionine (M)
  AUG: 'M',
  // Asparagine (N)
  AAC: 'N',
  AAU: 'N',
  // Proline (P)
  CCA: 'P',
  CCC: 'P',
  CCG: 'P',
  CCU: 'P',
  // Glutamine (Q)
  CAA: 'Q',
  CAG: 'Q',
  // Arginine (R)
  AGA: 'R',
  AGG: 'R',
  CGA: 'R',
  CGC: 'R',
  CGG: 'R',
  CGU: 'R',
  // Serine (S)
  AGC: 'S',
  AGU: 'S',
  UCA: 'S',
  UCC: 'S',
  UCG: 'S',
  UCU: 'S',
  // Threonine (T)
  ACA: 'T',
  ACC: 'T',
  ACG: 'T',
  ACU: 'T',
  // Valine (V)
  GUA: 'V',
  GUC: 'V',
  GUG: 'V',
  GUU: 'V',
  // Tryptophan (W)
  UGG: 'W',
  // Tyrosine (Y)
  UAC: 'Y',
  UAU: 'Y',
} as const;

/**
 * Static mapping of single letter codes to their corresponding codon arrays.
 * Uses string arrays instead of RNA objects for better performance.
 */
export const SLC_ALT_CODONS_MAP: Record<string, readonly string[]> = {
  A: ['GCA', 'GCC', 'GCG', 'GCU'],
  C: ['UGC', 'UGU'],
  D: ['GAC', 'GAU'],
  E: ['GAA', 'GAG'],
  F: ['UUC', 'UUU'],
  G: ['GGA', 'GGC', 'GGG', 'GGU'],
  H: ['CAC', 'CAU'],
  I: ['AUA', 'AUC', 'AUU'],
  K: ['AAA', 'AAG'],
  L: ['UUA', 'UUG', 'CUA', 'CUC', 'CUG', 'CUU'],
  M: ['AUG'],
  N: ['AAC', 'AAU'],
  P: ['CCA', 'CCC', 'CCG', 'CCU'],
  Q: ['CAA', 'CAG'],
  R: ['AGA', 'AGG', 'CGA', 'CGC', 'CGG', 'CGU'],
  S: ['AGC', 'AGU', 'UCA', 'UCC', 'UCG', 'UCU'],
  T: ['ACA', 'ACC', 'ACG', 'ACU'],
  V: ['GUA', 'GUC', 'GUG', 'GUU'],
  W: ['UGG'],
  Y: ['UAC', 'UAU'],
} as const;
