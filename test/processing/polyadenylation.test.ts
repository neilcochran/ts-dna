import { RNA } from '../../src/sequence';
import {
  findPolyadenylationSites,
  getStrongestPolyadenylationSite,
  filterPolyadenylationSites,
  DEFAULT_CLEAVAGE_OPTIONS,
} from '../../src/processing';
import { POLYA_SIGNAL_OFFSET } from '../../src/constants/biological-constants';

describe('findPolyadenylationSites', () => {
  test('finds the canonical AAUAAA signal', () => {
    const rna = new RNA('AUGAAACCCAAUAAAGGGCCCAAAUUUCCCGGG');
    const sites = findPolyadenylationSites(rna);
    expect(sites).toHaveLength(1);
    expect(sites[0].position).toBe(9);
    expect(sites[0].signal).toBe('AAUAAA');
    expect(sites[0].strength).toBe(100);
  });

  test('finds the AUUAAA alternative signal', () => {
    const rna = new RNA('AUGAAACCCAUUAAAGGGCCCAAAUUUCCCGGG');
    const sites = findPolyadenylationSites(rna);
    expect(sites).toHaveLength(1);
    expect(sites[0].signal).toBe('AUUAAA');
    expect(sites[0].strength).toBeGreaterThanOrEqual(80);
  });

  test('sorts by strength then by position', () => {
    const rna = new RNA('AAUAAAGGGAAAAAAAUUAAUAAACCCAAAAAAAUUAUUAAACCCAAAAAAGGGCCCUUUAAAAA');
    const sites = findPolyadenylationSites(rna);
    expect(sites.length).toBeGreaterThan(1);
    for (let i = 1; i < sites.length; i++) {
      if (sites[i - 1].strength === sites[i].strength) {
        expect(sites[i - 1].position).toBeLessThanOrEqual(sites[i].position);
      } else {
        expect(sites[i - 1].strength).toBeGreaterThanOrEqual(sites[i].strength);
      }
    }
  });

  test('returns an empty array when no signals are present', () => {
    expect(findPolyadenylationSites(new RNA('AUGAAACCCGGGCCCUUU'))).toEqual([]);
  });

  test('rejects sequences shorter than MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH', () => {
    expect(findPolyadenylationSites(new RNA('AAUAAA'))).toEqual([]);
  });

  test('boosts strength when an upstream USE element is present', () => {
    const rna = new RNA('AUGUUUUUUAGUAAAGGGCCCAAAUCCCGGGUUUAAAA');
    const sites = findPolyadenylationSites(rna);
    expect(sites).toHaveLength(1);
    expect(sites[0].strength).toBeGreaterThan(30);
    expect(sites[0].upstreamUSE).toBeDefined();
  });

  test('boosts strength when a downstream DSE element is present', () => {
    const rna = new RNA('AUGAGUAAAUUUUUUGGGCCC');
    const sites = findPolyadenylationSites(rna);
    expect(sites).toHaveLength(1);
    expect(sites[0].downstreamDSE).toBeDefined();
    expect(sites[0].strength).toBeGreaterThan(30);
  });

  test('predicts a cleavage site downstream of the signal in the configured distance range', () => {
    const rna = new RNA('AAUAAAGGGCCCAAAUUUCCC');
    const sites = findPolyadenylationSites(rna);
    expect(sites).toHaveLength(1);
    const cleavage = sites[0].cleavageSite!;
    expect(cleavage).toBeGreaterThan(sites[0].position + POLYA_SIGNAL_OFFSET);
    expect(cleavage).toBeLessThan(sites[0].position + 30);
  });

  test('tolerates an unparseable signal string in the options list', () => {
    const rna = new RNA('AUGAAACCCAAUAAAGGGCCCAAAUUUCCCGGG');
    const sites = findPolyadenylationSites(rna, { polyASignal: ['AAUAAA', 'NOTASIGNAL'] });
    expect(sites.some(site => site.signal === 'AAUAAA')).toBe(true);
  });

  test("uses each matched signal's own length for the cleavage-distance check (regression)", () => {
    // The legacy implementation indexed `polyASignal[0].length` for every match - so a
    // heterogeneous list with an unparseable first entry would size every cleavage check
    // against zero. The new shape passes the actually-matched signal length.
    const rna = new RNA('AUGAAACCCAAUAAAGGGCCCAAAUUUCCCGGG');
    const sites = findPolyadenylationSites(rna, { polyASignal: ['NOTASIGNAL', 'AAUAAA'] });
    // The AAUAAA match should still be reported with a valid cleavage site - if the bug
    // were still present, the distance check would compare against `'NOTASIGNAL'.length`
    // (incorrectly using length 10 instead of 6) and would silently drop the candidate
    // when distance happens to land outside the expected window.
    expect(sites.some(site => site.signal === 'AAUAAA' && site.cleavageSite !== undefined)).toBe(
      true,
    );
  });
});

describe('getStrongestPolyadenylationSite', () => {
  test('returns the highest-strength site', () => {
    const rna = new RNA('AGUAAAGGGAAUAAACCCAUUAAACCCAAAAAACCCGGGAAAA');
    const sites = findPolyadenylationSites(rna);
    const strongest = getStrongestPolyadenylationSite(sites);
    expect(strongest).toBeDefined();
    expect(strongest!.signal).toBe('AAUAAA');
    expect(strongest!.strength).toBe(100);
  });

  test('returns undefined for an empty array', () => {
    expect(getStrongestPolyadenylationSite([])).toBeUndefined();
  });
});

describe('filterPolyadenylationSites', () => {
  test('filters sites by minimum strength', () => {
    const rna = new RNA('AAUAAAGGGAGUAAACCCAUUAAACCCAAAAAACCCGGGAAAA');
    const all = findPolyadenylationSites(rna);
    const strong = filterPolyadenylationSites(all, 50);
    expect(strong.length).toBeLessThanOrEqual(all.length);
    for (const site of strong) {
      expect(site.strength).toBeGreaterThanOrEqual(50);
    }
  });
});

describe('DEFAULT_CLEAVAGE_OPTIONS', () => {
  test('lists the canonical signals', () => {
    expect(DEFAULT_CLEAVAGE_OPTIONS.polyASignal).toContain('AAUAAA');
    expect(DEFAULT_CLEAVAGE_OPTIONS.polyASignal).toContain('AUUAAA');
  });

  test('uses the standard cleavage distance range', () => {
    expect(DEFAULT_CLEAVAGE_OPTIONS.distanceRange).toEqual([11, 23]);
  });

  test('prefers A over U over C over G at the cleavage site', () => {
    expect(DEFAULT_CLEAVAGE_OPTIONS.cleavagePreference).toEqual(['A', 'U', 'C', 'G']);
  });
});
