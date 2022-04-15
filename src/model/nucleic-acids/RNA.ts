import { isValidNucleicAcidSequence, NucleicAcidType, RNASubType } from '../../nucleic-acids';
import { NucleicAcid } from '../nucleic-acids';

export class RNA extends NucleicAcid {
    private sequence?: string;
    public rnaSubType?: RNASubType;
    constructor(sequence?: string, rnaSubType?: RNASubType) {
        super(NucleicAcidType.RNA);
        if(sequence !== undefined) {
            this.setSequence(sequence);
        }
        this.rnaSubType = rnaSubType;
    }

    setSequence(sequence: string): void {
        if(!isValidNucleicAcidSequence(sequence, this.nucleicAcidType)){
            throw new Error(`invalid RNA squence provided: ${sequence}`);
        }
        this.sequence = sequence.toUpperCase();
    }

    getSequence(): string | undefined {
        return this.sequence;
    }
}