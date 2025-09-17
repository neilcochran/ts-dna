import { RNA } from '../model/nucleic-acids/RNA';
import { NucleotidePattern } from '../model/nucleic-acids/NucleotidePattern';
import { PolyadenylationSite, CleavageSiteOptions, DEFAULT_CLEAVAGE_OPTIONS } from '../types/polyadenylation-site';
import { GenomicRegion } from '../types/genomic-region';

/**
 * Finds polyadenylation sites in an RNA sequence with enhanced analysis
 * of signal strength, regulatory elements, and biological constraints.
 */
export function findPolyadenylationSites(
    rna: RNA,
    options: CleavageSiteOptions = DEFAULT_CLEAVAGE_OPTIONS
): PolyadenylationSite[] {
    const sequence = rna.getSequence();

    // Minimum sequence length for meaningful analysis (signal + distance + context)
    if (sequence.length < 20) {
        return [];
    }

    const sites: PolyadenylationSite[] = [];
    const opts = { ...DEFAULT_CLEAVAGE_OPTIONS, ...options };

    // Search for each polyadenylation signal with enhanced analysis
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
 * Returns the polyadenylation site with the highest strength score.
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

/**
 * Analyzes polyadenylation sites with detailed USE/DSE scoring
 * and biological constraint validation.
 */
function analyzePolyadenylationSite(
    sequence: string,
    position: number,
    signal: string,
    options: CleavageSiteOptions
): PolyadenylationSite | null {
    // Get base signal strength
    const baseStrength = getSignalStrength(signal);
    let totalStrength = baseStrength;

    // Upstream USE element analysis
    const upstreamUSE = findUpstreamUSE(sequence, position);
    if (upstreamUSE) {
        const useQuality = analyzeUSEQuality(sequence, upstreamUSE);
        totalStrength += Math.round(useQuality * 30); // Up to 30 point boost
    }

    // Downstream DSE element analysis
    const downstreamDSE = findDownstreamDSE(sequence, position + signal.length);
    if (downstreamDSE) {
        const dseQuality = analyzeDSEQuality(sequence, downstreamDSE);
        totalStrength += Math.round(dseQuality * 20); // Up to 20 point boost
    }

    // Predict cleavage site with context scoring
    const cleavageSite = predictCleavageSite(
        sequence,
        position + signal.length,
        [...options.distanceRange!] as [number, number],
        [...options.cleavagePreference!]
    );

    // Validate biological constraints
    if (!validateCleavageSiteConstraints(sequence, position, cleavageSite, options)) {
        return null;
    }

    // Apply strength threshold
    if (totalStrength < 25) {
        return null;
    }

    return {
        position,
        signal,
        strength: Math.min(totalStrength, 150), // Allow boost above 100 for USE/DSE
        upstreamUSE,
        downstreamDSE,
        cleavageSite
    };
}

/**
 * Signal strength calculation with biological scoring.
 */
function getSignalStrength(signal: string): number {
    switch (signal) {
        case 'AAUAAA': return 100; // Canonical signal - strongest
        case 'AUUAAA': return 80;  // Most common variant
        case 'AGUAAA': return 30;  // Weaker but functional
        case 'AAUAUA': return 25;  // Less efficient
        case 'AAUACA': return 20;  // Weak but documented
        case 'CAUAAA': return 18;  // Rare variant
        case 'GAUAAA': return 15;  // Very rare
        case 'AAAAAG': return 12;  // Alternative pathway
        case 'AAAACA': return 10;  // Very weak
        default: return 8;         // Other potential signals
    }
}

/**
 * Upstream USE element detection with multiple motif patterns.
 */
function findUpstreamUSE(
    sequence: string,
    position: number
): GenomicRegion | undefined {
    const searchStart = Math.max(0, position - 60);
    const searchEnd = position; // Search right up to signal

    if (searchEnd <= searchStart) return undefined;

    const searchRegion = sequence.substring(searchStart, searchEnd);
    const rnaRegion = searchRegion.replace(/T/g, 'U');

    // USE patterns with priority scoring
    const usePatterns = [
        { pattern: 'UGUA', priority: 3, name: 'USE' },      // UGUA motif
        { pattern: 'U[CU]U', priority: 2, name: 'USE' },   // UYU motif
        { pattern: 'UUU[UG]', priority: 2, name: 'USE' },  // U-rich clusters
        { pattern: 'U{4,}', priority: 1, name: 'USE' }     // Simple U-rich
    ];

    let bestMatch: { start: number; end: number; priority: number; name: string } | undefined;

    for (const { pattern, priority, name } of usePatterns) {
        try {
            const nucleotidePattern = new NucleotidePattern(pattern);
            const matches = nucleotidePattern.findMatchesString(rnaRegion);

            for (const match of matches) {
                if (!bestMatch || priority > bestMatch.priority) {
                    bestMatch = {
                        start: searchStart + match.start,
                        end: searchStart + match.end,
                        priority,
                        name
                    };
                }
            }
        } catch (error) {
            // Invalid pattern, skip
            continue;
        }
    }

    return bestMatch ? {
        start: bestMatch.start,
        end: bestMatch.end,
        name: bestMatch.name
    } : undefined;
}

/**
 * Downstream DSE element detection with GU-rich and U-rich patterns.
 */
function findDownstreamDSE(
    sequence: string,
    position: number
): GenomicRegion | undefined {
    const searchStart = position; // Start immediately after signal
    const searchEnd = Math.min(sequence.length, position + 80);

    if (searchEnd <= searchStart) return undefined;

    const searchRegion = sequence.substring(searchStart, searchEnd);
    const rnaRegion = searchRegion.replace(/T/g, 'U');

    // DSE patterns
    const dsePatterns = [
        { pattern: 'GU{2,}[ACGU]{0,3}U{2,}', priority: 3, name: 'DSE' }, // GU/U-rich combo
        { pattern: 'GU{3,}', priority: 2, name: 'DSE' },                  // GU-rich
        { pattern: 'U{4,}G', priority: 2, name: 'DSE' },                  // U-rich with G
        { pattern: 'U{5,}', priority: 1, name: 'DSE' }                    // Simple U-rich
    ];

    let bestMatch: { start: number; end: number; priority: number; name: string } | undefined;

    for (const { pattern, priority, name } of dsePatterns) {
        try {
            const nucleotidePattern = new NucleotidePattern(pattern);
            const matches = nucleotidePattern.findMatchesString(rnaRegion);

            for (const match of matches) {
                if (!bestMatch || priority > bestMatch.priority) {
                    bestMatch = {
                        start: searchStart + match.start,
                        end: searchStart + match.end,
                        priority,
                        name
                    };
                }
            }
        } catch (error) {
            // Invalid pattern, skip
            continue;
        }
    }

    return bestMatch ? {
        start: bestMatch.start,
        end: bestMatch.end,
        name: bestMatch.name
    } : undefined;
}

/**
 * Analyzes the quality of a USE element based on its sequence content.
 */
function analyzeUSEQuality(sequence: string, useRegion: GenomicRegion): number {
    const useSequence = sequence.substring(useRegion.start, useRegion.end).replace(/T/g, 'U');

    let score = 0.3; // Base score

    // UGUA motif gets highest score
    if (useSequence.includes('UGUA')) score = 1.0;
    // UYU motifs get high score
    else if (new NucleotidePattern('U[CU]U').testString(useSequence)) score = 0.8;
    // High U content gets medium score
    else if ((useSequence.match(/U/g) || []).length / useSequence.length > 0.7) score = 0.6;

    return Math.min(score, 1.0);
}

/**
 * Analyzes the quality of a DSE element based on its sequence content.
 */
function analyzeDSEQuality(sequence: string, dseRegion: GenomicRegion): number {
    const dseSequence = sequence.substring(dseRegion.start, dseRegion.end).replace(/T/g, 'U');

    let score = 0.3; // Base score

    // GU-rich regions with U clusters get highest score
    if (new NucleotidePattern('GU{2,}.*U{2,}').testString(dseSequence)) score = 1.0;
    // Simple GU-rich gets high score
    else if (new NucleotidePattern('GU{3,}').testString(dseSequence)) score = 0.8;
    // U-rich gets medium score
    else if ((dseSequence.match(/U/g) || []).length / dseSequence.length > 0.6) score = 0.6;

    return Math.min(score, 1.0);
}

/**
 * Cleavage site prediction with context-aware scoring.
 */
function predictCleavageSite(
    sequence: string,
    startPosition: number,
    distanceRange: [number, number],
    preferences: string[]
): number | undefined {
    const [minDistance, maxDistance] = distanceRange;
    const searchStart = startPosition + minDistance;
    const searchEnd = Math.min(sequence.length, startPosition + maxDistance);

    let bestPosition = undefined;
    let bestScore = -1;

    for (let pos = searchStart; pos < searchEnd; pos++) {
        if (pos >= sequence.length) break;

        const nucleotide = sequence[pos].toUpperCase().replace('T', 'U');
        const preferenceIndex = preferences.indexOf(nucleotide);

        if (preferenceIndex !== -1) {
            // Base score from nucleotide preference
            let score = preferences.length - preferenceIndex;

            // Context scoring: avoid problematic sequences
            const context = sequence.substring(Math.max(0, pos - 2), Math.min(sequence.length, pos + 3));

            // Penalize poly-G regions (difficult to cleave)
            if (new NucleotidePattern('G{3,}').testString(context)) {
                score *= 0.3;
            }
            // Favor A/U rich context
            else if (new NucleotidePattern('[AU]{2,}').testString(context.replace(/T/g, 'U'))) {
                score *= 1.2;
            }

            if (score > bestScore) {
                bestScore = score;
                bestPosition = pos;
            }
        }
    }

    return bestPosition;
}

/**
 * Validates biological constraints for cleavage sites.
 */
function validateCleavageSiteConstraints(
    sequence: string,
    signalPosition: number,
    cleavagePosition: number | undefined,
    options: CleavageSiteOptions
): boolean {
    // Must have a valid cleavage site
    if (cleavagePosition === undefined) {
        return false;
    }

    // Check distance constraints
    const distance = cleavagePosition - (signalPosition + options.polyASignal![0].length);
    const [minDist, maxDist] = options.distanceRange!;

    if (distance < minDist || distance > maxDist) {
        return false;
    }

    // Avoid cleavage in problematic regions
    const context = sequence.substring(
        Math.max(0, cleavagePosition - 3),
        Math.min(sequence.length, cleavagePosition + 3)
    );

    // Reject if cleavage site is in a poly-G region (>= 4 consecutive Gs)
    if (new NucleotidePattern('G{4,}').testString(context)) {
        return false;
    }

    return true;
}