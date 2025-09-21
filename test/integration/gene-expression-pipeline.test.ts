/**
 * Integration tests for the complete gene expression pipeline.
 *
 * These tests validate the entire workflow:
 * Gene → transcription → PreMRNA → RNA processing → mature mRNA
 *
 * This catches integration issues that unit tests miss, particularly
 * coordinate transformation bugs between transcription and RNA processing.
 */

import { Gene } from '../../src/model/nucleic-acids/Gene';
import { transcribe } from '../../src/utils/transcription';
import { processRNA } from '../../src/utils/mrna-processing';
import { isSuccess, isFailure } from '../../src/types/validation-result';

describe('Gene Expression Pipeline Integration', () => {
  describe('complete pipeline: Gene → transcription → RNA processing', () => {
    test('simple gene with TATA box processes correctly', () => {
      // Create a gene with biologically correct promoter structure
      // TATA box will be detected at position ~4, TSS will be at position ~29 (25bp downstream)
      const geneSequence =
        'GCGCTATAAAAGGCGC' + // Contains TATA box at pos 4-9 (16bp total)
        'GGGGGGGGGGGG' + // Spacer to reach TSS at pos 28 (12bp)
        'G' + // TSS at position 29 (1bp)
        'ATGAAAGCCTTTGTGAACCAACACCTT' + // Exon 1 (27bp) starts at pos 30
        'GTAAGTCCCCCCCCCCCCCCCCCCCAG' + // Intron 1 with GT...AG (27bp)
        'CTGGTGGAGCGGCTCTACCTGGTGTGC' + // Exon 2 (27bp)
        'GTAAGTTTTTTTTTTTTTTTTTTTCAG' + // Intron 2 with GT...AG (27bp)
        'GGCTCGCTGTGCGCCCTGGATGCGTAG'; // Exon 3 with stop codon (27bp)

      // Exon coordinates (0-based, end-exclusive)
      const exons = [
        { start: 29, end: 56, name: 'exon1' }, // Starts at position 29
        { start: 83, end: 110, name: 'exon2' }, // After intron 1
        { start: 137, end: 164, name: 'exon3' }, // After intron 2 (ends at sequence end)
      ];

      // Step 1: Create gene
      const gene = new Gene(geneSequence, exons, 'test-insulin-like');
      expect(gene.getSequence().length).toBe(164);
      expect(gene.getExons().length).toBe(3);

      // Step 2: Transcription
      const transcriptionResult = transcribe(gene);

      if (isFailure(transcriptionResult)) {
        console.log('Transcription failed:', transcriptionResult.error);
      }
      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;

        // Verify successful transcription

        // Step 3: RNA Processing
        const processingResult = processRNA(preMRNA);

        if (isFailure(processingResult)) {
          console.log('RNA processing failed:', processingResult.error);
        }
        expect(isSuccess(processingResult)).toBe(true);

        if (isSuccess(processingResult)) {
          const mRNA = processingResult.data;

          // Validate biological accuracy
          const codingSeq = mRNA.getCodingSequence();
          expect(codingSeq.startsWith('AUG')).toBe(true); // Start codon
          expect(codingSeq.endsWith('UAG')).toBe(true); // Stop codon
          expect(codingSeq.length % 3).toBe(0); // Reading frame
        }
      }
    });

    test('gene without promoter fails transcription gracefully', () => {
      // Gene with no promoter elements - use simple repeating pattern that avoids promoter motifs
      const geneSequence =
        'TTTTTTTTTTTTTTTT' + // Simple T-repeat, no promoter elements (16bp)
        'ATGTTATTATTATTATTATTATTATT' + // Exon 1: ATG + simple repeats (25bp)
        'GTTTTTTTTTTTTTTTTTTTTTTTAG' + // Intron 1 with GT...AG (25bp)
        'TTATTATTATTATTATTATTATTAG'; // Exon 2 with stop (25bp)

      const exons = [
        { start: 16, end: 41, name: 'exon1' },
        { start: 66, end: 91, name: 'exon2' },
      ];

      const gene = new Gene(geneSequence, exons, 'no-promoter-gene');
      const transcriptionResult = transcribe(gene);

      // Should fail transcription (either no promoter found or TSS/exon conflict)
      expect(isFailure(transcriptionResult)).toBe(true);
      if (isFailure(transcriptionResult)) {
        // Accept either type of failure
        const error = transcriptionResult.error;
        const hasValidError =
          error.includes('No promoters found') ||
          error.includes('conflicts with gene exon structure');
        expect(hasValidError).toBe(true);
      }
    });

    test('forced TSS allows transcription without promoter', () => {
      const geneSequence =
        'TTTTTTTTTTTTTTTT' + // Simple T-repeat, no promoter elements (16bp)
        'ATGTTATTATTATTATTATTATTATT' + // Exon 1: ATG + simple repeats (26bp)
        'GTTTTTTTTTTTTTTTTTTTTTTTAG' + // Intron 1 with GT...AG (26bp)
        'TTATTATTATTATTATTATTATTAG'; // Exon 2 with stop (25bp)

      const exons = [
        { start: 16, end: 42, name: 'exon1' }, // 26bp: 16-41 inclusive, 16-42 exclusive
        { start: 68, end: 93, name: 'exon2' }, // 25bp: 68-92 inclusive, 68-93 exclusive
      ];

      const gene = new Gene(geneSequence, exons, 'forced-tss-gene');

      // Force transcription to start at beginning of exon 1
      const transcriptionResult = transcribe(gene, {
        forceTranscriptionStartSite: 16,
      });

      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;
        expect(preMRNA.getTranscriptionStartSite()).toBe(16);

        // Should be able to process RNA normally
        const processingResult = processRNA(preMRNA);
        expect(isSuccess(processingResult)).toBe(true);

        if (isSuccess(processingResult)) {
          const mRNA = processingResult.data;
          const codingSeq = mRNA.getCodingSequence();
          expect(codingSeq.startsWith('AUG')).toBe(true);
        }
      }
    });

    test('single exon gene processes correctly', () => {
      const geneSequence =
        'GCGCTATAAAAGGCGC' + // TATA box promoter (16bp)
        'GGGGGGGGGGGG' + // Spacer to reach TSS at pos 28 (12bp)
        'G' + // TSS at position 29 (1bp)
        'ATGAAACCCGGGTAGT'; // Single exon with stop (16bp)

      const exons = [{ start: 29, end: 45, name: 'exon1' }]; // Start at TSS, include ATG start codon, end-exclusive

      const gene = new Gene(geneSequence, exons, 'single-exon-gene');

      // Full pipeline
      const transcriptionResult = transcribe(gene);
      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;
        expect(preMRNA.hasIntrons()).toBe(false);

        const processingResult = processRNA(preMRNA);
        expect(isSuccess(processingResult)).toBe(true);

        if (isSuccess(processingResult)) {
          const mRNA = processingResult.data;
          const codingSeq = mRNA.getCodingSequence();
          expect(codingSeq).toBe('AUGAAACCCGGGUAG');
        }
      }
    });
  });

  describe('coordinate transformation validation', () => {
    test('TSS detection affects exon coordinates correctly', () => {
      // Create a gene where TSS will be detected around position ~37 (25bp downstream from TATA)
      const geneSequence =
        'TATAAAAGGCGC' + // TATA box (12bp)
        'GGGGGGGGGGGGGGGGGGGGGGGG' + // Spacer to reach TSS around pos 37 (24bp)
        'G' + // TSS position (1bp)
        'ATGAAAGCCTTTGTGAACCAACACCTT' + // Exon 1 (27bp)
        'GTAAGTCCCCCCCCCCCCCCCCCCCAG' + // Intron 1 (27bp)
        'CTGGTGGAGCGGCTCTACCTGGTGTGC' + // Exon 2 (27bp)
        'GTAAGTTTTTTTTTTTTTTTTTTTCAG' + // Intron 2 (27bp)
        'GGCTCGCTGTGCGCCCTGGATGCGTAG'; // Exon 3 (27bp)

      const exons = [
        { start: 37, end: 64, name: 'exon1' }, // 27bp: 37-63 inclusive, 37-64 exclusive
        { start: 91, end: 118, name: 'exon2' }, // 27bp: 91-117 inclusive, 91-118 exclusive
        { start: 145, end: 172, name: 'exon3' }, // 27bp: 145-171 inclusive, 145-172 exclusive
      ];

      const gene = new Gene(geneSequence, exons, 'coord-test-gene');

      const transcriptionResult = transcribe(gene);
      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;
        const tss = preMRNA.getTranscriptionStartSite();

        // Verify exon transformation math
        const originalExons = gene.getExons();
        const transformedExons = preMRNA.getExonRegions();

        originalExons.forEach((originalExon, i) => {
          const transformedExon = transformedExons[i];
          if (transformedExon) {
            expect(transformedExon.start).toBe(originalExon.start - tss);
            expect(transformedExon.end).toBe(originalExon.end - tss);
          }
        });
      }
    });
  });
});
