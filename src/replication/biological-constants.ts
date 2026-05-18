/**
 * Replication-specific biological constants.
 *
 * Lives alongside the replication module rather than in a global constants file because the
 * values are not consumed by any other domain.
 */

/** Minimum RNA primer length in nucleotides, per the biological 3-10 nt range. */
export const MIN_RNA_PRIMER_LENGTH = 3;

/** Maximum RNA primer length in nucleotides, per the biological 3-10 nt range. */
export const MAX_RNA_PRIMER_LENGTH = 10;
