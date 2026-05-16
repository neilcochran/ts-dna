import { RNA, CODON_LENGTH, validateReadingFrame } from '../../src/sequence';
import { parsePreMRNA, transcribe } from '../../src/transcription';
import { parseGene } from '../../src/gene';
import { spliceRNA } from '../../src/utils/rna-processing';
import { GenomicRegion } from '../../src/coordinates';
import { isSuccess, isFailure } from '../../src/result/Result';
import {
  SIMPLE_TWO_EXON_GENE,
  THREE_EXON_GENE,
  SINGLE_EXON_GENE,
  INVALID_SPLICE_GENE,
} from '../test-genes';

describe('rna-processing', () => {
  describe('spliceRNA', () => {
    test('splices simple two-exon gene correctly', () => {
      const gene = parseGene(SIMPLE_TWO_EXON_GENE.dnaSequence, [
        ...SIMPLE_TWO_EXON_GENE.exons,
      ]).unwrap();
      const preMRNA = parsePreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, gene, 0).unwrap();

      const result = spliceRNA(preMRNA);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(SIMPLE_TWO_EXON_GENE.splicedRNA);
      }
    });

    test('splices three-exon gene correctly', () => {
      const gene = parseGene(THREE_EXON_GENE.dnaSequence, [...THREE_EXON_GENE.exons]).unwrap();
      const preMRNA = parsePreMRNA(THREE_EXON_GENE.rnaSequence, gene, 0).unwrap();

      const result = spliceRNA(preMRNA);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(THREE_EXON_GENE.splicedRNA);
      }
    });

    test('handles single exon gene (no splicing needed)', () => {
      const gene = parseGene(SINGLE_EXON_GENE.dnaSequence, [...SINGLE_EXON_GENE.exons]).unwrap();
      const preMRNA = parsePreMRNA(SINGLE_EXON_GENE.rnaSequence, gene, 0).unwrap();

      const result = spliceRNA(preMRNA);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(SINGLE_EXON_GENE.splicedRNA);
      }
    });

    test('parseGene rejects gene with no exons', () => {
      const geneResult = parseGene('ATGAAACCCGGGTTT', []);
      expect(isFailure(geneResult)).toBe(true);
      if (isFailure(geneResult)) {
        expect(geneResult.error.kind).toBe('no-exons');
      }
    });

    test('fails with invalid splice sites', () => {
      const gene = parseGene(INVALID_SPLICE_GENE.dnaSequence, [
        ...INVALID_SPLICE_GENE.exons,
      ]).unwrap();
      const preMRNA = parsePreMRNA(INVALID_SPLICE_GENE.rnaSequence, gene, 0).unwrap();

      const result = spliceRNA(preMRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Splice site validation failed');
      }
    });

    test('parseGene rejects exon coordinates past sequence end', () => {
      const exons: GenomicRegion[] = [
        { start: 0, end: 6, name: 'exon1' },
        { start: 25, end: 30, name: 'exon2' },
      ];
      const geneResult = parseGene('ATGAAAGTATGCCCAAATTCGGG', exons);
      expect(isFailure(geneResult)).toBe(true);
      if (isFailure(geneResult)) {
        expect(geneResult.error.kind).toBe('exon-out-of-bounds');
      }
    });

    test('validates splice sites using transcript coordinates', () => {
      const geneSequence =
        'GCGCGCGCGCTATAAAAGGCGCGCGCGCGCGC' +
        'ATGAAAGTAAGGGGGGGGGGGGGGGAGCCCGGG' +
        'GTAAGGGGGGGGGGGGGGGAGTAGAAACCC';
      const exons = [
        { start: 32, end: 38, name: 'exon1' },
        { start: 59, end: 65, name: 'exon2' },
        { start: 86, end: 91, name: 'exon3' },
      ];
      const gene = parseGene(geneSequence, exons, 'COORD_TEST').unwrap();
      const transcriptionResult = transcribe(gene, { forceTranscriptionStartSite: 32 });
      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const splicingResult = spliceRNA(transcriptionResult.data);
        expect(isSuccess(splicingResult)).toBe(true);
        if (isSuccess(splicingResult)) {
          expect(splicingResult.data.getSequence()).toBe('AUGAAACCCGGGUAGAA');
        }
      }
    });

    test('bypasses splice site validation when skipSpliceSiteValidation is true', () => {
      const gene = parseGene(INVALID_SPLICE_GENE.dnaSequence, [
        ...INVALID_SPLICE_GENE.exons,
      ]).unwrap();
      const preMRNA = parsePreMRNA(INVALID_SPLICE_GENE.rnaSequence, gene, 0).unwrap();

      const resultWithValidation = spliceRNA(preMRNA);
      expect(isFailure(resultWithValidation)).toBe(true);

      const resultWithBypass = spliceRNA(preMRNA, { skipSpliceSiteValidation: true });
      expect(isSuccess(resultWithBypass)).toBe(true);
      if (isSuccess(resultWithBypass)) {
        expect(resultWithBypass.data.getSequence()).toBe('AUGAAAUCGGG');
      }
    });

    test('fails with invalid 5 prime splice site in transcript coordinates', () => {
      const invalidGeneSequence = 'ATGAAACCCTCCCCCCCCCCCCCCCAGGGG';
      const invalidExons = [
        { start: 0, end: 6, name: 'exon1' },
        { start: 26, end: 29, name: 'exon2' },
      ];
      const gene = parseGene(invalidGeneSequence, invalidExons).unwrap();
      const rnaSequence = 'AUGAAACCCUCCCCCCCCCCCCCCCAGGGG';
      const preMRNA = parsePreMRNA(rnaSequence, gene, 0).unwrap();

      const result = spliceRNA(preMRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain("Invalid 5' splice site");
        expect(result.error).toContain('expected GU');
      }
    });

    test('fails with invalid 3 prime splice site when 5 prime is valid', () => {
      const invalidGeneSequence = 'ATGAAAGTTCCCCCCCCCCCCCCCCCCGGG';
      const invalidExons = [
        { start: 0, end: 6, name: 'exon1' },
        { start: 26, end: 29, name: 'exon2' },
      ];
      const gene = parseGene(invalidGeneSequence, invalidExons).unwrap();
      const rnaSequence = 'AUGAAAGUUCCCCCCCCCCCCCCCCCCGGG';
      const preMRNA = parsePreMRNA(rnaSequence, gene, 0).unwrap();

      const result = spliceRNA(preMRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain("Invalid 3' splice site");
        expect(result.error).toContain('expected AG');
      }
    });
  });

  describe('validateReadingFrame', () => {
    test('validates correct reading frame', () => {
      const rna = new RNA('AUGAAACCCGGGUUU');
      const result = validateReadingFrame(rna.sequence);
      expect(isSuccess(result)).toBe(true);
    });

    test('fails with incorrect reading frame length', () => {
      const rna = new RNA('AUGAAACCCGGGUUAA');
      const result = validateReadingFrame(rna.sequence);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result) && result.error.kind === 'frame-misaligned') {
        expect(result.error.codingLength).toBe(16);
        expect(result.error.codonLength).toBe(CODON_LENGTH);
      }
    });

    test('validates start codon when position specified', () => {
      const rna = new RNA('UUUAUGAAACCCGGG');
      const result = validateReadingFrame(rna.sequence, CODON_LENGTH);
      expect(isSuccess(result)).toBe(true);
    });

    test('fails with wrong start codon', () => {
      const rna = new RNA('AAGAAACCCGGGUUU');
      const result = validateReadingFrame(rna.sequence, 0);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result) && result.error.kind === 'missing-start-codon') {
        expect(result.error.found).toBe('AAG');
        expect(result.error.position).toBe(0);
      }
    });

    test('validates reading frame from custom start position', () => {
      const rna = new RNA('UUUUUUGGGCCCAAA');
      const result = validateReadingFrame(rna.sequence, CODON_LENGTH);
      expect(isSuccess(result)).toBe(true);
    });
  });
});
