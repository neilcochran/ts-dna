import { NucleicAcid } from './nucleic-acids';
import { AminoAcid } from './AminoAcid';
import { nucleicAcidToAminoAcids } from '../amino-acids';

/**
 * A class representing a polypeptide. It has a sequence of amino acids and a nucleic acid that contains the full coding sequence.
 * The constructor enforces validation, and all members are readonly. Therefor, all Polypeptide objects can only exist in a valid state.
 */
export class Polypeptide {
    public readonly aminoAcidSequence: AminoAcid[];
    public readonly nucleicAcid: NucleicAcid;

    /**
     * @param nucleicAcid - A nucleic acid that codes for a sequence of amino acids
     *
     * @throws {@link InvalidSequenceError}
     * Thrown if the nucleic acid's nucleotide sequence is undefined
     *
     * @throws {@link InvalidCodonError}
     * Thrown if the codon is invalid
     */
    constructor(nucleicAcid: NucleicAcid) {
        this.aminoAcidSequence = nucleicAcidToAminoAcids(nucleicAcid);
        this.nucleicAcid = nucleicAcid;
    }
}

