import { NucleotidePattern } from '../model/nucleic-acids/NucleotidePattern';
import { PromoterElement } from '../model/PromoterElement';

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
    'TATA',
    new NucleotidePattern('TATAAA'),
    -25
);

/**
 * Initiator (Inr) - Core promoter element overlapping TSS
 * Consensus: BBCABW (modern consensus, where B = C/G/T, W = A/T)
 * Position: Overlaps TSS (spans -3 to +3 relative to TSS)
 */
export const INITIATOR = new PromoterElement(
    'Inr',
    new NucleotidePattern('BBCABW'),
    0
);

/**
 * Downstream Promoter Element (DPE) - Works with Inr
 * Consensus: RGWYV (where R = A/G, G = G, W = A/T, Y = C/T, V = A/C/G)
 * Position: +28 to +35 bp downstream of TSS
 */
export const DOWNSTREAM_PROMOTER_ELEMENT = new PromoterElement(
    'DPE',
    new NucleotidePattern('RGWYV'),
    +30
);

/**
 * CAAT Box - Enhancer element
 * Consensus: GGCCAATCT
 * Typical position: -70 to -80 bp upstream of TSS
 */
export const CAAT_BOX = new PromoterElement(
    'CAAT',
    new NucleotidePattern('GGCCAATCT'),
    -75
);

/**
 * GC Box - Sp1 binding site, common in housekeeping genes
 * Consensus: GGGCGG
 * Variable positions: typically -40 to -110 bp upstream
 */
export const GC_BOX = new PromoterElement(
    'GC',
    new NucleotidePattern('GGGCGG'),
    -70
);

/**
 * CCAAT/Enhancer Binding Protein (C/EBP) site
 * Consensus: RTTGCGYAAY (where R = A/G, Y = C/T)
 * Variable positions in promoter region
 */
export const CEBP_SITE = new PromoterElement(
    'C/EBP',
    new NucleotidePattern('RTTGCGYAAY'),
    -50
);

/**
 * E-box - Basic helix-loop-helix protein binding site
 * Consensus: CANNTG
 * Variable positions, often in tissue-specific promoters
 */
export const E_BOX = new PromoterElement(
    'E-box',
    new NucleotidePattern('CANNTG'),
    -60
);

/**
 * AP-1 binding site - Jun/Fos heterodimer binding
 * Consensus: TGASTCA (where S = G/C)
 * Variable positions in promoters and enhancers
 */
export const AP1_SITE = new PromoterElement(
    'AP-1',
    new NucleotidePattern('TGASTCA'),
    -40
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
    AP1_SITE
] as const;

/**
 * Core promoter elements that directly regulate transcription initiation.
 * These are typically found close to the TSS.
 */
export const CORE_PROMOTER_ELEMENTS = [
    TATA_BOX,
    INITIATOR,
    DOWNSTREAM_PROMOTER_ELEMENT
] as const;

/**
 * Proximal promoter elements that modulate transcription strength.
 * These are typically found within 200bp of the TSS.
 */
export const PROXIMAL_PROMOTER_ELEMENTS = [
    CAAT_BOX,
    GC_BOX,
    CEBP_SITE,
    E_BOX,
    AP1_SITE
] as const;

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
    TISSUE_SPECIFIC: [E_BOX, CEBP_SITE, AP1_SITE]
} as const;