/**
 * A class representing an invalid nucleotide pattern error
 */
export class InvalidNucleotidePatternError extends Error {
  public readonly nucleotidePattern: string;

  /**
   * @param message - The error message
   *
   * @param nucleotidePattern - The invalid nucleotide pattern
   */
  constructor(message: string, nucleotidePattern: string) {
    super(message);
    this.nucleotidePattern = nucleotidePattern;
  }
}
