import { DNA, RNA, isDNA, isRNA } from '../src';
import { convertNucleicAcid, convertToDNA, convertToRNA, getDNABaseComplement, getRNABaseComplement, isValidNucleicAcidSequence, NucleicAcidType } from '../src/nucleic-acids';

//ensure RNA_SEQ and DNA_SEQ are be the same sequence (excluding base differences) since some tests rely it 
const RNA_SEQ = 'AUCGGCUA';
const RNA_SEQ_COMP = 'UAGCCGAU';
const DNA_SEQ = 'ATCGGCTA';
const DNA_SEQ_COMP = 'TAGCCGAT';

/*
    DNA/RNA type guard tests
*/

test('check DNA -> isDNA type guard', () => {
    expect(isDNA(new DNA())).toEqual(true);
});

test('check RNA -> isDNA type guard', () => {
    expect(isDNA(new RNA())).toEqual(false);
});

test('check RNA -> isRNA type guard', () => {
    expect(isRNA(new RNA())).toEqual(true);
});

test('check DNA -> isRNA type guard', () => {
    expect(isRNA(new DNA())).toEqual(false);
});

/*
    DNA class tests
*/

test('construct valid DNA sequence', () => {
    expect(new DNA(DNA_SEQ).getSequence()).toEqual(DNA_SEQ);
});

test('construct valid undefined DNA sequence', () => {
    expect(new DNA(undefined).getSequence()).toBeUndefined();
});

test('construct invalid DNA sequence', () => {
    expect(() => new DNA(RNA_SEQ)).toThrowError();
});

test('construct invalid empty string DNA sequence', () => {
    expect(() => new DNA('')).toThrowError();
});

test('call DNA\'s .setSequence() with a valid sequence', () => {
    const dna = new DNA();
    dna.setSequence(DNA_SEQ);
    expect(dna.getSequence()).toEqual(DNA_SEQ);
});

test('call DNA\'s .setSequence() with an invalid empty string', () => {
    expect(() => new DNA().setSequence('')).toThrowError();
});

test('get DNA complement sequence', () => {
    const dna = new DNA(DNA_SEQ);
    expect(dna.getComplementSequence()).toEqual(DNA_SEQ_COMP);
});

test('check DNA equality', () => {
    const dna = new DNA(DNA_SEQ);
    const dna2 = new DNA(DNA_SEQ);
    expect(dna.equals(dna2)).toEqual(true);
});

test('check DNA inequality', () => {
    const dna = new DNA(DNA_SEQ);
    const dna2 = new DNA();
    expect(dna.equals(dna2)).toEqual(false);
});

test('check DNA/RNA inequality', () => {
    const dna = new DNA();
    const rna = new RNA();
    expect(dna.equals(rna)).toEqual(false);
});

/*
    RNA class tests
*/

test('construct valid RNA sequence', () => {
    expect(new RNA(RNA_SEQ).getSequence()).toEqual(RNA_SEQ);
});

test('construct valid undefined RNA', () => {
    expect(new RNA(undefined).getSequence()).toBeUndefined();
});

test('construct invalid RNA sequence', () => {
    expect(() => new RNA(DNA_SEQ)).toThrowError();
});

test('construct invalid empty string RNA', () => {
    expect(() => new RNA('').getSequence()).toThrowError();
});

test('call RNA\'s .setSequence() with a valid sequence', () => {
    const rna = new RNA();
    rna.setSequence(RNA_SEQ);
    expect(rna.getSequence()).toEqual(RNA_SEQ);
});

test('call RNA\'s .setSequence() with an invalid empty string', () => {
    expect(() =>  new RNA().setSequence('')).toThrowError();
});

test('get RNA complement sequence', () => {
    const rna = new RNA(RNA_SEQ);
    expect(rna.getComplementSequence()).toEqual(RNA_SEQ_COMP);
});

test('check RNA equality', () => {
    const rna = new RNA(RNA_SEQ);
    const rna2 = new RNA(RNA_SEQ);
    expect(rna.equals(rna2)).toEqual(true);
});

test('check RNA inequality', () => {
    const rna = new RNA(RNA_SEQ);
    const rna2 = new RNA();
    expect(rna.equals(rna2)).toEqual(false);
});

test('check RNA/DNA inequality', () => {
    const rna = new RNA();
    const dna = new DNA();
    expect(rna.equals(dna)).toEqual(false);
});

/*
    Util tests
*/

test('valid DNA sequence -> isValidNucleicAcidSequence', () => {
    expect(isValidNucleicAcidSequence(DNA_SEQ, NucleicAcidType.DNA)).toEqual(true);
});

test('invalid DNA sequence -> isValidNucleicAcidSequence', () => {
    expect(isValidNucleicAcidSequence(RNA_SEQ, NucleicAcidType.DNA)).toEqual(false);
});

test('valid RNA sequence -> isValidNucleicAcidSequence', () => {
    expect(isValidNucleicAcidSequence(RNA_SEQ, NucleicAcidType.RNA)).toEqual(true);
});

test('invalid RNA sequence -> isValidNucleicAcidSequence', () => {
    expect(isValidNucleicAcidSequence(DNA_SEQ, NucleicAcidType.RNA)).toEqual(false);
});

test('convert DNA -> RNA convertNucleicAcid', () => {
    expect(convertNucleicAcid(new DNA(DNA_SEQ))).toEqual(new RNA(RNA_SEQ));
});

test('convert RNA -> DNA convertNucleicAcid', () => {
    expect(convertNucleicAcid(new RNA(RNA_SEQ))).toEqual(new DNA(DNA_SEQ));
});

test('convert DNA -> RNA convertToRNA', () => {
    expect(convertToRNA(new DNA(DNA_SEQ))).toEqual(new RNA(RNA_SEQ));
});

test('convert empty DNA -> RNA convertToRNA', () => {
    expect(convertToRNA(new DNA())).toEqual(new RNA());
});

test('convert RNA -> DNA convertToDNA', () => {
    expect(convertToDNA(new RNA(RNA_SEQ))).toEqual(new DNA(DNA_SEQ));
});

test('convert empty RNA -> DNA convertToDNA', () => {
    expect(convertToDNA(new RNA())).toEqual(new DNA());
});

test('get DNA base complement for A', () => {
    expect(getDNABaseComplement('A')).toEqual('T');
});

test('get DNA base complement for C', () => {
    expect(getDNABaseComplement('C')).toEqual('G');
});

test('get DNA base complement for G', () => {
    expect(getDNABaseComplement('G')).toEqual('C');
});

test('get DNA base complement for T', () => {
    expect(getDNABaseComplement('T')).toEqual('A');
});

test('get DNA base complement for invalid base \'x\'', () => {
    expect(getDNABaseComplement('x')).toBeUndefined();
});

test('get DNA base complement for empty string', () => {
    expect(getDNABaseComplement('')).toBeUndefined();
});

test('get RNA base complement for A', () => {
    expect(getRNABaseComplement('A')).toEqual('U');
});

test('get RNA base complement for C', () => {
    expect(getRNABaseComplement('C')).toEqual('G');
});

test('get RNA base complement for G', () => {
    expect(getRNABaseComplement('G')).toEqual('C');
});

test('get RNA base complement for U', () => {
    expect(getRNABaseComplement('U')).toEqual('A');
});

test('get RNA base complement for invalid base \'x\'', () => {
    expect(getRNABaseComplement('x')).toBeUndefined();
});

test('get RNA base complement for empty string', () => {
    expect(getRNABaseComplement('')).toBeUndefined();
});