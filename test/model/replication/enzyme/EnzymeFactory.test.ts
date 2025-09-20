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

    test('handles non-Error exceptions in enzyme creation', async () => {
      // Test the String(error) branches in catch blocks by temporarily mocking modules

      // Mock Helicase module to throw string error
      jest.doMock('../../../../src/model/replication/enzyme/Helicase.js', () => ({
        Helicase: jest.fn(() => {
          throw 'string error';
        }),
      }));

      // Clear module cache and re-import to get mocked version
      jest.resetModules();
      const { EnzymeFactory: MockedEnzymeFactory } = await import(
        '../../../../src/model/replication/enzyme/EnzymeFactory.js'
      );

      const helicaseResult = MockedEnzymeFactory.createHelicase(0);
      expect(isFailure(helicaseResult)).toBe(true);
      if (isFailure(helicaseResult)) {
        expect(helicaseResult.error).toContain('Failed to create helicase');
        expect(helicaseResult.error).toContain('string error');
      }

      // Test primase with object error
      jest.doMock('../../../../src/model/replication/enzyme/Primase.js', () => ({
        Primase: jest.fn(() => {
          throw { message: 'object error' };
        }),
      }));

      jest.resetModules();
      const { EnzymeFactory: MockedEnzymeFactory2 } = await import(
        '../../../../src/model/replication/enzyme/EnzymeFactory.js'
      );

      const primaseResult = MockedEnzymeFactory2.createPrimase(0);
      expect(isFailure(primaseResult)).toBe(true);
      if (isFailure(primaseResult)) {
        expect(primaseResult.error).toContain('Failed to create primase');
        expect(primaseResult.error).toContain('[object Object]');
      }

      // Test polymerase with null error
      jest.doMock('../../../../src/model/replication/enzyme/DNAPolymerase.js', () => ({
        DNAPolymerase: jest.fn(() => {
          throw null;
        }),
      }));

      jest.resetModules();
      const { EnzymeFactory: MockedEnzymeFactory3 } = await import(
        '../../../../src/model/replication/enzyme/EnzymeFactory.js'
      );

      const polymeraseResult = MockedEnzymeFactory3.createPolymerase(0);
      expect(isFailure(polymeraseResult)).toBe(true);
      if (isFailure(polymeraseResult)) {
        expect(polymeraseResult.error).toContain('Failed to create polymerase');
        expect(polymeraseResult.error).toContain('null');
      }

      // Test ligase with undefined error
      jest.doMock('../../../../src/model/replication/enzyme/DNALigase.js', () => ({
        DNALigase: jest.fn(() => {
          throw undefined;
        }),
      }));

      jest.resetModules();
      const { EnzymeFactory: MockedEnzymeFactory4 } = await import(
        '../../../../src/model/replication/enzyme/EnzymeFactory.js'
      );

      const ligaseResult = MockedEnzymeFactory4.createLigase(0);
      expect(isFailure(ligaseResult)).toBe(true);
      if (isFailure(ligaseResult)) {
        expect(ligaseResult.error).toContain('Failed to create ligase');
        expect(ligaseResult.error).toContain('undefined');
      }

      // Test exonuclease with number error
      jest.doMock('../../../../src/model/replication/enzyme/Exonuclease.js', () => ({
        Exonuclease: jest.fn(() => {
          throw 123;
        }),
      }));

      jest.resetModules();
      const { EnzymeFactory: MockedEnzymeFactory5 } = await import(
        '../../../../src/model/replication/enzyme/EnzymeFactory.js'
      );

      const exonucleaseResult = MockedEnzymeFactory5.createExonuclease(0);
      expect(isFailure(exonucleaseResult)).toBe(true);
      if (isFailure(exonucleaseResult)) {
        expect(exonucleaseResult.error).toContain('Failed to create exonuclease');
        expect(exonucleaseResult.error).toContain('123');
      }

      // Restore all mocks
      jest.dontMock('../../../../src/model/replication/enzyme/Helicase.js');
      jest.dontMock('../../../../src/model/replication/enzyme/Primase.js');
      jest.dontMock('../../../../src/model/replication/enzyme/DNAPolymerase.js');
      jest.dontMock('../../../../src/model/replication/enzyme/DNALigase.js');
      jest.dontMock('../../../../src/model/replication/enzyme/Exonuclease.js');
      jest.resetModules();
    });
  });
});
