import { RNA } from './RNA.js';
import { MIN_POLY_A_DETECTION_LENGTH, CODON_LENGTH } from '../../constants/biological-constants.js';

/**
 * Represents mature messenger RNA (mRNA) that has undergone complete processing.
 *
 * Mature mRNA is the final product of RNA processing, containing:
 * - 5' methylguanosine cap for stability and ribosome binding
 * - Spliced sequence with introns removed and exons joined
 * - 3' poly-A tail for stability and nuclear export
 * - Clear coding sequence boundaries for translation
 *
 * This class extends RNA to provide specific functionality for translation-ready mRNA.
 */
export class MRNA extends RNA {
  private readonly fivePrimeCap: boolean;
  private readonly polyATail: string;
  private readonly codingSequence: string;
  private readonly codingStart: number;
  private readonly codingEnd: number;

  /**
   * Creates a new mature mRNA instance.
   *
   * @param sequence - The complete mRNA sequence including cap and poly-A tail
   * @param codingSequence - The coding sequence (CDS) portion for translation
   * @param codingStart - Start position of coding sequence in the full sequence
   * @param codingEnd - End position of coding sequence in the full sequence
   * @param fivePrimeCap - Whether the mRNA has a 5' cap (default: true)
   * @param polyATail - The poly-A tail sequence (default: empty string)
   *
   * @example
   * ```typescript
   * // Create mature mRNA with cap and poly-A tail
   * const mRNA = new MRNA(
   *     'GAUGAAACCCGGGUAAAAAAAAAA',  // full sequence
   *     'AUGAAACCCGGG',              // coding sequence
   *     1,                          // coding starts at position 1
   *     13,                         // coding ends at position 13
   *     true,                       // has 5' cap
   *     'AAAAAAAAAA'                // 10 A's poly-A tail
   * );
   * ```
   */
  constructor(
    sequence: string,
    codingSequence: string,
    codingStart: number,
    codingEnd: number,
    fivePrimeCap: boolean = true,
    polyATail: string = '',
  ) {
    super(sequence);

    // Validate coding sequence boundaries
    if (codingStart < 0 || codingEnd > sequence.length || codingStart >= codingEnd) {
      throw new Error(
        `Invalid coding sequence boundaries: start=${codingStart}, end=${codingEnd}, sequence length=${sequence.length}`,
      );
    }

    // Validate that coding sequence matches the specified region
    const extractedCodingSeq = sequence.substring(codingStart, codingEnd);
    if (extractedCodingSeq !== codingSequence) {
      throw new Error(
        `Coding sequence mismatch: expected '${codingSequence}', found '${extractedCodingSeq}' at positions ${codingStart}-${codingEnd}`,
      );
    }

    this.fivePrimeCap = fivePrimeCap;
    this.polyATail = polyATail;
    this.codingSequence = codingSequence;
    this.codingStart = codingStart;
    this.codingEnd = codingEnd;
  }

  /**
   * Gets the coding sequence (CDS) for translation.
   * This excludes 5' UTR, 3' UTR, cap, and poly-A tail.
   *
   * @returns The coding sequence that will be translated to a polypeptide
   *
   * @example
   * ```typescript
   * const mRNA = new MRNA('GAUGAAACCCGGGUAAAAAAA', 'AUGAAACCCGGG', 1, 13);
   * console.log(mRNA.getCodingSequence()); // 'AUGAAACCCGGG'
   * ```
   */
  getCodingSequence(): string {
    return this.codingSequence;
  }

  /**
   * Gets the length of the poly-A tail.
   *
   * @returns The number of adenine nucleotides in the poly-A tail
   *
   * @example
   * ```typescript
   * const mRNA = new MRNA('GAUGAAACCCGGGUAAAAAAA', 'AUGAAACCCGGG', 1, 13, true, 'AAAAAAA');
   * console.log(mRNA.getPolyATailLength()); // 7
   * ```
   */
  getPolyATailLength(): number {
    return this.polyATail.length;
  }

  /**
   * Gets the poly-A tail sequence.
   *
   * @returns The poly-A tail sequence
   *
   * @example
   * ```typescript
   * const mRNA = new MRNA('GAUGAAACCCGGGUAAAAAAA', 'AUGAAACCCGGG', 1, 13, true, 'AAAAAAA');
   * console.log(mRNA.getPolyATail()); // 'AAAAAAA'
   * ```
   */
  getPolyATail(): string {
    return this.polyATail;
  }

  /**
   * Checks if the mRNA has a 5' methylguanosine cap.
   *
   * @returns True if the mRNA has a 5' cap, false otherwise
   *
   * @example
   * ```typescript
   * const mRNA = new MRNA('GAUGAAACCCGGGUAA', 'AUGAAACCCGGG', 1, 13, true);
   * console.log(mRNA.hasFivePrimeCap()); // true
   * ```
   */
  hasFivePrimeCap(): boolean {
    return this.fivePrimeCap;
  }

  /**
   * Checks if the mRNA is fully processed and ready for translation.
   *
   * A fully processed mRNA must have:
   * - A 5' cap
   * - A poly-A tail (minimum length 10)
   * - A valid coding sequence
   *
   * @returns True if the mRNA is fully processed, false otherwise
   *
   * @example
   * ```typescript
   * const mRNA = new MRNA('GAUGAAACCCGGGUAAAAAAAAAA', 'AUGAAACCCGGG', 1, 13, true, 'AAAAAAAAAA');
   * console.log(mRNA.isFullyProcessed()); // true
   * ```
   */
  isFullyProcessed(): boolean {
    return (
      this.fivePrimeCap &&
      this.polyATail.length >= MIN_POLY_A_DETECTION_LENGTH &&
      this.codingSequence.length >= CODON_LENGTH
    );
  }

  /**
   * Gets the 5' untranslated region (UTR).
   *
   * @returns The 5' UTR sequence before the coding sequence
   *
   * @example
   * ```typescript
   * const mRNA = new MRNA('GAUGAAACCCGGGUAA', 'AUGAAACCCGGG', 1, 13);
   * console.log(mRNA.getFivePrimeUTR()); // 'G'
   * ```
   */
  getFivePrimeUTR(): string {
    return this.getSequence().substring(0, this.codingStart);
  }

  /**
   * Gets the 3' untranslated region (UTR).
   *
   * @returns The 3' UTR sequence after the coding sequence (excluding poly-A tail)
   *
   * @example
   * ```typescript
   * const mRNA = new MRNA('GAUGAAACCCGGGUAAAAAAA', 'AUGAAACCCGGG', 1, 13, true, 'AAAAAAA');
   * console.log(mRNA.getThreePrimeUTR()); // 'UAA'  // stop codon + UTR, excluding poly-A
   * ```
   */
  getThreePrimeUTR(): string {
    const fullSequence = this.getSequence();
    const threePrimeStart = this.codingEnd;
    const threePrimeEnd = fullSequence.length - this.polyATail.length;
    return fullSequence.substring(threePrimeStart, threePrimeEnd);
  }

  /**
   * Gets the coding start position in the full mRNA sequence.
   *
   * @returns The 0-based index where the coding sequence begins
   */
  getCodingStart(): number {
    return this.codingStart;
  }

  /**
   * Gets the coding end position in the full mRNA sequence.
   *
   * @returns The 0-based index where the coding sequence ends (exclusive)
   */
  getCodingEnd(): number {
    return this.codingEnd;
  }
}
