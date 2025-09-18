import { RNA } from '../model/nucleic-acids/RNA';
import { NucleotidePattern } from '../model/nucleic-acids/NucleotidePattern';
import {
    PolyadenylationSite,
    CleavageSiteOptions,
    DEFAULT_CLEAVAGE_OPTIONS,
} from '../types/polyadenylation-site';
import {
    POLYA_SIGNALS,
    DEFAULT_POLYA_SIGNAL_STRENGTH,
    MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH,
    USE_ELEMENT_MAX_BOOST,
    DSE_ELEMENT_MAX_BOOST,
    BASE_POLYA_SCORE,
    HIGH_U_CONTENT_THRESHOLD,
    MODERATE_U_CONTENT_THRESHOLD,
    MODERATE_USE_SCORE,
    HIGH_DSE_SCORE,
    INHIBITORY_G_RUN_PENALTY,
    AU_RICH_CONTEXT_BOOST,
    PERFECT_USE_SCORE,
    HIGH_USE_SCORE,
    PERFECT_DSE_SCORE,
    MIN_POLYA_SITE_STRENGTH,
} from '../constants/biological-constants';
import { GenomicRegion } from '../types/genomic-region';

/**
 * Finds polyadenylation sites in an RNA sequence with enhanced analysis
 * of signal strength, regulatory elements, and biological constraints.
 */
export function findPolyadenylationSites(
    rna: RNA,
    options: CleavageSiteOptions = DEFAULT_CLEAVAGE_OPTIONS,
): PolyadenylationSite[] {
    const sequence = rna.getSequence();

    // Minimum sequence length for meaningful analysis (signal + distance + context)
    if (sequence.length < MIN_RNA_SEQUENCE_FOR_POLYA_SEARCH) {
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
                const site = analyzePolyadenylationSite(sequence, match.start, signal, opts);
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
    sites: PolyadenylationSite[],
): PolyadenylationSite | undefined {
    if (sites.length === 0) {
        return undefined;
    }

    return sites.reduce((strongest, current) =>
        current.strength > strongest.strength ? current : strongest,
    );
}

/**
 * Filters polyadenylation sites by minimum strength threshold.
 */
export function filterPolyadenylationSites(
    sites: PolyadenylationSite[],
    minStrength: number = 50,
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
    options: CleavageSiteOptions,
): PolyadenylationSite | null {
    // Get base signal strength
    const baseStrength = getSignalStrength(signal);
    let totalStrength = baseStrength;

    // Upstream USE element analysis
    const upstreamUSE = findUpstreamUSE(sequence, position);
    if (upstreamUSE) {
        const useQuality = analyzeUSEQuality(sequence, upstreamUSE);
        totalStrength += Math.round(useQuality * USE_ELEMENT_MAX_BOOST); // Up to 30 point boost
    }

    // Downstream DSE element analysis
    const downstreamDSE = findDownstreamDSE(sequence, position + signal.length);
    if (downstreamDSE) {
        const dseQuality = analyzeDSEQuality(sequence, downstreamDSE);
        totalStrength += Math.round(dseQuality * DSE_ELEMENT_MAX_BOOST); // Up to 20 point boost
    }

    // Predict cleavage site with context scoring
    const cleavageSite = predictCleavageSite(
        sequence,
        position + signal.length,
    [...options.distanceRange!] as [number, number],
    [...options.cleavagePreference!],
    );

    // Validate biological constraints
    if (!validateCleavageSiteConstraints(sequence, position, cleavageSite, options)) {
        return null;
    }

    // Apply strength threshold
    if (totalStrength < MIN_POLYA_SITE_STRENGTH) {
        return null;
    }

    return {
        position,
        signal,
        strength: Math.min(totalStrength, 150), // Allow boost above 100 for USE/DSE
        upstreamUSE,
        downstreamDSE,
        cleavageSite,
    };
}

/**
 * Signal strength calculation with biological scoring.
 */
function getSignalStrength(signal: string): number {
    return POLYA_SIGNALS[signal as keyof typeof POLYA_SIGNALS] ?? DEFAULT_POLYA_SIGNAL_STRENGTH;
}

/**
 * Upstream USE element detection with multiple motif patterns.
 */
function findUpstreamUSE(sequence: string, position: number): GenomicRegion | undefined {
    const searchStart = Math.max(0, position - 60);
    const searchEnd = position; // Search right up to signal

    if (searchEnd <= searchStart) {
        return undefined;
    }

    const searchRegion = sequence.substring(searchStart, searchEnd);
    const rnaRegion = searchRegion.replace(/T/g, 'U');

    // USE patterns with priority scoring
    const usePatterns = [
        { pattern: 'UGUA', priority: 3, name: 'USE' }, // UGUA motif
        { pattern: 'U[CU]U', priority: 2, name: 'USE' }, // UYU motif
        { pattern: 'UUU[UG]', priority: 2, name: 'USE' }, // U-rich clusters
        { pattern: 'U{4,}', priority: 1, name: 'USE' }, // Simple U-rich
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
                        name,
                    };
                }
            }
        } catch (error) {
            // Invalid pattern, skip
            continue;
        }
    }

    return bestMatch
        ? {
            start: bestMatch.start,
            end: bestMatch.end,
            name: bestMatch.name,
        }
        : undefined;
}

