/**
 * Replication-specific biological constants.
 *
 * These cover RNA primer length bounds and polymerase / supporting-enzyme speed factors
 * relative to the organism's base polymerase speed. They live alongside the replication
 * module rather than in a global constants file because they are not consumed by any other
 * domain.
 */

/** Minimum RNA primer length in nucleotides, per the biological 3-10 nt range. */
export const MIN_RNA_PRIMER_LENGTH = 3;

/** Maximum RNA primer length in nucleotides, per the biological 3-10 nt range. */
export const MAX_RNA_PRIMER_LENGTH = 10;

/**
 * Speed factor (fraction of the organism's base polymerase speed) for DNA polymerase I,
 * which handles primer removal and gap-filling rather than bulk replication.
 */
export const DNA_POL_I_SPEED_FACTOR = 0.05;

/**
 * Speed factor (fraction of the organism's base polymerase speed) for DNA polymerase II,
 * a repair polymerase.
 */
export const DNA_POL_II_SPEED_FACTOR = 0.04;

/**
 * Speed factor (fraction of the organism's base polymerase speed) for DNA polymerase III,
 * the primary replicative polymerase.
 */
export const DNA_POL_III_SPEED_FACTOR = 1.0;

/**
 * Speed factor (fraction of the organism's base polymerase speed) for primase, which
 * synthesizes the short RNA primers that initiate Okazaki fragments.
 */
export const PRIMASE_SPEED_FACTOR = 0.1;

/**
 * Speed factor (fraction of the organism's base polymerase speed) for 5'-to-3' exonuclease,
 * which removes RNA primers.
 */
export const EXONUCLEASE_SPEED_FACTOR = 0.1;
