import { NucleotidePattern } from './nucleic-acids/NucleotidePattern';

/**
 * Represents a single promoter element with its pattern, name, and position relative to TSS.
 * Promoter elements are regulatory DNA sequences that help initiate transcription.
 */
export class PromoterElement {
  /** The nucleotide pattern that defines this promoter element */
  readonly pattern: NucleotidePattern;

  /** Human-readable name for this promoter element */
  readonly name: string;

  /** Position relative to transcription start site (TSS), typically negative for upstream elements */
  readonly position: number;

  /**
   * Creates a new PromoterElement.
   *
   * @param name - Name of the promoter element (e.g., "TATA", "Inr", "DPE")
   * @param pattern - The NucleotidePattern that defines this element
   * @param position - Position relative to TSS (negative for upstream, positive for downstream)
   *
   * @example
   * ```typescript
   * const tataBox = new PromoterElement(
   *     "TATA",
   *     new NucleotidePattern("TATAWAR"), // W = A or T, R = A or G
   *     -25 // Typically 25bp upstream of TSS
   * );
   * ```
   */
  constructor(name: string, pattern: NucleotidePattern, position: number) {
    this.name = name;
    this.pattern = pattern;
    this.position = position;
  }

  /**
   * Gets a string representation of this promoter element.
   * @returns String in format "name\@position"
   */
  toString(): string {
    return `${this.name}@${this.position}`;
  }

  /**
   * Checks if two PromoterElements are equivalent.
   * @param other - The other PromoterElement to compare
   * @returns true if name, pattern, and position are identical
   */
  equals(other: PromoterElement): boolean {
    return (
      this.name === other.name &&
      this.position === other.position &&
      this.pattern.pattern === other.pattern.pattern
    );
  }
}
