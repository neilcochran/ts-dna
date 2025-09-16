import { RNA } from '../model/nucleic-acids/RNA';
import { PreMRNA } from '../model/nucleic-acids/PreMRNA';
import { Gene } from '../model/nucleic-acids/Gene';
import { GenomicRegion } from '../types/genomic-region';
import { ValidationResult, success, failure, isFailure } from '../types/validation-result';
import { START_CODON } from './nucleic-acids';

/**
 * Splices a pre-mRNA by removing introns and joining exons to produce mature mRNA.
 * This function performs the core splicing operation that removes introns
 * and joins exons while maintaining proper reading frame.
 */
export function spliceRNA(preMRNA: PreMRNA): ValidationResult<RNA> {
    try {
        const sourceGene = preMRNA.getSourceGene();
        const exonRegions = preMRNA.getExonRegions();
        const sequence = preMRNA.getSequence();

        // Validate that we have exons to work with
        if (exonRegions.length === 0) {
            return failure('Cannot splice RNA: no exons found in pre-mRNA');
        }

        // Validate splice sites before proceeding
        const spliceSiteValidation = validateAllSpliceSites(sourceGene, exonRegions);
        if (isFailure(spliceSiteValidation)) {
            return failure(`Splice site validation failed: ${spliceSiteValidation.error}`);
        }

        // Extract and join exon sequences
        const exonSequences: string[] = [];

        for (const exon of exonRegions) {
            if (exon.start < 0 || exon.end > sequence.length) {
                return failure(`Exon region ${exon.start}-${exon.end} is outside sequence bounds`);
            }

            const exonSequence = sequence.substring(exon.start, exon.end);
            exonSequences.push(exonSequence);
        }

        // Join all exons to create mature mRNA sequence
        const matureSequence = exonSequences.join('');

        // Create and return mature RNA
        const matureRNA = new RNA(matureSequence);
        return success(matureRNA);

    } catch (error) {
        return failure(`RNA splicing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Validates all splice sites in a gene to ensure proper splicing can occur.
 */
function validateAllSpliceSites(gene: Gene, exonRegions: GenomicRegion[]): ValidationResult<boolean> {
    if (exonRegions.length <= 1) {
        // Single exon genes don't need splice site validation
        return success(true);
    }

    const sequence = gene.getSequence();
    const introns = gene.getIntrons();

    for (let i = 0; i < introns.length; i++) {
        const intron = introns[i];

        // Check 5' splice site (donor) - should start with GT
        if (intron.start + 1 < sequence.length) {
            const donorSite = sequence.substring(intron.start, intron.start + 2);
            if (donorSite !== 'GT') {
                return failure(`Invalid 5' splice site at position ${intron.start}: expected GT, found ${donorSite}`);
            }
        }

        // Check 3' splice site (acceptor) - should end with AG
        if (intron.end >= 2) {
            const acceptorSite = sequence.substring(intron.end - 2, intron.end);
            if (acceptorSite !== 'AG') {
                return failure(`Invalid 3' splice site at position ${intron.end - 2}: expected AG, found ${acceptorSite}`);
            }
        }
    }

    return success(true);
}

/**
 * Checks if a spliced RNA maintains proper reading frame for translation.
 * This is important for ensuring the resulting protein will be correctly translated.
 */
export function validateReadingFrame(rna: RNA, expectedStart?: number): ValidationResult<boolean> {
    const sequence = rna.getSequence();
    const startPos = expectedStart ?? 0;

    // Check if sequence length from start position is divisible by 3
    const codingLength = sequence.length - startPos;
    if (codingLength % 3 !== 0) {
        return failure(`Reading frame error: coding sequence length ${codingLength} is not divisible by 3`);
    }

    // Check for start codon if position 0 is specified (beginning of complete coding sequence)
    if (expectedStart === 0) {
        if (startPos + 3 <= sequence.length) {
            const startCodon = sequence.substring(startPos, startPos + 3);
            if (startCodon !== START_CODON) {
                return failure(`Expected start codon ${START_CODON} at position ${startPos}, found ${startCodon}`);
            }
        }
    }

    return success(true);
}

