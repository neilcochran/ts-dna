/**
 * IUPAC nucleotide symbol mappings for pattern matching.
 * This file contains no imports to avoid circular dependencies.
 */

/**
 * Maps IUPAC nucleotide pattern symbols to their corresponding nucleotide bases
 */
export const NUCLEOTIDE_PATTERN_SYMBOLS: Record<string, string[]> = {
    A: ['A'], //Adenine
    T: ['T'], //Thymine
    C: ['C'], //Cytosine
    G: ['G'], //Guanine
    U: ['U'], //Uracil
    R: ['G', 'A'], //Purine
    Y: ['C', 'T'], //Pyrimidine
    K: ['G', 'T'], //Ketone
    M: ['A', 'C'], //Amino
    S: ['G', 'C'], //Strong
    W: ['A', 'T'], //Weak
    B: ['G', 'T', 'C'], //Not A
    V: ['G', 'C', 'A'], //Not T
    D: ['G', 'A', 'T'], //Not C
    H: ['A', 'C', 'T'], //Not G
    N: ['A', 'G', 'C', 'T'] //Any one base
};