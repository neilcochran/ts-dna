/**
 * Biological constants used throughout the ts-dna library.
 * Centralizes hardcoded values to prevent drift and improve maintainability.
 */

// Codon and genetic code constants
export const CODON_LENGTH = 3;
export const MIN_CODON_LENGTH = 3;

// Gene structure constraints
export const MIN_EXON_SIZE = 3; // Minimum exon size in base pairs
export const MAX_EXON_SIZE = 50000; // Maximum realistic exon size (prevent unrealistic sequences)
export const MIN_INTRON_SIZE = 20; // Minimum intron size for proper splicing machinery
export const MAX_INTRON_SIZE = 1000000; // Maximum realistic intron size (prevent memory issues)
export const DEFAULT_MAX_INTRON_SEARCH = 10000; // Default maximum for splice site search

// RNA processing constants
export const DEFAULT_POLY_A_TAIL_LENGTH = 200;
export const MIN_POLY_A_DETECTION_LENGTH = 10; // Minimum consecutive A's to detect poly-A tail
export const POLY_A_TAIL_PATTERN = /A+$/; // Regex pattern for detecting trailing poly-A sequences

// Polyadenylation signal constants
export const POLYA_SIGNAL_OFFSET = 6; // Offset from AATAAA/AAUAAA to typical cleavage site
export const DEFAULT_CLEAVAGE_OFFSET = 15; // Default cleavage site offset when not specified
export const CANONICAL_POLYA_SIGNAL_DNA = 'AATAAA'; // Canonical polyadenylation signal in DNA (becomes AAUAAA in RNA)

// Polyadenylation signal variants with their relative strengths
export const POLYA_SIGNALS = {
  AAUAAA: 100, // Canonical signal - strongest
  AUUAAA: 80, // Most common variant
  AGUAAA: 30, // Weaker but functional
  AAUAUA: 25, // Less efficient
  AAUACA: 20, // Weak but documented
  CAUAAA: 18, // Rare variant
  GAUAAA: 15, // Very rare
  AAAAAG: 12, // Alternative pathway
  AAAACA: 10, // Very weak
} as const;

// Default signal strength for unrecognized polyadenylation signals
export const DEFAULT_POLYA_SIGNAL_STRENGTH = 8;

// DNA Replication constants
export const MIN_RNA_PRIMER_LENGTH = 3; // Minimum RNA primer length in nucleotides
export const MAX_RNA_PRIMER_LENGTH = 10; // Maximum RNA primer length in nucleotides

// DNA Polymerase relative speeds (as fraction of organism base speed)
export const DNA_POL_I_SPEED_FACTOR = 0.05; // 5% for primer removal/repair
export const DNA_POL_II_SPEED_FACTOR = 0.04; // 4% for repair
export const DNA_POL_III_SPEED_FACTOR = 1.0; // Full speed for main replication

// Other replication enzyme speeds (relative to polymerase)
export const PRIMASE_SPEED_FACTOR = 0.1; // 10% of polymerase speed
export const EXONUCLEASE_SPEED_FACTOR = 0.1; // Similar to primase

// DNA synthesis quality control
export const DNA_PROOFREADING_THRESHOLD = 500; // Base pairs before proofreading (every 100-1000 bp)

// Splice site sequences
export const DONOR_SPLICE_CONSENSUS = 'GT'; // 5' splice site (donor)
export const ACCEPTOR_SPLICE_CONSENSUS = 'AG'; // 3' splice site (acceptor)
export const MIN_INTRON_LENGTH_FOR_SPLICING = 4; // Minimum for GT-AG recognition

// Promoter element positioning (relative to TSS)
export const TATA_BOX_TYPICAL_POSITION = -25; // Typical TATA box position upstream of TSS
export const DPE_TYPICAL_POSITION = 30; // DPE typically 30bp downstream of TSS
export const MAX_PROMOTER_SEARCH_DISTANCE = 200; // Maximum upstream search distance

// RNA processing and modification constants
export const MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH = 20; // Minimum RNA length to search for poly-A signals

// Scoring weights for polyadenylation elements
export const USE_ELEMENT_MAX_BOOST = 30; // Maximum boost from upstream USE elements
export const DSE_ELEMENT_MAX_BOOST = 20; // Maximum boost from downstream DSE elements

// Quality scoring thresholds
export const BASE_POLYA_SCORE = 0.3; // Base score for polyadenylation analysis
export const HIGH_U_CONTENT_THRESHOLD = 0.7; // Threshold for high U content in USE regions
export const MODERATE_U_CONTENT_THRESHOLD = 0.6; // Threshold for moderate U content
export const MODERATE_USE_SCORE = 0.6; // Score for moderate USE quality

