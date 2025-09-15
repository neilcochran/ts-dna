import {
    NucleotidePatternSymbol,
    NucleotidePattern,
    DNA,
    RNA,
    InvalidNucleotidePatternError,
    InvalidSequenceError
} from '../../src/model';
import {
    isDNA,
    isRNA,
    convertNucleicAcid,
    convertToDNA,
    convertToRNA,
    getDNABaseComplement,
    getRNABaseComplement,
    isValidNucleicAcid,
    isValidNucleotidePattern,
    getNucleotidePatternComplement,
    STOP_CODON_UAA,
    STOP_CODON_UAG,
    STOP_CODON_UGA,
    STOP_CODONS
} from '../../src/utils/nucleic-acids';
import { NucleicAcidType } from '../../src/enums/nucleic-acid-type';
import { RNASubType } from '../../src/enums/rna-sub-type';
import { NUCLEOTIDE_PATTERN_SYMBOLS } from '../../src/data/iupac-symbols';
import {
    success,
    failure,
    isSuccess,
    isFailure,
    validateNucleicAcid
} from '../../src';
import * as TestUtils from './test-utils';

/*
    --- Nucleotide Symbols & Patterns --
*/

test('create valid NucleotidePatternSymbols and check matching bases', () => {
    for(let i = 0; i < TestUtils.ALL_NUCLEOTIDE_SYMBOLS.length; i++) {
        const symbol = TestUtils.ALL_NUCLEOTIDE_SYMBOLS[i];
        const currSymbol = new NucleotidePatternSymbol(symbol);
        //check that the matching bases are correct
        expect(currSymbol.matchingBases).toEqual(NUCLEOTIDE_PATTERN_SYMBOLS[symbol]);
        //check that the matching bases are all accepted by its regex
        expect(currSymbol.matchingRegex.test(currSymbol.matchingBases.join())).toEqual(true);
    }
});

test('create valid NucleotidePatternSymbols and check matching bases regex', () => {
    for(let i = 0; i < TestUtils.ALL_NUCLEOTIDE_SYMBOLS.length; i++) {
        const currSymbol = new NucleotidePatternSymbol(TestUtils.ALL_NUCLEOTIDE_SYMBOLS[i]);
        //check that the matching bases are all accepted by its regex
        expect(currSymbol.matchingRegex.test(currSymbol.matchingBases.join())).toEqual(true);
    }
});

test('create valid NucleotidePattern with heavy regex use', () => {
    expect(new NucleotidePattern(TestUtils.NUCLEOTIDE_PATTERN).patternRegex.source).toEqual(TestUtils.NUCLEOTIDE_PATTERN_REGEX);
});

test('test valid sequences against a NucleotidePattern with heavy regex use', () => {
    const pattern = new NucleotidePattern(TestUtils.NUCLEOTIDE_PATTERN);
    for(const passingSeq of TestUtils.NUCLEOTIDE_PATTERN_PASSING_SEQS) {
        expect(pattern.matches(new DNA(passingSeq))).toEqual(true);
    }
});

test('test invalid sequence against a NucleotidePattern with heavy regex use', () => {
    expect(new NucleotidePattern(TestUtils.NUCLEOTIDE_PATTERN).matches(new DNA('AAATCGC'))).toEqual(false);
});

test('create invalid nucleotide pattern symbol', () => {
    expect(() => new NucleotidePatternSymbol('Z')).toThrowError(InvalidNucleotidePatternError);
});

test('create valid NucleotidePattern', () => {
    expect(new NucleotidePattern(TestUtils.ALL_NUCLEOTIDE_SYMBOLS)).toBeDefined();
});

test('create valid NucleotidePattern and check it\'s patternString', () => {
    expect(new NucleotidePattern(TestUtils.ALL_NUCLEOTIDE_SYMBOLS).pattern).toEqual(TestUtils.ALL_NUCLEOTIDE_SYMBOLS);
});

test('get complement NucleotidePattern (all symbols, no regex)', () => {
    expect(
        getNucleotidePatternComplement(new NucleotidePattern(TestUtils.ALL_NUCLEOTIDE_SYMBOLS))
    ).toEqual(new NucleotidePattern(TestUtils.ALL_NUCLEOTIDE_SYMBOLS_COMP));
});

