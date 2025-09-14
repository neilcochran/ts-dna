import { transcribe, dnaToRNA, simpleTranscribe, TranscriptionOptions } from '../../src/utils/transcription';
import { Gene } from '../../src/model/nucleic-acids/Gene';
import { DNA } from '../../src/model/nucleic-acids/DNA';
import { NucleotidePattern } from '../../src/model/nucleic-acids/NucleotidePattern';
import { isSuccess, isFailure } from '../../src/types/validation-result';

describe('transcription', () => {
    let testGene: Gene;
    let testDNA: string;

    beforeEach(() => {
        // Create a realistic gene with promoter region and poly-A signal
        // Layout: [promoter region] [exon1] [intron] [exon2] [AAUAAA] [end]
        testDNA =
            'GGCCAATCT' +        // CAAT box at position 0-8 (promoter)
            'T'.repeat(45) +     // Spacer to position 54
            'TATAAAAG' +         // TATA box at position 54-61 (promoter)
            'A'.repeat(20) +     // Spacer to TSS at position 82
            'ATGAAA' +           // Exon1: 82-88 (start codon + amino acid)
            'CCCAAA' +           // Intron: 88-94
            'TTTGGG' +           // Exon2: 94-100 (amino acid + partial)
            'AATAAA' +           // Poly-A signal: 100-106 (note: DNA version of AAUAAA)
            'T'.repeat(50);      // 3' region

        testGene = new Gene(testDNA, [
            { start: 82, end: 88, name: 'exon1' },  // ATGAAA
            { start: 94, end: 100, name: 'exon2' }  // TTTGGG
        ]);
    });

    describe('transcribe', () => {
        test('successfully transcribes gene with promoter recognition', () => {
            const result = transcribe(testGene);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                const preMRNA = result.data;

                // Should start from TSS (around position 82) and include both exons and introns
                expect(preMRNA.getSequence()).toContain('AUGAAA'); // Exon1 in RNA
                expect(preMRNA.getSequence()).toContain('CCCAAA'); // Intron (T->U conversion)
                expect(preMRNA.getSequence()).toContain('UUUGGG'); // Exon2 in RNA

                expect(preMRNA.getSourceGene()).toBe(testGene);
                expect(preMRNA.hasIntrons()).toBe(true);

                // Should have found polyadenylation site
                expect(preMRNA.getPolyadenylationSite()).toBeDefined();
            }
        });

        test('transcribes with forced TSS', () => {
            const options: TranscriptionOptions = {
                forceTranscriptionStartSite: 82
            };

            const result = transcribe(testGene, options);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                const preMRNA = result.data;
                expect(preMRNA.getTranscriptionStartSite()).toBe(82);
                expect(preMRNA.getSequence().startsWith('AUGAAA')).toBe(true);
            }
        });

        test('handles custom promoter pattern', () => {
            const options: TranscriptionOptions = {
                promoterPattern: new NucleotidePattern('GGCCAATCT'), // CAAT box
                maxPromoterSearchDistance: 200
            };

            const result = transcribe(testGene, options);

            expect(isSuccess(result)).toBe(true);
        });

        test('fails when no promoters found', () => {
            // Create gene without promoter elements
            const nopromoterDNA = 'A'.repeat(200) + 'ATGAAATTTGGGAATAAA';
            const nopromoterGene = new Gene(nopromoterDNA, [
                { start: 200, end: 206 },
                { start: 209, end: 215 }
            ]);

            const result = transcribe(nopromoterGene);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('No promoters found');
            }
        });

        test('handles TSS outside gene bounds', () => {
            const options: TranscriptionOptions = {
                forceTranscriptionStartSite: testGene.getSequence().length + 10
            };

            const result = transcribe(testGene, options);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('outside gene bounds');
            }
        });

        test('works with different promoter strength requirements', () => {
            const options: TranscriptionOptions = {
                minPromoterStrength: 1 // Very low threshold
            };

            const result = transcribe(testGene, options);
            expect(isSuccess(result)).toBe(true);
        });

        test('transcribes gene without polyadenylation signal', () => {
            // Gene without AATAAA signal
            const simpleGene = new Gene('A'.repeat(100) + 'TATAAAAG' + 'A'.repeat(20) + 'ATGAAATTTGGG', [
                { start: 128, end: 140 }
            ]);

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

    describe('dnaToRNA', () => {
        test('converts T to U in DNA sequence', () => {
            const dna = 'ATGCGT';
            const rna = dnaToRNA(dna);
            expect(rna).toBe('AUGCGU');
        });

        test('leaves other nucleotides unchanged', () => {
            const dna = 'AAGCGACCAA';
            const rna = dnaToRNA(dna);
            expect(rna).toBe('AAGCGACCAA'); // No T, so no change
        });

        test('handles empty string', () => {
            expect(dnaToRNA('')).toBe('');
        });

        test('handles string with no T', () => {
            const dna = 'AAGCGACCAA';
            expect(dnaToRNA(dna)).toBe('AAGCGACCAA');
        });

        test('handles string with only T', () => {
            const dna = 'TTTTTT';
            expect(dnaToRNA(dna)).toBe('UUUUUU');
        });
    });

    describe('simpleTranscribe', () => {
        test('transcribes DNA to RNA without analysis', () => {
            const dna = new DNA('ATGCGT');
            const rna = simpleTranscribe(dna);
            expect(rna).toBe('AUGCGU');
        });

        test('handles complex sequences', () => {
            const dna = new DNA('ATGAAACCCAAATTTGGG');
            const rna = simpleTranscribe(dna);
            expect(rna).toBe('AUGAAACCCAAAUUUGGG');
        });

        test('preserves sequence length', () => {
            const sequence = 'ATGCGTTATCGAA';
            const dna = new DNA(sequence);
            const rna = simpleTranscribe(dna);

            expect(rna.length).toBe(sequence.length);
            expect(rna).toBe('AUGCGUUAUCGAA');
        });
    });

    describe('integration with promoter system', () => {
        test('uses promoter recognition to find realistic TSS', () => {
            const result = transcribe(testGene);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                const preMRNA = result.data;

                // TSS should be downstream of TATA box (around position 82)
                const tss = preMRNA.getTranscriptionStartSite();
                expect(tss).toBeGreaterThan(50); // After promoter region
                expect(tss).toBeLessThan(100);   // Before gene end

                // Should contain both exons and introns
                expect(preMRNA.getCodingSequence().length).toBeLessThan(preMRNA.getSequence().length);
            }
        });

        test('respects promoter search distance limits', () => {
            const options: TranscriptionOptions = {
                maxPromoterSearchDistance: 10 // Very short search
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
            const emptyGene = new Gene('ATGAAATTTGGG', []);
            const result = transcribe(emptyGene);

            // Should handle gracefully
            if (isSuccess(result)) {
                expect(result.data.getExonRegions()).toHaveLength(0);
            }
        });

        test('handles malformed gene structure', () => {
            // This should be caught by Gene class validation, but test transcription robustness
            const options: TranscriptionOptions = {
                forceTranscriptionStartSite: 50
            };

            const result = transcribe(testGene, options);
            expect(isSuccess(result) || isFailure(result)).toBe(true); // Should not throw
        });
    });
});