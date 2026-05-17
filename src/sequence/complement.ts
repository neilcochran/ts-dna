import { DNA } from './DNA.js';
import { RNA } from './RNA.js';

/**
 * Returns the Watson-Crick complement of a {@link DNA} sequence (A&lt;-&gt;T, C&lt;-&gt;G),
 * preserving order. Equivalent to `dna.getComplement()`; provided as a free function for
 * call sites that prefer that style.
 *
 * @param sequence - The DNA sequence to complement
 * @returns A new DNA carrying the complement
 */
export function complement(sequence: DNA): DNA;
/**
 * Returns the Watson-Crick complement of an {@link RNA} sequence (A&lt;-&gt;U, C&lt;-&gt;G),
 * preserving order. Equivalent to `rna.getComplement()`; provided as a free function for
 * call sites that prefer that style.
 *
 * @param sequence - The RNA sequence to complement
 * @returns A new RNA carrying the complement
 */
export function complement(sequence: RNA): RNA;
export function complement(sequence: DNA | RNA): DNA | RNA {
  return sequence.getComplement();
}

/**
 * Returns the reverse complement of a {@link DNA} sequence (Watson-Crick complement, then
 * reversed). Represents the opposite strand of a duplex. Equivalent to
 * `dna.getReverseComplement()`; provided as a free function for call sites that prefer that
 * style.
 *
 * @param sequence - The DNA sequence to reverse-complement
 * @returns A new DNA carrying the reverse complement
 */
export function reverseComplement(sequence: DNA): DNA;
/**
 * Returns the reverse complement of an {@link RNA} sequence (Watson-Crick complement, then
 * reversed). Equivalent to `rna.getReverseComplement()`; provided as a free function for
 * call sites that prefer that style.
 *
 * @param sequence - The RNA sequence to reverse-complement
 * @returns A new RNA carrying the reverse complement
 */
export function reverseComplement(sequence: RNA): RNA;
export function reverseComplement(sequence: DNA | RNA): DNA | RNA {
  return sequence.getReverseComplement();
}
