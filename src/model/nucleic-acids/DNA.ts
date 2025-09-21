import { NucleicAcid } from './NucleicAcid.js';
import { validateNucleicAcid, unwrap } from '../../utils/validation.js';
import { NucleicAcidType } from '../../enums/nucleic-acid-type.js';
import { ValidationResult } from '../../types/validation-result.js';
import { InvalidSequenceError } from '../errors/InvalidSequenceError.js';

/**
 * A class representing DNA with a valid sequence.
 * The constructor enforces validation, and the sequence is immutable after construction.
 * All DNA objects are guaranteed to be in a valid state.
 */
export class DNA extends NucleicAcid {
  private readonly sequence: string;

  /**
   * @param sequence - String representing the DNA sequence (required)
   *
   * @throws {@link InvalidSequenceError}
   * Thrown if the sequence is invalid
   *
   * @example
   * ```typescript
   * const dna = new DNA('ATCG'); // Valid
   * const dna = new DNA('atcg'); // Valid - normalized to uppercase
   * const dna = new DNA(''); // Throws InvalidSequenceError
   * const dna = new DNA('ATUX'); // Throws InvalidSequenceError - invalid characters
   * ```
   */
  constructor(sequence: string) {
    super(NucleicAcidType.DNA);
    const validationResult = validateNucleicAcid(sequence, NucleicAcidType.DNA);

    if (!validationResult.success) {
      throw new InvalidSequenceError(validationResult.error, sequence, NucleicAcidType.DNA);
    }

    this.sequence = validationResult.data;
  }

  /**
   * Creates a DNA instance from a sequence, returning a ValidationResult instead of throwing
   *
   * @param sequence - String representing the DNA sequence
   * @returns ValidationResult containing DNA instance or error message
   *
   * @example
   * ```typescript
   * const result = DNA.create('ATCG');
   * if (result.success) {
   *     console.log('Valid DNA:', result.data.getSequence());
   * } else {
   *     console.log('Error:', result.error);
   * }
   * ```
   */
  static create(sequence: string): ValidationResult<DNA> {
    const validationResult = validateNucleicAcid(sequence, NucleicAcidType.DNA);

    if (!validationResult.success) {
      return validationResult;
    }

    // Use unwrap since we know validation succeeded
    return { success: true as const, data: new DNA(unwrap(validationResult)) };
  }

  /**
   * Returns the DNA sequence string
   *
   * @returns The DNA sequence string
   */
  getSequence(): string {
    return this.sequence;
  }

  /**
   * Returns a DNA subsequence from the specified start position to the end position
   *
   * @param start - The starting position (inclusive, 0-based)
   * @param end - The ending position (exclusive, 0-based). If not specified, goes to end of sequence
   * @returns A new DNA instance containing the subsequence
   *
   * @example
   * ```typescript
   * const dna = new DNA('ATCGATCG');
   * const sub = dna.getSubsequence(2, 5); // Creates new DNA with 'CGA'
   * console.log(sub.getSequence()); // 'CGA'
   * ```
   */
  getSubsequence(start: number, end?: number): DNA {
    const subsequence = this.sequence.substring(start, end);
    return new DNA(subsequence);
  }

  /**
   * Returns the complement as a new DNA instance
   * This is the object-oriented API for getting DNA complements
   *
   * @returns A new DNA instance containing the complement sequence
   *
   * @example
   * ```typescript
   * const dna = new DNA('ATCG');
   * const complement = dna.getComplement(); // Returns new DNA('TAGC')
   * console.log(complement.getSequence()); // 'TAGC'
   * ```
   */
  getComplement(): DNA {
    const complementSequence = this.getComplementSequence();
    return new DNA(complementSequence);
  }

  /**
   * Returns the reverse complement as a new DNA instance
   * This represents the opposite strand of double-stranded DNA
   *
   * @returns A new DNA instance containing the reverse complement sequence
   *
   * @example
   * ```typescript
   * const dna = new DNA('ATCG');
   * const reverseComplement = dna.getReverseComplement(); // Returns new DNA('CGAT')
   *
   * // Chainable operations
   * const original = dna.getReverseComplement().getReverseComplement(); // Returns new DNA('ATCG')
   * const doubleComplement = dna.getComplement().getComplement(); // Returns new DNA('ATCG')
   * ```
   */
  getReverseComplement(): DNA {
    const reverseComplementSequence = this.getReverseComplementSequence();
    return new DNA(reverseComplementSequence);
  }
}
