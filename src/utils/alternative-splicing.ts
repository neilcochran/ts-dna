import { PreMRNA } from '../model/nucleic-acids/PreMRNA';
import { RNA } from '../model/nucleic-acids/RNA';
import { DNA } from '../model/nucleic-acids/DNA';
import { Gene } from '../model/nucleic-acids/Gene';
import { RNASubType } from '../enums/rna-sub-type';
import { ValidationResult, success, failure } from '../types/validation-result';
import { convertToRNA, START_CODON, STOP_CODONS } from './nucleic-acids';
import { CODON_LENGTH } from '../constants/biological-constants';
import {
    SpliceVariant,
    SplicingOutcome,
    AlternativeSplicingOptions,
    DEFAULT_ALTERNATIVE_SPLICING_OPTIONS
} from '../types/alternative-splicing';

/**
 * Processes a pre-mRNA with a specific splice variant to produce mature mRNA.
 *
 * @param preMRNA - The pre-mRNA to process
 * @param variant - The splice variant specifying which exons to include
 * @param options - Optional configuration for splicing validation
 * @returns ValidationResult containing the mature RNA or error message
 *
 * @example
 * ```typescript
 * const variant = { name: 'variant-1', includedExons: [0, 2, 3] };
 * const result = spliceRNAWithVariant(preMRNA, variant);
 * if (result.success) {
 *     console.log(`Mature RNA: ${result.data.getSequence()}`);
 * }
 * ```
 */
export function spliceRNAWithVariant(
    preMRNA: PreMRNA,
    variant: SpliceVariant,
    options: AlternativeSplicingOptions = DEFAULT_ALTERNATIVE_SPLICING_OPTIONS
): ValidationResult<RNA> {
    const opts = { ...DEFAULT_ALTERNATIVE_SPLICING_OPTIONS, ...options };
    const sourceGene = preMRNA.getSourceGene();

    // Validate variant against gene structure
    const validation = validateSpliceVariant(variant, sourceGene, opts);
    if (!validation.success) {
        return failure(validation.error);
    }

    try {
        // Get the variant sequence from the gene
        const variantSequence = sourceGene.getVariantSequence(variant);

        // Convert DNA to RNA
        const variantDNA = new DNA(variantSequence);
        const matureRNA = convertToRNA(variantDNA, RNASubType.M_RNA);

        return success(matureRNA);
    } catch (error) {
        return failure(`Failed to process splice variant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Processes all splice variants defined for a gene to produce multiple mature mRNAs.
 *
 * @param preMRNA - The pre-mRNA to process
 * @param options - Optional configuration for splicing validation
 * @returns ValidationResult containing array of SplicingOutcome objects or error message
 *
 * @example
 * ```typescript
 * const result = processAllSplicingVariants(preMRNA);
 * if (result.success) {
 *     result.data.forEach(outcome => {
 *         console.log(`${outcome.getVariantName()}: ${outcome.getMRNALength()} bp`);
 *     });
 * }
 * ```
 */
export function processAllSplicingVariants(
    preMRNA: PreMRNA,
    options: AlternativeSplicingOptions = DEFAULT_ALTERNATIVE_SPLICING_OPTIONS
): ValidationResult<SplicingOutcome[]> {
    const sourceGene = preMRNA.getSourceGene();
    const splicingProfile = sourceGene.getSplicingProfile();

    if (!splicingProfile) {
        return failure('Gene does not have an alternative splicing profile');
    }

    const outcomes: SplicingOutcome[] = [];
    const errors: string[] = [];

    for (const variant of splicingProfile.variants) {
        const splicingResult = spliceRNAWithVariant(preMRNA, variant, options);

        if (splicingResult.success) {
            try {
                const matureRNA = splicingResult.data;
                const codingSequence = matureRNA.getSequence();
                const proteinLength = Math.floor(codingSequence.length / CODON_LENGTH);

                const outcome = new SplicingOutcome(
                    variant,
                    matureRNA,
                    codingSequence,
                    proteinLength
                );

                outcomes.push(outcome);
            } catch (error) {
                errors.push(`Failed to create outcome for variant '${variant.name}': ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } else {
            errors.push(`Failed to process variant '${variant.name}': ${splicingResult.error}`);
        }
    }

    if (errors.length > 0 && outcomes.length === 0) {
        return failure(`All splice variants failed: ${errors.join('; ')}`);
    }

    if (errors.length > 0) {
        // Some variants succeeded, some failed - could return partial success
        // For now, we'll include the errors in a warning but still return success
        console.warn(`Some splice variants failed: ${errors.join('; ')}`);
    }

    return success(outcomes);
}

/**
 * Validates a splice variant against a gene's structure and splicing options.
 *
 * @param variant - The splice variant to validate
 * @param gene - The gene to validate against
 * @param options - Splicing validation options
 * @returns ValidationResult indicating whether the variant is valid
 *
 * @example
 * ```typescript
 * const validation = validateSpliceVariant(variant, gene);
 * if (!validation.success) {
 *     console.error(`Invalid variant: ${validation.error}`);
 * }
 * ```
 */
