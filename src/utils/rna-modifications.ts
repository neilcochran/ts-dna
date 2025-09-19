import { RNA } from '../model/nucleic-acids/RNA.js';
import { RNASubType } from '../enums/rna-sub-type.js';
import { PolyadenylationSite } from '../types/polyadenylation-site.js';
import { ValidationResult, success, failure } from '../types/validation-result.js';
import {
  DEFAULT_POLY_A_TAIL_LENGTH,
  MAX_POLY_A_TAIL_LENGTH,
  MIN_POLY_A_DETECTION_LENGTH,
  POLY_A_TAIL_PATTERN,
} from '../constants/biological-constants.js';

/**
 * Represents a processed mRNA with 5' cap and 3' poly-A tail modifications.
 * This is a temporary class until we implement the full MRNA class in Phase 5.
 */
export class ProcessedRNA extends RNA {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(
    sequence: string,
    rnaSubType?: RNASubType,
    public readonly hasFivePrimeCap: boolean = false,
    public readonly polyATail: string = '',
  ) {
    super(sequence, rnaSubType);
  }

  /**
   * Gets the total length including poly-A tail.
   */
  getTotalLength(): number {
    return this.getSequence().length + this.polyATail.length;
  }

  /**
   * Gets the core sequence without poly-A tail.
   */
  getCoreSequence(): string {
    return this.getSequence();
  }

  /**
   * Gets the length of the poly-A tail.
   */
  getPolyATailLength(): number {
    return this.polyATail.length;
  }

  /**
   * Checks if this RNA is fully processed (has both cap and poly-A tail).
   */
  isFullyProcessed(): boolean {
    return this.hasFivePrimeCap && this.polyATail.length > 0;
  }
}

/**
 * Adds a 5' cap structure to an RNA molecule.
 * Returns a ProcessedRNA instance with the cap flag set.
 */
export function add5PrimeCap(rna: RNA): ProcessedRNA {
  if (rna instanceof ProcessedRNA) {
    return new ProcessedRNA(rna.getSequence(), rna.rnaSubType, true, rna.polyATail);
  }
  return new ProcessedRNA(rna.getSequence(), rna.rnaSubType, true, '');
}

/**
 * Adds a 3' poly-A tail to an RNA molecule at the specified cleavage site.
 * The poly-A tail enhances mRNA stability, nuclear export, and translation efficiency.
 */
