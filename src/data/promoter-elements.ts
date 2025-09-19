import { NucleotidePattern } from '../model/nucleic-acids/NucleotidePattern.js';
import { PromoterElement } from '../model/PromoterElement.js';
import {
  TATA_BOX_CONSENSUS,
  INITIATOR_CONSENSUS,
  DPE_CONSENSUS,
  CAAT_BOX_CONSENSUS,
  GC_BOX_CONSENSUS,
  CEBP_SITE_CONSENSUS,
  E_BOX_CONSENSUS,
  AP1_SITE_CONSENSUS,
  TATA_BOX_NAME,
  INITIATOR_NAME,
  DPE_NAME,
  CAAT_BOX_NAME,
  GC_BOX_NAME,
  CEBP_SITE_NAME,
  E_BOX_NAME,
  AP1_SITE_NAME,
} from '../constants/biological-constants.js';

/**
 * Common promoter elements found in eukaryotic gene promoters.
 * These are based on well-characterized regulatory sequences.
 */

/**
 * TATA Box - The most well-known core promoter element
 * Consensus: TATAWAR (7 bp) - the correct biological consensus
 * Typical position: -25 to -30 bp upstream of TSS
 */
export const TATA_BOX = new PromoterElement(
  TATA_BOX_NAME,
  new NucleotidePattern(TATA_BOX_CONSENSUS),
  -25,
);

/**
 * Initiator (Inr) - Core promoter element overlapping TSS
 * Consensus: BBCABW (modern consensus, where B = C/G/T, W = A/T)
 * Position: Overlaps TSS (spans -3 to +3 relative to TSS)
 */
export const INITIATOR = new PromoterElement(
  INITIATOR_NAME,
  new NucleotidePattern(INITIATOR_CONSENSUS),
  0,
);

/**
 * Downstream Promoter Element (DPE) - Works with Inr
 * Consensus: RGWYV (where R = A/G, G = G, W = A/T, Y = C/T, V = A/C/G)
 * Position: +28 to +35 bp downstream of TSS
 */
export const DOWNSTREAM_PROMOTER_ELEMENT = new PromoterElement(
  DPE_NAME,
  new NucleotidePattern(DPE_CONSENSUS),
  +30,
);

/**
 * CAAT Box - Enhancer element
 * Consensus: GGCCAATCT
 * Typical position: -70 to -80 bp upstream of TSS
 */
export const CAAT_BOX = new PromoterElement(
  CAAT_BOX_NAME,
  new NucleotidePattern(CAAT_BOX_CONSENSUS),
  -75,
);

/**
 * GC Box - Sp1 binding site, common in housekeeping genes
 * Consensus: GGGCGG
 * Variable positions: typically -40 to -110 bp upstream
 */
export const GC_BOX = new PromoterElement(
  GC_BOX_NAME,
  new NucleotidePattern(GC_BOX_CONSENSUS),
  -70,
);

/**
 * CCAAT/Enhancer Binding Protein (C/EBP) site
 * Consensus: RTTGCGYAAY (where R = A/G, Y = C/T)
 * Variable positions in promoter region
 */
export const CEBP_SITE = new PromoterElement(
  CEBP_SITE_NAME,
  new NucleotidePattern(CEBP_SITE_CONSENSUS),
  -50,
);

/**
 * E-box - Basic helix-loop-helix protein binding site
 * Consensus: CANNTG
 * Variable positions, often in tissue-specific promoters
 */
export const E_BOX = new PromoterElement(E_BOX_NAME, new NucleotidePattern(E_BOX_CONSENSUS), -60);

/**
 * AP-1 binding site - Jun/Fos heterodimer binding
 * Consensus: TGASTCA (where S = G/C)
 * Variable positions in promoters and enhancers
 */
export const AP1_SITE = new PromoterElement(
  AP1_SITE_NAME,
  new NucleotidePattern(AP1_SITE_CONSENSUS),
  -40,
);

/**
 * Array of all standard promoter elements for systematic searching.
 */
export const STANDARD_PROMOTER_ELEMENTS = [
  TATA_BOX,
  INITIATOR,
  DOWNSTREAM_PROMOTER_ELEMENT,
  CAAT_BOX,
  GC_BOX,
  CEBP_SITE,
  E_BOX,
  AP1_SITE,
] as const;

/**
 * Core promoter elements that directly regulate transcription initiation.
 * These are typically found close to the TSS.
 */
export const CORE_PROMOTER_ELEMENTS = [TATA_BOX, INITIATOR, DOWNSTREAM_PROMOTER_ELEMENT] as const;

/**
 * Proximal promoter elements that modulate transcription strength.
 * These are typically found within 200bp of the TSS.
 */
export const PROXIMAL_PROMOTER_ELEMENTS = [CAAT_BOX, GC_BOX, CEBP_SITE, E_BOX, AP1_SITE] as const;

/**
 * Common promoter element combinations that work synergistically.
 */
export const PROMOTER_ELEMENT_COMBINATIONS = {
  /** TATA-containing promoters */
  TATA_DEPENDENT: [TATA_BOX],

  /** TATA-less promoters often use Inr + DPE */
  TATA_LESS: [INITIATOR, DOWNSTREAM_PROMOTER_ELEMENT],

  /** Strong promoters with multiple elements */
  STRONG_PROMOTER: [TATA_BOX, CAAT_BOX, GC_BOX],

  /** Housekeeping gene promoters */
  HOUSEKEEPING: [GC_BOX, INITIATOR],

  /** Tissue-specific promoters */
  TISSUE_SPECIFIC: [E_BOX, CEBP_SITE, AP1_SITE],
} as const;
