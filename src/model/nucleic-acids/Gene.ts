import { DNA } from './DNA';
import { GenomicRegion, validateExons } from '../../types/genomic-region';
import { ValidationResult } from '../../types/validation-result';
import { InvalidSequenceError } from '../errors/InvalidSequenceError';
import { NucleicAcidType } from '../../enums/nucleic-acid-type';
import { AlternativeSplicingProfile, SpliceVariant } from '../../types/alternative-splicing';

/**
 * A class representing a Gene with exons and introns.
 * Extends DNA to provide gene-specific functionality including exon/intron structure.
 * Supports alternative splicing through splice variant profiles.
 */
export class Gene extends DNA {
  private readonly exons: readonly GenomicRegion[];
  private readonly introns: readonly GenomicRegion[];
  private readonly name?: string;
  private readonly splicingProfile?: AlternativeSplicingProfile;

  /**
   * Creates a Gene instance with the specified DNA sequence and exon definitions.
   * Introns are automatically calculated from the gaps between exons.
   *
   * @param sequence - The complete gene DNA sequence
   * @param exons - Array of GenomicRegion objects defining exon locations
   * @param name - Optional name for the gene
   * @param splicingProfile - Optional alternative splicing profile for this gene
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
  constructor(
    sequence: string,
    exons: GenomicRegion[],
    name?: string,
    splicingProfile?: AlternativeSplicingProfile,
  ) {
    super(sequence);

    // Validate exons
    const exonValidation = validateExons(exons, sequence.length);
    if (!exonValidation.success) {
      throw new InvalidSequenceError(exonValidation.error, sequence, NucleicAcidType.DNA);
    }

    // Validate splicing profile if provided
    if (splicingProfile) {
      const splicingValidation = this.validateSplicingProfile(splicingProfile, exons.length);
      if (!splicingValidation.success) {
        throw new InvalidSequenceError(splicingValidation.error, sequence, NucleicAcidType.DNA);
      }
    }

    // Store immutable copies
    this.exons = Object.freeze([...exons]);
    this.introns = Object.freeze(this.calculateIntrons(exons));
    this.name = name;
    this.splicingProfile = splicingProfile;
  }

  /**
   * Creates a Gene instance, returning a ValidationResult instead of throwing.
   *
   * @param sequence - The complete gene DNA sequence
   * @param exons - Array of GenomicRegion objects defining exon locations
   * @param name - Optional name for the gene
   * @param splicingProfile - Optional alternative splicing profile for this gene
   * @returns ValidationResult containing Gene instance or error message
   */
  static createGene(
    sequence: string,
    exons: GenomicRegion[],
    name?: string,
    splicingProfile?: AlternativeSplicingProfile,
  ): ValidationResult<Gene> {
    try {
      const gene = new Gene(sequence, exons, name, splicingProfile);
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
    return sortedExons.map(exon => this.getSequence().substring(exon.start, exon.end)).join('');
  }

  /**
   * Gets the sequence of a specific exon.
   * @param exonIndex - 0-based index of the exon
   * @returns DNA sequence string of the specified exon
   * @throws Error if exonIndex is out of bounds
   */
  getExonSequence(exonIndex: number): string {
    if (exonIndex < 0 || exonIndex >= this.exons.length) {
      throw new Error(
        `Exon index ${exonIndex} out of bounds. Gene has ${this.exons.length} exons.`,
      );
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
      throw new Error(
        `Intron index ${intronIndex} out of bounds. Gene has ${this.introns.length} introns.`,
      );
    }
    const intron = this.introns[intronIndex];
    return this.getSequence().substring(intron.start, intron.end);
  }

  /**
   * Gets the alternative splicing profile for this gene, if available.
   * @returns The splicing profile, or undefined if no profile was provided
   */
  getSplicingProfile(): AlternativeSplicingProfile | undefined {
    return this.splicingProfile;
  }

  /**
   * Gets all available splice variants for this gene.
   * @returns Array of splice variants, or empty array if no splicing profile
   */
  getSplicingVariants(): readonly SpliceVariant[] {
    return this.splicingProfile?.variants ?? [];
  }

  /**
   * Gets the default splice variant for this gene.
   * @returns The default splice variant, or undefined if no splicing profile
   */
  getDefaultSplicingVariant(): SpliceVariant | undefined {
    if (!this.splicingProfile) return undefined;
    return this.splicingProfile.variants.find(v => v.name === this.splicingProfile!.defaultVariant);
  }

  /**
   * Gets a specific splice variant by name.
   * @param variantName - Name of the variant to retrieve
   * @returns The splice variant, or undefined if not found
   */
  getSplicingVariantByName(variantName: string): SpliceVariant | undefined {
    return this.splicingProfile?.variants.find(v => v.name === variantName);
  }

  /**
   * Gets the mature sequence for a specific splice variant.
   * @param variant - The splice variant to process
   * @returns DNA sequence string of the variant's concatenated exons
   * @throws Error if variant contains invalid exon indices
   */
  getVariantSequence(variant: SpliceVariant): string {
    // Validate exon indices
    for (const exonIndex of variant.includedExons) {
      if (exonIndex < 0 || exonIndex >= this.exons.length) {
        throw new Error(
          `Variant '${variant.name}' references invalid exon index ${exonIndex}. Gene has ${this.exons.length} exons.`,
        );
      }
    }

    // Get exons in their original genomic order
    const selectedExons = variant.includedExons
      .map(index => this.exons[index])
      .sort((a, b) => a.start - b.start);

    return selectedExons.map(exon => this.getSequence().substring(exon.start, exon.end)).join('');
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
          name: `intron${intronCount++}`,
        });
      }
    }
    return introns;
  }

  /**
   * Validates a splicing profile to ensure all variants reference valid exon indices.
   * @param splicingProfile - The splicing profile to validate
   * @param totalExons - Total number of exons in the gene
   * @returns ValidationResult indicating success or failure with error message
   */
  private validateSplicingProfile(
    splicingProfile: AlternativeSplicingProfile,
    totalExons: number,
  ): ValidationResult<void> {
    if (splicingProfile.variants.length === 0) {
      return {
        success: false as const,
        error: 'Splicing profile must contain at least one variant',
      };
    }

    // Check that default variant exists
    const defaultVariantExists = splicingProfile.variants.some(
      v => v.name === splicingProfile.defaultVariant,
    );
    if (!defaultVariantExists) {
      return {
        success: false as const,
        error: `Default variant '${splicingProfile.defaultVariant}' not found in variants list`,
      };
    }

    // Validate each variant
    for (let i = 0; i < splicingProfile.variants.length; i++) {
      const variant = splicingProfile.variants[i];

      if (variant.includedExons.length === 0) {
        return {
          success: false as const,
          error: `Variant '${variant.name}' must include at least one exon`,
        };
      }

      // Check all exon indices are valid
      for (const exonIndex of variant.includedExons) {
        if (exonIndex < 0 || exonIndex >= totalExons) {
          return {
            success: false as const,
            error: `Variant '${variant.name}' references invalid exon index ${exonIndex}. Gene has ${totalExons} exons.`,
          };
        }
      }

      // Check for duplicate exon indices within variant
      const uniqueExons = new Set(variant.includedExons);
      if (uniqueExons.size !== variant.includedExons.length) {
        return {
          success: false as const,
          error: `Variant '${variant.name}' contains duplicate exon indices`,
        };
      }
    }

    // Check for duplicate variant names
    const variantNames = splicingProfile.variants.map(v => v.name);
    const uniqueNames = new Set(variantNames);
    if (uniqueNames.size !== variantNames.length) {
      return {
        success: false as const,
        error: 'Splicing profile contains duplicate variant names',
      };
    }

    return { success: true as const, data: undefined };
  }
}