export function add3PrimePolyATail(
  rna: RNA,
  cleavageSite: number,
  tailLength: number = DEFAULT_POLY_A_TAIL_LENGTH,
): ValidationResult<ProcessedRNA> {
  try {
    const sequence = rna.getSequence();

    // Validate cleavage site
    if (cleavageSite < 0) {
      return failure(`Invalid cleavage site ${cleavageSite}: must be >= 0`);
    }

    // Truncate cleavage site to sequence length if beyond end
    const effectiveCleavageSite = Math.min(cleavageSite, sequence.length);

    // Validate tail length
    if (tailLength < 0 || tailLength > MAX_POLY_A_TAIL_LENGTH) {
      return failure(
        `Invalid poly-A tail length ${tailLength}: must be between 0 and ${MAX_POLY_A_TAIL_LENGTH}`,
      );
    }

    // Create poly-A tail
    const polyATail = 'A'.repeat(tailLength);

    // Cleave sequence at effective site
    const cleavedSequence = sequence.substring(0, effectiveCleavageSite);

    // Create ProcessedRNA with poly-A tail
    const hasCap = rna instanceof ProcessedRNA ? rna.hasFivePrimeCap : false;
    const processedRNA = new ProcessedRNA(cleavedSequence, rna.rnaSubType, hasCap, polyATail);
    return success(processedRNA);
  } catch (error) {
    return failure(
      `Failed to add poly-A tail: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Adds a 3' poly-A tail using polyadenylation site information.
 * This is the preferred method when polyadenylation sites have been identified.
 */
export function add3PrimePolyATailAtSite(
  rna: RNA,
  polySite: PolyadenylationSite,
  tailLength: number = DEFAULT_POLY_A_TAIL_LENGTH,
): ValidationResult<ProcessedRNA> {
  const cleavageSite = polySite.cleavageSite ?? polySite.position + polySite.signal.length + 15;
  return add3PrimePolyATail(rna, cleavageSite, tailLength);
}

/**
 * Removes the 3' poly-A tail from an RNA sequence.
 * This can be useful for analysis or simulating deadenylation.
 */
export function remove3PrimePolyATail(rna: RNA): ValidationResult<ProcessedRNA> {
  try {
    if (rna instanceof ProcessedRNA) {
      if (rna.polyATail.length === 0) {
        return failure('No poly-A tail found to remove');
      }
      // Return ProcessedRNA without poly-A tail
      return success(new ProcessedRNA(rna.getSequence(), rna.rnaSubType, rna.hasFivePrimeCap, ''));
    }

    // For regular RNA, check if sequence ends with A's
    let sequence = rna.getSequence();
    const originalLength = sequence.length;
    sequence = sequence.replace(POLY_A_TAIL_PATTERN, '');

    if (sequence.length === originalLength) {
      return failure('No poly-A tail found to remove');
    }

    const processedRNA = new ProcessedRNA(sequence, rna.rnaSubType, false, '');
    return success(processedRNA);
  } catch (error) {
    return failure(
      `Failed to remove poly-A tail: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Removes the 5' cap from an RNA sequence.
 */
export function remove5PrimeCap(rna: RNA): ValidationResult<ProcessedRNA> {
  try {
    if (rna instanceof ProcessedRNA) {
      if (!rna.hasFivePrimeCap) {
        return failure("No 5' cap found to remove");
      }
      // Return ProcessedRNA without 5' cap
      return success(new ProcessedRNA(rna.getSequence(), rna.rnaSubType, false, rna.polyATail));
    }

    return failure("No 5' cap found to remove");
  } catch (error) {
    return failure(
      `Failed to remove 5' cap: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Checks if an RNA molecule has a 5' cap structure.
 */
export function has5PrimeCap(rna: RNA): boolean {
  if (rna instanceof ProcessedRNA) {
    return rna.hasFivePrimeCap;
  }
  return false;
}

/**
 * Checks if an RNA molecule has a 3' poly-A tail.
 * This is a basic check that looks for at least 10 consecutive A's at the 3' end.
 */
export function has3PrimePolyATail(
  rna: RNA,
  minLength: number = MIN_POLY_A_DETECTION_LENGTH,
): boolean {
  if (rna instanceof ProcessedRNA) {
    return rna.polyATail.length >= minLength;
  }
  const sequence = rna.getSequence();
  const pattern = new RegExp(`A{${minLength},}$`);
  return pattern.test(sequence);
}

/**
 * Gets the length of the 3' poly-A tail.
 */
export function get3PrimePolyATailLength(rna: RNA): number {
  if (rna instanceof ProcessedRNA) {
    return rna.polyATail.length;
  }
  const sequence = rna.getSequence();
  const match = sequence.match(/A+$/);
  return match ? match[0].length : 0;
}

/**
 * Gets the core sequence without 5' cap and 3' poly-A tail.
 * This returns the essential mRNA sequence for analysis.
 */
export function getCoreSequence(rna: RNA): string {
  if (rna instanceof ProcessedRNA) {
    return rna.getCoreSequence();
  }

  let sequence = rna.getSequence();
  // Remove poly-A tail if present
  sequence = sequence.replace(POLY_A_TAIL_PATTERN, '');
  return sequence;
}

/**
 * Checks if an RNA molecule is fully processed (has both 5' cap and 3' poly-A tail).
 */
export function isFullyProcessed(rna: RNA): boolean {
  if (rna instanceof ProcessedRNA) {
    return rna.isFullyProcessed();
  }
  return has5PrimeCap(rna) && has3PrimePolyATail(rna);
}

/**
 * Information about RNA processing modifications.
 */
