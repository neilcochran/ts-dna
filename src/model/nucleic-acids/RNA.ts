import { validateNucleicAcid } from '../../utils/validation.js';
import { NucleicAcidType } from '../../enums/nucleic-acid-type.js';
import { InvalidSequenceError } from '../errors/InvalidSequenceError.js';
import { NucleicAcid } from './NucleicAcid.js';
import { ValidationResult, success, failure } from '../../types/validation-result.js';

/**
 * A class representing RNA with a valid sequence.
 * The constructor enforces validation, and the sequence is immutable after construction.
 * All RNA objects are guaranteed to be in a valid state.
 */
export class RNA extends NucleicAcid {
  private readonly sequence: string;

  /**
   * @param source - String sequence OR any NucleicAcid to convert to RNA
   *
   * @example
   * ```typescript
   * const rna1 = new RNA('AUCG');
   * const rna2 = new RNA(someDNA);
   * ```
   */
  constructor(source: string | NucleicAcid) {
    super(NucleicAcidType.RNA);

    // Handle different input types
    let sequenceString: string;
    if (typeof source === 'string') {
      sequenceString = source;
    } else {
      // If it's already RNA, just copy the sequence
      if (source.nucleicAcidType === NucleicAcidType.RNA) {
        sequenceString = source.getSequence();
      } else {
        // Convert DNA or other nucleic acid to RNA sequence (T→U)
        sequenceString = source.getSequence().replaceAll('T', 'U');
      }
    }

    const validationResult = validateNucleicAcid(sequenceString, NucleicAcidType.RNA);

    if (!validationResult.success) {
      throw new InvalidSequenceError(validationResult.error, sequenceString, NucleicAcidType.RNA);
    }

    this.sequence = validationResult.data;
  }

  /**
   * Creates an RNA instance with validation.
   *
   * @param source - String sequence OR any NucleicAcid to convert to RNA
   * @returns ValidationResult containing RNA or error
   */
  static create(source: string | NucleicAcid): ValidationResult<RNA> {
    try {
      return success(new RNA(source));
    } catch (error) {
      return failure(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Returns the RNA sequence string
   *
   * @returns The RNA sequence string
   */
  getSequence(): string {
    return this.sequence;
  }

  /**
   * Returns an RNA subsequence from the specified start position to the end position
   *
   * @param start - The starting position (inclusive, 0-based)
   * @param end - The ending position (exclusive, 0-based). If not specified, goes to end of sequence
   * @returns A new RNA instance containing the subsequence
   *
   * @example
   * ```typescript
   * const rnaResult = RNA.create('AUCGAUCG');
   * if (rnaResult.success) {
   *   const sub = rnaResult.data.getSubsequence(2, 5); // Creates new RNA with 'CGA'
   *   console.log(sub.getSequence()); // 'CGA'
   * }
   * ```
   */
  getSubsequence(start: number, end?: number): RNA {
    const subsequence = this.sequence.substring(start, end);
    // Since we're working with a substring of a valid RNA sequence,
    // it should still be valid RNA, so we can use the internal method
    return new RNA(subsequence);
  }

  /**
   * Returns the complement as a new RNA instance
   * This is the object-oriented API for getting RNA complements
   *
   * @returns A new RNA instance containing the complement sequence
   *
   * @example
   * ```typescript
   * const rnaResult = RNA.create('AUCG');
   * if (rnaResult.success) {
   *   const complement = rnaResult.data.getComplement(); // Returns new RNA('UAGC')
   *   console.log(complement.getSequence()); // 'UAGC'
   * }
   * ```
   */
  getComplement(): RNA {
    const complementSequence = this.getComplementSequence();
    // Complement of valid RNA is valid RNA
    return new RNA(complementSequence);
  }

  /**
   * Returns the reverse complement as a new RNA instance
   * This represents the opposite strand orientation for RNA binding
   *
   * @returns A new RNA instance containing the reverse complement sequence
   *
   * @example
   * ```typescript
   * const rnaResult = RNA.create('AUCG');
   * if (rnaResult.success) {
   *   const rna = rnaResult.data;
   *   const reverseComplement = rna.getReverseComplement(); // Returns new RNA('CGAU')
   *
   *   // Chainable operations
   *   const original = rna.getReverseComplement().getReverseComplement(); // Returns new RNA('AUCG')
   *   const doubleComplement = rna.getComplement().getComplement(); // Returns new RNA('AUCG')
   * }
   * ```
   */
  getReverseComplement(): RNA {
    const reverseComplementSequence = this.getReverseComplementSequence();
    // Reverse complement of valid RNA is valid RNA
    return new RNA(reverseComplementSequence);
  }
}
