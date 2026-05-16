/**
 * Discriminator identifying which nucleic-acid alphabet the offending sequence belonged to.
 */
export type NucleicAcidKind = 'DNA' | 'RNA';

/**
 * Thrown when a sequence string fails DNA or RNA validation. Carries the offending sequence
 * and the alphabet it was being validated against, so consumers that catch can surface the
 * full context.
 *
 * Production code should prefer the structured `DNAError` / `RNAError` payloads returned by
 * `parseDNA` / `parseRNA`. This error class exists for callers that go through the throwing
 * `new DNA(...)` / `new RNA(...)` constructors (notably the `MRNA` sub-class, whose own
 * constructor calls `super(sequence)`).
 */
export class InvalidSequenceError extends Error {
  /** The invalid sequence as it was provided to the failing validator. */
  public readonly sequence: string;
  /** Which alphabet the validator was checking against. */
  public readonly nucleicAcidType: NucleicAcidKind;

  /**
   * @param message - Human-readable error message describing the validation failure
   * @param sequence - The invalid sequence string
   * @param nucleicAcidType - Which alphabet the sequence failed against (`'DNA'` or `'RNA'`)
   */
  constructor(message: string, sequence: string, nucleicAcidType: NucleicAcidKind) {
    super(message);
    this.sequence = sequence;
    this.nucleicAcidType = nucleicAcidType;
  }
}
