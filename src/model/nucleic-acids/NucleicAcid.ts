import { isDeepStrictEqual } from 'util';
import { getComplementSequence } from '../../utils/validation';
import { NucleicAcidType } from '../../enums/nucleic-acid-type';

/**
 * An abstract class representing a general nucleic acid (a sequence of nucleotides)
 */
export abstract class NucleicAcid {
    readonly nucleicAcidType: NucleicAcidType;

    /**
     * @param nucleicAcidType - The type of NucleicAcid
     */
    constructor(nucleicAcidType: NucleicAcidType){
        this.nucleicAcidType = nucleicAcidType;
    }

    abstract getSequence(): string;

    /**
     * Returns the complement of the sequence
     *
     * @returns String representing the complement of the sequence
     */
    getComplementSequence(): string {
        return getComplementSequence(this.getSequence(), this.nucleicAcidType) ?? '';
    }

    /**
     * Checks if the given NucleicAcid is equal
     *
     * @param nucleicAcid - The NucleicAcid to compare
     *
     * @returns True if the NucleicAcids are equal, false otherwise
     */
    equals(nucleicAcid: NucleicAcid): boolean {
        return isDeepStrictEqual(this, nucleicAcid);
    }
}