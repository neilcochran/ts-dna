import { RNA } from './nucleic-acids';
import { NucleicAcidType } from '../NucleicAcidType';
import { getAminoAcidDataByCodon, SLC_ALT_CODONS_MAP } from '../amino-acids';
import { AminoAcidPolarity } from '../AminoAcidPolarity';
import { AminoAcidCharge } from '../AminoAcidCharge';
import { AminoAcidSideChainType } from '../AminoAcidSideChainType';
import { isDeepStrictEqual } from 'util';
import { InvalidCodonError } from './errors/InvalidCodonError';

/**
 * A class representing an amino acid instance with its backing RNA codon.
 * The constructor enforces validation, and all members are readonly. Therefore, all AminoAcid
 * objects can only exist in a valid state.
 */
export class AminoAcid {
    public readonly codon: RNA;
    public readonly acidType: NucleicAcidType;
    public readonly name: string;
    public readonly abbrv: string;
    public readonly slc: string;
    public readonly molecularWeight: number;
    public readonly polarity: AminoAcidPolarity;
    public readonly charge: AminoAcidCharge;
    public readonly hydrophobicity: number;
    public readonly sideChainType: AminoAcidSideChainType;

    /**
     * @param codon - An RNA codon that codes for an amino acid
     *
     * @throws {@link InvalidCodonError}
     * Thrown if the codon does not code for an amino acid
     */
    constructor(codon: RNA){
        const sequence = codon.getSequence();
        if(sequence.length !== 3){
            throw new InvalidCodonError(`Invalid codon length of: ${sequence.length}`, sequence);
        }
        const aminoAcidData = getAminoAcidDataByCodon(codon);
        if(!aminoAcidData) {
            throw new InvalidCodonError(`No amino acid is associated with the codon: ${sequence}`, sequence);
        }
        this.name = aminoAcidData.name;
        this.abbrv = aminoAcidData.abbrv;
        this.slc = aminoAcidData.slc;
        this.molecularWeight = aminoAcidData.molecularWeight;
        this.polarity = aminoAcidData.polarity;
        this.charge = aminoAcidData.charge;
        this.hydrophobicity = aminoAcidData.hydrophobicity;
        this.sideChainType = aminoAcidData.sideChainType;
        this.acidType = codon.nucleicAcidType;
        this.codon = codon;
    }

    /**
     * Returns the codon nucleotide sequence
     *
     * @returns The codon nucleotide sequence
     */
    getCodonSequence(): string {
        return this.codon.getSequence();
    }

    /**
     * Return all codons that code for this amino acid
     *
     * @returns All codons that code for this amino acid
     */
    getAllAlternateCodons(): RNA[] {
        return SLC_ALT_CODONS_MAP[this.slc].map(codonStr => new RNA(codonStr));
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