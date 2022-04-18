import { AminoAcid, DNA, NucleicAcid, RNA } from './model';
import { InvalidCodonError } from './model/errors/InvalidCodonError';
import { InvalidSequenceError } from './model/errors/InvalidSequenceError';
import { convertNucleicAcid, isRNA } from './nucleic-acids';

//helper record that maps an amino acid's SLC to its corresponding AminoAcidName
export const SLC_AMINO_ACID_NAME_MAP: Record<string, AminoAcidName> = {
    A: { name: 'Alanine', abbrv: 'Ala', slc: 'A' },
    C: { name: 'Cysteine', abbrv: 'Cys', slc: 'C' },
    D: { name: 'Aspartic acid', abbrv: 'Asp', slc: 'D' },
    E: { name: 'Glutamic acid', abbrv: 'Glu', slc: 'E' },
    F: { name: 'Phenylalanine', abbrv: 'Phe', slc: 'F' },
    G: { name: 'Glycine', abbrv: 'Gly', slc: 'G' },
    H: { name: 'Histidine', abbrv: 'His', slc: 'H' },
    I: { name: 'Isoleucine', abbrv: 'Ile', slc: 'I' },
    K: { name: 'Lysine', abbrv: 'Lys', slc: 'K' },
    L: { name: 'Leucine', abbrv: 'Leu', slc: 'L' },
    M: { name: 'Methionine', abbrv: 'Met', slc: 'M' },
    N: { name: 'Asparagine', abbrv: 'Asn', slc: 'N' },
    P: { name: 'Proline', abbrv: 'Pro', slc: 'P' },
    Q: { name: 'Glutamine', abbrv: 'Gln', slc: 'Q' },
    R: { name: 'Arginine', abbrv: 'Arg', slc: 'R' },
    S: { name: 'Serine', abbrv: 'Ser', slc: 'S' },
    T: { name: 'Threonine', abbrv: 'Thr', slc: 'T' },
    V: { name: 'Valine', abbrv: 'Val', slc: 'V' },
    W: { name: 'Tryptophan', abbrv: 'Trp', slc: 'W' },
    Y: { name: 'Tyrosine', abbrv: 'Tyr', slc: 'Y' }
};

//helper record that maps an amino acid's SLC to its list of RNA codons
export const SLC_ALT_CODONS_MAP: Record<string, RNA[]> = {
    A: [ new RNA('GCA'), new RNA('GCC'), new RNA('GCG'), new RNA('GCU') ],
    C: [ new RNA('UGC'), new RNA('UGU') ],
    D: [ new RNA('GAC'), new RNA('GAU') ],
    E: [ new RNA('GAA'), new RNA('GAG') ],
    F: [ new RNA('UUC'), new RNA('UUU') ],
    G: [ new RNA('GGA'), new RNA('GGC'), new RNA('GGG'), new RNA('GGU') ],
    H: [ new RNA('CAC'), new RNA('CAU') ],
    I: [ new RNA('AUA'), new RNA('AUC'), new RNA('AUU') ],
    K: [ new RNA('AAA'), new RNA('AAG') ],
    L: [ new RNA('UUA'), new RNA('UUG'), new RNA('CUA'), new RNA('CUC'), new RNA('CUG'), new RNA('CUU') ],
    M: [ new RNA('AUG') ],
    N: [ new RNA('AAC'), new RNA('AAU') ],
    P: [ new RNA('CCA'), new RNA('CCC'), new RNA('CCG'), new RNA('CCU') ],
    Q: [ new RNA('CAA'), new RNA('CAG') ],
    R: [ new RNA('AGA'), new RNA('AGG'), new RNA('CGA'), new RNA('CGC'), new RNA('CGG'), new RNA('CGU') ],
    S: [ new RNA('AGC'), new RNA('AGU'), new RNA('UCA'), new RNA('UCC'), new RNA('UCG'), new RNA('UCU') ],
    T: [ new RNA('ACA'), new RNA('ACC'), new RNA('ACG'), new RNA('ACU') ],
    V: [ new RNA('GUA'), new RNA('GUC'), new RNA('GUG'), new RNA('GUU') ],
    W: [ new RNA('UGG') ],
    Y: [ new RNA('UAC'), new RNA('UAU') ]
};

/**
 * An interface representing an amino acid name.
 * It has all the standard representations of an amino acid name: the full name (name), the 3 letter abbreviation (abbrv), and the single letter code (slc).
 */
export interface AminoAcidName {
    readonly name: string;
    readonly abbrv: string;
    readonly slc: string;
}

/**
 * Given a valid codon, return the corresponding amino acid
 * @param codon - The codon that codes for an amino acid
 * @returns The corresponding amino acid or undefined if the codon is invalid
 */
export const getAminoAcidByCodon = (codon: NucleicAcid): AminoAcid | undefined => {
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
 * Given a valid codon, return the corresponding amino acid name
 * @internal
 * @param codon - The codon that codes for an amino acid
 * @returns The corresponding amino acid name or undefined if the codon is invalid
 */
export const getAminoAcidNameByCodon = (codon: NucleicAcid): AminoAcidName | undefined => {
    if(!codon.getSequence() || codon.getSequence()?.length !== 3) {
        return undefined;
    }
    //perform all look ups as the standard RNA representation
    if(!isRNA(codon)) {
        codon = convertNucleicAcid(codon);
    }
    let slc: keyof typeof SLC_ALT_CODONS_MAP;
    for(slc in SLC_ALT_CODONS_MAP) {
        const altCodon = SLC_ALT_CODONS_MAP[slc].find(altCodon => altCodon.equals(codon));
        if(altCodon) {
            return SLC_AMINO_ACID_NAME_MAP[slc];
        }
    }
    return undefined;
};

/**
 * Parse a nucleic acid into a list of amino acids. The nucleic acid must be made up of valid codons only.
 * @param nucleicAcid - The nucleic acid comprised of codons
 * @returns A list of amino acids
 *
 * @throws {@link InvalidSequenceError}
 * Thrown if the sequence is undefined, or not evenly divisible by 3 (codons always have a length of 3)
 *
 * @throws {@link InvalidCodonError}
 * Thrown if an invalid codon is encountered (one that does not code for an amino acid)
 */
export const nucleicAcidToAminoAcids = (nucleicAcid: NucleicAcid): AminoAcid[] => {
    const sequence = nucleicAcid.getSequence();
    const aminoAcids: AminoAcid[] = [];
    if(!sequence) {
        throw new InvalidSequenceError('The nucleic acid\'s sequence cannot be undefined', '', nucleicAcid.nucleicAcidType);
    }
    if(sequence.length % 3 !== 0) {
        throw new InvalidSequenceError('The nucleic acid\'s sequence length must be divisible by 3 to be comprised of only codons', sequence, nucleicAcid.nucleicAcidType);
    }
    //parse sequence into groups of 3 (codons)
    sequence.match(/.{1,3}/g)?.forEach(codonSeq => {
        const aminoAcid = getAminoAcidByCodon(isRNA(nucleicAcid) ? new RNA(codonSeq) : new DNA(codonSeq));
        if(!aminoAcid) {
            throw new InvalidCodonError('Invalid codon encountered', codonSeq);
        }
        aminoAcids.push(aminoAcid);
    });
    return aminoAcids;
};
