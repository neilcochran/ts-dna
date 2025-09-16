import { MRNA } from '../../../src/model/nucleic-acids/MRNA';
import { RNASubType } from '../../../src/enums/rna-sub-type';

describe('MRNA', () => {
    describe('constructor', () => {
        test('creates MRNA with valid parameters', () => {
            const mRNA = new MRNA(
                'GAUGAAACCCGGGUAAAAAAAAAA',  // full sequence
                'AUGAAACCCGGG',              // coding sequence
                1,                          // coding starts at position 1
                13,                         // coding ends at position 13
                true,                       // has 5' cap
                'AAAAAAAAAA'                // 10 A's poly-A tail
            );

            expect(mRNA.getSequence()).toBe('GAUGAAACCCGGGUAAAAAAAAAA');
            expect(mRNA.getCodingSequence()).toBe('AUGAAACCCGGG');
            expect(mRNA.hasFivePrimeCap()).toBe(true);
            expect(mRNA.getPolyATailLength()).toBe(10);
            expect(mRNA.rnaSubType).toBe(RNASubType.M_RNA);
        });

        test('creates MRNA with default cap and empty poly-A tail', () => {
            const mRNA = new MRNA(
                'AUGAAACCCGGG',
                'AUGAAACCCGGG',
                0,
                12
            );

            expect(mRNA.hasFivePrimeCap()).toBe(true);
            expect(mRNA.getPolyATailLength()).toBe(0);
            expect(mRNA.getPolyATail()).toBe('');
        });

        test('throws error for invalid coding sequence boundaries', () => {
            expect(() => {
                new MRNA('AUGAAACCCGGG', 'AUGAAACCCGGG', -1, 12);
            }).toThrow('Invalid coding sequence boundaries');

            expect(() => {
                new MRNA('AUGAAACCCGGG', 'AUGAAACCCGGG', 0, 15);
            }).toThrow('Invalid coding sequence boundaries');

            expect(() => {
                new MRNA('AUGAAACCCGGG', 'AUGAAACCCGGG', 10, 5);
            }).toThrow('Invalid coding sequence boundaries');
        });

        test('throws error for coding sequence mismatch', () => {
            expect(() => {
                new MRNA(
                    'GAUGAAACCCGGG',
                    'AUGCCCCCCGGG',  // wrong coding sequence
                    1,
                    13
                );
            }).toThrow('Coding sequence mismatch');
        });
    });

    describe('getCodingSequence', () => {
        test('returns the coding sequence', () => {
            const mRNA = new MRNA('GAUGAAACCCGGGUAA', 'AUGAAACCCGGG', 1, 13);
            expect(mRNA.getCodingSequence()).toBe('AUGAAACCCGGG');
        });
    });

    describe('getPolyATailLength', () => {
        test('returns correct poly-A tail length', () => {
            const mRNA = new MRNA('AUGAAACCCGGGAAAAAAA', 'AUGAAACCCGGG', 0, 12, true, 'AAAAAAA');
            expect(mRNA.getPolyATailLength()).toBe(7);
        });

        test('returns 0 for empty poly-A tail', () => {
            const mRNA = new MRNA('AUGAAACCCGGG', 'AUGAAACCCGGG', 0, 12);
            expect(mRNA.getPolyATailLength()).toBe(0);
        });
    });

    describe('getPolyATail', () => {
        test('returns the poly-A tail sequence', () => {
            const mRNA = new MRNA('AUGAAACCCGGGAAAAAAA', 'AUGAAACCCGGG', 0, 12, true, 'AAAAAAA');
            expect(mRNA.getPolyATail()).toBe('AAAAAAA');
        });
    });

    describe('hasFivePrimeCap', () => {
        test('returns true when cap is present', () => {
            const mRNA = new MRNA('AUGAAACCCGGG', 'AUGAAACCCGGG', 0, 12, true);
            expect(mRNA.hasFivePrimeCap()).toBe(true);
        });

        test('returns false when cap is absent', () => {
            const mRNA = new MRNA('AUGAAACCCGGG', 'AUGAAACCCGGG', 0, 12, false);
            expect(mRNA.hasFivePrimeCap()).toBe(false);
        });
    });

    describe('isFullyProcessed', () => {
        test('returns true for fully processed mRNA', () => {
            const mRNA = new MRNA(
                'AUGAAACCCGGGAAAAAAAAAA',
                'AUGAAACCCGGG',
                0,
                12,
                true,                    // has cap
                'AAAAAAAAAA'            // 10 A's poly-A tail
            );
            expect(mRNA.isFullyProcessed()).toBe(true);
        });

        test('returns false when missing 5\' cap', () => {
            const mRNA = new MRNA(
                'AUGAAACCCGGGAAAAAAAAAA',
                'AUGAAACCCGGG',
                0,
                12,
                false,                   // no cap
                'AAAAAAAAAA'
            );
            expect(mRNA.isFullyProcessed()).toBe(false);
        });

        test('returns false when poly-A tail is too short', () => {
            const mRNA = new MRNA(
                'AUGAAACCCGGGAAAAAA',
                'AUGAAACCCGGG',
                0,
                12,
                true,
                'AAAAAA'                 // only 6 A's (< 10 minimum)
            );
            expect(mRNA.isFullyProcessed()).toBe(false);
        });

        test('returns false when coding sequence is too short', () => {
            const mRNA = new MRNA(
                'AUGAAAAAAAAAA',
                'AU',                    // too short (< 3 nucleotides)
                0,
                2,
                true,
                'AAAAAAAAAA'
            );
            expect(mRNA.isFullyProcessed()).toBe(false);
        });
    });

    describe('getFivePrimeUTR', () => {
        test('returns 5\' UTR before coding sequence', () => {
            const mRNA = new MRNA('GGGCCCAUGAAACCCGGG', 'AUGAAACCCGGG', 6, 18);
            expect(mRNA.getFivePrimeUTR()).toBe('GGGCCC');
        });

        test('returns empty string when coding starts at beginning', () => {
            const mRNA = new MRNA('AUGAAACCCGGG', 'AUGAAACCCGGG', 0, 12);
            expect(mRNA.getFivePrimeUTR()).toBe('');
        });
    });

    describe('getThreePrimeUTR', () => {
        test('returns 3\' UTR after coding sequence excluding poly-A tail', () => {
            const mRNA = new MRNA(
                'AUGAAACCCGGGUAAGGGAAAAAAA',
                'AUGAAACCCGGG',
                0,
                12,
                true,
                'AAAAAAA'
            );
            expect(mRNA.getThreePrimeUTR()).toBe('UAAGGG');
        });

        test('returns empty string when no 3\' UTR', () => {
            const mRNA = new MRNA(
                'AUGAAACCCGGGAAAAAAA',
                'AUGAAACCCGGG',
                0,
                12,
                true,
                'AAAAAAA'
            );
            expect(mRNA.getThreePrimeUTR()).toBe('');
        });
    });

    describe('getCodingStart and getCodingEnd', () => {
        test('returns correct coding boundaries', () => {
            const mRNA = new MRNA('GGGAUGAAACCCGGGUAA', 'AUGAAACCCGGG', 3, 15);
            expect(mRNA.getCodingStart()).toBe(3);
            expect(mRNA.getCodingEnd()).toBe(15);
        });
    });

    describe('complex scenarios', () => {
        test('handles realistic mRNA with all components', () => {
            // 5' UTR + coding sequence + 3' UTR + poly-A tail
            const fullSequence = 'GGGCCCAUGAAACCCGGGUAAUCCAAAAAAAAAAAAAAAA';
            const codingSeq = 'AUGAAACCCGGGUAA';  // includes stop codon
            const mRNA = new MRNA(
                fullSequence,
                codingSeq,
                6,                      // coding starts after 5' UTR
                21,                     // coding ends before 3' UTR
                true,
                'AAAAAAAAAAAAAAAA'       // 16 A's
            );

            expect(mRNA.getFivePrimeUTR()).toBe('GGGCCC');
            expect(mRNA.getCodingSequence()).toBe('AUGAAACCCGGGUAA');
            expect(mRNA.getThreePrimeUTR()).toBe('UCC');
            expect(mRNA.getPolyATailLength()).toBe(16);
            expect(mRNA.isFullyProcessed()).toBe(true);
        });

        test('handles minimal valid mRNA', () => {
            const mRNA = new MRNA('AUGUGA', 'AUGUGA', 0, 6, false, '');

            expect(mRNA.getFivePrimeUTR()).toBe('');
            expect(mRNA.getCodingSequence()).toBe('AUGUGA');
            expect(mRNA.getThreePrimeUTR()).toBe('');
            expect(mRNA.getPolyATailLength()).toBe(0);
            expect(mRNA.hasFivePrimeCap()).toBe(false);
            expect(mRNA.isFullyProcessed()).toBe(false);  // no cap, no poly-A tail
        });
    });
});