import { PromoterElement } from '../../src/model/PromoterElement';
import { NucleotidePattern } from '../../src/model/nucleic-acids/NucleotidePattern';
import {
    TATA_BOX_TYPICAL_POSITION,
    DPE_TYPICAL_POSITION,
} from '../../src/constants/biological-constants';

describe('PromoterElement', () => {
    describe('constructor', () => {
        test('creates valid PromoterElement', () => {
            const pattern = new NucleotidePattern('TATAWAR');
            const element = new PromoterElement('TATA', pattern, TATA_BOX_TYPICAL_POSITION);

            expect(element.name).toBe('TATA');
            expect(element.pattern).toBe(pattern);
            expect(element.position).toBe(TATA_BOX_TYPICAL_POSITION);
        });

        test('creates element with positive position', () => {
            const pattern = new NucleotidePattern('YYANWYY');
            const element = new PromoterElement('Inr', pattern, 0);

            expect(element.position).toBe(0);
        });

        test('creates element with downstream position', () => {
            const pattern = new NucleotidePattern('RGWYV');
            const element = new PromoterElement('DPE', pattern, DPE_TYPICAL_POSITION);

            expect(element.position).toBe(DPE_TYPICAL_POSITION);
        });
    });

    describe('toString', () => {
        test('returns formatted string representation', () => {
            const pattern = new NucleotidePattern('TATAWAR');
            const element = new PromoterElement('TATA', pattern, TATA_BOX_TYPICAL_POSITION);

            expect(element.toString()).toBe('TATA@' + TATA_BOX_TYPICAL_POSITION);
        });

        test('handles zero position', () => {
            const pattern = new NucleotidePattern('YYANWYY');
            const element = new PromoterElement('Inr', pattern, 0);

            expect(element.toString()).toBe('Inr@0');
        });

        test('handles positive position', () => {
            const pattern = new NucleotidePattern('RGWYV');
            const element = new PromoterElement('DPE', pattern, DPE_TYPICAL_POSITION);

            expect(element.toString()).toBe('DPE@' + DPE_TYPICAL_POSITION);
        });
    });

    describe('equals', () => {
        test('returns true for identical elements', () => {
            const pattern1 = new NucleotidePattern('TATAWAR');
            const pattern2 = new NucleotidePattern('TATAWAR');
            const element1 = new PromoterElement('TATA', pattern1, TATA_BOX_TYPICAL_POSITION);
            const element2 = new PromoterElement('TATA', pattern2, TATA_BOX_TYPICAL_POSITION);

            expect(element1.equals(element2)).toBe(true);
        });

        test('returns false for different names', () => {
            const pattern = new NucleotidePattern('TATAWAR');
            const element1 = new PromoterElement('TATA', pattern, TATA_BOX_TYPICAL_POSITION);
            const element2 = new PromoterElement('GC', pattern, TATA_BOX_TYPICAL_POSITION);

            expect(element1.equals(element2)).toBe(false);
        });

        test('returns false for different positions', () => {
            const pattern = new NucleotidePattern('TATAWAR');
            const element1 = new PromoterElement('TATA', pattern, TATA_BOX_TYPICAL_POSITION);
            const element2 = new PromoterElement('TATA', pattern, -DPE_TYPICAL_POSITION);

            expect(element1.equals(element2)).toBe(false);
        });

        test('returns false for different patterns', () => {
            const pattern1 = new NucleotidePattern('TATAWAR');
            const pattern2 = new NucleotidePattern('GGGCGG');
            const element1 = new PromoterElement('TATA', pattern1, TATA_BOX_TYPICAL_POSITION);
            const element2 = new PromoterElement('TATA', pattern2, TATA_BOX_TYPICAL_POSITION);

            expect(element1.equals(element2)).toBe(false);
        });
    });

    describe('edge cases', () => {
        test('handles empty name', () => {
            const pattern = new NucleotidePattern('NNNN');
            const element = new PromoterElement('', pattern, 0);

            expect(element.name).toBe('');
            expect(element.toString()).toBe('@0');
        });

        test('handles large negative position', () => {
            const pattern = new NucleotidePattern('GGCCAATCT');
            const element = new PromoterElement('CAAT', pattern, -1000);

            expect(element.position).toBe(-1000);
            expect(element.toString()).toBe('CAAT@-1000');
        });

        test('handles large positive position', () => {
            const pattern = new NucleotidePattern('CANNTG');
            const element = new PromoterElement('E-box', pattern, 500);

            expect(element.position).toBe(500);
            expect(element.toString()).toBe('E-box@500');
        });
    });
});
