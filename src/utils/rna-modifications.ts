import { RNA } from '../model/nucleic-acids/RNA';
import { RNASubType } from '../enums/rna-sub-type';
import { PolyadenylationSite } from '../types/polyadenylation-site';
import { ValidationResult, success, failure } from '../types/validation-result';

/**
 * Adds a 5' cap structure to an RNA molecule.
 * The 5' cap (7-methylguanosine) is essential for mRNA stability,
 * nuclear export, and ribosome binding during translation.
 */
export function add5PrimeCap(rna: RNA): RNA {
    const sequence = rna.getSequence();

    // Add symbolic representation of 5' cap
    // In reality, this is a 7-methylguanosine linked via 5'-5' triphosphate
    // We represent it as a special prefix to maintain string-based sequence handling
    const cappedSequence = `5CAP_${sequence}`;

    // Create new RNA with capped sequence
    // Note: We maintain the same subtype as the input RNA
    return new RNA(cappedSequence, rna.rnaSubType);
}

/**
 * Adds a 3' poly-A tail to an RNA molecule at the specified cleavage site.
 * The poly-A tail enhances mRNA stability, nuclear export, and translation efficiency.
 */
export function add3PrimePolyATail(
    rna: RNA,
    cleavageSite: number,
    tailLength: number = 200
): ValidationResult<RNA> {
    try {
        const sequence = rna.getSequence();

        // Validate cleavage site
        if (cleavageSite < 0 || cleavageSite > sequence.length) {
            return failure(`Invalid cleavage site ${cleavageSite}: must be between 0 and ${sequence.length}`);
        }

        // Validate tail length
        if (tailLength < 0 || tailLength > 1000) {
            return failure(`Invalid poly-A tail length ${tailLength}: must be between 0 and 1000`);
        }

        // Create poly-A tail
        const polyATail = 'A'.repeat(tailLength);

        // Insert poly-A tail at cleavage site
        const processedSequence = sequence.substring(0, cleavageSite) + polyATail;

        // Create new RNA with poly-A tail
        const processedRNA = new RNA(processedSequence, rna.rnaSubType);
        return success(processedRNA);

    } catch (error) {
        return failure(`Failed to add poly-A tail: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Adds a 3' poly-A tail using polyadenylation site information.
 * This is the preferred method when polyadenylation sites have been identified.
 */
export function add3PrimePolyATailAtSite(
    rna: RNA,
    polySite: PolyadenylationSite,
    tailLength: number = 200
): ValidationResult<RNA> {
    const cleavageSite = polySite.cleavageSite ?? (polySite.position + polySite.signal.length + 15);
    return add3PrimePolyATail(rna, cleavageSite, tailLength);
}

/**
 * Removes the 3' poly-A tail from an RNA sequence.
 * This can be useful for analysis or simulating deadenylation.
 */
export function remove3PrimePolyATail(rna: RNA): ValidationResult<RNA> {
    try {
        let sequence = rna.getSequence();

        // Remove trailing A's (poly-A tail)
        const originalLength = sequence.length;
        sequence = sequence.replace(/A+$/, '');

        if (sequence.length === originalLength) {
            return failure('No poly-A tail found to remove');
        }

        const processedRNA = new RNA(sequence, rna.rnaSubType);
        return success(processedRNA);

    } catch (error) {
        return failure(`Failed to remove poly-A tail: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Removes the 5' cap from an RNA sequence.
 */
export function remove5PrimeCap(rna: RNA): ValidationResult<RNA> {
    try {
        let sequence = rna.getSequence();

        // Remove 5' cap prefix if present
        if (sequence.startsWith('5CAP_')) {
            sequence = sequence.substring(5);
            const processedRNA = new RNA(sequence, rna.rnaSubType);
            return success(processedRNA);
        }

        return failure('No 5\' cap found to remove');

    } catch (error) {
        return failure(`Failed to remove 5' cap: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Checks if an RNA molecule has a 5' cap structure.
 */
export function has5PrimeCap(rna: RNA): boolean {
    return rna.getSequence().startsWith('5CAP_');
}

/**
 * Checks if an RNA molecule has a 3' poly-A tail.
 * This is a basic check that looks for at least 10 consecutive A's at the 3' end.
 */
export function has3PrimePolyATail(rna: RNA, minLength: number = 10): boolean {
    const sequence = rna.getSequence();
    const pattern = new RegExp(`A{${minLength},}$`);
    return pattern.test(sequence);
}

/**
 * Gets the length of the 3' poly-A tail.
 */
export function get3PrimePolyATailLength(rna: RNA): number {
    const sequence = rna.getSequence();
    const match = sequence.match(/A+$/);
    return match ? match[0].length : 0;
}

/**
 * Gets the core sequence without 5' cap and 3' poly-A tail.
 * This returns the essential mRNA sequence for analysis.
 */
export function getCoreSequence(rna: RNA): string {
    let sequence = rna.getSequence();

    // Remove 5' cap if present
    if (sequence.startsWith('5CAP_')) {
        sequence = sequence.substring(5);
    }

    // Remove poly-A tail if present
    sequence = sequence.replace(/A+$/, '');

    return sequence;
}

/**
 * Checks if an RNA molecule is fully processed (has both 5' cap and 3' poly-A tail).
 */
export function isFullyProcessed(rna: RNA): boolean {
    return has5PrimeCap(rna) && has3PrimePolyATail(rna);
}

/**
 * Information about RNA processing modifications.
 */
export interface RNAProcessingInfo {
    readonly hasFivePrimeCap: boolean;
    readonly hasThreePrimePolyA: boolean;
    readonly polyATailLength: number;
    readonly coreSequenceLength: number;
    readonly isFullyProcessed: boolean;
}

/**
 * Analyzes the processing state of an RNA molecule.
 */
export function analyzeRNAProcessing(rna: RNA): RNAProcessingInfo {
    const hasFivePrimeCap = has5PrimeCap(rna);
    const hasThreePrimePolyA = has3PrimePolyATail(rna);
    const polyATailLength = get3PrimePolyATailLength(rna);
    const coreSequence = getCoreSequence(rna);
    const coreSequenceLength = coreSequence.length;
    const fullyProcessed = isFullyProcessed(rna);

    return {
        hasFivePrimeCap,
        hasThreePrimePolyA,
        polyATailLength,
        coreSequenceLength,
        isFullyProcessed: fullyProcessed
    };
}