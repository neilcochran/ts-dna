import { DNA } from '../model/nucleic-acids/DNA';
import { Promoter } from '../model/Promoter';
import { PromoterElement } from '../model/PromoterElement';
import { STANDARD_PROMOTER_ELEMENTS, CORE_PROMOTER_ELEMENTS } from '../data/promoter-elements';

/**
 * Configuration options for promoter finding.
 */
export interface PromoterSearchOptions {
    /** Maximum distance upstream to search for promoter elements */
    maxUpstreamDistance?: number;

    /** Maximum distance downstream to search for promoter elements */
    maxDownstreamDistance?: number;

    /** Minimum number of elements required to constitute a promoter */
    minElements?: number;

    /** Custom set of promoter elements to search for */
    elements?: readonly PromoterElement[];

    /** Minimum promoter strength score to include in results */
    minStrengthScore?: number;
}

/**
 * Default search options for promoter recognition.
 */
const DEFAULT_SEARCH_OPTIONS: Required<PromoterSearchOptions> = {
    maxUpstreamDistance: 200,
    maxDownstreamDistance: 50,
    minElements: 1,
    elements: STANDARD_PROMOTER_ELEMENTS,
    minStrengthScore: 5
};

/**
 * Represents a potential promoter element match found in a sequence.
 */
interface ElementMatch {
    element: PromoterElement;
    position: number;
    sequence: string;
}

/**
 * Finds potential promoters in a DNA sequence by identifying promoter elements.
 *
 * @param dna - The DNA sequence to search
 * @param options - Configuration options for the search
 * @returns Array of potential Promoter objects found in the sequence
 *
 * @example
 * ```typescript
 * const dna = new DNA('GGCCAATCTATAATGCATGCCC...');
 * const promoters = findPromoters(dna);
 * console.log(`Found ${promoters.length} potential promoters`);
 * ```
 */
export function findPromoters(dna: DNA, options: PromoterSearchOptions = {}): Promoter[] {
    const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options };
    const sequence = dna.getSequence();
    const promoters: Promoter[] = [];

    // Find all element matches in the sequence
    const elementMatches = findAllElementMatches(sequence, opts.elements);

    // Group elements into potential promoters
    const promoterCandidates = groupElementsIntoPromoters(elementMatches, opts);

    // Convert candidates to Promoter objects and filter by strength
    for (const candidate of promoterCandidates) {
        const promoter = new Promoter(
            candidate.tss,
            candidate.elements.map(match => match.element),
            `promoter_${candidate.tss}`
        );

        if (promoter.getStrengthScore() >= opts.minStrengthScore) {
            promoters.push(promoter);
        }
    }

    return promoters.sort((a, b) => b.getStrengthScore() - a.getStrengthScore());
}

/**
 * Identifies potential transcription start sites (TSS) based on promoter elements.
 *
 * @param promoter - The promoter to analyze
 * @param sequence - The DNA sequence containing the promoter
 * @returns Array of potential TSS positions
 *
 * @example
 * ```typescript
 * const tssPositions = identifyTSS(promoter, dna);
 * console.log(`Potential TSS at positions: ${tssPositions.join(', ')}`);
 * ```
 */
export function identifyTSS(promoter: Promoter, sequence: DNA): number[] {
    const tssPositions: number[] = [];
    const seq = sequence.getSequence();

    // If promoter has an Initiator element, TSS is at the Inr position
    const initiators = promoter.getElementsByName('Inr');
    if (initiators.length > 0) {
        for (const inr of initiators) {
            const tssPos = promoter.getElementPosition(inr);
            if (tssPos >= 0 && tssPos < seq.length) {
                tssPositions.push(tssPos);
            }
        }
        return tssPositions;
    }

    // If promoter has TATA box, predict TSS downstream
    const tataBoxes = promoter.getElementsByName('TATA');
    if (tataBoxes.length > 0) {
        for (const tata of tataBoxes) {
            const tataPos = promoter.getElementPosition(tata);
            // TSS is typically 25bp downstream of TATA box (TATA is at -25, so TSS = TATA + 25)
            const predictedTSS = tataPos - tata.position; // Remove the relative offset to get actual TSS
            if (predictedTSS >= 0 && predictedTSS < seq.length) {
                tssPositions.push(predictedTSS);
            }
        }
        return tssPositions;
    }

    // For other elements, use the provided TSS
    tssPositions.push(promoter.transcriptionStartSite);
    return tssPositions;
}

