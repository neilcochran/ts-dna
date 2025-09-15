import { RNA } from '../../src/model/nucleic-acids/RNA';
import {
    add5PrimeCap,
    add3PrimePolyATail,
    add3PrimePolyATailAtSite,
    remove5PrimeCap,
    remove3PrimePolyATail,
    has5PrimeCap,
    has3PrimePolyATail,
    get3PrimePolyATailLength,
    getCoreSequence,
    isFullyProcessed,
    analyzeRNAProcessing
} from '../../src/utils/rna-modifications';
import { PolyadenylationSite } from '../../src/types/polyadenylation-site';
import { isSuccess, isFailure } from '../../src/types/validation-result';

describe('rna-modifications', () => {
    describe('add5PrimeCap', () => {
        test('adds 5\' cap to RNA sequence', () => {
            const rna = new RNA('AUGAAACCCGGG');
            const cappedRNA = add5PrimeCap(rna);

            expect(cappedRNA.getSequence()).toBe('5CAP_AUGAAACCCGGG');
            expect(cappedRNA.rnaSubType).toBe(rna.rnaSubType);
        });

        test('adds cap to empty sequence', () => {
            const rna = new RNA('A'); // Minimal valid RNA
            const cappedRNA = add5PrimeCap(rna);

            expect(cappedRNA.getSequence()).toBe('5CAP_A');
        });

        test('preserves RNA subtype', () => {
            const rna = new RNA('AUGAAACCCGGG');
            const cappedRNA = add5PrimeCap(rna);

            expect(cappedRNA.rnaSubType).toBe(rna.rnaSubType);
        });
    });

    describe('add3PrimePolyATail', () => {
        test('adds poly-A tail at specified cleavage site', () => {
            const rna = new RNA('AUGAAACCCGGGAAUAAACCC');
            const result = add3PrimePolyATail(rna, 15, 10);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUGAAACCCGGGAAUAAAAAAAAAA');
            }
        });

        test('adds default length poly-A tail', () => {
            const rna = new RNA('AUGAAACCCGGG');
            const result = add3PrimePolyATail(rna, 12);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                const sequence = result.data.getSequence();
                expect(sequence.startsWith('AUGAAACCCGGG')).toBe(true);
                expect(sequence.length).toBe(12 + 200); // Original + 200 A's
                expect(sequence.endsWith('A'.repeat(200))).toBe(true);
            }
        });

        test('adds custom length poly-A tail', () => {
            const rna = new RNA('AUGAAACCCGGG');
            const result = add3PrimePolyATail(rna, 12, 50);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUGAAACCCGGG' + 'A'.repeat(50));
            }
        });

        test('fails with invalid cleavage site', () => {
            const rna = new RNA('AUGAAACCCGGG');
            const result = add3PrimePolyATail(rna, -1);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('Invalid cleavage site');
            }
        });

        test('fails with cleavage site beyond sequence', () => {
            const rna = new RNA('AUGAAACCCGGG');
            const result = add3PrimePolyATail(rna, 100);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('Invalid cleavage site');
            }
        });

        test('fails with invalid tail length', () => {
            const rna = new RNA('AUGAAACCCGGG');
            const result = add3PrimePolyATail(rna, 12, -10);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('Invalid poly-A tail length');
            }
        });

        test('fails with excessive tail length', () => {
            const rna = new RNA('AUGAAACCCGGG');
            const result = add3PrimePolyATail(rna, 12, 2000);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('Invalid poly-A tail length');
            }
        });
    });

    describe('add3PrimePolyATailAtSite', () => {
        test('adds poly-A tail using polyadenylation site info', () => {
            const rna = new RNA('AUGAAACCCGGGAAUAAACCC');
            const polySite: PolyadenylationSite = {
                position: 12,
                signal: 'AAUAAA',
                strength: 100,
                cleavageSite: 20
            };

            const result = add3PrimePolyATailAtSite(rna, polySite, 10);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUGAAACCCGGGAAUAAACCAAAAAAAAAA');
            }
        });

        test('calculates cleavage site when not provided', () => {
            const rna = new RNA('AUGAAACCCGGGAAUAAACCC');
            const polySite: PolyadenylationSite = {
                position: 12,
                signal: 'AAUAAA',
                strength: 100
                // No cleavageSite provided
            };

            const result = add3PrimePolyATailAtSite(rna, polySite, 5);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                // Should use position + signal.length + 15 = 12 + 6 + 15 = 33
                // But sequence is only 21 long, so it will truncate appropriately
                const sequence = result.data.getSequence();
                expect(sequence.endsWith('AAAAA')).toBe(true);
            }
        });
    });

    describe('remove5PrimeCap', () => {
        test('removes 5\' cap from capped RNA', () => {
            const rna = new RNA('5CAP_AUGAAACCCGGG');
            const result = remove5PrimeCap(rna);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUGAAACCCGGG');
            }
        });

        test('fails when no cap present', () => {
            const rna = new RNA('AUGAAACCCGGG');
            const result = remove5PrimeCap(rna);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('No 5\' cap found');
            }
        });
    });

    describe('remove3PrimePolyATail', () => {
        test('removes poly-A tail from RNA', () => {
            const rna = new RNA('AUGAAACCCGGGAAAAAAAAAA');
            const result = remove3PrimePolyATail(rna);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                expect(result.data.getSequence()).toBe('AUGAAACCCGGG');
            }
        });

        test('fails when no poly-A tail present', () => {
            const rna = new RNA('AUGAAACCCGGGCCC');
            const result = remove3PrimePolyATail(rna);

            expect(isFailure(result)).toBe(true);
            if (isFailure(result)) {
                expect(result.error).toContain('No poly-A tail found');
            }
        });
    });

    describe('has5PrimeCap', () => {
        test('detects 5\' cap presence', () => {
            const cappedRNA = new RNA('5CAP_AUGAAACCCGGG');
            const uncappedRNA = new RNA('AUGAAACCCGGG');

            expect(has5PrimeCap(cappedRNA)).toBe(true);
            expect(has5PrimeCap(uncappedRNA)).toBe(false);
        });
    });

    describe('has3PrimePolyATail', () => {
        test('detects poly-A tail with default minimum length', () => {
            const polyARNA = new RNA('AUGAAACCCGGGAAAAAAAAAA'); // 10 A's
            const noPolyARNA = new RNA('AUGAAACCCGGGCCC');
            const shortPolyARNA = new RNA('AUGAAACCCGGGAAA'); // Only 3 A's

            expect(has3PrimePolyATail(polyARNA)).toBe(true);
            expect(has3PrimePolyATail(noPolyARNA)).toBe(false);
            expect(has3PrimePolyATail(shortPolyARNA)).toBe(false);
        });

        test('detects poly-A tail with custom minimum length', () => {
            const rna = new RNA('AUGAAACCCGGGAAAAA'); // 5 A's

            expect(has3PrimePolyATail(rna, 3)).toBe(true);
            expect(has3PrimePolyATail(rna, 5)).toBe(true);
            expect(has3PrimePolyATail(rna, 10)).toBe(false);
        });
    });

    describe('get3PrimePolyATailLength', () => {
        test('returns correct poly-A tail length', () => {
            const rna1 = new RNA('AUGAAACCCGGGAAAAAAAAAA'); // 10 A's
            const rna2 = new RNA('AUGAAACCCGGGCCC'); // No A's at end
            const rna3 = new RNA('AUGAAACCCGGGAAA'); // 3 A's

            expect(get3PrimePolyATailLength(rna1)).toBe(10);
            expect(get3PrimePolyATailLength(rna2)).toBe(0);
            expect(get3PrimePolyATailLength(rna3)).toBe(3);
        });

        test('handles edge cases', () => {
            const allARNA = new RNA('AAAAAAAAAA');
            const noARNA = new RNA('CCCGGGCCC');

            expect(get3PrimePolyATailLength(allARNA)).toBe(10);
            expect(get3PrimePolyATailLength(noARNA)).toBe(0);
        });
    });

    describe('getCoreSequence', () => {
        test('removes both cap and poly-A tail', () => {
            const rna = new RNA('5CAP_AUGAAACCCGGGAAAAAAAAAA');
            const core = getCoreSequence(rna);

            expect(core).toBe('AUGAAACCCGGG');
        });

        test('removes only cap when no poly-A tail', () => {
            const rna = new RNA('5CAP_AUGAAACCCGGGCCC');
            const core = getCoreSequence(rna);

            expect(core).toBe('AUGAAACCCGGGCCC');
        });

        test('removes only poly-A tail when no cap', () => {
            const rna = new RNA('AUGAAACCCGGGAAAAAAAAAA');
            const core = getCoreSequence(rna);

            expect(core).toBe('AUGAAACCCGGG');
        });

        test('returns unchanged sequence when no modifications', () => {
            const rna = new RNA('AUGAAACCCGGGCCC');
            const core = getCoreSequence(rna);

            expect(core).toBe('AUGAAACCCGGGCCC');
        });
    });

    describe('isFullyProcessed', () => {
        test('detects fully processed RNA', () => {
            const fullyProcessed = new RNA('5CAP_AUGAAACCCGGGAAAAAAAAAA');
            const onlyCapped = new RNA('5CAP_AUGAAACCCGGGCCC');
            const onlyPolyA = new RNA('AUGAAACCCGGGAAAAAAAAAA');
            const unprocessed = new RNA('AUGAAACCCGGGCCC');

            expect(isFullyProcessed(fullyProcessed)).toBe(true);
            expect(isFullyProcessed(onlyCapped)).toBe(false);
            expect(isFullyProcessed(onlyPolyA)).toBe(false);
            expect(isFullyProcessed(unprocessed)).toBe(false);
        });
    });

    describe('analyzeRNAProcessing', () => {
        test('analyzes fully processed RNA', () => {
            const rna = new RNA('5CAP_AUGAAACCCGGGAAAAAAAAAA'); // 10 A's at end
            const analysis = analyzeRNAProcessing(rna);

            expect(analysis.hasFivePrimeCap).toBe(true);
            expect(analysis.hasThreePrimePolyA).toBe(true);
            expect(analysis.polyATailLength).toBe(10);
            expect(analysis.coreSequenceLength).toBe(12); // AUGAAACCCGGG
            expect(analysis.isFullyProcessed).toBe(true);
        });

        test('analyzes partially processed RNA', () => {
            const rna = new RNA('5CAP_AUGAAACCCGGGCCC');
            const analysis = analyzeRNAProcessing(rna);

            expect(analysis.hasFivePrimeCap).toBe(true);
            expect(analysis.hasThreePrimePolyA).toBe(false);
            expect(analysis.polyATailLength).toBe(0);
            expect(analysis.coreSequenceLength).toBe(15); // AUGAAACCCGGGCCC
            expect(analysis.isFullyProcessed).toBe(false);
        });

        test('analyzes unprocessed RNA', () => {
            const rna = new RNA('AUGAAACCCGGGCCC');
            const analysis = analyzeRNAProcessing(rna);

            expect(analysis.hasFivePrimeCap).toBe(false);
            expect(analysis.hasThreePrimePolyA).toBe(false);
            expect(analysis.polyATailLength).toBe(0);
            expect(analysis.coreSequenceLength).toBe(15);
            expect(analysis.isFullyProcessed).toBe(false);
        });
    });
});