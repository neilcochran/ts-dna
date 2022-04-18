/**
 * A class representing an invalid codon error
 */
export class InvalidCodonError extends Error {
    public readonly codonSequence: string;

    /**
     * @param message - The error message
     * @param codonSequence - The invalid codon sequence
     */
    constructor(message: string, codonSequence: string) {
        super(message);
        this.codonSequence = codonSequence;
    }
}