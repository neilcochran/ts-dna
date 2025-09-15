import { DNA } from './DNA';
import { GenomicRegion, isValidGenomicRegion, validateNonOverlappingRegions } from '../../types/genomic-region';
import { ValidationResult } from '../../types/validation-result';
import { InvalidSequenceError } from '../errors/InvalidSequenceError';
import { NucleicAcidType } from '../../enums/nucleic-acid-type';
// Import types for future alternative splicing support (Phase 4.5)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AlternativeSplicingProfile, SpliceVariant } from '../../types/alternative-splicing';

/**
 * A class representing a Gene with exons and introns.
 * Extends DNA to provide gene-specific functionality including exon/intron structure.
 */
export class Gene extends DNA {
    private readonly exons: readonly GenomicRegion[];
    private readonly introns: readonly GenomicRegion[];
    private readonly name?: string;

    /**
     * Creates a Gene instance with the specified DNA sequence and exon definitions.
     * Introns are automatically calculated from the gaps between exons.
     *
     * @param sequence - The complete gene DNA sequence
     * @param exons - Array of GenomicRegion objects defining exon locations
     * @param name - Optional name for the gene
     *
     * @throws {@link InvalidSequenceError}
     * Thrown if the sequence is invalid, exons are invalid, or exons extend beyond sequence
     *
     * @example
     * ```typescript
     * const gene = new Gene('ATGCCCGGGAAATTT', [
     *     { start: 0, end: 3, name: 'exon1' },
     *     { start: 9, end: 15, name: 'exon2' }
     * ], 'BRCA1');
     * // Introns automatically calculated: [{ start: 3, end: 9 }]
     * ```
     */
    constructor(sequence: string, exons: GenomicRegion[], name?: string) {
        super(sequence);

        // Validate exons
        const exonValidation = this.validateExons(exons, sequence.length);
        if (!exonValidation.success) {
            throw new InvalidSequenceError(exonValidation.error, sequence, NucleicAcidType.DNA);
        }

        // Store immutable copies
        this.exons = Object.freeze([...exons]);
        this.introns = Object.freeze(this.calculateIntrons(exons));
        this.name = name;
    }

    /**
     * Creates a Gene instance, returning a ValidationResult instead of throwing.
     *
     * @param sequence - The complete gene DNA sequence
     * @param exons - Array of GenomicRegion objects defining exon locations
     * @param name - Optional name for the gene
     * @returns ValidationResult containing Gene instance or error message
     */
    static createGene(sequence: string, exons: GenomicRegion[], name?: string): ValidationResult<Gene> {
        try {
            const gene = new Gene(sequence, exons, name);
            return { success: true as const, data: gene };
        } catch (error) {
            if (error instanceof InvalidSequenceError) {
                return { success: false as const, error: error.message };
            }
            return { success: false as const, error: 'Unknown error creating Gene' };
        }
    }

    /**
     * Gets the name of this gene, if provided.
     * @returns The gene name, or undefined if no name was provided
     */
    getName(): string | undefined {
        return this.name;
    }

    /**
     * Gets the exon regions of this gene.
     * @returns Readonly array of GenomicRegion objects representing exons
     */
    getExons(): readonly GenomicRegion[] {
        return this.exons;
    }

    /**
     * Gets the intron regions of this gene.
     * @returns Readonly array of GenomicRegion objects representing introns
     */
    getIntrons(): readonly GenomicRegion[] {
        return this.introns;
    }

    /**
     * Gets the mature mRNA sequence by concatenating all exons.
     * @returns DNA sequence string of concatenated exons
     */
    getMatureSequence(): string {
        // Sort exons by genomic position before concatenating
        const sortedExons = [...this.exons].sort((a, b) => a.start - b.start);
        return sortedExons
            .map(exon => this.getSequence().substring(exon.start, exon.end))
            .join('');
    }

    /**
     * Gets the sequence of a specific exon.
     * @param exonIndex - 0-based index of the exon
     * @returns DNA sequence string of the specified exon
     * @throws Error if exonIndex is out of bounds
     */
    getExonSequence(exonIndex: number): string {
        if (exonIndex < 0 || exonIndex >= this.exons.length) {
            throw new Error(`Exon index ${exonIndex} out of bounds. Gene has ${this.exons.length} exons.`);
        }
        const exon = this.exons[exonIndex];
        return this.getSequence().substring(exon.start, exon.end);
    }

    /**
     * Gets the sequence of a specific intron.
     * @param intronIndex - 0-based index of the intron
     * @returns DNA sequence string of the specified intron
     * @throws Error if intronIndex is out of bounds
     */
    getIntronSequence(intronIndex: number): string {
        if (intronIndex < 0 || intronIndex >= this.introns.length) {
            throw new Error(`Intron index ${intronIndex} out of bounds. Gene has ${this.introns.length} introns.`);
        }
        const intron = this.introns[intronIndex];
        return this.getSequence().substring(intron.start, intron.end);
    }

    /**
     * Validates exon regions to ensure they are valid and non-overlapping.
     * @param exons - Array of GenomicRegion objects to validate
     * @param sequenceLength - Length of the gene sequence for boundary validation
     * @returns ValidationResult indicating success or failure with error message
     */
    private validateExons(exons: GenomicRegion[], sequenceLength: number): ValidationResult<void> {
        if (exons.length === 0) {
            return { success: false as const, error: 'Gene must have at least one exon' };
        }

        // Validate individual exons
        for (let i = 0; i < exons.length; i++) {
            const exon = exons[i];

            if (!isValidGenomicRegion(exon)) {
                return { success: false as const, error: `Exon ${i} has invalid coordinates: start=${exon.start}, end=${exon.end}` };
            }

            if (exon.end > sequenceLength) {
                return { success: false as const, error: `Exon ${i} extends beyond sequence length: end=${exon.end}, sequence length=${sequenceLength}` };
            }
        }

        // Validate non-overlapping using optimized algorithm
        if (!validateNonOverlappingRegions(exons)) {
            return { success: false as const, error: 'Exons must not overlap' };
        }

        return { success: true as const, data: undefined };
    }

    /**
     * Calculates intron regions from exon definitions.
     * @param exons - Array of validated exon regions
     * @returns Array of GenomicRegion objects representing introns
     */
    private calculateIntrons(exons: GenomicRegion[]): GenomicRegion[] {
        if (exons.length <= 1) {
            return [];
        }

        // Sort exons by start position
        const sortedExons = [...exons].sort((a, b) => a.start - b.start);
        const introns: GenomicRegion[] = [];
        let intronCount = 1;

        // Create introns between adjacent exons
        for (let i = 0; i < sortedExons.length - 1; i++) {
            const currentExon = sortedExons[i];
            const nextExon = sortedExons[i + 1];

            if (currentExon.end < nextExon.start) {
                introns.push({
                    start: currentExon.end,
                    end: nextExon.start,
                    name: `intron${intronCount++}`
                });
            }
        }
        return introns;
    }
}