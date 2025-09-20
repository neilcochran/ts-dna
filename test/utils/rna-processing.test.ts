import { RNA } from '../../src/model/nucleic-acids/RNA';
import { PreMRNA } from '../../src/model/nucleic-acids/PreMRNA';
import { Gene } from '../../src/model/nucleic-acids/Gene';
import { spliceRNA, validateReadingFrame } from '../../src/utils/rna-processing';
import { transcribe } from '../../src/utils/transcription';
import { CODON_LENGTH } from '../../src/constants/biological-constants';
import { GenomicRegion } from '../../src/types/genomic-region';
import { isSuccess, isFailure } from '../../src/types/validation-result';
import {
  SIMPLE_TWO_EXON_GENE,
  THREE_EXON_GENE,
  SINGLE_EXON_GENE,
  INVALID_SPLICE_GENE,
} from '../test-genes';

describe('rna-processing', () => {
  describe('spliceRNA', () => {
    test('splices simple two-exon gene correctly', () => {
      const gene = new Gene(SIMPLE_TWO_EXON_GENE.dnaSequence, SIMPLE_TWO_EXON_GENE.exons);
      const preMRNA = new PreMRNA(SIMPLE_TWO_EXON_GENE.rnaSequence, gene, 0);

      const result = spliceRNA(preMRNA);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(SIMPLE_TWO_EXON_GENE.splicedRNA);
      }
    });

    test('splices three-exon gene correctly', () => {
      const gene = new Gene(THREE_EXON_GENE.dnaSequence, THREE_EXON_GENE.exons);
      const preMRNA = new PreMRNA(THREE_EXON_GENE.rnaSequence, gene, 0);

      const result = spliceRNA(preMRNA);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(THREE_EXON_GENE.splicedRNA);
      }
    });

    test('handles single exon gene (no splicing needed)', () => {
      const gene = new Gene(SINGLE_EXON_GENE.dnaSequence, SINGLE_EXON_GENE.exons);
      const preMRNA = new PreMRNA(SINGLE_EXON_GENE.rnaSequence, gene, 0);

      const result = spliceRNA(preMRNA);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.getSequence()).toBe(SINGLE_EXON_GENE.splicedRNA);
      }
    });

    test('fails when no exons present', () => {
      const geneSequence = 'ATGAAACCCGGGTTT';

      // Gene creation should fail when no exons provided
      const geneResult = Gene.createGene(geneSequence, []);
      expect(isFailure(geneResult)).toBe(true);
      if (isFailure(geneResult)) {
        expect(geneResult.error).toContain('must have at least one exon');
      }
    });

    test('fails with invalid splice sites', () => {
      const gene = new Gene(INVALID_SPLICE_GENE.dnaSequence, INVALID_SPLICE_GENE.exons);
      const preMRNA = new PreMRNA(INVALID_SPLICE_GENE.rnaSequence, gene, 0);

      const result = spliceRNA(preMRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Splice site validation failed');
      }
    });

    test('fails when exon region is out of bounds', () => {
      const geneSequence = 'ATGAAAGTATGCCCAAATTCGGG'; // 23bp total
      const exons: GenomicRegion[] = [
        { start: 0, end: 6, name: 'exon1' },
        { start: 25, end: 30, name: 'exon2' }, // Out of bounds - starts at 25 but sequence only 23bp
      ];

      // This should fail at gene creation, not splicing
      const geneResult = Gene.createGene(geneSequence, exons);
      expect(isFailure(geneResult)).toBe(true);
      if (isFailure(geneResult)) {
        expect(geneResult.error).toContain('extends beyond sequence length');
      }
    });
    test('validates splice sites using transcript coordinates (coordinate system fix)', () => {
      // This test specifically verifies the coordinate system fix for issue where
      // splice site validation was using gene coordinates against transcript sequence

      // Create a gene where transcription starts from a non-zero position
      const geneSequence =
        'GCGCGCGCGCTATAAAAGGCGCGCGCGCGCGC' + // Promoter region (32 bp)
        'ATGAAAGTAAGGGGGGGGGGGGGGGAGCCCGGG' + // Exon 1 + Intron 1 (32 bp)
        'GTAAGGGGGGGGGGGGGGGAGTAGAAACCC'; // Intron 1 end + Exon 2 (27 bp)

      const exons = [
        { start: 32, end: 38, name: 'exon1' }, // ATGAAA in gene coordinates
        { start: 59, end: 65, name: 'exon2' }, // CCCGGG in gene coordinates
        { start: 86, end: 91, name: 'exon3' }, // TAGAA in gene coordinates
      ];

      const gene = new Gene(geneSequence, exons, 'COORD_TEST');

      // Transcribe from TSS at position 32 (not position 0)
      const transcriptionResult = transcribe(gene, { forceTranscriptionStartSite: 32 });
      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;

        // Before the fix: This would fail because validation used gene coordinates
        // After the fix: This should succeed because validation uses transcript coordinates
        const splicingResult = spliceRNA(preMRNA);
        expect(isSuccess(splicingResult)).toBe(true);

        if (isSuccess(splicingResult)) {
          const mRNA = splicingResult.data;
          // Should be: AUGAAA + CCCGGG + UAGAA = AUGAAACCCGGGUAGAA
          expect(mRNA.getSequence()).toBe('AUGAAACCCGGGUAGAA');
        }
      }
    });

    test('bypasses splice site validation when skipSpliceSiteValidation is true', () => {
      // Use the same INVALID_SPLICE_GENE that fails in the previous test
      const gene = new Gene(INVALID_SPLICE_GENE.dnaSequence, INVALID_SPLICE_GENE.exons);
      const preMRNA = new PreMRNA(INVALID_SPLICE_GENE.rnaSequence, gene, 0);

      // First verify it still fails with default validation
      const resultWithValidation = spliceRNA(preMRNA);
      expect(isFailure(resultWithValidation)).toBe(true);

      // Now test that it succeeds when validation is bypassed
      const resultWithBypass = spliceRNA(preMRNA, { skipSpliceSiteValidation: true });
      expect(isSuccess(resultWithBypass)).toBe(true);

      if (isSuccess(resultWithBypass)) {
        // Should successfully splice despite invalid splice sites
        // The spliced sequence should join exons regardless of splice site validity
        // INVALID_SPLICE_GENE exons: 'AUGAAA' (0-6) + 'UCGGG' (26-31) = 'AUGAAAUCGGG'
        expect(resultWithBypass.data.getSequence()).toBe('AUGAAAUCGGG');
      }
    });

    test('fails when PreMRNA has no exon regions', () => {
      // Create a PreMRNA with empty exon regions
      const geneSequence = 'ATGAAACCCGGGTTT';
      const exons: GenomicRegion[] = [{ start: 0, end: 15, name: 'exon1' }];
      const gene = new Gene(geneSequence, exons);

      // Create PreMRNA but override getExonRegions to return empty array
      const mockPreMRNA = {
        getExonRegions: () => [],
        getSequence: () => 'AUGAAACCCGGGUUU',
        getGene: () => gene,
      } as any;

      const result = spliceRNA(mockPreMRNA);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('no exons found in pre-mRNA');
      }
    });

    test('fails when exon region extends beyond PreMRNA sequence', () => {
      // Create a proper gene and PreMRNA but use a malformed exon that goes out of bounds
      const geneSequence = 'ATGAAACCCGGGTTT';
      const exons: GenomicRegion[] = [{ start: 0, end: 15, name: 'exon1' }];
      const gene = new Gene(geneSequence, exons);

      // Create a PreMRNA with a very short sequence
      const shortRnaSequence = 'AUGAAACCC'; // Only 9 bp
      const preMRNA = new PreMRNA(shortRnaSequence, gene, 0);

      // Override the getExonRegions to return regions that extend beyond the short sequence
      const originalGetExonRegions = preMRNA.getExonRegions;
      preMRNA.getExonRegions = () => [{ start: 0, end: 20, name: 'exon1' }]; // Out of bounds for 9bp sequence

      const result = spliceRNA(preMRNA);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('is outside sequence bounds');
      }

      // Restore original method
      preMRNA.getExonRegions = originalGetExonRegions;
    });

    test('handles general exceptions during splicing', () => {
      // Create a PreMRNA that will throw an exception during processing
      const mockPreMRNA = {
        getExonRegions: () => {
          throw new Error('Test exception');
        },
        getSequence: () => 'AUGAAACCC',
        getGene: () => null,
      } as any;

      const result = spliceRNA(mockPreMRNA);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('RNA splicing failed');
        expect(result.error).toContain('Test exception');
      }
    });

    test('fails with invalid 3 prime splice site in transcript coordinates', () => {
      // Test line 141: Invalid 3' splice site in validateTranscriptSpliceSites
      // Create a gene with invalid 3' splice site (not ending with AG)
      // Need at least 20bp intron and 3bp exons to satisfy Gene constructor validation
      const invalidGeneSequence = 'ATGAAACTGTCCCCCCCCCCCCCCCCCCGGG'; // 30 bp total, 20bp intron ending with CC
      const invalidExons = [
        { start: 0, end: 6, name: 'exon1' }, // ATGAAA (6bp)
        { start: 27, end: 30, name: 'exon2' }, // GGG (3bp)
      ];

      // The intron would be from 6-27 (21bp) and end with CC, not AG
      const gene = new Gene(invalidGeneSequence, invalidExons);
      const rnaSequence = 'AUGAAACUGUCCCCCCCCCCCCCCCCCUGGG'; // RNA version
      const preMRNA = new PreMRNA(rnaSequence, gene, 0);

      const result = spliceRNA(preMRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Splice site validation failed');
        // Note: The 5' splice site is checked first, so we get that error instead
        expect(result.error).toContain("Invalid 5' splice site");
        expect(result.error).toContain('expected GU');
      }
    });

    test('fails with invalid 5 prime splice site in transcript coordinates', () => {
      // Test validateTranscriptSpliceSites with invalid 5' splice site
      // Create a gene with invalid 5' splice site (not starting with GT)
      // Need at least 20bp intron and 3bp exons to satisfy Gene constructor validation
      const invalidGeneSequence = 'ATGAAACCCTCCCCCCCCCCCCCCCAGGGG'; // 29 bp total, 20bp intron starting with CC
      const invalidExons = [
        { start: 0, end: 6, name: 'exon1' }, // ATGAAA (6bp)
        { start: 26, end: 29, name: 'exon2' }, // GGG (3bp)
      ];

      // The intron would be from 6-26 (20bp) and start with CC, not GT, end with AG
      const gene = new Gene(invalidGeneSequence, invalidExons);
      const rnaSequence = 'AUGAAACCCUCCCCCCCCCCCCCCCAGGGG'; // RNA version
      const preMRNA = new PreMRNA(rnaSequence, gene, 0);

      const result = spliceRNA(preMRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Splice site validation failed');
        expect(result.error).toContain("Invalid 5' splice site");
        expect(result.error).toContain('expected GU');
      }
    });

    test('fails with invalid 3 prime splice site when 5 prime is valid', () => {
      // Test line 141: Invalid 3' splice site in validateTranscriptSpliceSites
      // Create a gene with valid 5' splice site (GU) but invalid 3' splice site (not AG)
      const invalidGeneSequence = 'ATGAAAGTTCCCCCCCCCCCCCCCCCCGGG'; // 29 bp total, starts with GT, ends with CC
      const invalidExons = [
        { start: 0, end: 6, name: 'exon1' }, // ATGAAA (6bp)
        { start: 26, end: 29, name: 'exon2' }, // GGG (3bp)
      ];

      // The intron would be from 6-26 (20bp) and start with GT (valid), end with CC (invalid)
      const gene = new Gene(invalidGeneSequence, invalidExons);
      const rnaSequence = 'AUGAAAGUUCCCCCCCCCCCCCCCCCCGGG'; // RNA version
      const preMRNA = new PreMRNA(rnaSequence, gene, 0);

      const result = spliceRNA(preMRNA);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Splice site validation failed');
        expect(result.error).toContain("Invalid 3' splice site");
        expect(result.error).toContain('expected AG');
      }
    });
  });

  describe('validateReadingFrame', () => {
    test('validates correct reading frame', () => {
      const rna = new RNA('AUGAAACCCGGGUUU'); // 15 nucleotides = 5 codons
      const result = validateReadingFrame(rna);

      expect(isSuccess(result)).toBe(true);
    });

    test('fails with incorrect reading frame length', () => {
      const rna = new RNA('AUGAAACCCGGGUUAA'); // 16 nucleotides (not divisible by ${CODON_LENGTH})
      const result = validateReadingFrame(rna);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('not divisible by ' + CODON_LENGTH);
      }
    });

    test('validates start codon when position specified', () => {
      const rna = new RNA('UUUAUGAAACCCGGG');
      const result = validateReadingFrame(rna, CODON_LENGTH);

      expect(isSuccess(result)).toBe(true);
    });

    test('fails with wrong start codon', () => {
      const rna = new RNA('AAGAAACCCGGGUUU');
      const result = validateReadingFrame(rna, 0);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Expected start codon AUG');
      }
    });

    test('validates reading frame from custom start position', () => {
      const rna = new RNA('UUUUUUGGGCCCAAA'); // 12 nucleotides from position 3
      const result = validateReadingFrame(rna, CODON_LENGTH);

      expect(isSuccess(result)).toBe(true);
    });
  });
});
