import { validateNucleicAcid, unwrap } from '../../utils/validation.js';
import { NucleicAcidType } from '../../enums/nucleic-acid-type.js';
import { ValidationResult } from '../../types/validation-result.js';
import { InvalidSequenceError } from '../errors/InvalidSequenceError.js';
import { NucleicAcid } from './NucleicAcid.js';

/**
 * A class representing RNA with a valid sequence.
 * The constructor enforces validation, and the sequence is immutable after construction.
 * All RNA objects are guaranteed to be in a valid state.
 */
export class RNA extends NucleicAcid {
  private readonly sequence: string;

  /**
   * @param sequence - String representing the RNA sequence (required)
   *
   * @throws {@link InvalidSequenceError}
   * Thrown if the sequence is invalid
   *
   * @example
   * ```typescript
   * const rna = new RNA('AUCG'); // Valid
   * const rna = new RNA('aucg'); // Valid - normalized to uppercase
   * const rna = new RNA(''); // Throws InvalidSequenceError
   * const rna = new RNA('ATCG'); // Throws InvalidSequenceError - contains T instead of U
   * ```
   */
  constructor(sequence: string) {
    super(NucleicAcidType.RNA);
    const validationResult = validateNucleicAcid(sequence, NucleicAcidType.RNA);

    if (!validationResult.success) {
      throw new InvalidSequenceError(validationResult.error, sequence, NucleicAcidType.RNA);
    }

    this.sequence = validationResult.data;
  }

  /**
   * Creates an RNA instance from a sequence, returning a ValidationResult instead of throwing
   *
   * @param sequence - String representing the RNA sequence
   * @returns ValidationResult containing RNA instance or error message
   *
   * @example
   * ```typescript
   * const result = RNA.create('AUCG');
   * if (result.success) {
   *     console.log('Valid RNA:', result.data.getSequence());
   * } else {
   *     console.log('Error:', result.error);
   * }
   * ```
   */
  static create(sequence: string): ValidationResult<RNA> {
    const validationResult = validateNucleicAcid(sequence, NucleicAcidType.RNA);

    if (!validationResult.success) {
      return validationResult;
    }

    // Use unwrap since we know validation succeeded
    return { success: true as const, data: new RNA(unwrap(validationResult)) };
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
   * const rna = new RNA('AUCGAUCG');
   * const sub = rna.getSubsequence(2, 5); // Creates new RNA with 'CGA'
   * console.log(sub.getSequence()); // 'CGA'
   * ```
   */
  getSubsequence(start: number, end?: number): RNA {
    const subsequence = this.sequence.substring(start, end);
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
   * const rna = new RNA('AUCG');
   * const complement = rna.getComplement(); // Returns new RNA('UAGC')
   * console.log(complement.getSequence()); // 'UAGC'
   * ```
   */
  getComplement(): RNA {
    const complementSequence = this.getComplementSequence();
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
   * const rna = new RNA('AUCG');
   * const reverseComplement = rna.getReverseComplement(); // Returns new RNA('CGAU')
   *
   * // Chainable operations
   * const original = rna.getReverseComplement().getReverseComplement(); // Returns new RNA('AUCG')
   * const doubleComplement = rna.getComplement().getComplement(); // Returns new RNA('AUCG')
   * ```
   */
  getReverseComplement(): RNA {
    const reverseComplementSequence = this.getReverseComplementSequence();
    return new RNA(reverseComplementSequence);
  }
}
