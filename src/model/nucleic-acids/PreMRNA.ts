import { RNA } from './RNA.js';
import { Gene } from './Gene.js';
import { GenomicRegion } from '../../types/genomic-region.js';

/**
 * Represents pre-mRNA (precursor mRNA) - the initial RNA transcript containing both exons and introns.
 * Pre-mRNA is produced directly from DNA transcription and requires processing (splicing) to become mature mRNA.
 *
 * In eukaryotes, genes are transcribed as pre-mRNA containing:
 * - All exons (coding sequences that will be retained)
 * - All introns (non-coding sequences that will be removed during splicing)
 * - 5' UTR and 3' UTR regions
 *
 * @example
 * ```typescript
 * const gene = new Gene(dnaSequence, exons);
 * const preMRNA = new PreMRNA(transcriptSequence, gene, tss, polyASite);
 *
 * console.log(preMRNA.getExonRegions()); // Exon positions in transcript
 * console.log(preMRNA.getIntronRegions()); // Intron positions in transcript
 * console.log(preMRNA.getCodingSequence()); // Exons only, joined together
 * ```
 */
export class PreMRNA extends RNA {
  /** The source gene that was transcribed to create this pre-mRNA */
  private readonly sourceGene: Gene;

  /** Position of transcription start site in the original gene sequence */
  private readonly transcriptionStartSite: number;

  /** Position of polyadenylation site in the transcript, if known */
  private readonly polyadenylationSite?: number;

  /**
   * Creates a new PreMRNA instance.
   *
   * @param sequence - The complete pre-mRNA sequence including introns and exons
   * @param sourceGene - The gene that was transcribed
   * @param transcriptionStartSite - TSS position in the original gene sequence
   * @param polyadenylationSite - Optional polyadenylation site position in transcript
   *
   * @example
   * ```typescript
   * const gene = new Gene('ATGAAACCCAAATTTGGG', [
   *     { start: 0, end: 6 },   // First exon: ATGAAA
   *     { start: 12, end: 18 }  // Second exon: TTTGGG
   * ]);
   *
   * const preMRNA = new PreMRNA(
   *     'AUGAAACCCAAAUUUGGG',  // Transcribed sequence (DNA -> RNA)
   *     gene,
   *     0,  // TSS at gene position 0
   *     18  // Poly-A site at transcript end
   * );
   * ```
   */
  constructor(
    sequence: string,
    sourceGene: Gene,
    transcriptionStartSite: number,
    polyadenylationSite?: number,
  ) {
    super(sequence);
    this.sourceGene = sourceGene;
    this.transcriptionStartSite = transcriptionStartSite;
    this.polyadenylationSite = polyadenylationSite;
  }

  /**
   * Gets the source gene that was transcribed to create this pre-mRNA.
   * @returns The original gene
   */
  getSourceGene(): Gene {
    return this.sourceGene;
  }

  /**
   * Gets the transcription start site position in the original gene.
   * @returns TSS position in gene coordinates
   */
  getTranscriptionStartSite(): number {
    return this.transcriptionStartSite;
  }

  /**
   * Gets the polyadenylation site position in the transcript, if known.
   * @returns Polyadenylation site position in transcript coordinates, or undefined
   */
  getPolyadenylationSite(): number | undefined {
    return this.polyadenylationSite;
  }

  /**
   * Gets the exon regions in transcript coordinates.
   * These are the regions that will be retained after splicing.
   *
   * @returns Array of exon regions in transcript coordinates
   *
   * @example
   * ```typescript
   * const exonRegions = preMRNA.getExonRegions();
   * // [{ start: 0, end: 6 }, { start: 12, end: 18 }]
   * ```
   */
  getExonRegions(): GenomicRegion[] {
    // Convert gene exon coordinates to transcript coordinates
    const transcriptLength = this.getSequence().length;

    return this.sourceGene
      .getExons()
      .map(exon => ({
        start: exon.start - this.transcriptionStartSite,
        end: exon.end - this.transcriptionStartSite,
        name: exon.name,
      }))
      .filter(exon => {
        // Include exons that have any overlap with the transcript
        return exon.end > 0 && exon.start < transcriptLength;
      });
  }

  /**
   * Gets the intron regions in transcript coordinates.
   * These are the regions that will be removed during splicing.
   *
   * @returns Array of intron regions in transcript coordinates
   *
   * @example
   * ```typescript
   * const intronRegions = preMRNA.getIntronRegions();
   * // [{ start: 6, end: 12 }] - region between exons
   * ```
   */
  getIntronRegions(): GenomicRegion[] {
    const exonRegions = this.getExonRegions();
    if (exonRegions.length <= 1) {
      return [];
    }

    // Calculate introns between transcript exons (not gene introns)
    const sortedExons = [...exonRegions].sort((a, b) => a.start - b.start);
    const introns: GenomicRegion[] = [];

    // Create introns between adjacent exons in transcript coordinates
    for (let i = 0; i < sortedExons.length - 1; i++) {
      const currentExon = sortedExons[i];
      const nextExon = sortedExons[i + 1];

      if (currentExon.end < nextExon.start) {
        introns.push({
          start: currentExon.end,
          end: nextExon.start,
          name: undefined, // Tests expect undefined
        });
      }
    }

    return introns;
  }

  /**
   * Gets the coding sequence by extracting and joining only the exons.
   * This represents what the mature mRNA sequence will be after splicing.
   *
   * @returns The coding sequence (exons joined together)
   *
   * @example
   * ```typescript
   * const preMRNA = new PreMRNA('AUGAAACCCAAAUUUGGG', gene, 0);
   * console.log(preMRNA.getCodingSequence()); // 'AUGAAAUUUGGG' (exons only)
   * ```
   */
  getCodingSequence(): string {
    const sequence = this.getSequence();
    const exons = this.getExonRegions();

    return exons
      .map(exon => {
        // Clamp coordinates to valid transcript bounds
        const start = Math.max(0, exon.start);
        const end = Math.min(sequence.length, exon.end);
        return sequence.substring(start, end);
      })
      .join('');
  }

  /**
   * Checks if this pre-mRNA contains introns that need to be spliced.
   * @returns true if introns are present, false if this is intronless
   */
  hasIntrons(): boolean {
    return this.getIntronRegions().length > 0;
  }

  /**
   * Gets the total length of all introns in this pre-mRNA.
   * @returns Total intron length in nucleotides
   */
  getTotalIntronLength(): number {
    return this.getIntronRegions().reduce(
      (total, intron) => total + (intron.end - intron.start),
      0,
    );
  }

  /**
   * Gets the total length of all exons in this pre-mRNA.
   * @returns Total exon length in nucleotides
   */
  getTotalExonLength(): number {
    const sequenceLength = this.getSequence().length;
    return this.getExonRegions().reduce((total, exon) => {
      // Clamp coordinates to valid transcript bounds
      const start = Math.max(0, exon.start);
      const end = Math.min(sequenceLength, exon.end);
      return total + Math.max(0, end - start);
    }, 0);
  }

  /**
   * Gets a string representation of this pre-mRNA.
   * @returns String showing sequence length, exon/intron counts, and source gene
   */
  override toString(): string {
    const exonCount = this.getExonRegions().length;
    const intronCount = this.getIntronRegions().length;
    return `PreMRNA(${this.getSequence().length}nt, ${exonCount} exons, ${intronCount} introns)`;
  }
}
