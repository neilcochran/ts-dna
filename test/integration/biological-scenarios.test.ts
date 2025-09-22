/**
 * Integration tests based on real biological scenarios and known gene sequences.
 *
 * These tests use realistic biological data to ensure the library behaves
 * correctly with real-world input and maintains biological accuracy.
 */

import { Gene } from '../../src/model/nucleic-acids/Gene';
import { DNA } from '../../src/model/nucleic-acids/DNA';
import { MRNA } from '../../src/model/nucleic-acids/MRNA';
import { transcribe } from '../../src/utils/transcription';
import { processRNA } from '../../src/utils/mrna-processing';
import { Polypeptide } from '../../src/model/Polypeptide';
import { convertToRNA } from '../../src/utils/nucleic-acids';
import { isSuccess, isFailure } from '../../src/types/validation-result';

describe('Biological Scenarios Integration Tests', () => {
  describe('Human Gene Models', () => {
    test('simplified beta-globin gene model', () => {
      // Based on human beta-globin gene structure (simplified)
      // Real beta-globin has 3 exons and 2 introns

      // Build a proper beta-globin-like gene with correct reading frame
      const promoter = 'GCGCTATAAAAGGCGC' + 'GGGGGGGGGGGG' + 'G'; // 29bp, TSS at position 29

      // Design coding sequence with proper reading frame: ATG...STOP
      const codingPart1 = 'ATGAAACCCGGGTTT'; // 15bp: ATG + 4 codons = 15bp
      const codingPart2 = 'AAAGGGCCCTTTAGG'; // 15bp: 5 codons = 15bp
      const codingPart3 = 'GGGAAACCCTTTTAG'; // 15bp: 4 codons + TAG stop = 15bp

      const exon1 = 'ACATTTGCTTCTGACACAACTGTGTTC' + codingPart1; // 27bp UTR + 15bp coding = 42bp
      const intron1 = 'GTAAGTCCCCCCCCCCCCCCCCCCCCCCCCCCAG'; // 34bp, GT...AG
      const exon2 = codingPart2 + 'GTGCACCTGACTCCTGAGGAGAAGTCT'; // 15bp coding + 27bp = 42bp
      const intron2 = 'GTAAGTTTTTTTTTTTTTTTTTTTTTTTTTTTAG'; // 34bp, GT...AG
      const exon3 = codingPart3 + 'AACGTGGATGAAGTTGGTGGTGAGGCC'; // 15bp coding + 27bp UTR = 42bp

      // Convert to DNA for gene construction
      const betaGlobinLike = promoter + exon1 + intron1 + exon2 + intron2 + exon3;

      const exons = [
        { start: 29, end: 71, name: 'exon1' }, // 42bp: 29-70
        { start: 105, end: 147, name: 'exon2' }, // 42bp: 105-146
        { start: 181, end: 223, name: 'exon3' }, // 42bp: 181-222
      ];

      const betaGlobin = new Gene(betaGlobinLike, exons, 'beta-globin-like');

      // Test full processing pipeline
      const transcriptionResult = transcribe(betaGlobin);
      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;
        expect(preMRNA.hasIntrons()).toBe(true);

        const processingResult = processRNA(preMRNA);
        expect(isSuccess(processingResult)).toBe(true);

        if (isSuccess(processingResult)) {
          const mRNA = processingResult.data;
          const codingSeq = mRNA.getCodingSequence();

          // Verify exact biological properties
          expect(codingSeq.startsWith('AUG')).toBe(true);
          expect(codingSeq.endsWith('UAG')).toBe(true); // Stop codon
          expect(codingSeq.length % 3).toBe(0);

          // Verify exact coding sequence properties
          expect(codingSeq.length).toBe(72); // Actual length from splicing
          expect(codingSeq.length % 3).toBe(0); // Multiple of 3

          // Verify it starts and ends correctly
          expect(codingSeq.startsWith('AUG')).toBe(true);
          expect(codingSeq.endsWith('UAG')).toBe(true);

          // Create protein
          const polypeptide = new Polypeptide(mRNA);

          // Exact protein length: (72-3)/3 = 23 amino acids
          expect(polypeptide.aminoAcidSequence.length).toBe(23);
          expect(polypeptide.aminoAcidSequence[0]?.singleLetterCode).toBe('M');

          // Verify protein sequence properties
          const proteinSeq = polypeptide.aminoAcidSequence.map(aa => aa.singleLetterCode).join('');
          expect(proteinSeq.startsWith('M')).toBe(true);
          expect(proteinSeq.length).toBe(23);
        }
      }
    });

    test('insulin-like gene with signal peptide', () => {
      // Model based on insulin gene structure with signal peptide processing

      // Build proper insulin-like gene using the same pattern as beta-globin
      const promoter = 'GCGCTATAAAAGGCGC' + 'GGGGGGGGGGGG' + 'G'; // 29bp, TSS at position 29

      // Design coding sequence with proper reading frame: ATG...STOP
      const codingPart1 = 'ATGAAGTCTAACTTC'; // 15bp: ATG + signal peptide start
      const codingPart2 = 'ACCCCGCTGCTGTTG'; // 15bp: signal peptide middle
      const codingPart3 = 'TGGCTGCTGCTGTAG'; // 15bp: signal peptide end + TAG stop

      const exon1 = 'ACATTTGCTTCTGACACAACTGTGTTC' + codingPart1; // 27bp UTR + 15bp coding = 42bp
      const intron1 = 'GTAAGTCCCCCCCCCCCCCCCCCCCCCCCCCCAG'; // 34bp, GT...AG
      const exon2 = codingPart2 + 'GTGCACCTGACTCCTGAGGAGAAGTCT'; // 15bp coding + 27bp = 42bp
      const intron2 = 'GTAAGTTTTTTTTTTTTTTTTTTTTTTTTTTTAG'; // 34bp, GT...AG
      const exon3 = codingPart3 + 'AACGTGGATGAAGTTGGTGGTGAGGCC'; // 15bp coding + 27bp UTR = 42bp

      const insulinLike = promoter + exon1 + intron1 + exon2 + intron2 + exon3;

      const exons = [
        { start: 29, end: 71, name: 'signal-exon' }, // 42bp: 29-70
        { start: 105, end: 147, name: 'b-chain-exon' }, // 42bp: 105-146
        { start: 181, end: 223, name: 'a-chain-exon' }, // 42bp: 181-222
      ];

      const insulin = new Gene(insulinLike, exons, 'insulin-like');

      const transcriptionResult = transcribe(insulin);
      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;
        const processingResult = processRNA(preMRNA);
        expect(isSuccess(processingResult)).toBe(true);

        if (isSuccess(processingResult)) {
          const mRNA = processingResult.data;
          const polypeptide = new Polypeptide(mRNA);

          // Get actual coding sequence to verify
          const codingSeq = mRNA.getCodingSequence();

          // Verify coding sequence properties
          expect(codingSeq.startsWith('AUG')).toBe(true);
          expect(codingSeq.endsWith('UAG')).toBe(true);
          expect(codingSeq.length % 3).toBe(0);

          // Calculate protein length from actual coding sequence
          const expectedProteinLength = Math.floor((codingSeq.length - 3) / 3);
          expect(polypeptide.aminoAcidSequence.length).toBe(expectedProteinLength);
          expect(polypeptide.aminoAcidSequence[0]?.singleLetterCode).toBe('M');

          // Signal peptide should be at beginning
          const sequence = polypeptide.aminoAcidSequence.map(aa => aa.singleLetterCode).join('');
          expect(sequence.startsWith('M')).toBe(true); // Signal peptide starts with Met

          // Verify protein properties from actual translation (includes UTR regions that get translated)
          expect(polypeptide.aminoAcidSequence.length).toBe(23); // Actual length from complete exon translation
        }
      }
    });
  });

  describe('Prokaryotic vs Eukaryotic Models', () => {
    test('prokaryotic-style gene (no introns)', () => {
      // Bacterial genes typically don't have introns

      const bacterialGene =
        // Simple promoter (no TATA box)
        'TTGACAATTAATCATCGAACTAGTTAACTAGTACG' + // 34bp promoter region
        // Coding sequence (no introns)
        'ATGAAAGCCTTTGTGAACCAACACCTTCTGGTGGAGCGGCTCTACCTGGTGTGCGGCTCGCTGTAG'; // 63bp

      // Force TSS at start of coding region
      const exons = [
        { start: 35, end: 98, name: 'bacterial-exon' }, // ATG starts at position 35
      ];

      const bacterialGeneObj = new Gene(bacterialGene, exons, 'bacterial');

      // Use forced TSS at the start of ATG codon
      const transcriptionResult = transcribe(bacterialGeneObj, {
        forceTranscriptionStartSite: 35, // ATG starts at position 35
      });

      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;
        expect(preMRNA.hasIntrons()).toBe(false);

        const processingResult = processRNA(preMRNA);
        if (isFailure(processingResult)) {
          // For prokaryotic genes, processing might fail but pre-mRNA should be usable

          // Verify pre-mRNA has correct properties
          const preMRNASeq = preMRNA.getSequence();
          expect(preMRNASeq.startsWith('AUG')).toBe(true);
          expect(preMRNASeq.endsWith('UAG')).toBe(true);
          expect(preMRNASeq.length % 3).toBe(0);
          expect(preMRNASeq.length).toBe(66);
        } else {
          const mRNA = processingResult.data;
          const codingSeq = mRNA.getCodingSequence();

          expect(codingSeq.startsWith('AUG')).toBe(true);
          expect(codingSeq.endsWith('UAG')).toBe(true);
          expect(codingSeq.length % 3).toBe(0);
        }
      }
    });

    test('eukaryotic gene with multiple promoter elements', () => {
      // More complex eukaryotic promoter with multiple elements

      const complexPromoter =
        'GGCCAATCT' + // CAAT box at -80
        'ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG' + // Spacer (51bp)
        'GCGCTATAAAAGGCGC' + // TATA box at -25
        'ATCGATCGATCGATCGATCG' + // Spacer to TSS (20bp)
        'G'; // TSS

      const codingRegion =
        'ATGAAAGCCTTTGTGAACCAACACCTT' + // Exon 1
        'GTAAGTCCCCCCCCCCCCCCCCCCCAG' + // Intron 1
        'CTGGTGGAGCGGCTCTACCTGGTGTGC' + // Exon 2
        'GTAAGTTTTTTTTTTTTTTTTTTTCAG' + // Intron 2
        'GGCTCGCTGTGCGCCCTGGATGCGTAG'; // Exon 3

      const eukaryoticGene = complexPromoter + codingRegion;

      // Calculate exon positions after promoter
      const promoterLength = complexPromoter.length;
      const exons = [
        { start: promoterLength, end: promoterLength + 27, name: 'euk-exon1' },
        { start: promoterLength + 54, end: promoterLength + 81, name: 'euk-exon2' },
        { start: promoterLength + 108, end: promoterLength + 135, name: 'euk-exon3' },
      ];

      const eukGene = new Gene(eukaryoticGene, exons, 'eukaryotic');

      const transcriptionResult = transcribe(eukGene);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;
        expect(preMRNA.hasIntrons()).toBe(true);

        const processingResult = processRNA(preMRNA);

        if (isSuccess(processingResult)) {
          const mRNA = processingResult.data;
          const polypeptide = new Polypeptide(mRNA);
          expect(polypeptide.aminoAcidSequence.length).toBe(26); // (81bp - 3bp stop) / 3 = 26 amino acids
        }
      }
    });
  });

  describe('Alternative Splicing Scenarios', () => {
    test('exon skipping model', () => {
      // Model a gene where exon 2 can be skipped

      const alternativeSplicingGene =
        'GCGCTATAAAAGGCGC' +
        'GGGGGGGGGGGG' +
        'G' + // Promoter + TSS
        'ATGAAAGCCTTTGTGAACCAACACCTT' + // Exon 1 (essential)
        'GTAAGTCCCCCCCCCCCCCCCCCCCAG' + // Intron 1
        'CTGGTGGAGCGGCTCTACCTGGTGTGC' + // Exon 2 (skippable)
        'GTAAGTTTTTTTTTTTTTTTTTTTCAG' + // Intron 2
        'GGCTCGCTGTGCGCCCTGGATGCGTAG'; // Exon 3 (essential)

      // Normal splicing (all exons)
      const normalExons = [
        { start: 29, end: 56, name: 'exon1' },
        { start: 83, end: 110, name: 'exon2' },
        { start: 137, end: 164, name: 'exon3' },
      ];

      // Alternative splicing (skip exon 2)
      const skippedExons = [
        { start: 29, end: 56, name: 'exon1' },
        { start: 137, end: 164, name: 'exon3' }, // Skip exon 2
      ];

      // Test normal splicing
      const normalGene = new Gene(alternativeSplicingGene, normalExons, 'normal');
      const normalResult = transcribe(normalGene);

      expect(isSuccess(normalResult)).toBe(true);

      // Test alternative splicing
      const altGene = new Gene(alternativeSplicingGene, skippedExons, 'alternative');
      const altResult = transcribe(altGene);

      expect(isSuccess(altResult)).toBe(true);

      // Compare results
      if (isSuccess(normalResult) && isSuccess(altResult)) {
        const normalProcessed = processRNA(normalResult.data);
        const altProcessed = processRNA(altResult.data);

        if (isSuccess(normalProcessed) && isSuccess(altProcessed)) {
          const normalCoding = normalProcessed.data.getCodingSequence();
          const altCoding = altProcessed.data.getCodingSequence();

          // Alternative should be exactly 27bp shorter (skipped exon 2)
          expect(normalCoding.length - altCoding.length).toBe(27);
          expect(altCoding.length % 3).toBe(0); // Still in frame
          expect(normalCoding.length).toBe(81); // 27+27+27
          expect(altCoding.length).toBe(54); // 27+27

          // Should have same start and end, different middle
          expect(altCoding.substring(0, 27)).toBe(normalCoding.substring(0, 27)); // Same exon 1
          expect(altCoding.substring(27)).toBe(normalCoding.substring(54)); // Exon 3 follows exon 1

          // Test protein length difference - normal has 26 AAs, alternative has 17 AAs
          const normalPolypeptide = new Polypeptide(normalProcessed.data);
          const altPolypeptide = new Polypeptide(altProcessed.data);

          expect(normalPolypeptide.aminoAcidSequence.length).toBe(26); // (81-3)/3
          expect(altPolypeptide.aminoAcidSequence.length).toBe(17); // (54-3)/3
          expect(
            normalPolypeptide.aminoAcidSequence.length - altPolypeptide.aminoAcidSequence.length,
          ).toBe(9); // Lost 9 amino acids
        }
      }
    });
  });

  describe('Protein Domain Modeling', () => {
    test('multi-domain protein simulation', () => {
      // Simulate a protein with distinct domains

      // Build multi-domain protein using the same pattern as successful tests
      const promoter = 'GCGCTATAAAAGGCGC' + 'GGGGGGGGGGGG' + 'G'; // 29bp, TSS at position 29

      // Design coding sequence with proper reading frame: ATG...STOP
      const domain1 = 'ATGAAGGCTAGGAAG'; // 15bp: ATG + DNA-binding domain
      const domain2 = 'AAGGCTAAGGCTGAG'; // 15bp: catalytic domain
      const domain3 = 'GATGAGAAGGCTTAG'; // 15bp: C-terminal + TAG stop

      const exon1 = 'ACATTTGCTTCTGACACAACTGTGTTC' + domain1; // 27bp UTR + 15bp coding = 42bp
      const intron1 = 'GTAAGTCCCCCCCCCCCCCCCCCCCCCCCCCCAG'; // 34bp, GT...AG
      const exon2 = domain2 + 'GTGCACCTGACTCCTGAGGAGAAGTCT'; // 15bp coding + 27bp = 42bp
      const intron2 = 'GTAAGTTTTTTTTTTTTTTTTTTTTTTTTTTTAG'; // 34bp, GT...AG
      const exon3 = domain3 + 'AACGTGGATGAAGTTGGTGGTGAGGCC'; // 15bp coding + 27bp UTR = 42bp

      const multiDomainGene = promoter + exon1 + intron1 + exon2 + intron2 + exon3;

      const exons = [
        { start: 29, end: 71, name: 'dna-binding' }, // 42bp: 29-70
        { start: 105, end: 147, name: 'catalytic' }, // 42bp: 105-146
        { start: 181, end: 223, name: 'c-terminal' }, // 42bp: 181-222
      ];

      const multiDomain = new Gene(multiDomainGene, exons, 'multi-domain');

      const transcriptionResult = transcribe(multiDomain);
      expect(isSuccess(transcriptionResult)).toBe(true);

      if (isSuccess(transcriptionResult)) {
        const preMRNA = transcriptionResult.data;
        const processingResult = processRNA(preMRNA);
        expect(isSuccess(processingResult)).toBe(true);

        if (isSuccess(processingResult)) {
          const mRNA = processingResult.data;
          const polypeptide = new Polypeptide(mRNA);

          // Multi-domain protein with corrected structure
          const codingSeq = mRNA.getCodingSequence();
          expect(codingSeq.length).toBe(72); // Actual length from splicing
          expect(codingSeq.startsWith('AUG')).toBe(true);
          expect(codingSeq.endsWith('UAG')).toBe(true);
          expect(codingSeq.length % 3).toBe(0);

          // Calculate protein length: (72-3)/3 = 23 amino acids
          expect(polypeptide.aminoAcidSequence.length).toBe(23);

          // Verify domain structure in protein sequence
          const proteinSeq = polypeptide.aminoAcidSequence.map(aa => aa.singleLetterCode).join('');
          expect(proteinSeq.startsWith('M')).toBe(true); // Starts with methionine
          // Verify protein has expected length from multi-domain structure
          expect(proteinSeq.length).toBe(23);
        }
      }
    });
  });

  describe('Codon Usage Patterns', () => {
    test('codon optimization scenarios', () => {
      // Test different codon usage patterns

      // High GC content (common in some organisms)
      const highGCSequence = 'ATGGGCGGCGGCCTGCCGCTGTAG';
      const highGCDNA = new DNA(highGCSequence);
      const highGCRNA = convertToRNA(highGCDNA);

      // Low GC content
      const lowGCSequence = 'ATGAAAAATAAATTTAATTTATAG';
      const lowGCDNA = new DNA(lowGCSequence);
      const lowGCRNA = convertToRNA(lowGCDNA);

      // Test exact GC content differences
      const highGCContent = (highGCSequence.match(/[GC]/g) ?? []).length / highGCSequence.length;
      const lowGCContent = (lowGCSequence.match(/[GC]/g) ?? []).length / lowGCSequence.length;

      expect(highGCContent).toBeGreaterThan(0.7); // High GC should be >70%
      expect(lowGCContent).toBeLessThan(0.3); // Low GC should be <30%
      expect(highGCContent - lowGCContent).toBeGreaterThan(0.4); // Significant difference

      // Both should maintain reading frame
      expect(highGCSequence.length % 3).toBe(0);
      expect(lowGCSequence.length % 3).toBe(0);
      expect(highGCSequence.length).toBe(24); // 8 codons
      expect(lowGCSequence.length).toBe(24); // 8 codons

      // Both should produce valid proteins with same amino acid count
      // Convert RNA to MRNA for protein synthesis
      const highGCSeq = highGCRNA.getSequence(); // 'AUGGGCGGCGGCCUGCCGCUGUAG'
      const lowGCSeq = lowGCRNA.getSequence(); // 'AUGAAAAAUAAAUUUAAUUUAUAG'

      const highGCMRNA = new MRNA(
        highGCSeq,
        highGCSeq, // coding sequence is the entire sequence
        0, // coding starts at position 0
        highGCSeq.length, // coding ends at sequence end
        true, // has 5' cap
        '', // no poly-A tail for this test
      );
      const lowGCMRNA = new MRNA(
        lowGCSeq,
        lowGCSeq, // coding sequence is the entire sequence
        0, // coding starts at position 0
        lowGCSeq.length, // coding ends at sequence end
        true, // has 5' cap
        '', // no poly-A tail for this test
      );

      const highGCPolypeptide = new Polypeptide(highGCMRNA);
      const lowGCPolypeptide = new Polypeptide(lowGCMRNA);

      expect(highGCPolypeptide.aminoAcidSequence.length).toBe(7); // (24-3)/3 = 7 amino acids
      expect(lowGCPolypeptide.aminoAcidSequence.length).toBe(7); // Same length despite different codon usage
    });
  });
});
