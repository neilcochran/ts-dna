import { NucleicAcid } from './nucleic-acids';
import { NucleicAcidType } from '../nucleic-acids';
import { AminoAcidName, getAminoAcidNameByCodon, SLC_ALT_CODON_SEQ_MAP } from '../amino-acids';
import { isDeepStrictEqual } from 'util';

export class AminoAcid implements AminoAcidName {
    private codon: NucleicAcid;
    readonly acidType: NucleicAcidType;
    readonly name: string;
    readonly abbrv: string;
    readonly slc: string;

    constructor(codon: NucleicAcid){
        const sequence = codon.getSequence();
        if(!sequence || sequence.length !== 3){
            throw new Error(`invalid codon length of: ${codon.getSequence()?.length ?? 0}`);
        }
        const aminoAcidName = getAminoAcidNameByCodon(codon);
        if(!aminoAcidName) {
            throw new Error(`No amino acid is associated with the codon: ${sequence}`);
        }
        this.name = aminoAcidName.name;
        this.abbrv = aminoAcidName.abbrv;
        this.slc = aminoAcidName.slc;
        this.acidType = codon.nucleicAcidType;
        this.codon = codon;
    }

    getCodonSequence(): string {
        //due to our constructor enforced logic getSequence() should never return undefined
        return this.codon.getSequence() ?? '';
    }

    getCodon(): NucleicAcid {
        return this.codon;
    }

    //return any other codons for this amino acid if others exist
    getAllAlternateCodons(): NucleicAcid[] {
        return SLC_ALT_CODON_SEQ_MAP[this.slc] ?? [];
    }

    //an alternate is the same amino acid build from a different codon
    isAlternateOf(aminoAcid: AminoAcid): boolean {
        return this.name === aminoAcid.name && !this.codon.equals(aminoAcid.codon);
    }

    equals(otherAminoAcid: AminoAcid): boolean {
        return isDeepStrictEqual(this, otherAminoAcid);
    }
}