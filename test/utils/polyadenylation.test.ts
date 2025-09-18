import { RNA } from '../../src/model/nucleic-acids/RNA';
import {
  findPolyadenylationSites,
  getStrongestPolyadenylationSite,
  filterPolyadenylationSites,
} from '../../src/utils/polyadenylation';
import { DEFAULT_CLEAVAGE_OPTIONS } from '../../src/types/polyadenylation-site';
import { POLYA_SIGNAL_OFFSET } from '../../src/constants/biological-constants';

describe('polyadenylation', () => {
  describe('findPolyadenylationSites', () => {
    test('finds canonical AAUAAA signal', () => {
      const rna = new RNA('AUGAAACCCAAUAAAGGGCCCAAAUUUCCCGGG');
      const sites = findPolyadenylationSites(rna);

      expect(sites).toHaveLength(1);
      expect(sites[0].position).toBe(9);
      expect(sites[0].signal).toBe('AAUAAA');
      expect(sites[0].strength).toBe(100);
    });

    test('finds alternative AUUAAA signal', () => {
      const rna = new RNA('AUGAAACCCAUUAAAGGGCCCAAAUUUCCCGGG');
      const sites = findPolyadenylationSites(rna);

      expect(sites).toHaveLength(1);
      expect(sites[0].position).toBe(9);
      expect(sites[0].signal).toBe('AUUAAA');
      expect(sites[0].strength).toBeGreaterThanOrEqual(80); // May have USE/DSE bonuses
    });

    test('finds multiple polyadenylation signals', () => {
      const rna = new RNA('AAUAAAGGGAAAAAAAUUAAUAAACCCAAAAAAAUUAUUAAACCCAAAAAAGGGCCCUUUAAAAA');
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
      const rna = new RNA('AUGAAACCCAGUAAAGGGCCCAAAUUUCCCGGG');
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
      const rna = new RNA('AUGUUUUUUAGUAAAGGGCCCAAAUCCCGGGUUUAAAA');
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
      expect(cleavageSite).toBeGreaterThan(sites[0].position + POLYA_SIGNAL_OFFSET);
      expect(cleavageSite).toBeLessThan(sites[0].position + 30);
    });

    test('works with custom options', () => {
      const customOptions = {
        polyASignal: ['AAUAAA'] as const,
        distanceRange: [15, 25] as const,
      };

      const rna = new RNA('AAUAAAGGGCCCAAAAAACCCGGGAAUAAACCCAAAAAACCCGGGAAAA');
      const sites = findPolyadenylationSites(rna, customOptions);

      expect(sites).toHaveLength(2);
      sites.forEach(site => {
        expect(site.signal).toBe('AAUAAA');
      });
    });
  });

  describe('getStrongestPolyadenylationSite', () => {
    test('returns strongest site from multiple candidates', () => {
      const rna = new RNA('AGUAAAGGGAAUAAACCCAUUAAACCCAAAAAACCCGGGAAAA');
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
      const rna = new RNA('AUGAAACCCAAUAAAGGGCCCAAAUCCCGGGUUUAAAA');
      const sites = findPolyadenylationSites(rna);
      const strongest = getStrongestPolyadenylationSite(sites);

      expect(strongest).toBeDefined();
      expect(strongest!.signal).toBe('AAUAAA');
    });
  });

  describe('filterPolyadenylationSites', () => {
    test('filters sites by minimum strength', () => {
      const rna = new RNA('AAUAAAGGGAGUAAACCCAUUAAACCCAAAAAACCCGGGAAAA');
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

  describe('findPolyadenylationSites - advanced features', () => {
    test('finds polyadenylation sites with enhanced USE analysis', () => {
      // Sequence with strong upstream USE (U-rich region) and UGUA motif
      const rna = new RNA('UUUUGUAAACCCAAUAAAGGGCCCUUUGUU');
      const sites = findPolyadenylationSites(rna);

      expect(sites).toHaveLength(1);
      expect(sites[0].signal).toBe('AAUAAA');
      expect(sites[0].strength).toBeGreaterThan(100); // Boosted by USE elements
      expect(sites[0].upstreamUSE).toBeDefined();
      expect(sites[0].upstreamUSE!.name).toBe('USE');
    });

    test('finds polyadenylation sites with enhanced DSE analysis', () => {
      // Sequence with strong downstream DSE (GU-rich and U-rich regions)
      const rna = new RNA('GGGCCCAAUAAAGUUUGUUUGGGUUU');
      const sites = findPolyadenylationSites(rna);

      expect(sites).toHaveLength(1);
      expect(sites[0].signal).toBe('AAUAAA');
      expect(sites[0].strength).toBeGreaterThan(100); // Boosted by DSE elements
      expect(sites[0].downstreamDSE).toBeDefined();
      expect(sites[0].downstreamDSE!.name).toBe('DSE');
    });

    test('predicts optimal cleavage sites with context scoring', () => {
      // Sequence designed for optimal cleavage site prediction
      const rna = new RNA('GGGCCCAAUAAAGUUCCCAAAGGGCCC');
      const sites = findPolyadenylationSites(rna);

      expect(sites).toHaveLength(1);
      expect(sites[0].cleavageSite).toBeDefined();

      // Cleavage site should be within reasonable distance (11-23 bp from signal)
      const distance = sites[0].cleavageSite! - (sites[0].position + sites[0].signal.length);
      expect(distance).toBeGreaterThanOrEqual(11);
      expect(distance).toBeLessThanOrEqual(23);
    });

    test('rejects sites below enhanced strength threshold', () => {
      // Sequence with weak signal and no enhancing elements
      const rna = new RNA('GGGCCCAAUACAGGGCCCGGGCCC');
      const sites = findPolyadenylationSites(rna);

      // Should have no sites or very few weak sites
      sites.forEach(site => {
        expect(site.strength).toBeGreaterThanOrEqual(25);
      });
    });

    test('validates biological constraints for cleavage sites', () => {
      // Sequence with problematic poly-G region that should be avoided
      const rna = new RNA('GGGCCCAAUAAAGGGGGGGGGAAA');
      const sites = findPolyadenylationSites(rna);

      if (sites.length > 0) {
        const site = sites[0];
        if (site.cleavageSite) {
          // Should not cleave in poly-G region
          const cleavageContext = rna
            .getSequence()
            .substring(site.cleavageSite - 1, site.cleavageSite + 2);
          expect(cleavageContext).not.toMatch(/G{3,}/);
        }
      }
    });

    test('handles multiple USE motif patterns', () => {
      // Sequence with UYU motif variant and standard U-rich region
      const rna = new RNA('UCUUUUUCGUCCCAAUAAAGGGCCCAAAUCCCGGGUUUAAAA');
      const sites = findPolyadenylationSites(rna);

      expect(sites).toHaveLength(1);
      expect(sites[0].upstreamUSE).toBeDefined();
      expect(sites[0].strength).toBeGreaterThan(100); // Should get USE boost
    });

    test('provides variable strength boosting based on element quality', () => {
      // Compare sites with different quality USE/DSE elements
      const rnaHighQuality = new RNA('UUUUGUAUUUAAUAAAGUUUGUGUUUUU');
      const rnaLowQuality = new RNA('CCCCCCAAUAAAGGGCCCCCCCAAAUCCCGGGUUUAAAA');

      const highQualitySites = findPolyadenylationSites(rnaHighQuality);
      const lowQualitySites = findPolyadenylationSites(rnaLowQuality);

      expect(highQualitySites).toHaveLength(1);
      expect(lowQualitySites).toHaveLength(1);

      // High quality site should have higher strength
      expect(highQualitySites[0].strength).toBeGreaterThan(lowQualitySites[0].strength);
    });

    test('respects custom cleavage site options', () => {
      const rna = new RNA('GGGCCCAAUAAAGUUCCCAAAGGGCCC');
      const customOptions = {
        polyASignal: ['AAUAAA'] as const,
        distanceRange: [15, 20] as const,
        cleavagePreference: ['A', 'U'] as const,
      };

      const sites = findPolyadenylationSites(rna, customOptions);

      if (sites.length > 0 && sites[0].cleavageSite) {
        const distance = sites[0].cleavageSite - (sites[0].position + sites[0].signal.length);
        expect(distance).toBeGreaterThanOrEqual(15);
        expect(distance).toBeLessThanOrEqual(20);
      }
    });

    test('sorts sites by strength and position correctly', () => {
      // Multiple signals with different strengths
      const rna = new RNA('UUUUAAUAAAGGGAGUAAACCCAUUAAAUUU');
      const sites = findPolyadenylationSites(rna);

      expect(sites.length).toBeGreaterThan(1);

      // Should be sorted by strength (highest first), then by position
      for (let i = 1; i < sites.length; i++) {
        if (sites[i - 1].strength === sites[i].strength) {
          expect(sites[i - 1].position).toBeLessThanOrEqual(sites[i].position);
        } else {
          expect(sites[i - 1].strength).toBeGreaterThanOrEqual(sites[i].strength);
        }
      }
    });

    test('handles edge cases gracefully', () => {
      // Very short sequence
      const shortRNA = new RNA('AAUAAA');
      const shortSites = findPolyadenylationSites(shortRNA);
      expect(shortSites).toHaveLength(0); // Too short for proper analysis

      // Sequence with no polyadenylation signals
      const noSignalRNA = new RNA('GGGCCCUUUGGGGCCCUUU');
      const noSites = findPolyadenylationSites(noSignalRNA);
      expect(noSites).toHaveLength(0);

      // Very minimal sequence (just above empty)
      const minimalRNA = new RNA('A');
      const minimalSites = findPolyadenylationSites(minimalRNA);
      expect(minimalSites).toHaveLength(0);
    });
  });
});
