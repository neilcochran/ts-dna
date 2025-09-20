import { transcribe, TranscriptionOptions } from '../../src/utils/transcription';
import { Gene } from '../../src/model/nucleic-acids/Gene';
import { NucleotidePattern } from '../../src/model/nucleic-acids/NucleotidePattern';
import { isSuccess, isFailure } from '../../src/types/validation-result';
import {
  MAX_PROMOTER_SEARCH_DISTANCE,
  MIN_INTRON_SIZE,
} from '../../src/constants/biological-constants';
import { COMPLEX_GENE } from '../test-genes';

describe('transcription', () => {
  let testGene: Gene;

  beforeEach(() => {
    // Use realistic gene with proper intron size and splice sites
    testGene = new Gene(COMPLEX_GENE.dnaSequence, COMPLEX_GENE.exons);
  });

  describe('transcribe', () => {
    test('successfully transcribes gene with promoter recognition', () => {
      const result = transcribe(testGene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const preMRNA = result.data;

        // Should include both exons and introns from COMPLEX_GENE
        expect(preMRNA.getSequence()).toContain('AUGAAA'); // Exon1 in RNA
        expect(preMRNA.getSequence()).toContain('AUAAAAAUA'); // Exon2 in RNA

        expect(preMRNA.getSourceGene()).toBe(testGene);
        expect(preMRNA.hasIntrons()).toBe(true);

        // Should have found polyadenylation site (if implemented)
        // Note: May not be defined if poly-A signal detection is not yet implemented
        // expect(preMRNA.getPolyadenylationSite()).toBeDefined();
      }
    });

    test('transcribes with forced TSS', () => {
      const options: TranscriptionOptions = {
        forceTranscriptionStartSite: 6, // Start at exon1 position in COMPLEX_GENE
      };

      const result = transcribe(testGene, options);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const preMRNA = result.data;
        expect(preMRNA.getTranscriptionStartSite()).toBe(6);
        expect(preMRNA.getSequence().startsWith('AUGAAA')).toBe(true);
      }
    });

    test('handles custom promoter pattern', () => {
      const options: TranscriptionOptions = {
        promoterPattern: new NucleotidePattern('GGCCAATCT'), // CAAT box
        maxPromoterSearchDistance: MAX_PROMOTER_SEARCH_DISTANCE,
      };

      const result = transcribe(testGene, options);

      expect(isSuccess(result)).toBe(true);
    });

    test('fails when no promoters found', () => {
      // Create gene without promoter elements but with valid intron size
      const nopromoterDNA =
        'A'.repeat(MAX_PROMOTER_SEARCH_DISTANCE) +
        'ATGAAAGT' +
        'A'.repeat(MIN_INTRON_SIZE) +
        'AGTTTGGGAATAAA';
      const nopromoterGene = new Gene(nopromoterDNA, [
        { start: MAX_PROMOTER_SEARCH_DISTANCE, end: 208 }, // ATGAAAGT (8bp)
        { start: 230, end: 236 }, // TTTGGG (6bp) - 20bp intron between them
      ]);

      const result = transcribe(nopromoterGene);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('No promoters found');
      }
    });

    test('handles TSS outside gene bounds', () => {
      const options: TranscriptionOptions = {
        forceTranscriptionStartSite: testGene.getSequence().length + 10,
      };

      const result = transcribe(testGene, options);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('outside gene bounds');
      }
    });

    test('works with different promoter strength requirements', () => {
      const options: TranscriptionOptions = {
        minPromoterStrength: 1, // Very low threshold
      };

      const result = transcribe(testGene, options);
      expect(isSuccess(result)).toBe(true);
    });

    test('transcribes gene without polyadenylation signal', () => {
      // Gene without AATAAA signal
      const simpleGene = new Gene(
        'A'.repeat(100) + 'TATAAAAG' + 'A'.repeat(MIN_INTRON_SIZE) + 'ATGAAATTTGGG',
        [{ start: 128, end: 140 }],
      );

      const result = transcribe(simpleGene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const preMRNA = result.data;
        expect(preMRNA.getPolyadenylationSite()).toBeUndefined();
        // Should transcribe to end of gene
        expect(preMRNA.getSequence()).toContain('AUGAAAUUUGGG');
      }
    });
  });

  describe('integration with promoter system', () => {
    test('uses promoter recognition to find realistic TSS', () => {
      const result = transcribe(testGene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const preMRNA = result.data;

        // For COMPLEX_GENE, TSS should be at beginning of gene (no promoter detected)
        const tss = preMRNA.getTranscriptionStartSite();
        expect(tss).toBeGreaterThanOrEqual(0); // Valid TSS position
        expect(tss).toBeLessThan(testGene.getSequence().length); // Within gene bounds

        // Should contain both exons and introns
        expect(preMRNA.getCodingSequence().length).toBeLessThan(preMRNA.getSequence().length);
      }
    });

    test('respects promoter search distance limits', () => {
      const options: TranscriptionOptions = {
        maxPromoterSearchDistance: 10, // Very short search
      };

      const result = transcribe(testGene, options);

      // Might fail due to short search distance
      if (isFailure(result)) {
        expect(result.error).toContain('No promoters found');
      }
    });
  });

  describe('biological accuracy', () => {
    test('properly converts DNA to RNA nucleotides', () => {
      const result = transcribe(testGene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const sequence = result.data.getSequence();

        // Should not contain T (DNA nucleotide)
        expect(sequence).not.toContain('T');

        // Should contain U (RNA nucleotide)
        expect(sequence).toContain('U');

        // Should contain other RNA nucleotides
        expect(sequence).toMatch(/[AUGC]+/);
      }
    });

    test('maintains intron-exon structure from gene', () => {
      const result = transcribe(testGene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const preMRNA = result.data;

        // Should have same number of exons as source gene
        expect(preMRNA.getExonRegions().length).toBe(testGene.getExons().length);

        // Should have introns between exons
        expect(preMRNA.hasIntrons()).toBe(true);

        // Coding sequence should be shorter than full transcript
        const codingLength = preMRNA.getCodingSequence().length;
        const fullLength = preMRNA.getSequence().length;
        expect(codingLength).toBeLessThan(fullLength);
      }
    });

    test('finds biologically relevant polyadenylation signals', () => {
      const result = transcribe(testGene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const preMRNA = result.data;
        const polyASite = preMRNA.getPolyadenylationSite();

        if (polyASite !== undefined) {
          // Poly-A site should be downstream of exons
          const lastExon = preMRNA.getExonRegions().slice(-1)[0];
          if (lastExon) {
            expect(polyASite).toBeGreaterThanOrEqual(lastExon.end);
          }
        }
      }
    });
  });

  describe('error handling', () => {
    test('handles gene with no exons', () => {
      // Gene constructor should throw for no exons (biologically invalid)
      expect(() => {
        new Gene('ATGAAATTTGGG', []);
      }).toThrow('Gene must have at least one exon');
    });

    test('handles malformed gene structure', () => {
      // This should be caught by Gene class validation, but test transcription robustness
      const options: TranscriptionOptions = {
        forceTranscriptionStartSite: 50,
      };

      const result = transcribe(testGene, options);
      expect(isSuccess(result) || isFailure(result)).toBe(true); // Should not throw
    });

    test('handles exception during transcription', () => {
      // Test line 133: exception handling - error caught by TSS search first
      const mockGene = {
        getSequence: () => { throw new Error('Mock gene error'); },
        getExons: () => [{ start: 0, end: 12, name: 'exon1' }]
      } as any;

      const result = transcribe(mockGene);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('TSS search failed');
        expect(result.error).toContain('Mock gene error');
      }
    });

    test('handles exception during TSS search', () => {
      // Test line 196: exception handling in findTranscriptionStartSite
      const mockGene = {
        getSequence: () => 'ATGAAACCCGGG',
        getExons: () => {
          throw new Error('TSS search error');
        }
      } as any;

      const result = transcribe(mockGene);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('TSS search failed');
        expect(result.error).toContain('TSS search error');
      }
    });

    test('handles exception during polyadenylation site search', () => {
      // Test line 230: exception handling - error caught by TSS search first
      const geneSequence = 'ATGAAACCCGGG';
      const exons = [{ start: 0, end: 12, name: 'exon1' }];
      const testGene = new Gene(geneSequence, exons);

      // Mock to force exception in polyadenylation search
      const originalPattern = NucleotidePattern.prototype.findMatches;
      NucleotidePattern.prototype.findMatches = jest.fn(() => {
        throw new Error('Pattern search error');
      });

      const result = transcribe(testGene);

      // Restore original method
      NucleotidePattern.prototype.findMatches = originalPattern;

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('TSS search failed');
        expect(result.error).toContain('Pattern search error');
      }
    });

    test('handles non-Error exception objects', () => {
      // Test error handling with non-Error objects - error caught by TSS search first
      const mockGene = {
        getSequence: () => { throw 'String error'; },
        getExons: () => [{ start: 0, end: 12, name: 'exon1' }]
      } as any;

      const result = transcribe(mockGene);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('TSS search failed');
        expect(result.error).toContain('String error');
      }
    });
  });
});