export function validateSpliceVariant(
    variant: SpliceVariant,
    gene: Gene,
    options: AlternativeSplicingOptions = DEFAULT_ALTERNATIVE_SPLICING_OPTIONS
): ValidationResult<boolean> {
    const opts = { ...DEFAULT_ALTERNATIVE_SPLICING_OPTIONS, ...options };
    const exons = gene.getExons();

    // Check minimum exon requirement
    if (opts.requireMinimumExons && variant.includedExons.length < (opts.minimumExonCount ?? 1)) {
        return failure(`Variant '${variant.name}' includes ${variant.includedExons.length} exons, but minimum required is ${opts.minimumExonCount}`);
    }

    // Check exon indices are valid
    for (const exonIndex of variant.includedExons) {
        if (exonIndex < 0 || exonIndex >= exons.length) {
            return failure(`Variant '${variant.name}' references invalid exon index ${exonIndex}. Gene has ${exons.length} exons.`);
        }
    }

    // Check first/last exon restrictions
    if (!opts.allowSkipFirstExon && !variant.includedExons.includes(0)) {
        return failure(`Variant '${variant.name}' skips the first exon, which is not allowed`);
    }

    if (!opts.allowSkipLastExon && !variant.includedExons.includes(exons.length - 1)) {
        return failure(`Variant '${variant.name}' skips the last exon, which is not allowed`);
    }

    // Validate reading frame if required
    if (opts.validateReadingFrames) {
        try {
            const variantSequence = gene.getVariantSequence(variant);
            if (variantSequence.length % CODON_LENGTH !== 0) {
                return failure(
                    `Variant '${variant.name}' does not maintain reading frame: length ${variantSequence.length} is not divisible by 3`,
                );
            }
        } catch (error) {
            return failure(`Failed to validate reading frame for variant '${variant.name}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Validate start/stop codons if required
    if (opts.validateCodons) {
        try {
            const variantSequence = gene.getVariantSequence(variant);
            const variantDNA = new DNA(variantSequence);
            const rnaSequence = convertToRNA(variantDNA).getSequence();

            if (rnaSequence.length >= CODON_LENGTH) {
                const startCodon = rnaSequence.substring(0, CODON_LENGTH);
                if (startCodon !== START_CODON) {
                    return failure(
                        `Variant '${variant.name}' does not start with start codon ${START_CODON}, found '${startCodon}'`,
                    );
                }
            }

            if (rnaSequence.length >= CODON_LENGTH) {
                const lastCodon = rnaSequence.substring(rnaSequence.length - CODON_LENGTH);
                if (!STOP_CODONS.includes(lastCodon)) {
                    return failure(`Variant '${variant.name}' does not end with stop codon, found '${lastCodon}'`);
                }
            }
        } catch (error) {
            return failure(`Failed to validate codons for variant '${variant.name}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    return success(true);
}

/**
 * Gets the default splice variant for a gene and processes it to mature mRNA.
 *
 * @param preMRNA - The pre-mRNA to process
 * @param options - Optional configuration for splicing validation
 * @returns ValidationResult containing the mature RNA or error message
 *
 * @example
 * ```typescript
 * const result = processDefaultSpliceVariant(preMRNA);
 * if (result.success) {
 *     console.log(`Default variant RNA: ${result.data.getSequence()}`);
 * }
 * ```
 */
export function processDefaultSpliceVariant(
    preMRNA: PreMRNA,
    options: AlternativeSplicingOptions = DEFAULT_ALTERNATIVE_SPLICING_OPTIONS
): ValidationResult<RNA> {
    const sourceGene = preMRNA.getSourceGene();
    const defaultVariant = sourceGene.getDefaultSplicingVariant();

    if (!defaultVariant) {
        return failure('Gene does not have a default splice variant defined');
    }

    return spliceRNAWithVariant(preMRNA, defaultVariant, options);
}

/**
 * Finds all splice variants that produce proteins of a specific length range.
 *
 * @param preMRNA - The pre-mRNA to analyze
 * @param minLength - Minimum protein length in amino acids
 * @param maxLength - Maximum protein length in amino acids
 * @param options - Optional configuration for splicing validation
 * @returns ValidationResult containing array of matching SplicingOutcome objects
 *
 * @example
 * ```typescript
 * const result = findVariantsByProteinLength(preMRNA, 100, 200);
 * if (result.success) {
 *     console.log(`Found ${result.data.length} variants with proteins 100-200 amino acids`);
 * }
 * ```
 */
export function findVariantsByProteinLength(
    preMRNA: PreMRNA,
    minLength: number,
    maxLength: number,
    options: AlternativeSplicingOptions = DEFAULT_ALTERNATIVE_SPLICING_OPTIONS
): ValidationResult<SplicingOutcome[]> {
    const allVariantsResult = processAllSplicingVariants(preMRNA, options);

    if (!allVariantsResult.success) {
        return failure(allVariantsResult.error);
    }

    const matchingVariants = allVariantsResult.data.filter(outcome => {
        const proteinLength = outcome.getAminoAcidCount();
        return proteinLength >= minLength && proteinLength <= maxLength;
    });

    return success(matchingVariants);
}