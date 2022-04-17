import { NucleicAcid } from './NucleicAcid';
import { NucleicAcidType, isValidNucleicAcidSequence } from '../../nucleic-acids';

/**
 * A class representing DNA. An DNA object can either have an unset (undefined) sequence, or a valid sequence.
 * Both the constructor and setSequence() enforce validation, and the backing sequence is a private member. Therefor, all DNA
 * objects can only exist in a valid state.
 */
export class DNA extends NucleicAcid {
    private sequence?: string;

    /**
     * @param sequence - Optional string representing the DNA sequence
     * @throws
     * If the sequence param is invalid an error is thrown.
     */
    constructor(sequence?: string) {
        super(NucleicAcidType.DNA);
        if(sequence !== undefined){
            this.setSequence(sequence);
        }
    }

    /**
     * Set a new DNA sequence
     * @param sequence - String representing the DNA sequence
     * @throws
     * If the sequence param is invalid an error is thrown.
     */
    setSequence(sequence: string): void {
        if(!isValidNucleicAcidSequence(sequence, NucleicAcidType.DNA)){
            throw new Error(`invalid DNA sequence provided: ${sequence}`);
        }
        this.sequence = sequence.toUpperCase();
    }

    /**
     * Returns the DNA sequence string if it is set
     * @returns The DNA sequence string or undefined if it is not set
     */
    getSequence(): string | undefined {
        return this.sequence;
    }
}