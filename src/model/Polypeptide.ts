import { NucleicAcid } from './nucleic-acids';
import { AminoAcid } from './AminoAcid';
import { nucleicAcidToAminoAcids } from '../amino-acids';

/**
 * A class representing a polypeptide. It has a sequence of amino acids and a nucleic acid that contains the full coding sequence.
 * The constructor enforces validation, and all members are private. Therefor, all Polypeptide objects can only exist in a valid state.
 */
export class Polypeptide {
    private aminoAcidSequence: AminoAcid[];
    private nucleicAcid: NucleicAcid;

    /**
     * @param nucleicAcid - A nucleic acid that codes for a sequence of amino acids
     * @throws
     * If the nucleicAcid param does not code for a valid sequence of amino acids, an error is thrown
     */
    constructor(nucleicAcid: NucleicAcid) {
        this.aminoAcidSequence = nucleicAcidToAminoAcids(nucleicAcid);
        this.nucleicAcid = nucleicAcid;
    }

    /**
     * Returns the sequence of amino acids that make up the polypeptide
     * @returns The sequence of amino acids that make up the polypeptide
     */
    getAminoAcidSequence(): AminoAcid[] {
        return this.aminoAcidSequence;
    }

    /**
     * Returns the nucleic acid that contains the full coding sequence
     * @returns The nucleic acid that contains the full coding sequence
     */
    getNucleicAcid(): NucleicAcid {
        return this.nucleicAcid;
    }
}