/**
 * Finds all matches of promoter elements in a DNA sequence.
 * @param sequence - DNA sequence to search
 * @param elements - Promoter elements to search for
 * @returns Array of element matches with positions
 */
function findAllElementMatches(sequence: string, elements: readonly PromoterElement[]): ElementMatch[] {
    const matches: ElementMatch[] = [];
    const dna = new DNA(sequence);

    for (const element of elements) {
        const pattern = element.pattern;
        const patternMatches = pattern.findMatches(dna);

        for (const match of patternMatches) {
            matches.push({
                element,
                position: match.start,
                sequence: match.match
            });
        }
    }

    return matches;
}

/**
 * Groups element matches into potential promoters based on proximity.
 */
function groupElementsIntoPromoters(
    matches: ElementMatch[],
    options: Required<PromoterSearchOptions>
): Array<{ tss: number; elements: ElementMatch[] }> {
    const promoterCandidates: Array<{ tss: number; elements: ElementMatch[] }> = [];

    // Sort matches by position
    const sortedMatches = [...matches].sort((a, b) => a.position - b.position);

    // Find core promoter elements that can anchor a promoter
    // Only biologically validated core elements can anchor promoters
    const coreMatches = sortedMatches.filter(match =>
        CORE_PROMOTER_ELEMENTS.some(core => core.name === match.element.name)
    );

    for (const coreMatch of coreMatches) {
        let predictedTSS: number;

        // Predict TSS based on core element type
        if (coreMatch.element.name === 'Inr') {
            predictedTSS = coreMatch.position;
        } else if (coreMatch.element.name === 'TATA') {
            predictedTSS = coreMatch.position + 25; // TATA is typically 25bp upstream
        } else if (coreMatch.element.name === 'DPE') {
            predictedTSS = coreMatch.position - 30; // DPE is typically 30bp downstream
        } else {
            predictedTSS = coreMatch.position;
        }

        // Find all elements within range of this predicted TSS
        const associatedElements: ElementMatch[] = [];

        for (const match of sortedMatches) {
            const relativePosition = match.position - predictedTSS;

            // Check if element is within acceptable range
            if (relativePosition >= -options.maxUpstreamDistance &&
                relativePosition <= options.maxDownstreamDistance) {
                associatedElements.push(match);
            }
        }

        // Only create promoter if minimum elements threshold is met
        if (associatedElements.length >= options.minElements) {
            promoterCandidates.push({
                tss: predictedTSS,
                elements: associatedElements
            });
        }
    }

    // Remove duplicate promoters (same TSS within 10bp)
    return removeDuplicatePromoters(promoterCandidates);
}

/**
 * Removes duplicate promoter candidates that have TSS positions within 10bp of each other.
 * Keeps the candidate with more elements.
 */
function removeDuplicatePromoters(
    candidates: Array<{ tss: number; elements: ElementMatch[] }>
): Array<{ tss: number; elements: ElementMatch[] }> {
    const filtered: Array<{ tss: number; elements: ElementMatch[] }> = [];

    for (const candidate of candidates) {
        const isDuplicate = filtered.some(existing =>
            Math.abs(existing.tss - candidate.tss) <= 10
        );

        if (!isDuplicate) {
            filtered.push(candidate);
        } else {
            // Replace if this candidate has more elements
            const existingIndex = filtered.findIndex(existing =>
                Math.abs(existing.tss - candidate.tss) <= 10
            );

            if (candidate.elements.length > filtered[existingIndex].elements.length) {
                filtered[existingIndex] = candidate;
            }
        }
    }

    return filtered;
}