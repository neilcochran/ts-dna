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

/**
 * Returns the complement of a single DNA base, or `undefined` if the input is not one of
 * `A`, `C`, `G`, `T` (case-sensitive).
 *
 * @param base - A single character
 * @returns The complement base (`A`/`T`/`C`/`G`), or `undefined` for invalid input
 */
export function complementDNABase(base: string): string | undefined {
  switch (base) {
    case 'A':
      return 'T';
    case 'T':
      return 'A';
    case 'C':
      return 'G';
    case 'G':
      return 'C';
    default:
      return undefined;
  }
}

/**
 * Returns the complement of a single RNA base, or `undefined` if the input is not one of
 * `A`, `C`, `G`, `U` (case-sensitive).
 *
 * @param base - A single character
 * @returns The complement base (`A`/`U`/`C`/`G`), or `undefined` for invalid input
 */
export function complementRNABase(base: string): string | undefined {
  switch (base) {
    case 'A':
      return 'U';
    case 'U':
      return 'A';
    case 'C':
      return 'G';
    case 'G':
      return 'C';
    default:
      return undefined;
  }
}
