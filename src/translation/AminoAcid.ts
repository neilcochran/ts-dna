import type { RNA } from '../sequence/index.js';
import { unsafeRNA } from '../sequence/parse.js';
import type { AminoAcidData } from './AminoAcidData.js';
import { UNSAFE_AMINO_ACID_KEY } from './internal-keys.js';

/**
 * A proteinogenic amino acid as encoded by a specific RNA codon.
 *
 * Composition over inheritance: an `AminoAcid` *has* an RNA codon and *has* a
 * {@link AminoAcidData} payload; biochemical properties (`name`, `singleLetterCode`,
 * `molecularWeight`, etc.) live on {@link data}.
 *
 * Public construction goes through `parseAminoAcid` (for reconstruction from raw codon
 * strings) or through the `translate` pipeline (for the mRNA -\> polypeptide flow). The
 * constructor is gated by a module-private sentinel.
 */
export class AminoAcid {
  /** The validated RNA codon that codes for this amino acid in this instance. */
  public readonly codon: RNA;

  /**
   * Biochemical data shared by every amino-acid instance of this type. Lookup is by codon;
   * alternate codons coding for the same amino acid share the same {@link AminoAcidData}
   * reference.
   */
  public readonly data: AminoAcidData;

  /**
   * Constructs an `AminoAcid`. Module-private; public callers must go through `parseAminoAcid`
   * or `translate`.
   *
   * @param codon - The validated RNA codon
   * @param data - The validated amino-acid data (codon must appear in `data.codons`)
   * @param trustedKey - Sentinel proving the caller is `translation/`-internal
   *
   * @internal
   */
  constructor(codon: RNA, data: AminoAcidData, trustedKey: typeof UNSAFE_AMINO_ACID_KEY) {
    if (trustedKey !== UNSAFE_AMINO_ACID_KEY) {
      throw new Error('AminoAcid must be constructed via parseAminoAcid or translate');
    }
    this.codon = codon;
    this.data = data;
  }

  /**
   * Returns every RNA codon that codes for this amino acid (including the one carried by
   * this instance), as fresh `RNA` instances. Alternate codons are the silent third-base
   * substitutions of degenerate codes.
   *
   * @returns Array of `RNA` codons, in canonical order matching `data.codons`
   *
   * @example
   * ```typescript
   * const alanine = parseAminoAcid('GCA').unwrap();
   * alanine.getAllAlternateCodons().map(c => c.sequence); // ['GCA', 'GCC', 'GCG', 'GCU']
   * ```
   */
  getAllAlternateCodons(): RNA[] {
    return this.data.codons.map(codon => unsafeRNA(codon));
  }

  /**
   * Reports whether another amino acid is the same proteinogenic type as this one but is
   * encoded by a different codon. Returns `false` for identical-codon comparisons (including
   * with `this`).
   *
   * @param other - The amino acid to compare against
   * @returns `true` if the two amino acids share a {@link AminoAcidData} but have different
   * codons
   *
   * @example
   * ```typescript
   * const a1 = parseAminoAcid('GCA').unwrap();
   * const a2 = parseAminoAcid('GCC').unwrap();
   * a1.isAlternateOf(a2); // true (both Alanine, different codons)
   * a1.isAlternateOf(a1); // false (same codon)
   * ```
   */
  isAlternateOf(other: AminoAcid): boolean {
    return (
      this.data.singleLetterCode === other.data.singleLetterCode &&
      this.codon.sequence !== other.codon.sequence
    );
  }

  /**
   * Reports structural equality with another amino acid: same proteinogenic type *and* same
   * codon. Two `AminoAcid` instances representing the same residue-codon pair are equal even
   * if they are different object references.
   *
   * @param other - The amino acid to compare against
   * @returns `true` if both `codon.sequence` and `data.singleLetterCode` match
   *
   * @example
   * ```typescript
   * const a1 = parseAminoAcid('GCA').unwrap();
   * const a2 = parseAminoAcid('GCA').unwrap();
   * a1.equals(a2); // true
   * ```
   */
  equals(other: AminoAcid): boolean {
    return (
      this.codon.sequence === other.codon.sequence &&
      this.data.singleLetterCode === other.data.singleLetterCode
    );
  }
}