test('get complement NucleotidePattern (regex)', () => {
    expect(
        getNucleotidePatternComplement(new NucleotidePattern(TestUtils.NUCLEOTIDE_PATTERN))
    ).toEqual(new NucleotidePattern(TestUtils.NUCLEOTIDE_PATTERN_COMP));
});

test('pass valid pattern string (all symbols) to isValidNucleotidePattern', () => {
    expect(isValidNucleotidePattern(TestUtils.ALL_NUCLEOTIDE_SYMBOLS)).toEqual(true);
});

test('pass valid pattern string (heavy regex) to isValidNucleotidePattern', () => {
    expect(isValidNucleotidePattern(TestUtils.NUCLEOTIDE_PATTERN)).toEqual(true);
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
    -- NucleotidePattern Search Methods --
*/

test('findMatches returns all pattern matches in DNA sequence', () => {
    const pattern = new NucleotidePattern('RY');
    const dna = new DNA('ATGAGCGATC');
    const matches = pattern.findMatches(dna);

    expect(matches).toHaveLength(3);
    expect(matches[0]).toEqual({ start: 0, end: 2, match: 'AT' });
    expect(matches[1]).toEqual({ start: 4, end: 6, match: 'GC' });
    expect(matches[2]).toEqual({ start: 7, end: 9, match: 'AT' });
});

test('findMatches returns empty array when no matches found', () => {
    const pattern = new NucleotidePattern('AAAA');
    const dna = new DNA('CCCCGGGG');
    const matches = pattern.findMatches(dna);

    expect(matches).toHaveLength(0);
});

test('findMatches works with complex regex patterns', () => {
    const pattern = new NucleotidePattern('N+AT');
    const dna = new DNA('GGGGATCCCAAT');
    const matches = pattern.findMatches(dna);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ start: 0, end: 12, match: 'GGGGATCCCAAT' });
});

test('findFirst returns first pattern match in DNA sequence', () => {
    const pattern = new NucleotidePattern('RY');
    const dna = new DNA('ATGAGCGATC');
    const match = pattern.findFirst(dna);

    expect(match).toEqual({ start: 0, end: 2, match: 'AT' });
});

test('findFirst returns null when no match found', () => {
    const pattern = new NucleotidePattern('AAAA');
    const dna = new DNA('CCCCGGGG');
    const match = pattern.findFirst(dna);

    expect(match).toBeNull();
});

test('findFirst works with RNA sequences', () => {
    const pattern = new NucleotidePattern('RY');
    const rna = new RNA('AUGAGCGAUC');
    const match = pattern.findFirst(rna);

    expect(match).toEqual({ start: 4, end: 6, match: 'GC' });
});

test('matchesEitherStrand returns true for forward strand match', () => {
    const pattern = new NucleotidePattern('GAATTC');
    const dna = new DNA('GAATTC');

    expect(pattern.matchesEitherStrand(dna)).toBe(true);
});

test('matchesEitherStrand returns true for reverse complement match', () => {
    const pattern = new NucleotidePattern('ATCG');
    const reverseCompDna = new DNA('CGAT'); // Reverse complement of ATCG

    expect(pattern.matches(reverseCompDna)).toBe(false);
    expect(pattern.matchesEitherStrand(reverseCompDna)).toBe(true);
});

test('matchesEitherStrand returns false when neither strand matches', () => {
    const pattern = new NucleotidePattern('GAATTC');
    const dna = new DNA('AAATTT');

    expect(pattern.matchesEitherStrand(dna)).toBe(false);
});

test('matchesEitherStrand works with RNA sequences', () => {
    const pattern = new NucleotidePattern('AUCG');
    const rna = new RNA('AUCG');
    const reverseCompRna = new RNA('CGAU'); // Reverse complement of AUCG

    expect(pattern.matchesEitherStrand(rna)).toBe(true);
    expect(pattern.matchesEitherStrand(reverseCompRna)).toBe(true);
});

test('matchesEitherStrand works with IUPAC ambiguous patterns', () => {
    const pattern = new NucleotidePattern('RYKM'); // [GA][CT][GT][AC]
    const dna = new DNA('ACTA'); // Matches pattern: A[GA] C[CT] T[GT] A[AC]

    expect(pattern.matchesEitherStrand(dna)).toBe(true);
});

