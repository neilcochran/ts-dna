import { RNA } from './nucleic-acids';
import { AminoAcid } from './AminoAcid';
import { RNAtoAminoAcids } from '../amino-acids';

/**
 * A class representing a polypeptide. It has a sequence of amino acids and an RNA sequence that contains the full coding sequence.
 * The constructor enforces validation, and all members are readonly. Therefore, all Polypeptide objects can only exist in a valid state.
 */
export class Polypeptide {
    public readonly aminoAcidSequence: AminoAcid[];
    public readonly rna: RNA;

    /**
     * @param rna - An RNA sequence that codes for a sequence of amino acids
     *
     * @throws {@link InvalidSequenceError}
     * Thrown if the RNA sequence length is not divisible by 3 (invalid codons)
     *
     * @throws {@link InvalidCodonError}
     * Thrown if any codon is invalid (doesn't code for an amino acid)
     *
     * @example
     * ```typescript
     * const polypeptide = new Polypeptide(new RNA('AUGAAAGGG')); // 3 codons: Met-Lys-Gly
     * console.log(polypeptide.aminoAcidSequence.length); // 3
     * ```
     */
    constructor(rna: RNA) {
        this.aminoAcidSequence = RNAtoAminoAcids(rna);
        this.rna = rna;
    }
}

