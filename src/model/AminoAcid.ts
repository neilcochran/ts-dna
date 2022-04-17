import { NucleicAcid } from './nucleic-acids';
import { NucleicAcidType } from '../nucleic-acids';
import { AminoAcidName, getAminoAcidNameByCodon, SLC_ALT_CODONS_MAP } from '../amino-acids';
import { isDeepStrictEqual } from 'util';

/**
 * A class representing an amino acid instance with its backing codon.
 * The constructor enforces validation, and all members are private. Therefor, all AminoAcid
 * objects can only exist in a valid state.
 */
export class AminoAcid implements AminoAcidName {
    private codon: NucleicAcid;
    readonly acidType: NucleicAcidType;
    readonly name: string;
    readonly abbrv: string;
    readonly slc: string;

    /**
     * @param codon - A codon that codes for an amino acid
     * @throws
     * If the codon param does not code for an amino acid, an error is thrown
     */
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

    /**
     * Returns the codon nucleotide sequence
     * @returns The codon nucleotide sequence
     */
    getCodonSequence(): string {
        //due to our constructor enforced logic getSequence() should never return undefined
        return this.codon.getSequence() ?? '';
    }

    /**
     * Returns the backing NucleicAcid that represents the codon
     * @returns The backing NucleicAcid that represents the codon
     */
    getCodon(): NucleicAcid {
        return this.codon;
    }


    /**
     * Return all codons that code for this amino acid
     * @returns All codons that code for this amino acid
     */
    getAllAlternateCodons(): NucleicAcid[] {
        return SLC_ALT_CODONS_MAP[this.slc];
    }

    /**
     * Checks if the given amino acid is the same amino acid regardless of the backing codon
     * @param aminoAcid - The amino acid to check
     * @returns True if the amino acid is the same (without checking the codon), false otherwise
     */
    isAlternateOf(aminoAcid: AminoAcid): boolean {
        return this.name === aminoAcid.name && !this.codon.equals(aminoAcid.codon);
    }

    /**
     * Checks if the given amino acid is the same, including the backing codon
     * @param aminoAcid - The amino acid to check
     * @returns True if the amino acid is the same (including the backing codon), false otherwise
     */
    equals(aminoAcid: AminoAcid): boolean {
        return isDeepStrictEqual(this, aminoAcid);
    }
}