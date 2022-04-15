import { NucleicAcid } from './nucleic-acids';
import { AminoAcid } from './AminoAcid';
import { nucleicAcidToAminoAcids } from '../amino-acids';

export class Polypeptide {
    private aminoAcidSequence: AminoAcid[];
    private nucleicAcid: NucleicAcid;

    constructor(nucleicAcid: NucleicAcid) {
        this.aminoAcidSequence = nucleicAcidToAminoAcids(nucleicAcid);
        this.nucleicAcid = nucleicAcid;
    }

    getAminoAcidSequence(): AminoAcid[] {
        return this.aminoAcidSequence;
    }

    getNucleicAcid(): NucleicAcid {
        return this.nucleicAcid;
    }
}

