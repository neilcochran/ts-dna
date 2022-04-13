import { AminoAcid, getAminoAcidByCodon } from './amino-acids';
import { DNA, isRNA, NucleicAcid, RNA } from './nucleic-acids';

export class Polypeptide {
    private aminoAcidSequence: AminoAcid[];
    private nucleicAcid: NucleicAcid;

    constructor(nucleicAcid: NucleicAcid) {
        this.aminoAcidSequence = nucleicAcidToAminoAcids(nucleicAcid);
        this.nucleicAcid = nucleicAcid;
    }

    getAminoAcidSequence(): AminoAcid[] {
        return this.aminoAcidSequence;
    }

    getNucleicAcid(): NucleicAcid {
        return this.nucleicAcid;
    }
}

//parse a nucleic acid into a list of amino acids. The nucleic acid must be made up of valid codons only.
export const nucleicAcidToAminoAcids = (nucleicAcid: NucleicAcid): AminoAcid[] => {
    const sequence = nucleicAcid.getSequence();
    const aminoAcids: AminoAcid[] = [];
    if(!sequence) {
        throw new Error('The nucleic acid sequence cannot be undefined');
    }
    if(sequence.length % 3 !== 0) {
        throw new Error('the nucleic acid length must be divisable by 3 to be comprised of only codons');
    }
    //parse sequence into groups of 3 (codons)
    sequence.match(/.{1,3}/g)?.forEach(codonSeq => {
        const aminoAcid = getAminoAcidByCodon(isRNA(nucleicAcid) ? new RNA(codonSeq) : new DNA(codonSeq));
        if(!aminoAcid) {
            throw new Error(`invalid codon encounted: ${codonSeq}`);
        }
        aminoAcids.push(aminoAcid);
    });
    return aminoAcids;
};
