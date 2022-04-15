import { isDeepStrictEqual } from 'util';
import { getComplementSequence, NucleicAcidType } from '../../nucleic-acids';

export abstract class NucleicAcid {
    readonly nucleicAcidType: NucleicAcidType;

    constructor(nucleicAcidType: NucleicAcidType){
        this.nucleicAcidType = nucleicAcidType;
    }

    abstract setSequence(sequence: string): void;

    abstract getSequence(): string | undefined;

    getComplementSequence(): string | undefined {
        return getComplementSequence(this.getSequence(), this.nucleicAcidType);
    }

    equals(nucleicAcid: NucleicAcid): boolean {
        return isDeepStrictEqual(this, nucleicAcid);
    }
}