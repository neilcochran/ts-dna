import { RNA } from '../model/nucleic-acids/RNA';
import { NucleotidePattern } from '../model/nucleic-acids/NucleotidePattern';
import { PolyadenylationSite, CleavageSiteOptions, DEFAULT_CLEAVAGE_OPTIONS } from '../types/polyadenylation-site';
import { GenomicRegion } from '../types/genomic-region';

/**
 * Finds polyadenylation sites in an RNA sequence with detailed analysis
 * of signal strength and regulatory elements.
 */
export function findPolyadenylationSites(
    rna: RNA,
    options: CleavageSiteOptions = DEFAULT_CLEAVAGE_OPTIONS
): PolyadenylationSite[] {
    const sequence = rna.getSequence();
    const sites: PolyadenylationSite[] = [];
    const opts = { ...DEFAULT_CLEAVAGE_OPTIONS, ...options };

    // Search for each polyadenylation signal
    for (const signal of opts.polyASignal!) {
        try {
            const pattern = new NucleotidePattern(signal);
            const matches = pattern.findMatches(rna);

            for (const match of matches) {
                const site = analyzePolyadenylationSite(
                    sequence,
                    match.start,
                    signal,
                    opts
                );
                if (site) {
                    sites.push(site);
                }
            }
        } catch (error) {
            // Invalid pattern, skip
            continue;
        }
    }

    // Sort by strength (highest first), then by position
    return sites.sort((a, b) => {
        if (a.strength !== b.strength) {
            return b.strength - a.strength;
        }
        return a.position - b.position;
    });
}

/**
 * Analyzes a potential polyadenylation site to determine its strength
 * and identify regulatory elements.
 */
function analyzePolyadenylationSite(
    sequence: string,
    position: number,
    signal: string,
    options: CleavageSiteOptions
): PolyadenylationSite | null {
    const baseStrength = getSignalStrength(signal);
    let totalStrength = baseStrength;

    // Analyze upstream USE elements
    const upstreamUSE = findUpstreamUSE(sequence, position, options.upstreamUSE);
    if (upstreamUSE) {
        totalStrength += 15; // Boost for USE presence
    }

    // Analyze downstream DSE elements
    const downstreamDSE = findDownstreamDSE(sequence, position + signal.length, options.downstreamDSE);
    if (downstreamDSE) {
        totalStrength += 10; // Boost for DSE presence
    }

    // Predict cleavage site
    const cleavageSite = predictCleavageSite(
        sequence,
        position + signal.length,
        options.distanceRange!,
        options.cleavagePreference!
    );

    // Minimum strength threshold
    if (totalStrength < 30) {
        return null;
    }

    return {
        position,
        signal,
        strength: Math.min(totalStrength, 100),
        upstreamUSE,
        downstreamDSE,
        cleavageSite
    };
}

/**
 * Gets the base strength score for a polyadenylation signal.
 */
function getSignalStrength(signal: string): number {
    switch (signal) {
        case 'AAUAAA': return 100; // Canonical signal
        case 'AUUAAA': return 80;  // Strong alternative
        case 'AGUAAA': return 30;  // Weak alternative
        case 'AAUAUA': return 25;  // Weak alternative
        case 'AAUACA': return 20;  // Weak alternative
        default: return 10;        // Unknown signal
    }
}

/**
 * Finds upstream sequence elements (USE) that enhance polyadenylation.
 */
function findUpstreamUSE(
    sequence: string,
    signalPosition: number,
    usePattern?: string
): GenomicRegion | undefined {
    if (!usePattern || signalPosition < 5) {
        return undefined;
    }

    // Search up to 50 bp upstream of signal, but at least 5 bp
    const searchLength = Math.min(50, signalPosition);
    const searchStart = signalPosition - searchLength;
    const searchRegion = sequence.substring(searchStart, signalPosition);

    try {
        // Look for U-rich regions or UGUA motifs
        const uRichPattern = new NucleotidePattern('U{3,}');
        const uguaPattern = new NucleotidePattern('UGUA');

        // Create temporary RNA object to use with pattern matching
        const searchRNA = new RNA(searchRegion);
        const uRichMatches = uRichPattern.findMatches(searchRNA);
        const uguaMatches = uguaPattern.findMatches(searchRNA);

        if (uRichMatches.length > 0 || uguaMatches.length > 0) {
            return {
                start: searchStart,
                end: signalPosition,
                name: 'USE'
            };
        }
    } catch (error) {
        // Pattern matching failed
    }

    return undefined;
}

/**
 * Finds downstream sequence elements (DSE) that enhance polyadenylation.
 */
function findDownstreamDSE(
    sequence: string,
    searchStart: number,
    dsePattern?: string
): GenomicRegion | undefined {
    if (!dsePattern || searchStart >= sequence.length - 5) {
        return undefined;
    }

    // Search up to 30 bp downstream of signal end, but at least 5 bp
    const searchLength = Math.min(30, sequence.length - searchStart);
    const searchEnd = searchStart + searchLength;
    const searchRegion = sequence.substring(searchStart, searchEnd);

    try {
        // Look for U-rich or GU-rich regions
        const uRichMatches = searchRegion.match(/U{3,}/g);
        const guRichMatches = searchRegion.match(/GU{2,}/g);

        if (uRichMatches || guRichMatches) {
            return {
                start: searchStart,
                end: searchEnd,
                name: 'DSE'
            };
        }
    } catch (error) {
        // Pattern matching failed
    }

    return undefined;
}

/**
 * Predicts the optimal cleavage site based on nucleotide preference
 * and distance from the polyadenylation signal.
 */
function predictCleavageSite(
    sequence: string,
    signalEnd: number,
    distanceRange: readonly [number, number],
    preference: readonly string[]
): number | undefined {
    const [minDist, maxDist] = distanceRange;
    const searchStart = signalEnd + minDist;
    const searchEnd = Math.min(sequence.length, signalEnd + maxDist);

    if (searchStart >= sequence.length) {
        return undefined;
    }

    let bestPosition = searchStart;
    let bestScore = -1;

    // Score positions based on nucleotide preference
    for (let pos = searchStart; pos < searchEnd; pos++) {
        const nucleotide = sequence[pos];
        const score = preference.indexOf(nucleotide);

        if (score !== -1 && (preference.length - score) > bestScore) {
            bestScore = preference.length - score;
            bestPosition = pos;
        }
    }

    return bestPosition;
}

/**
 * Gets the strongest polyadenylation site from a list of candidates.
 */
export function getStrongestPolyadenylationSite(
    sites: PolyadenylationSite[]
): PolyadenylationSite | undefined {
    if (sites.length === 0) {
        return undefined;
    }

    return sites.reduce((strongest, current) =>
        current.strength > strongest.strength ? current : strongest
    );
}

/**
 * Filters polyadenylation sites by minimum strength threshold.
 */
export function filterPolyadenylationSites(
    sites: PolyadenylationSite[],
    minStrength: number = 50
): PolyadenylationSite[] {
    return sites.filter(site => site.strength >= minStrength);
}