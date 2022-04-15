import { NucleicAcid } from './NucleicAcid';
import { NucleicAcidType, isValidNucleicAcidSequence } from '../../nucleic-acids';

export class DNA extends NucleicAcid {
    private sequence?: string;

    constructor(sequence?: string) {
        super(NucleicAcidType.DNA);
        if(sequence !== undefined){
            this.setSequence(sequence);
        }
    }

    setSequence(sequence: string): void {
        if(!isValidNucleicAcidSequence(sequence, NucleicAcidType.DNA)){
            throw new Error(`invalid RNA squence provided: ${sequence}`);
        }
        this.sequence = sequence.toUpperCase();
    }

    getSequence(): string | undefined {
        return this.sequence;
    }
}