/*
    -- DNA/RNA type guards ---
*/

test('check DNA -> isDNA type guard', () => {
    expect(isDNA(new DNA(TestUtils.DNA_SEQ))).toEqual(true);
});

test('check RNA -> isDNA type guard', () => {
    expect(isDNA(new RNA(TestUtils.RNA_SEQ))).toEqual(false);
});

test('check RNA -> isRNA type guard', () => {
    expect(isRNA(new RNA(TestUtils.RNA_SEQ))).toEqual(true);
});

test('check DNA -> isRNA type guard', () => {
    expect(isRNA(new DNA(TestUtils.DNA_SEQ))).toEqual(false);
});

/*
    --- DNA ---
*/

test('construct valid DNA sequence', () => {
    expect(new DNA(TestUtils.DNA_SEQ).getSequence()).toEqual(TestUtils.DNA_SEQ);
});

test('construct DNA with lowercase sequence (normalized to uppercase)', () => {
    expect(new DNA('atcg').getSequence()).toEqual('ATCG');
});

test('construct invalid DNA sequence', () => {
    expect(() => new DNA(TestUtils.RNA_SEQ)).toThrowError(InvalidSequenceError);
});

test('construct invalid empty string DNA sequence', () => {
    expect(() => new DNA('')).toThrowError(InvalidSequenceError);
});

test('DNA sequences are immutable after construction', () => {
    const dna = new DNA(TestUtils.DNA_SEQ);
    // Verify getSequence returns the same value consistently
    expect(dna.getSequence()).toEqual(TestUtils.DNA_SEQ);
    expect(dna.getSequence()).toEqual(TestUtils.DNA_SEQ);
});

test('construct DNA with invalid characters throws error', () => {
    expect(() => new DNA('ATCGX')).toThrowError(InvalidSequenceError);
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
    const dna2 = new DNA('GGGG');
    expect(dna.equals(dna2)).toEqual(false);
});

test('check DNA/RNA inequality', () => {
    const dna = new DNA(TestUtils.DNA_SEQ);
    const rna = new RNA(TestUtils.RNA_SEQ);
    expect(dna.equals(rna)).toEqual(false);
});

/*
    --- RNA ---
*/

test('construct valid RNA sequence', () => {
    expect(new RNA(TestUtils.RNA_SEQ).getSequence()).toEqual(TestUtils.RNA_SEQ);
});

test('construct RNA with lowercase sequence (normalized to uppercase)', () => {
    expect(new RNA('aucg').getSequence()).toEqual('AUCG');
});

test('construct valid RNA with RNASubType PRE_M_RNA', () => {
    expect(new RNA(TestUtils.RNA_SEQ, RNASubType.PRE_M_RNA).rnaSubType).toEqual(RNASubType.PRE_M_RNA);
});

test('construct valid RNA with RNASubType M_RNA', () => {
    expect(new RNA(TestUtils.RNA_SEQ, RNASubType.M_RNA).rnaSubType).toEqual(RNASubType.M_RNA);
});

test('construct invalid RNA sequence', () => {
    expect(() => new RNA(TestUtils.DNA_SEQ)).toThrowError(InvalidSequenceError);
});

test('construct invalid empty string RNA', () => {
    expect(() => new RNA('')).toThrowError(InvalidSequenceError);
});

test('RNA sequences are immutable after construction', () => {
    const rna = new RNA(TestUtils.RNA_SEQ);
    // Verify getSequence returns the same value consistently
    expect(rna.getSequence()).toEqual(TestUtils.RNA_SEQ);
    expect(rna.getSequence()).toEqual(TestUtils.RNA_SEQ);
});

test('construct RNA with invalid characters throws error', () => {
    expect(() => new RNA('AUCGX')).toThrowError(InvalidSequenceError);
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
    const rna2 = new RNA('GGGG');
    expect(rna.equals(rna2)).toEqual(false);
});

test('check RNA/DNA inequality', () => {
    const rna = new RNA(TestUtils.RNA_SEQ);
    const dna = new DNA(TestUtils.DNA_SEQ);
    expect(rna.equals(dna)).toEqual(false);
});

/*
    --- Util functions ---
*/

