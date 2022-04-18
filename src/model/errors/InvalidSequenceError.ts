import { NucleicAcidType } from '../../nucleic-acids';

/**
 * A class representing an invalid nucleic acid sequence
 */
export class InvalidSequenceError extends Error {
    public readonly sequence: string;
    public readonly nucleicAcidType: NucleicAcidType;

    /**
     * @param message - The error message
     * @param sequence - The invalid nucleotide sequence
     * @param nucleicAcidType - The type of nucleic acid
     */
    constructor(message: string, sequence: string, nucleicAcidType: NucleicAcidType) {
        super(message);
        this.sequence = sequence;
        this.nucleicAcidType = nucleicAcidType;
    }
}