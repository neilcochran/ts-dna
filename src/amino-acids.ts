import { NucleicAcid, NucleicAcidType, convertNucleicAcid } from './nucleic-acids';

export interface AminoAcidName {
    readonly name: string;
    readonly abbrv: string;
    readonly slc: string;
}

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
        const aminoAcidName = getAminoAcidNamesByCodon(codon);
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
        //TODO implement
        throw new Error('Not implemented');
    }
}

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

const getAminoAcidNamesByCodon = (codon: NucleicAcid): AminoAcidName | undefined => {
    let sequence = codon.getSequence();
    if(!sequence || sequence.length !== 3) {
        return undefined;
    }
    //perform all look up as the standard RNA representation
    if(codon.nucleicAcidType === NucleicAcidType.DNA) {
        sequence = convertNucleicAcid(codon).getSequence();
    }

    switch(sequence) {
        case 'GCA':
        case 'GCC':
        case 'GCG':
        case 'GCU':
            return { name: 'Alanine', abbrv: 'Ala', slc: 'A' };
        case 'UGC':
        case 'UGU':
            return { name: 'Cysteine', abbrv: 'Cys', slc: 'C' };
        case 'GAC':
        case 'GAU':
            return { name: 'Aspartic acid', abbrv: 'Asp', slc: 'D' };
        case 'GAA':
        case 'GAG':
            return { name: 'Glutamic acid', abbrv: 'Glu', slc: 'E' };
        case 'UUC':
        case 'UUU':
            return { name: 'Phenylalanine', abbrv: 'Phe', slc: 'F' };
        case 'GGA':
        case 'GGC':
        case 'GGG':
        case 'GGU':
            return { name: 'Glycine', abbrv: 'Gly', slc: 'G' };
        case 'CAC':
        case 'CAU':
            return { name: 'Histidine', abbrv: 'His', slc: 'H' };
        case 'AUA':
        case 'AUC':
        case 'AUU':
            return { name: 'Isoleucine', abbrv: 'Ile', slc: 'I' };
        case 'AAA':
        case 'AAG':
            return { name: 'Lysine', abbrv: 'Lys', slc: 'K' };
        case 'UUA':
        case 'UUG':
        case 'CUA':
        case 'CUC':
        case 'CUG':
        case 'CUU':
            return { name: 'Leucine', abbrv: 'Leu', slc: 'L' };
        case 'AUG':
            return { name: 'Methionine', abbrv: 'Met', slc: 'M' };
        case 'AAC':
        case 'AAU':
            return { name: 'Asparagine', abbrv: 'Asn', slc: 'N' };
        case 'CCA':
        case 'CCC':
        case 'CCG':
        case 'CCU':
            return { name: 'Proline', abbrv: 'Pro', slc: 'P' };
        case 'CAA':
        case 'CAG':
            return { name: 'Glutamine', abbrv: 'Gln', slc: 'Q' };
        case 'AGA':
        case 'AGG':
        case 'CGA':
        case 'CGC':
        case 'CGG':
        case 'CGU':
            return { name: 'Arginine', abbrv: 'Arg', slc: 'R' };
        case 'AGC':
        case 'AGU':
        case 'UCA':
        case 'UCC':
        case 'UCG':
        case 'UCU':
            return { name: 'Serine', abbrv: 'Ser', slc: 'S' };
        case 'ACA':
        case 'ACC':
        case 'ACG':
        case 'ACU':
            return { name: 'Threonine', abbrv: 'Thr', slc: 'T' };
        case 'GUA':
        case 'GUC':
        case 'GUG':
        case 'GUU':
            return { name: 'Valine', abbrv: 'Val', slc: 'V' };
        case 'UGG':
            return { name: 'Tryptophan', abbrv: 'Trp', slc: 'W' };
        case 'UAC':
        case 'UAU':
            return { name: 'Tyrosine', abbrv: 'Tyr', slc: 'Y' }; 
        default:
            return undefined;
    }
};