test('valid DNA sequence -> isValidNucleicAcid', () => {
    expect(isValidNucleicAcid(TestUtils.DNA_SEQ, NucleicAcidType.DNA)).toEqual(true);
});

test('invalid DNA sequence -> isValidNucleicAcid', () => {
    expect(isValidNucleicAcid(TestUtils.RNA_SEQ, NucleicAcidType.DNA)).toEqual(false);
});

test('valid RNA sequence -> isValidNucleicAcid', () => {
    expect(isValidNucleicAcid(TestUtils.RNA_SEQ, NucleicAcidType.RNA)).toEqual(true);
});

test('invalid RNA sequence -> isValidNucleicAcid', () => {
    expect(isValidNucleicAcid(TestUtils.DNA_SEQ, NucleicAcidType.RNA)).toEqual(false);
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

test('convert DNA with subtype -> RNA convertToRNA', () => {
    const result = convertToRNA(new DNA(TestUtils.DNA_SEQ), RNASubType.M_RNA);
    expect(result.getSequence()).toEqual(TestUtils.RNA_SEQ);
    expect(result.rnaSubType).toEqual(RNASubType.M_RNA);
});

test('convert DNA -> RNA with RNASubType PRE_M_RNA convertToRNA', () => {
    expect(convertToRNA(new DNA(TestUtils.DNA_SEQ), RNASubType.PRE_M_RNA).rnaSubType).toEqual(RNASubType.PRE_M_RNA);
});

test('convert DNA -> RNA with RNASubType M_RNA convertToRNA', () => {
    expect(convertToRNA(new DNA(TestUtils.DNA_SEQ), RNASubType.M_RNA).rnaSubType).toEqual(RNASubType.M_RNA);
});

test('convert RNA -> DNA convertToDNA', () => {
    expect(convertToDNA(new RNA(TestUtils.RNA_SEQ))).toEqual(new DNA(TestUtils.DNA_SEQ));
});

test('convert RNA with different sequence -> DNA convertToDNA', () => {
    expect(convertToDNA(new RNA('AUGCCC'))).toEqual(new DNA('ATGCCC'));
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

/*
    --- ValidationResult Pattern Tests ---
*/

test('validateNucleicAcid returns success for valid DNA', () => {
    const result = validateNucleicAcid('ATCG', NucleicAcidType.DNA);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
        expect(result.data).toEqual('ATCG');
    }
});

test('validateNucleicAcid returns success for valid RNA', () => {
    const result = validateNucleicAcid('AUCG', NucleicAcidType.RNA);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
        expect(result.data).toEqual('AUCG');
    }
});

test('validateNucleicAcid normalizes lowercase to uppercase', () => {
    const result = validateNucleicAcid('atcg', NucleicAcidType.DNA);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
        expect(result.data).toEqual('ATCG');
    }
});

test('validateNucleicAcid returns failure for empty sequence', () => {
    const result = validateNucleicAcid('', NucleicAcidType.DNA);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
        expect(result.error).toEqual('Sequence cannot be empty');
    }
});

test('validateNucleicAcid returns failure with detailed error for invalid DNA characters', () => {
    const result = validateNucleicAcid('ATCGUX', NucleicAcidType.DNA);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
        expect(result.error).toEqual('Invalid DNA sequence: contains invalid characters U, X');
    }
});

test('validateNucleicAcid returns failure with detailed error for invalid RNA characters', () => {
    const result = validateNucleicAcid('AUCGTY', NucleicAcidType.RNA);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
        expect(result.error).toEqual('Invalid RNA sequence: contains invalid characters T, Y');
    }
});

test('validateNucleicAcid returns failure for RNA sequence with T', () => {
    const result = validateNucleicAcid('ATCG', NucleicAcidType.RNA);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
        expect(result.error).toEqual('Invalid RNA sequence: contains invalid characters T');
    }
});

test('validateNucleicAcid returns failure for DNA sequence with U', () => {
    const result = validateNucleicAcid('AUCG', NucleicAcidType.DNA);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
        expect(result.error).toEqual('Invalid DNA sequence: contains invalid characters U');
    }
});

/*
    --- Static Factory Method Tests ---
*/

