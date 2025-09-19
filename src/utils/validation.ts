import { NucleicAcidType } from '../enums/nucleic-acid-type';
import { ValidationResult, success, failure, unwrap } from '../types/validation-result';

// Re-export for convenience
export { unwrap };

/**
 * Given a string sequence and a nucleic acid type, check if the sequence is valid
 *
 * @param sequence - The sequence to validate
 *
 * @param nucleicAcidType - The type of nucleic acid of the given sequence
 *
 * @returns True if the sequence if valid, false otherwise
 *
 * @example
 * ```typescript
 *  //pass a valid DNA sequence
 *  isValidNucleicAcid('ATTCG', NucleicAcidType.DNA); //returns true
 *
 *  //pass a valid RNA sequence
 *  isValidNucleicAcid('AUUCG', NucleicAcidType.RNA); //returns true
 *
 *  //pass an invalid sequence (regardless of type)
 *  isValidNucleicAcid('XYZ', NucleicAcidType.RNA); //returns false
 *
 *  //pass a valid RNA sequence, but the wrong type (DNA)
 *  isValidNucleicAcid('UUUA', NucleicAcidType.DNA); //returns false
 * ```
 */
export const isValidNucleicAcid = (sequence: string, nucleicAcidType: NucleicAcidType): boolean => {
  if (!sequence || sequence.length === 0) {
    return false;
  }

  let regex = undefined;
  switch (nucleicAcidType) {
    case NucleicAcidType.DNA:
      regex = /^[AaTtCcGg]+$/;
      break;
    case NucleicAcidType.RNA:
      regex = /^[AaUuCcGg]+$/;
      break;
  }
  return regex.test(sequence);
};

/**
 * Validates and normalizes a nucleic acid sequence, returning a ValidationResult
 *
 * @param sequence - The sequence to validate
 * @param nucleicAcidType - The type of nucleic acid
 *
 * @returns ValidationResult with normalized sequence (uppercase) or detailed error message
 *
 * @example
 * ```typescript
 *  validateNucleicAcid('atcg', NucleicAcidType.DNA);
 *  // returns { success: true, data: 'ATCG' }
 *
 *  validateNucleicAcid('', NucleicAcidType.DNA);
 *  // returns { success: false, error: 'Sequence cannot be empty' }
 *
 *  validateNucleicAcid('ATUX', NucleicAcidType.DNA);
 *  // returns { success: false, error: 'Invalid DNA sequence: contains invalid characters U, X' }
 * ```
 */
export const validateNucleicAcid = (
  sequence: string,
  nucleicAcidType: NucleicAcidType,
): ValidationResult<string> => {
  if (!sequence || sequence.length === 0) {
    return failure('Sequence cannot be empty');
  }

  const upperSequence = sequence.toUpperCase();
  const validChars = nucleicAcidType === NucleicAcidType.DNA ? 'ATCG' : 'AUCG';
  const invalidChars = [...upperSequence].filter(char => !validChars.includes(char));

  if (invalidChars.length > 0) {
    const uniqueInvalidChars = [...new Set(invalidChars)].join(', ');
    const typeStr = nucleicAcidType === NucleicAcidType.DNA ? 'DNA' : 'RNA';
    return failure(
      `Invalid ${typeStr} sequence: contains invalid characters ${uniqueInvalidChars}`,
    );
  }

  return success(upperSequence);
};
