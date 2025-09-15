import { RNA } from '../../src/model/nucleic-acids/RNA';
import {
    findPolyadenylationSites,
    getStrongestPolyadenylationSite,
    filterPolyadenylationSites
} from '../../src/utils/polyadenylation';
import { DEFAULT_CLEAVAGE_OPTIONS } from '../../src/types/polyadenylation-site';

describe('polyadenylation', () => {
    describe('findPolyadenylationSites', () => {
        test('finds canonical AAUAAA signal', () => {
            const rna = new RNA('AUGAAACCCAAUAAAGGGCCCUUU');
            const sites = findPolyadenylationSites(rna);

            expect(sites).toHaveLength(1);
            expect(sites[0].position).toBe(9);
            expect(sites[0].signal).toBe('AAUAAA');
            expect(sites[0].strength).toBe(100);
        });

        test('finds alternative AUUAAA signal', () => {
            const rna = new RNA('AUGAAACCCAUUAAAGGGCCCUUU');
            const sites = findPolyadenylationSites(rna);

            expect(sites).toHaveLength(1);
            expect(sites[0].position).toBe(9);
            expect(sites[0].signal).toBe('AUUAAA');
            expect(sites[0].strength).toBeGreaterThanOrEqual(80); // May have USE/DSE bonuses
        });

        test('finds multiple polyadenylation signals', () => {
            const rna = new RNA('AAUAAAGGGAAUAAACCCAUUAAA');
            const sites = findPolyadenylationSites(rna);

            expect(sites).toHaveLength(3);

            // Should be sorted by strength (AAUAAA > AUUAAA)
            expect(sites[0].signal).toBe('AAUAAA');
            expect(sites[0].strength).toBe(100);
            expect(sites[1].signal).toBe('AAUAAA');
            expect(sites[1].strength).toBe(100);
            expect(sites[2].signal).toBe('AUUAAA');
            expect(sites[2].strength).toBe(80);
        });

        test('finds weak alternative signals', () => {
            const rna = new RNA('AUGAAACCCAGUAAAGGGCCCUUU');
            const sites = findPolyadenylationSites(rna);

            expect(sites).toHaveLength(1);
            expect(sites[0].signal).toBe('AGUAAA');
            expect(sites[0].strength).toBeGreaterThanOrEqual(30); // May have USE/DSE bonuses
        });

        test('returns empty array when no signals found', () => {
            const rna = new RNA('AUGAAACCCGGGCCCUUU');
            const sites = findPolyadenylationSites(rna);

            expect(sites).toHaveLength(0);
        });

        test('enhances strength with upstream USE elements', () => {
            // Include U-rich region upstream of weak signal
            const rna = new RNA('AUGUUUUUUAGUAAAGGGCCC');
            const sites = findPolyadenylationSites(rna);

            expect(sites).toHaveLength(1);
            // Should have bonus for USE presence (30 base + 15 USE = 45)
            expect(sites[0].strength).toBeGreaterThan(30);
            expect(sites[0].upstreamUSE).toBeDefined();
        });

        test('enhances strength with downstream DSE elements', () => {
            // Include U-rich region downstream of weak signal
            const rna = new RNA('AUGAGUAAAUUUUUUGGGCCC');
            const sites = findPolyadenylationSites(rna);

            expect(sites).toHaveLength(1);
            // Should have bonus for DSE presence (30 base + 10 DSE = 40)
            expect(sites[0].strength).toBeGreaterThan(30);
            expect(sites[0].downstreamDSE).toBeDefined();
        });

        test('predicts cleavage site based on nucleotide preference', () => {
            // A preferred over other nucleotides
            const rna = new RNA('AAUAAAGGGCCCAAAUUUCCC');
            const sites = findPolyadenylationSites(rna);

            expect(sites).toHaveLength(1);
            expect(sites[0].cleavageSite).toBeDefined();

            // Should prefer A nucleotides for cleavage
            const cleavageSite = sites[0].cleavageSite!;
            expect(cleavageSite).toBeGreaterThan(sites[0].position + 6);
            expect(cleavageSite).toBeLessThan(sites[0].position + 30);
        });

        test('works with custom options', () => {
            const customOptions = {
                polyASignal: ['AAUAAA'] as const,
                distanceRange: [15, 25] as const
            };

            const rna = new RNA('AAUAAAGGGCCCAAUAAAUUU');
            const sites = findPolyadenylationSites(rna, customOptions);

            expect(sites).toHaveLength(2);
            sites.forEach(site => {
                expect(site.signal).toBe('AAUAAA');
            });
        });
    });

    describe('getStrongestPolyadenylationSite', () => {
        test('returns strongest site from multiple candidates', () => {
            const rna = new RNA('AGUAAAGGGAAUAAACCCAUUAAA');
            const sites = findPolyadenylationSites(rna);
            const strongest = getStrongestPolyadenylationSite(sites);

            expect(strongest).toBeDefined();
            expect(strongest!.signal).toBe('AAUAAA');
            expect(strongest!.strength).toBe(100);
        });

        test('returns undefined for empty array', () => {
            const strongest = getStrongestPolyadenylationSite([]);
            expect(strongest).toBeUndefined();
        });

        test('returns single site when only one present', () => {
            const rna = new RNA('AUGAAACCCAAUAAAGGGCCC');
            const sites = findPolyadenylationSites(rna);
            const strongest = getStrongestPolyadenylationSite(sites);

            expect(strongest).toBeDefined();
            expect(strongest!.signal).toBe('AAUAAA');
        });
    });

    describe('filterPolyadenylationSites', () => {
        test('filters sites by minimum strength', () => {
            const rna = new RNA('AAUAAAGGGAGUAAACCCAUUAAA');
            const allSites = findPolyadenylationSites(rna);
            const strongSites = filterPolyadenylationSites(allSites, 50);

            expect(allSites.length).toBeGreaterThan(strongSites.length);
            strongSites.forEach(site => {
                expect(site.strength).toBeGreaterThanOrEqual(50);
            });
        });

        test('returns all sites when threshold is low', () => {
            const rna = new RNA('AAUAAAGGGAGUAAACCC');
            const allSites = findPolyadenylationSites(rna);
            const filtered = filterPolyadenylationSites(allSites, 10);

            expect(filtered).toHaveLength(allSites.length);
        });

        test('returns empty array when no sites meet threshold', () => {
            const rna = new RNA('AAUAAAGGGAGUAAACCC');
            const allSites = findPolyadenylationSites(rna);
            const filtered = filterPolyadenylationSites(allSites, 200);

            expect(filtered).toHaveLength(0);
        });
    });

    describe('DEFAULT_CLEAVAGE_OPTIONS', () => {
        test('contains expected polyadenylation signals', () => {
            expect(DEFAULT_CLEAVAGE_OPTIONS.polyASignal).toContain('AAUAAA');
            expect(DEFAULT_CLEAVAGE_OPTIONS.polyASignal).toContain('AUUAAA');
            expect(DEFAULT_CLEAVAGE_OPTIONS.polyASignal).toContain('AGUAAA');
        });

        test('has reasonable distance range', () => {
            expect(DEFAULT_CLEAVAGE_OPTIONS.distanceRange).toEqual([11, 23]);
        });

        test('has nucleotide preference for cleavage', () => {
            expect(DEFAULT_CLEAVAGE_OPTIONS.cleavagePreference).toEqual(['A', 'U', 'C', 'G']);
        });
    });
});