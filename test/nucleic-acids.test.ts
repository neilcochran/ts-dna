import {
    NucleotidePatternSymbol,
    NucleotidePattern,
    DNA,
    RNA
} from '../src/model';
import {
    isDNA,
    isRNA,
    convertNucleicAcid,
    convertToDNA,
    convertToRNA,
    getDNABaseComplement,
    getRNABaseComplement,
    isValidNucleicAcidSequence,
    NucleicAcidType,
    RNASubType,
    NUCLEOTIDE_PATTERN_SYMBOLS,
    getNucleotidePatternComplement,
    isValidNucleotidePattern
} from '../src/nucleic-acids';
import * as TestUtils from './test-utils';

/*
    --- Nucleotide Symbols & Patterns --
*/

test('create valid NucleotidePatternSymbols and check matching bases', () => {
    for(let i = 0; i < TestUtils.ALL_NUCLEOTIDE_SYMBOLS.length; i++) {
        const symbol = TestUtils.ALL_NUCLEOTIDE_SYMBOLS[i];
        expect(new NucleotidePatternSymbol(symbol).getMatchingBases()).toEqual(NUCLEOTIDE_PATTERN_SYMBOLS[symbol]);
    }
});

test('create invalid nucleotide pattern symbol', () => {
    expect(() => new NucleotidePatternSymbol('Z')).toThrowError();
});

test('create valid NucleotidePattern', () => {
    expect(new NucleotidePattern(TestUtils.ALL_NUCLEOTIDE_SYMBOLS)).toBeDefined();
});

test('create valid NucleotidePattern and check it\'s patternString', () => {
    expect(new NucleotidePattern(TestUtils.ALL_NUCLEOTIDE_SYMBOLS).getPatternString()).toEqual(TestUtils.ALL_NUCLEOTIDE_SYMBOLS);
});

test('create valid NucleotidePattern and check it\'s pattern', () => {
    const pattern = new NucleotidePattern(TestUtils.ALL_NUCLEOTIDE_SYMBOLS).getPattern();
    for(let i = 0; i < pattern.length; i++) {
        expect(pattern[i].getSymbol()).toEqual(TestUtils.ALL_NUCLEOTIDE_SYMBOLS[i]);
    }
});

test('get complement NucleotidePattern', () => {
    expect(
        getNucleotidePatternComplement(new NucleotidePattern(TestUtils.ALL_NUCLEOTIDE_SYMBOLS))
    ).toEqual(new NucleotidePattern(TestUtils.ALL_NUCLEOTIDE_SYMBOLS_COMP));
});

test('pass valid pattern string to isValidNucleotidePattern', () => {
    expect(isValidNucleotidePattern(TestUtils.ALL_NUCLEOTIDE_SYMBOLS)).toEqual(true);
});

test('pass invalid empty pattern string to isValidNucleotidePattern', () => {
    expect(isValidNucleotidePattern('')).toEqual(false);
});

test('pass invalid pattern string to isValidNucleotidePattern', () => {
    expect(isValidNucleotidePattern('invalid')).toEqual(false);
});

test('ensure each base for each symbol\'s getMatchingBases() matches', () => {
    let symbol: keyof typeof NUCLEOTIDE_PATTERN_SYMBOLS;
    for(symbol in NUCLEOTIDE_PATTERN_SYMBOLS) {
        const bases = NUCLEOTIDE_PATTERN_SYMBOLS[symbol];
        const pattern = new NucleotidePattern(symbol);
        for(const baseSeq of bases) {
            const base = baseSeq === 'U' ? new RNA(baseSeq) : new DNA(baseSeq);
            expect(pattern.matches(base)).toEqual(true);
        }
    }
});

test('match a valid DNA sequence for a multi symbol NucleotidePattern', () => {
    expect(new NucleotidePattern('RYKM').matches(new DNA('GCGA'))).toEqual(true);
});

test('match an alternate valid DNA sequence for a multi symbol NucleotidePattern', () => {
    expect(new NucleotidePattern('RYKM').matches(new DNA('ATTC'))).toEqual(true);
});

test('match a valid RNA sequence for a multi symbol NucleotidePattern', () => {
    expect(new NucleotidePattern('RYKM').matches(new RNA('GCGA'))).toEqual(true);
});

test('match an alternate valid RNA sequence for a multi symbol NucleotidePattern', () => {
    expect(new NucleotidePattern('RYKM').matches(new RNA('ACGA'))).toEqual(true);
});

test('invalid DNA match for a NucleotidePattern', () => {
    expect(new NucleotidePattern('RYKM').matches(new DNA('CTTC'))).toEqual(false);
});

test('invalid RNA match for a NucleotidePattern', () => {
    expect(new NucleotidePattern('RYKM').matches(new RNA('GUCU'))).toEqual(false);
});

/*
    -- DNA/RNA type guards ---
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
    --- DNA ---
*/

test('construct valid DNA sequence', () => {
    expect(new DNA(TestUtils.DNA_SEQ).getSequence()).toEqual(TestUtils.DNA_SEQ);
});

test('construct valid undefined DNA sequence', () => {
    expect(new DNA(undefined).getSequence()).toBeUndefined();
});

test('construct invalid DNA sequence', () => {
    expect(() => new DNA(TestUtils.RNA_SEQ)).toThrowError();
});

test('construct invalid empty string DNA sequence', () => {
    expect(() => new DNA('')).toThrowError();
});

test('call DNA\'s .setSequence() with a valid sequence', () => {
    const dna = new DNA();
    dna.setSequence(TestUtils.DNA_SEQ);
    expect(dna.getSequence()).toEqual(TestUtils.DNA_SEQ);
});

