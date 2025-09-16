import { RNA } from '../model/nucleic-acids/RNA';

/**
 * Represents a specific splice variant with information about which exons to include.
 */
export interface SpliceVariant {
    /** Unique name for this variant (e.g., "variant-1", "cardiac-specific") */
    readonly name: string;

    /** 0-based exon indices to include in this variant */
    readonly includedExons: readonly number[];

    /** Optional biological context or description */
    readonly description?: string;
}

/**
 * Defines the complete alternative splicing profile for a gene,
 * including all possible variants and the default canonical form.
 */
export interface AlternativeSplicingProfile {
    /** Gene identifier that this splicing profile applies to */
    readonly geneId: string;

    /** All available splice variants for this gene */
    readonly variants: readonly SpliceVariant[];

    /** Name of the variant considered the "canonical" or default form */
    readonly defaultVariant: string;
}

/**
 * Represents the outcome of processing a specific splice variant,
 * containing the resulting mRNA and associated metadata.
 */
export class SplicingOutcome {
    constructor(
        public readonly variant: SpliceVariant,
        public readonly matureMRNA: RNA,
        public readonly codingSequence: string,
        public readonly proteinLength: number
    ) {}

    /**
     * Gets the name of this splice variant.
     */
    getVariantName(): string {
        return this.variant.name;
    }

    /**
     * Gets the description of this splice variant.
     */
    getVariantDescription(): string | undefined {
        return this.variant.description;
    }

    /**
     * Gets the exon indices included in this variant.
     */
    getIncludedExons(): readonly number[] {
        return this.variant.includedExons;
    }

    /**
     * Gets the length of the coding sequence in nucleotides.
     */
    getCodingSequenceLength(): number {
        return this.codingSequence.length;
    }

    /**
     * Gets the length of the mature mRNA in nucleotides.
     */
    getMRNALength(): number {
        return this.matureMRNA.getSequence().length;
    }

    /**
     * Checks if this variant maintains a proper reading frame.
     */
    hasValidReadingFrame(): boolean {
        return this.codingSequence.length % 3 === 0;
    }

    /**
     * Gets the number of amino acids that would be produced from this variant.
     */
    getAminoAcidCount(): number {
        return Math.floor(this.codingSequence.length / 3);
    }
}

/**
 * Options for configuring alternative splicing behavior.
 */
export interface AlternativeSplicingOptions {
    /** Whether to validate reading frames for each variant */
    readonly validateReadingFrames?: boolean;

    /** Whether to require at least one exon in each variant */
    readonly requireMinimumExons?: boolean;

    /** Minimum number of exons required per variant */
    readonly minimumExonCount?: number;

    /**
     * Whether to validate that variants maintain proper start/stop codons.
     *
     * When true, validates:
     * - Start codon (AUG) at the beginning of the coding sequence
     * - Stop codon (UAA, UAG, UGA) at the end of the coding sequence
     *
     * Use false for research on partial sequences, alternative start sites,
     * or when studying nonsense mutations with premature stops.
     */
    readonly validateCodons?: boolean;

    /** Whether to allow variants that skip the first exon */
    readonly allowSkipFirstExon?: boolean;

    /**
     * Whether to allow variants that skip the last exon.
     *
     * Biologically relevant for:
     * - Alternative polyadenylation (early termination with different 3' UTR)
     * - Nonsense-mediated decay escape mechanisms
     * - Research into truncated protein isoforms
     *
     * When false, enforces that functional proteins retain proper C-terminus
     * and termination signals. Use true for modeling alternative polyadenylation
     * or studying naturally occurring truncated isoforms.
     */
    readonly allowSkipLastExon?: boolean;
}

/**
 * Default options for alternative splicing processing.
 */
export const DEFAULT_ALTERNATIVE_SPLICING_OPTIONS: AlternativeSplicingOptions = {
    validateReadingFrames: true,
    requireMinimumExons: true,
    minimumExonCount: 1,
    validateCodons: true,
    allowSkipFirstExon: false,
    allowSkipLastExon: false
} as const;

/**
 * Common splice variant patterns for easy creation.
 */
export class SpliceVariantPatterns {
    /**
     * Creates an exon skipping variant.
     * @param name - Name for the variant
     * @param totalExons - Total number of exons in the gene
     * @param skippedExons - Array of 0-based exon indices to skip
     * @param description - Optional description
     */
    static exonSkipping(
        name: string,
        totalExons: number,
        skippedExons: number[],
        description?: string
    ): SpliceVariant {
        const allExons = Array.from({ length: totalExons }, (_, i) => i);
        const includedExons = allExons.filter(exon => !skippedExons.includes(exon));

        return {
            name,
            includedExons,
            description: description ?? `Skips exon${skippedExons.length > 1 ? 's' : ''} ${skippedExons.join(', ')}`
        };
    }

    /**
     * Creates a truncation variant that includes only the first N exons.
     * @param name - Name for the variant
     * @param exonCount - Number of exons to include from the beginning
     * @param description - Optional description
     */
    static truncation(
        name: string,
        exonCount: number,
        description?: string
    ): SpliceVariant {
        const includedExons = Array.from({ length: exonCount }, (_, i) => i);

        return {
            name,
            includedExons,
            description: description ?? `Truncated to first ${exonCount} exon${exonCount > 1 ? 's' : ''}`
        };
    }

    /**
     * Creates a minimal variant that includes only specified essential exons.
     * @param name - Name for the variant
     * @param essentialExons - Array of 0-based essential exon indices
     * @param description - Optional description
     */
    static minimal(
        name: string,
        essentialExons: number[],
        description?: string
    ): SpliceVariant {
        return {
            name,
            includedExons: [...essentialExons].sort((a, b) => a - b),
            description: description ?? `Minimal variant with essential exons ${essentialExons.join(', ')}`
        };
    }

    /**
     * Creates a full-length variant that includes all exons.
     * @param name - Name for the variant
     * @param totalExons - Total number of exons in the gene
     * @param description - Optional description
     */
    static fullLength(
        name: string,
        totalExons: number,
        description?: string
    ): SpliceVariant {
        const includedExons = Array.from({ length: totalExons }, (_, i) => i);

        return {
            name,
            includedExons,
            description: description ?? 'Full-length variant with all exons'
        };
    }
}