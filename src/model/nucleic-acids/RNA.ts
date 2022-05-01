import { isValidNucleicAcid, NucleicAcidType, RNASubType } from '../../nucleic-acids';
import { InvalidSequenceError } from '../errors/InvalidSequenceError';
import { NucleicAcid } from '../nucleic-acids';

/**
 * A class representing RNA. An RNA object can either have an unset (undefined) sequence, or a valid sequence.
 * Both the constructor and setSequence() enforce validation, and the backing sequence is a private member. Therefor, all RNA
 * objects can only exist in a valid state.
 */
export class RNA extends NucleicAcid {
    private sequence?: string;
    public rnaSubType?: RNASubType;

    /**
     * @param sequence - Optional string representing the RNA sequence
     *
     * @param rnaSubType - Optional RNASubType representing the type of RNA
     */
    constructor(sequence?: string, rnaSubType?: RNASubType) {
        super(NucleicAcidType.RNA);
        if(sequence !== undefined) {
            this.setSequence(sequence);
        }
        this.rnaSubType = rnaSubType;
    }

    /**
     * Set a new RNA sequence
     * @param sequence - String representing the RNA sequence
     *
     * @throws {@link InvalidSequenceError}
     * Thrown if the sequence is invalid
     */
    setSequence(sequence: string): void {
        if(!isValidNucleicAcid(sequence, this.nucleicAcidType)){
            throw new InvalidSequenceError(`Invalid RNA sequence provided: ${sequence}`, sequence, NucleicAcidType.RNA);
        }
        this.sequence = sequence.toUpperCase();
    }

    /**
     * Returns the RNA sequence string if it is set
     *
     * @returns The RNA sequence string or undefined if it is not set
     */
    getSequence(): string | undefined {
        return this.sequence;
    }
}