import { NucleicAcid } from './NucleicAcid.js';
import { validateNucleicAcid } from '../../utils/validation.js';
import { NucleicAcidType } from '../../enums/nucleic-acid-type.js';
import { InvalidSequenceError } from '../errors/InvalidSequenceError.js';
import { ValidationResult, success, failure } from '../../types/validation-result.js';

/**
 * A class representing DNA with a valid sequence.
 * The constructor enforces validation, and the sequence is immutable after construction.
 * All DNA objects are guaranteed to be in a valid state.
 */
export class DNA extends NucleicAcid {
  private readonly sequence: string;

  /**
   * @param source - String sequence OR any NucleicAcid to convert to DNA
   *
   * @example
   * ```typescript
   * const dna1 = new DNA('ATCG');
   * const dna2 = new DNA(someRNA);
   * ```
   */
  constructor(source: string | NucleicAcid) {
    super(NucleicAcidType.DNA);

    // Handle different input types
    let sequenceString: string;
    if (typeof source === 'string') {
      sequenceString = source;
    } else {
      // If it's already DNA, just copy the sequence
      if (source.nucleicAcidType === NucleicAcidType.DNA) {
        sequenceString = source.getSequence();
      } else {
        // Convert RNA or other nucleic acid to DNA sequence (U→T)
        sequenceString = source.getSequence().replaceAll('U', 'T');
      }
    }

    const validationResult = validateNucleicAcid(sequenceString, NucleicAcidType.DNA);

    if (!validationResult.success) {
      throw new InvalidSequenceError(validationResult.error, sequenceString, NucleicAcidType.DNA);
    }

    this.sequence = validationResult.data;
  }

  /**
   * Creates a DNA instance with validation.
   *
   * @param source - String sequence OR any NucleicAcid to convert to DNA
   * @returns ValidationResult containing DNA or error
   */
  static create(source: string | NucleicAcid): ValidationResult<DNA> {
    try {
      return success(new DNA(source));
    } catch (error) {
      return failure(error instanceof Error ? error.message : String(error));
    }
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
   * const dnaResult = DNA.create('ATCGATCG');
   * if (dnaResult.success) {
   *   const sub = dnaResult.data.getSubsequence(2, 5); // Creates new DNA with 'CGA'
   *   console.log(sub.getSequence()); // 'CGA'
   * }
   * ```
   */
  getSubsequence(start: number, end?: number): DNA {
    const subsequence = this.sequence.substring(start, end);
    // Since we're working with a substring of a valid DNA sequence,
    // it should still be valid DNA, so we can use the internal method
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
   * const dnaResult = DNA.create('ATCG');
   * if (dnaResult.success) {
   *   const complement = dnaResult.data.getComplement(); // Returns new DNA('TAGC')
   *   console.log(complement.getSequence()); // 'TAGC'
   * }
   * ```
   */
  getComplement(): DNA {
    const complementSequence = this.getComplementSequence();
    // Complement of valid DNA is valid DNA
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
   * const dnaResult = DNA.create('ATCG');
   * if (dnaResult.success) {
   *   const dna = dnaResult.data;
   *   const reverseComplement = dna.getReverseComplement(); // Returns new DNA('CGAT')
   *
   *   // Chainable operations
   *   const original = dna.getReverseComplement().getReverseComplement(); // Returns new DNA('ATCG')
   *   const doubleComplement = dna.getComplement().getComplement(); // Returns new DNA('ATCG')
   * }
   * ```
   */
  getReverseComplement(): DNA {
    const reverseComplementSequence = this.getReverseComplementSequence();
    // Reverse complement of valid DNA is valid DNA
    return new DNA(reverseComplementSequence);
  }
}