// Context analysis constants
export const CLEAVAGE_CONTEXT_WINDOW = 3; // Window size around cleavage site for context analysis
export const INHIBITORY_G_RUN_PENALTY = 0.3; // Penalty multiplier for G-runs near cleavage sites
export const AU_RICH_CONTEXT_BOOST = 1.2; // Boost multiplier for A/U-rich cleavage context

// Quality scoring values for USE/DSE analysis
export const PERFECT_USE_SCORE = 1.0; // Score for optimal USE elements (UGUA motif)
export const HIGH_USE_SCORE = 0.8; // Score for high-quality USE elements (UYU motifs)
export const PERFECT_DSE_SCORE = 1.0; // Score for optimal DSE elements (GU-rich with U clusters)
export const HIGH_DSE_SCORE = 0.8; // Score for high-quality DSE elements (GU-rich)

// Polyadenylation site strength thresholds
export const MIN_POLYA_SITE_STRENGTH = 25; // Minimum total strength for valid polyadenylation site

// Reading frame and validation constants
export const READING_FRAME_DIVISOR = 3; // Codons are always 3 nucleotides

// Transcription and promoter search constants
export const DEFAULT_MAX_PROMOTER_SEARCH_DISTANCE = 1000; // Default maximum upstream search for promoters
export const DEFAULT_DOWNSTREAM_SEARCH_DISTANCE = 100; // Default downstream search distance for promoter elements
export const MAX_POLY_A_TAIL_LENGTH = 1000; // Maximum allowed poly-A tail length
export const TSS_PROXIMITY_THRESHOLD = 10; // Maximum distance between TSS candidates to consider them the same
export const DEFAULT_MIN_PROMOTER_STRENGTH = 5; // Default minimum promoter strength for transcription
export const FORCE_TSS_DISABLED = -1; // Value indicating forced TSS is disabled

// Promoter scoring constants
export const PROMOTER_ELEMENT_SCORE_BOOST = 10; // Score boost for finding a promoter element (TATA)
export const INR_ELEMENT_SCORE_BOOST = 8; // Score boost for Initiator (Inr) elements
export const WEAKER_ELEMENT_SCORE_BOOST = 6; // Score boost for weaker promoter elements (DPE)
export const CAAT_ELEMENT_SCORE_BOOST = 5; // Score boost for CAAT box elements
export const GC_ELEMENT_SCORE_BOOST = 4; // Score boost for GC box elements
export const PROMOTER_SYNERGY_MULTIPLIER = 2; // Multiplier for multiple element synergy bonus

// Cleavage site recognition constants
export const DEFAULT_POLYA_SIGNALS = ['AAUAAA', 'AUUAAA', 'AGUAAA', 'AAUAUA', 'AAUACA'] as const;
export const DEFAULT_UPSTREAM_USE_PATTERN = 'U{3,}|UGUA';
export const DEFAULT_DOWNSTREAM_DSE_PATTERN = 'U{3,}|GU{2,}';
export const DEFAULT_CLEAVAGE_PREFERENCE = ['A', 'U', 'C', 'G'] as const;
export const DEFAULT_CLEAVAGE_DISTANCE_RANGE = [11, 23] as const;

// Promoter element consensus sequences (IUPAC nucleotide code)
export const TATA_BOX_CONSENSUS = 'TATAWAR'; // TATA box consensus sequence (W = A/T, R = A/G)
export const INITIATOR_CONSENSUS = 'BBCABW'; // Initiator (Inr) consensus (B = C/G/T, W = A/T)
export const DPE_CONSENSUS = 'RGWYV'; // Downstream Promoter Element (R = A/G, G = G, W = A/T, Y = C/T, V = A/C/G)
export const CAAT_BOX_CONSENSUS = 'GGCCAATCT'; // CAAT box consensus sequence
export const GC_BOX_CONSENSUS = 'GGGCGG'; // GC box (Sp1 binding site) consensus sequence
export const CEBP_SITE_CONSENSUS = 'RTTGCGYAAY'; // C/EBP binding site consensus (R = A/G, Y = C/T)
export const E_BOX_CONSENSUS = 'CANNTG'; // E-box consensus sequence (N = any nucleotide)
export const AP1_SITE_CONSENSUS = 'TGASTCA'; // AP-1 binding site consensus (S = G/C)

// Promoter element names (used for identification and searching)
export const TATA_BOX_NAME = 'TATA';
export const INITIATOR_NAME = 'Inr';
export const DPE_NAME = 'DPE';
export const CAAT_BOX_NAME = 'CAAT';
export const GC_BOX_NAME = 'GC';
export const CEBP_SITE_NAME = 'C/EBP';
export const E_BOX_NAME = 'E-box';
export const AP1_SITE_NAME = 'AP-1';
