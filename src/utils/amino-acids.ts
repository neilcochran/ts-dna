import { AminoAcid, RNA } from '../model';
import { InvalidCodonError } from '../model/errors/InvalidCodonError';
import { InvalidSequenceError } from '../model/errors/InvalidSequenceError';
import { NucleicAcidType } from '../enums/nucleic-acid-type';
import { AminoAcidData } from '../types/amino-acid-data';
import {
    SLC_AMINO_ACID_DATA_MAP,
    CODON_TO_SLC_MAP
} from '../data/codon-map';

export { SLC_AMINO_ACID_DATA_MAP, SLC_ALT_CODONS_MAP, CODON_TO_SLC_MAP } from '../data/codon-map';

/**
 * Given a valid RNA codon, return the corresponding amino acid
 *
 * @param codon - The RNA codon that codes for an amino acid
 *
 * @returns The corresponding amino acid or undefined if the RNA codon is invalid
 *
 * @example
 * ```typescript
 *  //passing a valid RNA codon
 *  getAminoAcidByCodon(new RNA('GCA')); //returns an AminoAcid object
 *
 *  //passing an invalid codon (wrong length)
 *  getAminoAcidByCodon(new RNA('GC')); //returns undefined
 * ```
 */
export const getAminoAcidByCodon = (codon: RNA): AminoAcid | undefined => {
    //leverage the AminoAcid constructor validation and simply attempt to create the AminoAcid object
    //if it is not a valid amino acid codon it will throw an error
    try {
        const aminoAcid = new AminoAcid(codon);
        return aminoAcid;
    } catch (error) {
        return undefined;
    }
};

/**
 * Given a valid codon, return the corresponding amino acid data
 *
 * @param codon - The RNA codon that codes for an amino acid
 *
 * @returns The corresponding amino acid data or undefined if the codon is invalid
 *
 * @internal
 */
const getAminoAcidDataByCodon = (codon: RNA): AminoAcidData | undefined => {
    const sequence = codon.getSequence();
    if(sequence.length !== 3) {
        return undefined;
    }

    const slc = CODON_TO_SLC_MAP[sequence];
    if (!slc) {
        return undefined;
    }

    return SLC_AMINO_ACID_DATA_MAP[slc];
};

/**
 * Parse RNA into a list of amino acids. The RNA must be made up of valid codons only.
 *
 * @param rna - The RNA comprised of codons
 *
 * @returns A list of amino acids
 *
 * @throws {@link InvalidSequenceError}
 * Thrown if the sequence is undefined, or not evenly divisible by 3 (codons always have a length of 3)
 *
 * @throws {@link InvalidCodonError}
 * Thrown if an invalid codon is encountered (one that does not code for an amino acid)
 *
 * @example
 * ```typescript
 *  //passing RNA comprised of 3 valid codons
 *  RNAtoAminoAcids(new RNA('GCAUGCGAC')); //returns a list of 3 AminoAcid objects
 * ```
 */
export const RNAtoAminoAcids = (rna: RNA): AminoAcid[] => {
    const sequence = rna.getSequence();
    const aminoAcids: AminoAcid[] = [];

    if(sequence.length % 3 !== 0) {
        throw new InvalidSequenceError(`Invalid codon: ${sequence} The RNA sequence length must be divisible by 3 to be comprised of only codons`, sequence, NucleicAcidType.RNA);
    }
    //parse sequence into groups of 3 (codons)
    sequence.match(/.{1,3}/g)?.forEach(codonSeq => {
        const aminoAcid = getAminoAcidByCodon(new RNA(codonSeq));
        if(!aminoAcid) {
            throw new InvalidCodonError(`Invalid codon encountered: ${codonSeq}`, codonSeq);
        }
        aminoAcids.push(aminoAcid);
    });
    return aminoAcids;
};

// Export for internal use by model classes
export { getAminoAcidDataByCodon };
