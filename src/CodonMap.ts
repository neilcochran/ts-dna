/**
 * Static codon-to-amino acid mapping for efficient lookups.
 */

/**
 * An interface representing an amino acid name.
 * It has all the standard representations of an amino acid name: the full name (name), the 3 letter abbreviation (abbrv), and the single letter code (slc).
 */
export interface AminoAcidName {
    readonly name: string;
    readonly abbrv: string;
    readonly slc: string;
}

/**
 * Static mapping of single letter codes to amino acid names
 */
export const SLC_AMINO_ACID_NAME_MAP: Record<string, AminoAcidName> = {
    A: { name: 'Alanine', abbrv: 'Ala', slc: 'A' },
    C: { name: 'Cysteine', abbrv: 'Cys', slc: 'C' },
    D: { name: 'Aspartic acid', abbrv: 'Asp', slc: 'D' },
    E: { name: 'Glutamic acid', abbrv: 'Glu', slc: 'E' },
    F: { name: 'Phenylalanine', abbrv: 'Phe', slc: 'F' },
    G: { name: 'Glycine', abbrv: 'Gly', slc: 'G' },
    H: { name: 'Histidine', abbrv: 'His', slc: 'H' },
    I: { name: 'Isoleucine', abbrv: 'Ile', slc: 'I' },
    K: { name: 'Lysine', abbrv: 'Lys', slc: 'K' },
    L: { name: 'Leucine', abbrv: 'Leu', slc: 'L' },
    M: { name: 'Methionine', abbrv: 'Met', slc: 'M' },
    N: { name: 'Asparagine', abbrv: 'Asn', slc: 'N' },
    P: { name: 'Proline', abbrv: 'Pro', slc: 'P' },
    Q: { name: 'Glutamine', abbrv: 'Gln', slc: 'Q' },
    R: { name: 'Arginine', abbrv: 'Arg', slc: 'R' },
    S: { name: 'Serine', abbrv: 'Ser', slc: 'S' },
    T: { name: 'Threonine', abbrv: 'Thr', slc: 'T' },
    V: { name: 'Valine', abbrv: 'Val', slc: 'V' },
    W: { name: 'Tryptophan', abbrv: 'Trp', slc: 'W' },
    Y: { name: 'Tyrosine', abbrv: 'Tyr', slc: 'Y' }
} as const;

/**
 * Direct codon-to-single-letter-code mapping for O(1) lookups.
 * This is much more efficient than creating RNA objects and iterating through arrays.
 */
export const CODON_TO_SLC_MAP: Record<string, string> = {
    // Alanine (A)
    'GCA': 'A', 'GCC': 'A', 'GCG': 'A', 'GCU': 'A',
    // Cysteine (C)
    'UGC': 'C', 'UGU': 'C',
    // Aspartic acid (D)
    'GAC': 'D', 'GAU': 'D',
    // Glutamic acid (E)
    'GAA': 'E', 'GAG': 'E',
    // Phenylalanine (F)
    'UUC': 'F', 'UUU': 'F',
    // Glycine (G)
    'GGA': 'G', 'GGC': 'G', 'GGG': 'G', 'GGU': 'G',
    // Histidine (H)
    'CAC': 'H', 'CAU': 'H',
    // Isoleucine (I)
    'AUA': 'I', 'AUC': 'I', 'AUU': 'I',
    // Lysine (K)
    'AAA': 'K', 'AAG': 'K',
    // Leucine (L)
    'UUA': 'L', 'UUG': 'L', 'CUA': 'L', 'CUC': 'L', 'CUG': 'L', 'CUU': 'L',
    // Methionine (M)
    'AUG': 'M',
    // Asparagine (N)
    'AAC': 'N', 'AAU': 'N',
    // Proline (P)
    'CCA': 'P', 'CCC': 'P', 'CCG': 'P', 'CCU': 'P',
    // Glutamine (Q)
    'CAA': 'Q', 'CAG': 'Q',
    // Arginine (R)
    'AGA': 'R', 'AGG': 'R', 'CGA': 'R', 'CGC': 'R', 'CGG': 'R', 'CGU': 'R',
    // Serine (S)
    'AGC': 'S', 'AGU': 'S', 'UCA': 'S', 'UCC': 'S', 'UCG': 'S', 'UCU': 'S',
    // Threonine (T)
    'ACA': 'T', 'ACC': 'T', 'ACG': 'T', 'ACU': 'T',
    // Valine (V)
    'GUA': 'V', 'GUC': 'V', 'GUG': 'V', 'GUU': 'V',
    // Tryptophan (W)
    'UGG': 'W',
    // Tyrosine (Y)
    'UAC': 'Y', 'UAU': 'Y'
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
    Y: ['UAC', 'UAU']
} as const;