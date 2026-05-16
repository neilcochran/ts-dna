/**
 * Canonical splice-site consensus sequences for both the DNA and RNA strands.
 *
 * The GT-AG rule covers ~99% of mammalian introns. DNA-side variants (`GT` donor, `AG`
 * acceptor) are useful for splice-site search over gene sequences; the RNA-side variants
 * (`GU` donor, `AG` acceptor) are useful when validating transcript-coordinate introns on the
 * pre-mRNA. Both sides live together so callers don't have to know which to import; pick the
 * pair matching the molecule type being inspected.
 */

/** Canonical 5' splice-site donor consensus on the DNA strand. */
export const DNA_DONOR_SPLICE_CONSENSUS = 'GT';

/** Canonical 3' splice-site acceptor consensus on the DNA strand. */
export const DNA_ACCEPTOR_SPLICE_CONSENSUS = 'AG';

/** Canonical 5' splice-site donor consensus on the RNA strand (U replaces T). */
export const RNA_DONOR_SPLICE_CONSENSUS = 'GU';

/** Canonical 3' splice-site acceptor consensus on the RNA strand. */
export const RNA_ACCEPTOR_SPLICE_CONSENSUS = 'AG';