test('call DNA\'s .setSequence() with an invalid empty string', () => {
    expect(() => new DNA().setSequence('')).toThrowError();
});

test('get DNA complement sequence', () => {
    const dna = new DNA(TestUtils.DNA_SEQ);
    expect(dna.getComplementSequence()).toEqual(TestUtils.DNA_SEQ_COMP);
});

test('check DNA equality', () => {
    const dna = new DNA(TestUtils.DNA_SEQ);
    const dna2 = new DNA(TestUtils.DNA_SEQ);
    expect(dna.equals(dna2)).toEqual(true);
});

test('check DNA inequality', () => {
    const dna = new DNA(TestUtils.DNA_SEQ);
    const dna2 = new DNA();
    expect(dna.equals(dna2)).toEqual(false);
});

test('check DNA/RNA inequality', () => {
    const dna = new DNA();
    const rna = new RNA();
    expect(dna.equals(rna)).toEqual(false);
});

/*
    --- RNA ---
*/

test('construct valid RNA sequence', () => {
    expect(new RNA(TestUtils.RNA_SEQ).getSequence()).toEqual(TestUtils.RNA_SEQ);
});

test('construct valid empty RNA', () => {
    expect(new RNA().getSequence()).toBeUndefined();
});

test('construct valid RNA with RNASubType PRE_M_RNA', () => {
    expect(new RNA(undefined, RNASubType.PRE_M_RNA).rnaSubType).toEqual(RNASubType.PRE_M_RNA);
});

test('construct valid RNA with RNASubType M_RNA', () => {
    expect(new RNA(undefined, RNASubType.PRE_M_RNA).rnaSubType).toEqual(RNASubType.PRE_M_RNA);
});

test('construct invalid RNA sequence', () => {
    expect(() => new RNA(TestUtils.DNA_SEQ)).toThrowError();
});

test('construct invalid empty string RNA', () => {
    expect(() => new RNA('').getSequence()).toThrowError();
});

test('call RNA\'s .setSequence() with a valid sequence', () => {
    const rna = new RNA();
    rna.setSequence(TestUtils.RNA_SEQ);
    expect(rna.getSequence()).toEqual(TestUtils.RNA_SEQ);
});

test('call RNA\'s .setSequence() with an invalid empty string', () => {
    expect(() =>  new RNA().setSequence('')).toThrowError();
});

test('get RNA complement sequence', () => {
    const rna = new RNA(TestUtils.RNA_SEQ);
    expect(rna.getComplementSequence()).toEqual(TestUtils.RNA_SEQ_COMP);
});

test('check RNA equality', () => {
    const rna = new RNA(TestUtils.RNA_SEQ);
    const rna2 = new RNA(TestUtils.RNA_SEQ);
    expect(rna.equals(rna2)).toEqual(true);
});

test('check RNA inequality', () => {
    const rna = new RNA(TestUtils.RNA_SEQ);
    const rna2 = new RNA();
    expect(rna.equals(rna2)).toEqual(false);
});

test('check RNA/DNA inequality', () => {
    const rna = new RNA();
    const dna = new DNA();
    expect(rna.equals(dna)).toEqual(false);
});

/*
    --- Util functions ---
*/

test('valid DNA sequence -> isValidNucleicAcidSequence', () => {
    expect(isValidNucleicAcidSequence(TestUtils.DNA_SEQ, NucleicAcidType.DNA)).toEqual(true);
});

test('invalid DNA sequence -> isValidNucleicAcidSequence', () => {
    expect(isValidNucleicAcidSequence(TestUtils.RNA_SEQ, NucleicAcidType.DNA)).toEqual(false);
});

test('valid RNA sequence -> isValidNucleicAcidSequence', () => {
    expect(isValidNucleicAcidSequence(TestUtils.RNA_SEQ, NucleicAcidType.RNA)).toEqual(true);
});

test('invalid RNA sequence -> isValidNucleicAcidSequence', () => {
    expect(isValidNucleicAcidSequence(TestUtils.DNA_SEQ, NucleicAcidType.RNA)).toEqual(false);
});

test('convert DNA -> RNA convertNucleicAcid', () => {
    expect(convertNucleicAcid(new DNA(TestUtils.DNA_SEQ))).toEqual(new RNA(TestUtils.RNA_SEQ));
});

test('convert RNA -> DNA convertNucleicAcid', () => {
    expect(convertNucleicAcid(new RNA(TestUtils.RNA_SEQ))).toEqual(new DNA(TestUtils.DNA_SEQ));
});

test('convert DNA -> RNA convertToRNA', () => {
    expect(convertToRNA(new DNA(TestUtils.DNA_SEQ))).toEqual(new RNA(TestUtils.RNA_SEQ));
});

test('convert empty DNA -> RNA convertToRNA', () => {
    expect(convertToRNA(new DNA())).toEqual(new RNA());
});

test('convert DNA -> RNA with RNASubType PRE_M_RNA convertToRNA', () => {
    expect(convertToRNA(new DNA(), RNASubType.PRE_M_RNA).rnaSubType).toEqual(RNASubType.PRE_M_RNA);
});

test('convert DNA -> RNA with RNASubType M_RNA convertToRNA', () => {
    expect(convertToRNA(new DNA(), RNASubType.M_RNA).rnaSubType).toEqual(RNASubType.M_RNA);
});

test('convert RNA -> DNA convertToDNA', () => {
    expect(convertToDNA(new RNA(TestUtils.RNA_SEQ))).toEqual(new DNA(TestUtils.DNA_SEQ));
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