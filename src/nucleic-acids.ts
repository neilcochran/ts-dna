export abstract class NucleicAcid {
    readonly nucleicAcidType: NucleicAcidType;
    
    constructor(nucleicAcidType: NucleicAcidType){
        this.nucleicAcidType = nucleicAcidType;
    }

    abstract setSequence(sequence: string): void;

    abstract getSequence(): string | undefined;

    getComplementSequence(): string | undefined {
        return getComplementSequence(this.getSequence(), this.nucleicAcidType);
    }
}

export class DNA extends NucleicAcid {
    private sequence: string | undefined;

    constructor(sequence?: string) {
        super(NucleicAcidType.DNA);
        if(sequence !== undefined){
            this.setSequence(sequence);
        }
    }

    setSequence(sequence: string): void {
        if(!isValidNucleicAcidSequence(sequence, NucleicAcidType.DNA)){
            throw new Error(`invalid RNA squence provided: ${sequence}`);
        }
        this.sequence = sequence.toUpperCase();
    }
    
    getSequence(): string | undefined {
        return this.sequence;
    }
}

export class RNA extends NucleicAcid {
    private sequence: string | undefined;

    constructor(sequence?: string) {
        super(NucleicAcidType.RNA);
        if(sequence !== undefined) {
            this.setSequence(sequence);
        }
    }

    setSequence(sequence: string): void {
        if(!isValidNucleicAcidSequence(sequence, this.nucleicAcidType)){
            throw new Error(`invalid RNA squence provided: ${sequence}`);
        }
        this.sequence = sequence.toUpperCase();
    }

    getSequence(): string | undefined {
        return this.sequence;
    }
   
    getComplementSequence(): string | undefined {
        return getComplementSequence(this.sequence, this.nucleicAcidType);
    }
}

export const isDNA = (nucleicAcid: NucleicAcid): nucleicAcid is DNA => {
    return nucleicAcid.nucleicAcidType === NucleicAcidType.DNA;
};

export const isRNA = (nucleicAcid: NucleicAcid): nucleicAcid is RNA => {
    return nucleicAcid.nucleicAcidType === NucleicAcidType.RNA;
};

export enum NucleicAcidType { 
    DNA = 'DNA',
    RNA = 'RNA'
}

// For internal use by DNA/RNA classes only!
// since this is only ever called (and not exported) from DNA/RNA classes which are alway have a valid sequence (or none at all)
// once successfully constructed, we can skip validation here and just check for undefined
// all other internal and external use should first construct the desired DNA/RNA object and then call it's .getComplementSequence()
const getComplementSequence = (sequence: string | undefined, type: NucleicAcidType): string | undefined => {
    let complement: string | undefined;
    if(sequence){
        complement = '';
        for (const base of sequence) {
            complement += NucleicAcidType.DNA === type 
                ? getDNABaseComplement(base) ?? ''
                : getRNABaseComplement(base) ?? '';
        }
    }
    return complement;
};

export const isValidNucleicAcidSequence = (sequence: string, type: NucleicAcidType): boolean => {
    let regex = undefined;
    switch(type){
        case NucleicAcidType.DNA:
            regex = /^[AaTtCcGg]+$/;
            break;
        case NucleicAcidType.RNA:
            regex =  /^[AaUuCcGg]+$/;
            break;
    }
    return regex.test(sequence);
};

export const convertNucleicAcid = (nucleicAcid: NucleicAcid): DNA | RNA => {
    const sequence = nucleicAcid.getSequence();
    if(nucleicAcid.nucleicAcidType === NucleicAcidType.DNA) {
        const rna = new RNA();
        if(sequence) {
            rna.setSequence(sequence.replaceAll('T', 'U'));
        }
        return rna;
    }
    else {
        const dna = new DNA();
        if(sequence) {
            dna.setSequence(sequence.replaceAll('U', 'T'));
        }
        return dna;
    }
};

export const convertToRNA = (dna: DNA): RNA => {
    const rna = new RNA();
    const sequence = dna.getSequence();
    if(sequence) {
        rna.setSequence(sequence.replaceAll('T', 'U'));
    }
    return rna;
};

export const convertToDNA = (rna: RNA): DNA => {
    const dna = new DNA();
    const sequence = rna.getSequence();
    if(sequence) {
        dna.setSequence(sequence.replaceAll('U', 'T'));
    }
    return dna;
};

export const getDNABaseComplement = (base: string): string | undefined => {
    switch(base){
        case 'A':
            return 'T';
        case 'T':
            return 'A';
        case 'C':
            return 'G';
        case 'G':
            return 'C';
        default:
            return undefined;
    }
};

export const getRNABaseComplement = (base: string): string | undefined => {
    switch(base){
        case 'A':
            return 'U';
        case 'U':
            return 'A';
        case 'C':
            return 'G';
        case 'G':
            return 'C';
        default:
            return undefined;
    }
};

