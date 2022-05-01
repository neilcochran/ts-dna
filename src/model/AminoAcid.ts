import { RNA } from './nucleic-acids';
import { NucleicAcidType } from '../nucleic-acids';
import { AminoAcidName, getAminoAcidNameByCodon, SLC_ALT_CODONS_MAP } from '../amino-acids';
import { isDeepStrictEqual } from 'util';
import { InvalidCodonError } from './errors/InvalidCodonError';

/**
 * A class representing an amino acid instance with its backing RNA codon.
 * The constructor enforces validation, and all members are readonly. Therefor, all AminoAcid
 * objects can only exist in a valid state.
 */
export class AminoAcid implements AminoAcidName {
    public readonly codon: RNA;
    public readonly acidType: NucleicAcidType;
    public readonly name: string;
    public readonly abbrv: string;
    public readonly slc: string;

    /**
     * @param codon - An RNA codon that codes for an amino acid
     *
     * @throws {@link InvalidCodonError}
     * Thrown if the codon does not code for an amino acid
     */
    constructor(codon: RNA){
        const sequence = codon.getSequence();
        if(!sequence || sequence.length !== 3){
            throw new InvalidCodonError(`Invalid codon length of: ${codon.getSequence()?.length ?? 0}`, sequence ?? '');
        }
        const aminoAcidName = getAminoAcidNameByCodon(codon);
        if(!aminoAcidName) {
            throw new InvalidCodonError(`No amino acid is associated with the codon: ${sequence}`, sequence);
        }
        this.name = aminoAcidName.name;
        this.abbrv = aminoAcidName.abbrv;
        this.slc = aminoAcidName.slc;
        this.acidType = codon.nucleicAcidType;
        this.codon = codon;
    }

    /**
     * Returns the codon nucleotide sequence
     *
     * @returns The codon nucleotide sequence
     */
    getCodonSequence(): string {
        //due to our constructor enforced logic getSequence() should never return undefined
        return this.codon.getSequence() ?? '';
    }

    /**
     * Return all codons that code for this amino acid
     *
     * @returns All codons that code for this amino acid
     */
    getAllAlternateCodons(): RNA[] {
        return SLC_ALT_CODONS_MAP[this.slc];
    }

    /**
     * Checks if the given amino acid is the same amino acid regardless of the backing codon
     *
     * @param aminoAcid - The amino acid to check
     *
     * @returns True if the amino acid is the same (without checking the codon), false otherwise
     *
     * @example
     * ```typescript
     *  //comparing the same amino acid with the same codon
     *  new AminoAcid(new RNA('GCG')).isAlternateOf(new AminoAcid(new RNA('GCG'))); //returns false
     *  //comparing the same amino acid with alternate codons
     *  new AminoAcid(new RNA('GCA')).isAlternateOf(new AminoAcid(new RNA('GCC'))); //returns true
     * ```
     */
    isAlternateOf(aminoAcid: AminoAcid): boolean {
        return this.name === aminoAcid.name && !this.codon.equals(aminoAcid.codon);
    }

    /**
     * Checks if the given amino acid is the same, including the backing codon
     *
     * @param aminoAcid - The amino acid to check
     *
     * @returns True if the amino acid is the same (including the backing codon), false otherwise
     *
     * @example
     * ```typescript
     *  //comparing the same amino acid with the same codon
     *  new AminoAcid(new RNA('GCG')).equals(new AminoAcid(new RNA('GCG'))); //returns true
     *
     *  //comparing the same amino acid with alternate codons
     *  new AminoAcid(new RNA('GCA')).equals(new AminoAcid(new RNA('GCC'))); //returns false
     *
     *  //comparing different amino acids
     *  new AminoAcid(new RNA('UGC')).equals(new AminoAcid(new RNA('GCA'))); //returns false
     * ```
     */
    equals(aminoAcid: AminoAcid): boolean {
        return isDeepStrictEqual(this, aminoAcid);
    }
}