/**
 * Downstream DSE element detection with GU-rich and U-rich patterns.
 */
function findDownstreamDSE(sequence: string, position: number): GenomicRegion | undefined {
    const searchStart = position; // Start immediately after signal
    const searchEnd = Math.min(sequence.length, position + 80);

    if (searchEnd <= searchStart) {
        return undefined;
    }

    const searchRegion = sequence.substring(searchStart, searchEnd);
    const rnaRegion = searchRegion.replace(/T/g, 'U');

    // DSE patterns
    const dsePatterns = [
        { pattern: 'GU{2,}[ACGU]{0,3}U{2,}', priority: 3, name: 'DSE' }, // GU/U-rich combo
        { pattern: 'GU{3,}', priority: 2, name: 'DSE' }, // GU-rich
        { pattern: 'U{4,}G', priority: 2, name: 'DSE' }, // U-rich with G
        { pattern: 'U{5,}', priority: 1, name: 'DSE' }, // Simple U-rich
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
                        name,
                    };
                }
            }
        } catch (error) {
            // Invalid pattern, skip
            continue;
        }
    }

    return bestMatch
        ? {
            start: bestMatch.start,
            end: bestMatch.end,
            name: bestMatch.name,
        }
        : undefined;
}

/**
 * Analyzes the quality of a USE element based on its sequence content.
 */
function analyzeUSEQuality(sequence: string, useRegion: GenomicRegion): number {
    const useSequence = sequence.substring(useRegion.start, useRegion.end).replace(/T/g, 'U');

    let score = BASE_POLYA_SCORE; // Base score

    // UGUA motif gets highest score
    if (useSequence.includes('UGUA')) {
        score = PERFECT_USE_SCORE;
    }
    // UYU motifs get high score
    else if (new NucleotidePattern('U[CU]U').testString(useSequence)) score = HIGH_USE_SCORE;
    // High U content gets medium score
    else if ((useSequence.match(/U/g) || []).length / useSequence.length > HIGH_U_CONTENT_THRESHOLD)
        score = MODERATE_USE_SCORE;

    return Math.min(score, PERFECT_USE_SCORE);
}

/**
 * Analyzes the quality of a DSE element based on its sequence content.
 */
function analyzeDSEQuality(sequence: string, dseRegion: GenomicRegion): number {
    const dseSequence = sequence.substring(dseRegion.start, dseRegion.end).replace(/T/g, 'U');

    let score = BASE_POLYA_SCORE; // Base score

    // GU-rich regions with U clusters get highest score
    if (new NucleotidePattern('GU{2,}.*U{2,}').testString(dseSequence)) {
        score = PERFECT_DSE_SCORE;
    }
    // Simple GU-rich gets high score
    else if (new NucleotidePattern('GU{3,}').testString(dseSequence)) {
        score = HIGH_DSE_SCORE;
    }
    // U-rich gets medium score
    else if (
        (dseSequence.match(/U/g) || []).length / dseSequence.length >
    MODERATE_U_CONTENT_THRESHOLD
    ) {
        score = MODERATE_USE_SCORE;
    }

    return Math.min(score, PERFECT_USE_SCORE);
}

/**
 * Cleavage site prediction with context-aware scoring.
 */
function predictCleavageSite(
    sequence: string,
    startPosition: number,
    distanceRange: [number, number],
    preferences: string[],
): number | undefined {
    const [minDistance, maxDistance] = distanceRange;
    const searchStart = startPosition + minDistance;
    const searchEnd = Math.min(sequence.length, startPosition + maxDistance);

    let bestPosition = undefined;
    let bestScore = -1;

    for (let pos = searchStart; pos < searchEnd; pos++) {
        if (pos >= sequence.length) {
            break;
        }

        const nucleotide = sequence[pos].toUpperCase().replace('T', 'U');
        const preferenceIndex = preferences.indexOf(nucleotide);

        if (preferenceIndex !== -1) {
            // Base score from nucleotide preference
            let score = preferences.length - preferenceIndex;

            // Context scoring: avoid problematic sequences
            const context = sequence.substring(Math.max(0, pos - 2), Math.min(sequence.length, pos + 3));

            // Penalize poly-G regions (difficult to cleave)
            if (new NucleotidePattern('G{3,}').testString(context)) {
                score *= INHIBITORY_G_RUN_PENALTY;
            }
            // Favor A/U rich context
            else if (new NucleotidePattern('[AU]{2,}').testString(context.replace(/T/g, 'U'))) {
                score *= AU_RICH_CONTEXT_BOOST;
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
    options: CleavageSiteOptions,
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
        Math.min(sequence.length, cleavagePosition + 3),
    );

    // Reject if cleavage site is in a poly-G region (>= 4 consecutive Gs)
    if (new NucleotidePattern('G{4,}').testString(context)) {
        return false;
    }

    return true;
}
