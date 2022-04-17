import { isDeepStrictEqual } from 'util';
import { getComplementSequence, NucleicAcidType } from '../../nucleic-acids';

/**
 * An abstract class representing a general nucleic acid (a squence of nucleotides)
 */
export abstract class NucleicAcid {
    readonly nucleicAcidType: NucleicAcidType;

    /**
     * @param nucleicAcidType - The type of NucleicAcid
     */
    constructor(nucleicAcidType: NucleicAcidType){
        this.nucleicAcidType = nucleicAcidType;
    }

    abstract setSequence(sequence: string): void;

    abstract getSequence(): string | undefined;

    /**
     * Returns the complement of the sequence if the sequence is set
     * @returns String representing the complement of the sequence or undefined if there is no sequence
     */
    getComplementSequence(): string | undefined {
        return getComplementSequence(this.getSequence(), this.nucleicAcidType);
    }

    /**
     * Checks if the given NucleicAcid is equal
     * @param nucleicAcid - The NucleicAcid to compare
     * @returns True if the NucleicAcids are equal, false otherwise
     */
    equals(nucleicAcid: NucleicAcid): boolean {
        return isDeepStrictEqual(this, nucleicAcid);
    }
}