test('DNA.create returns success for valid sequence', () => {
    const result = DNA.create('ATCG');
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
        expect(result.data.getSequence()).toEqual('ATCG');
        expect(isDNA(result.data)).toBe(true);
    }
});

test('DNA.create returns success for lowercase sequence', () => {
    const result = DNA.create('atcg');
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
        expect(result.data.getSequence()).toEqual('ATCG');
    }
});

test('DNA.create returns failure for empty sequence', () => {
    const result = DNA.create('');
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
        expect(result.error).toEqual('Sequence cannot be empty');
    }
});

test('DNA.create returns failure for invalid characters', () => {
    const result = DNA.create('ATCGX');
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
        expect(result.error).toEqual('Invalid DNA sequence: contains invalid characters X');
    }
});

test('DNA.create returns failure for RNA characters', () => {
    const result = DNA.create('AUCG');
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
        expect(result.error).toEqual('Invalid DNA sequence: contains invalid characters U');
    }
});

test('RNA.create returns success for valid sequence', () => {
    const result = RNA.create('AUCG');
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
        expect(result.data.getSequence()).toEqual('AUCG');
        expect(isRNA(result.data)).toBe(true);
    }
});

test('RNA.create returns success for valid sequence with subtype', () => {
    const result = RNA.create('AUCG', RNASubType.M_RNA);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
        expect(result.data.getSequence()).toEqual('AUCG');
        expect(result.data.rnaSubType).toEqual(RNASubType.M_RNA);
    }
});

test('RNA.create returns success for lowercase sequence', () => {
    const result = RNA.create('aucg');
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
        expect(result.data.getSequence()).toEqual('AUCG');
    }
});

test('RNA.create returns failure for empty sequence', () => {
    const result = RNA.create('');
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
        expect(result.error).toEqual('Sequence cannot be empty');
    }
});

test('RNA.create returns failure for invalid characters', () => {
    const result = RNA.create('AUCGX');
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
        expect(result.error).toEqual('Invalid RNA sequence: contains invalid characters X');
    }
});

test('RNA.create returns failure for DNA characters', () => {
    const result = RNA.create('ATCG');
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
        expect(result.error).toEqual('Invalid RNA sequence: contains invalid characters T');
    }
});

/*
    --- ValidationResult Utility Tests ---
*/

test('success creates successful ValidationResult', () => {
    const result = success('test data');
    expect(isSuccess(result)).toBe(true);
    expect(isFailure(result)).toBe(false);
    if (isSuccess(result)) {
        expect(result.data).toEqual('test data');
    }
});

test('failure creates failed ValidationResult', () => {
    const result = failure('test error');
    expect(isFailure(result)).toBe(true);
    expect(isSuccess(result)).toBe(false);
    if (isFailure(result)) {
        expect(result.error).toEqual('test error');
    }
});

test('empty sequence validation fails consistently across functions', () => {
    // Constructor should throw
    expect(() => new DNA('')).toThrowError(InvalidSequenceError);
    expect(() => new RNA('')).toThrowError(InvalidSequenceError);

    // Static factory should return failure
    const dnaResult = DNA.create('');
    const rnaResult = RNA.create('');
    expect(isFailure(dnaResult)).toBe(true);
    expect(isFailure(rnaResult)).toBe(true);

    // Validation function should return failure
    const validateDNA = validateNucleicAcid('', NucleicAcidType.DNA);
    const validateRNA = validateNucleicAcid('', NucleicAcidType.RNA);
    expect(isFailure(validateDNA)).toBe(true);
    expect(isFailure(validateRNA)).toBe(true);
});

/*
    --- Stop Codon Constants ---
*/

test('stop codon constants have correct values', () => {
    expect(STOP_CODON_UAA).toBe('UAA');
    expect(STOP_CODON_UAG).toBe('UAG');
    expect(STOP_CODON_UGA).toBe('UGA');
});

test('STOP_CODONS array contains all stop codons', () => {
    expect(STOP_CODONS).toEqual(['UAA', 'UAG', 'UGA']);
    expect(STOP_CODONS.length).toBe(3);
});

test('stop codon constants are valid RNA sequences', () => {
    for (const stopCodon of STOP_CODONS) {
        expect(() => new RNA(stopCodon)).not.toThrow();
        expect(new RNA(stopCodon).getSequence()).toBe(stopCodon);
    }
});