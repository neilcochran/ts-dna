import { NucleicAcid } from './NucleicAcid';
import { validateNucleicAcid, unwrap } from '../../validation';
import { NucleicAcidType } from '../../NucleicAcidType';
import { ValidationResult } from '../../ValidationResult';
import { InvalidSequenceError } from '../errors/InvalidSequenceError';

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
}