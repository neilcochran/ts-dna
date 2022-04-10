/*
   --- Classes ---
*/


export interface NucleicAcid {
    readonly nucleicAcidType: NucleicAcidType;
    setSequence(sequence: string): void;
    getSequence(): string | undefined;
    getComplementSequence(): string | undefined;
}

export class DNA implements NucleicAcid {
    readonly nucleicAcidType = NucleicAcidType.DNA;
    private sequence: string | undefined;

    constructor(sequence?: string) {
        if(sequence){
            this.setSequence(sequence);
        }
    }

    setSequence(sequence: string): void {
        if(!isValidSequence(sequence, NucleicAcidType.DNA)){
            throw new Error(`invalid RNA squence provided: ${sequence}`);
        }
        this.sequence = sequence.toUpperCase();
    }
    
    getSequence(): string | undefined {
        return this.sequence;
    }

    getComplementSequence(): string | undefined {
        return getComplementSequence(this.sequence, NucleicAcidType.DNA);
    }
}

export class RNA implements NucleicAcid {
    readonly nucleicAcidType = NucleicAcidType.RNA;
    private sequence: string | undefined;

    constructor(sequence?: string) {
        if(sequence) {
            this.setSequence(sequence);
        }
    }

    setSequence(sequence: string): void {
        if(!isValidSequence(sequence, this.nucleicAcidType)){
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


/*
    --- Type Guards ---
*/


export const isDNA = (nucleicAcid: NucleicAcid): nucleicAcid is DNA => {
    return nucleicAcid.nucleicAcidType === NucleicAcidType.DNA;
};

export const isRNA = (nucleicAcid: NucleicAcid): nucleicAcid is RNA => {
    return nucleicAcid.nucleicAcidType === NucleicAcidType.RNA;
};


/*
    --- Utils ---
*/


export const DNA_REGEX = /^[AaTtCcGg]*$/;
export const RNA_REGEX = /^[AaUuCcGg]*$/;

export const DNA_BASES = ['A', 'T', 'C', 'G'];
export const RNA_BASES = ['A', 'U', 'C', 'G'];

export enum NucleicAcidType { 
    DNA = 'DNA',
    RNA = 'RNA'
}


/*
    --- Util Functions ---
*/


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

export const isValidSequence = (sequence: string, type: NucleicAcidType): boolean => {
    let regex = undefined;
    switch(type){
        case NucleicAcidType.DNA:
            regex = DNA_REGEX;
            break;
        case NucleicAcidType.RNA:
            regex = RNA_REGEX;
            break;
    }
    return regex.test(sequence);
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

export const convertDNAtoRNA = (dna: DNA): RNA => {
    const rna = new RNA();
    const sequence = dna.getSequence();
    if(sequence) {
        rna.setSequence(sequence.replaceAll('U', 'T'));
    }
    return rna;
};

export const convertRNAtoDNA = (rna: RNA): DNA => {
    const dna = new DNA();
    const sequence = rna.getSequence();
    if(sequence) {
        dna.setSequence(sequence.replaceAll('U', 'T'));
    }
    return dna;
};


