/**
 * Factory class for creating enzymes with validation.
 *
 * Provides static methods to create DNA replication enzymes with
 * proper error handling and validation.
 */

import { Result, success, failure } from '../../../result/index.js';
import { Helicase } from './Helicase.js';
import { Primase } from './Primase.js';
import { DNAPolymerase } from './DNAPolymerase.js';
import { DNALigase } from './DNALigase.js';
import { Exonuclease } from './Exonuclease.js';

/**
 * Factory class for creating enzymes with validation.
 */
export class EnzymeFactory {
  /**
   * Creates a helicase with validation.
   */
  static createHelicase(position: number): Result<Helicase> {
    try {
      return success(new Helicase(position));
    } catch (error) {
      return failure(
        `Failed to create helicase: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Creates a primase with validation.
   */
  static createPrimase(position: number): Result<Primase> {
    try {
      return success(new Primase(position));
    } catch (error) {
      return failure(
        `Failed to create primase: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Creates a DNA polymerase with validation.
   */
  static createPolymerase(
    position: number,
    variant: 'PolI' | 'PolII' | 'PolIII' = 'PolIII',
  ): Result<DNAPolymerase> {
    try {
      return success(new DNAPolymerase(position, variant));
    } catch (error) {
      return failure(
        `Failed to create polymerase: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Creates a DNA ligase with validation.
   */
  static createLigase(position: number): Result<DNALigase> {
    try {
      return success(new DNALigase(position));
    } catch (error) {
      return failure(
        `Failed to create ligase: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Creates an exonuclease with validation.
   */
  static createExonuclease(position: number): Result<Exonuclease> {
    try {
      return success(new Exonuclease(position));
    } catch (error) {
      return failure(
        `Failed to create exonuclease: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
