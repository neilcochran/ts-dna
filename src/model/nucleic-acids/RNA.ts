import { validateNucleicAcid, unwrap } from '../../utils/validation.js';
import { NucleicAcidType } from '../../enums/nucleic-acid-type.js';
import { RNASubType } from '../../enums/rna-sub-type.js';
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
  public readonly rnaSubType?: RNASubType;

  /**
   * @param sequence - String representing the RNA sequence (required)
   * @param rnaSubType - Optional RNASubType representing the type of RNA
   *
   * @throws {@link InvalidSequenceError}
   * Thrown if the sequence is invalid
   *
   * @example
   * ```typescript
   * const rna = new RNA('AUCG'); // Valid
   * const rna = new RNA('aucg'); // Valid - normalized to uppercase
   * const rna = new RNA('AUCG', RNASubType.M_RNA); // Valid with subtype
   * const rna = new RNA(''); // Throws InvalidSequenceError
   * const rna = new RNA('ATCG'); // Throws InvalidSequenceError - contains T instead of U
   * ```
   */
  constructor(sequence: string, rnaSubType?: RNASubType) {
    super(NucleicAcidType.RNA);
    const validationResult = validateNucleicAcid(sequence, NucleicAcidType.RNA);

    if (!validationResult.success) {
      throw new InvalidSequenceError(validationResult.error, sequence, NucleicAcidType.RNA);
    }

    this.sequence = validationResult.data;
    this.rnaSubType = rnaSubType;
  }

  /**
   * Creates an RNA instance from a sequence, returning a ValidationResult instead of throwing
   *
   * @param sequence - String representing the RNA sequence
   * @param rnaSubType - Optional RNASubType representing the type of RNA
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
  static create(sequence: string, rnaSubType?: RNASubType): ValidationResult<RNA> {
    const validationResult = validateNucleicAcid(sequence, NucleicAcidType.RNA);

    if (!validationResult.success) {
      return validationResult;
    }

    // Use unwrap since we know validation succeeded
    return { success: true as const, data: new RNA(unwrap(validationResult), rnaSubType) };
  }

  /**
   * Returns the RNA sequence string
   *
   * @returns The RNA sequence string
   */
  getSequence(): string {
    return this.sequence;
  }
}
