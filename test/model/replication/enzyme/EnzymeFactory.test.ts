import {
  Helicase,
  Primase,
  DNAPolymerase,
  DNALigase,
  Exonuclease,
  EnzymeFactory,
} from '../../../../src/model/replication/enzyme/index.js';
import { EnzymeType } from '../../../../src/types/replication-types.js';
import { isSuccess, isFailure } from '../../../../src/types/validation-result.js';

describe('EnzymeFactory', () => {
  describe('enzyme creation with validation', () => {
    test('createHelicase succeeds with valid position', () => {
      const result = EnzymeFactory.createHelicase(100);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(Helicase);
        expect(result.data.position).toBe(100);
        expect(result.data.type).toBe(EnzymeType.HELICASE);
      }
    });

    test('createHelicase fails with invalid position', () => {
      const result = EnzymeFactory.createHelicase(-1);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain('Failed to create helicase');
        expect(result.error).toContain('Enzyme position must be non-negative');
      }
    });

    test('createPrimase succeeds with valid position', () => {
      const result = EnzymeFactory.createPrimase(50);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(Primase);
        expect(result.data.position).toBe(50);
        expect(result.data.type).toBe(EnzymeType.PRIMASE);
      }
    });

    test('createPolymerase succeeds with default variant', () => {
      const result = EnzymeFactory.createPolymerase(200);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(DNAPolymerase);
        expect(result.data.variant).toBe('PolIII');
        expect(result.data.position).toBe(200);
      }
    });

    test('createPolymerase succeeds with specified variant', () => {
      const result = EnzymeFactory.createPolymerase(150, 'PolI');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.variant).toBe('PolI');
      }
    });

    test('createLigase succeeds with valid position', () => {
      const result = EnzymeFactory.createLigase(300);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(DNALigase);
        expect(result.data.position).toBe(300);
        expect(result.data.type).toBe(EnzymeType.LIGASE);
      }
    });

    test('createExonuclease succeeds with valid position', () => {
      const result = EnzymeFactory.createExonuclease(400);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeInstanceOf(Exonuclease);
        expect(result.data.position).toBe(400);
        expect(result.data.type).toBe(EnzymeType.EXONUCLEASE);
      }
    });

    test('all factory methods fail with negative positions', () => {
      expect(isFailure(EnzymeFactory.createHelicase(-1))).toBe(true);
      expect(isFailure(EnzymeFactory.createPrimase(-1))).toBe(true);
      expect(isFailure(EnzymeFactory.createPolymerase(-1))).toBe(true);
      expect(isFailure(EnzymeFactory.createLigase(-1))).toBe(true);
      expect(isFailure(EnzymeFactory.createExonuclease(-1))).toBe(true);
    });

    test('handles non-Error exceptions in enzyme creation', () => {
      // Test the String(error) branches in catch blocks by mocking constructors
      // We'll use jest.spyOn to mock the constructors temporarily

      // Test helicase with string error
      const helicaseSpy = jest
        .spyOn(require('../../../../src/model/replication/enzyme/Helicase'), 'Helicase')
        .mockImplementationOnce(() => {
          throw 'string error';
        });

      const helicaseResult = EnzymeFactory.createHelicase(0);
      expect(isFailure(helicaseResult)).toBe(true);
      if (isFailure(helicaseResult)) {
        expect(helicaseResult.error).toContain('Failed to create helicase');
        expect(helicaseResult.error).toContain('string error');
      }
      helicaseSpy.mockRestore();

      // Test primase with object error
      const primaseSpy = jest
        .spyOn(require('../../../../src/model/replication/enzyme/Primase'), 'Primase')
        .mockImplementationOnce(() => {
          throw { message: 'object error' };
        });

      const primaseResult = EnzymeFactory.createPrimase(0);
      expect(isFailure(primaseResult)).toBe(true);
      if (isFailure(primaseResult)) {
        expect(primaseResult.error).toContain('Failed to create primase');
        expect(primaseResult.error).toContain('[object Object]');
      }
      primaseSpy.mockRestore();

      // Test polymerase with null error
      const polymeraseSpy = jest
        .spyOn(require('../../../../src/model/replication/enzyme/DNAPolymerase'), 'DNAPolymerase')
        .mockImplementationOnce(() => {
          throw null;
        });

      const polymeraseResult = EnzymeFactory.createPolymerase(0);
      expect(isFailure(polymeraseResult)).toBe(true);
      if (isFailure(polymeraseResult)) {
        expect(polymeraseResult.error).toContain('Failed to create polymerase');
        expect(polymeraseResult.error).toContain('null');
      }
      polymeraseSpy.mockRestore();

      // Test ligase with undefined error
      const ligaseSpy = jest
        .spyOn(require('../../../../src/model/replication/enzyme/DNALigase'), 'DNALigase')
        .mockImplementationOnce(() => {
          throw undefined;
        });

      const ligaseResult = EnzymeFactory.createLigase(0);
      expect(isFailure(ligaseResult)).toBe(true);
      if (isFailure(ligaseResult)) {
        expect(ligaseResult.error).toContain('Failed to create ligase');
        expect(ligaseResult.error).toContain('undefined');
      }
      ligaseSpy.mockRestore();

      // Test exonuclease with number error
      const exonucleaseSpy = jest
        .spyOn(require('../../../../src/model/replication/enzyme/Exonuclease'), 'Exonuclease')
        .mockImplementationOnce(() => {
          throw 123;
        });

      const exonucleaseResult = EnzymeFactory.createExonuclease(0);
      expect(isFailure(exonucleaseResult)).toBe(true);
      if (isFailure(exonucleaseResult)) {
        expect(exonucleaseResult.error).toContain('Failed to create exonuclease');
        expect(exonucleaseResult.error).toContain('123');
      }
      exonucleaseSpy.mockRestore();
    });
  });
});
