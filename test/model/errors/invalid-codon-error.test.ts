import { InvalidCodonError } from '../../../src/model/errors/InvalidCodonError';

describe('InvalidCodonError', () => {
    describe('constructor', () => {
        test('creates error with message and codon sequence', () => {
            const message = 'Invalid codon sequence';
            const codonSequence = 'ATC';

            const error = new InvalidCodonError(message, codonSequence);

            expect(error.message).toBe(message);
            expect(error.codonSequence).toBe(codonSequence);
        });

        test('extends Error class', () => {
            const error = new InvalidCodonError('test', 'ATC');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(InvalidCodonError);
        });

        test('sets error name correctly', () => {
            const error = new InvalidCodonError('test', 'ATC');

            expect(error.name).toBe('Error'); // Default from Error class
        });

        test('preserves stack trace', () => {
            const error = new InvalidCodonError('test', 'ATC');

            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('invalid-codon-error');
        });
    });

    describe('properties', () => {
        test('codonSequence property is readonly', () => {
            const error = new InvalidCodonError('test', 'AUG');

            expect(error.codonSequence).toBe('AUG');
            // TypeScript prevents modification at compile time
        });

        test('preserves original message', () => {
            const message = 'Codon must be exactly 3 nucleotides long';
            const error = new InvalidCodonError(message, 'AU');

            expect(error.message).toBe(message);
        });
    });

    describe('invalid codon lengths', () => {
        test('handles too short codon sequences', () => {
            const error = new InvalidCodonError(
                'Codon must be exactly 3 nucleotides, got 1',
                'A'
            );

            expect(error.codonSequence).toBe('A');
            expect(error.message).toContain('exactly 3 nucleotides');
        });

        test('handles two nucleotide sequences', () => {
            const error = new InvalidCodonError(
                'Codon must be exactly 3 nucleotides, got 2',
                'AU'
            );

            expect(error.codonSequence).toBe('AU');
            expect(error.codonSequence).toHaveLength(2);
        });

        test('handles too long codon sequences', () => {
            const error = new InvalidCodonError(
                'Codon must be exactly 3 nucleotides, got 4',
                'AUGC'
            );

            expect(error.codonSequence).toBe('AUGC');
            expect(error.codonSequence).toHaveLength(4);
        });

        test('handles very long sequences', () => {
            const longSequence = 'AUGCUGAUC';
            const error = new InvalidCodonError(
                'Codon must be exactly 3 nucleotides, got 9',
                longSequence
            );

            expect(error.codonSequence).toBe(longSequence);
            expect(error.codonSequence).toHaveLength(9);
        });

        test('handles empty codon sequence', () => {
            const error = new InvalidCodonError(
                'Codon cannot be empty',
                ''
            );

            expect(error.codonSequence).toBe('');
            expect(error.codonSequence).toHaveLength(0);
        });
    });

    describe('invalid nucleotides in codons', () => {
        test('handles invalid nucleotides in RNA codons', () => {
            const error = new InvalidCodonError(
                'Invalid nucleotide T found in RNA codon',
                'ATG'
            );

            expect(error.codonSequence).toBe('ATG');
            expect(error.message).toContain('Invalid nucleotide T');
        });

        test('handles special characters in codons', () => {
            const error = new InvalidCodonError(
                'Invalid character - found in codon',
                'AU-'
            );

            expect(error.codonSequence).toBe('AU-');
        });

        test('handles numbers in codons', () => {
            const error = new InvalidCodonError(
                'Invalid character 1 found in codon',
                'AU1'
            );

            expect(error.codonSequence).toBe('AU1');
        });

        test('handles mixed case with invalid characters', () => {
            const error = new InvalidCodonError(
                'Invalid character found in codon',
                'AuX'
            );

            expect(error.codonSequence).toBe('AuX');
        });
    });

    describe('valid RNA codons that cause other errors', () => {
        test('handles unknown codon mapping', () => {
            const error = new InvalidCodonError(
                'Codon NNN does not map to any amino acid',
                'NNN'
            );

            expect(error.codonSequence).toBe('NNN');
            expect(error.message).toContain('does not map');
        });

        test('handles ambiguous codons', () => {
            const error = new InvalidCodonError(
                'Ambiguous codon with multiple possible amino acids',
                'NUN'
            );

            expect(error.codonSequence).toBe('NUN');
        });

        test('handles stop codons in wrong context', () => {
            const error = new InvalidCodonError(
                'Stop codon UAA found in middle of sequence',
                'UAA'
            );

            expect(error.codonSequence).toBe('UAA');
            expect(error.message).toContain('Stop codon');
        });
    });

    describe('edge cases', () => {
        test('handles unicode characters', () => {
            const error = new InvalidCodonError(
                'Invalid unicode character in codon',
                'AU🧬'
            );

            expect(error.codonSequence).toBe('AU🧬');
        });

        test('handles whitespace in codons', () => {
            const error = new InvalidCodonError(
                'Whitespace not allowed in codons',
                'AU '
            );

            expect(error.codonSequence).toBe('AU ');
        });

        test('handles tabs and newlines', () => {
            const error = new InvalidCodonError(
                'Control characters not allowed in codons',
                'AU\\t'
            );

            expect(error.codonSequence).toBe('AU\\t');
        });

        test('handles null-like strings', () => {
            const error = new InvalidCodonError(
                'Invalid null-like codon',
                'null'
            );

            expect(error.codonSequence).toBe('null');
        });
    });

    describe('error message handling', () => {
        test('handles empty error message', () => {
            const error = new InvalidCodonError('', 'AUG');

            expect(error.message).toBe('');
            expect(error.codonSequence).toBe('AUG');
        });

        test('handles complex error messages', () => {
            const complexMessage = 'Codon "AUX" contains invalid nucleotide "X" at position 2. Valid RNA nucleotides are A, U, C, G.';
            const error = new InvalidCodonError(complexMessage, 'AUX');

            expect(error.message).toBe(complexMessage);
            expect(error.message).toContain('position 2');
            expect(error.message).toContain('A, U, C, G');
        });

        test('handles multiline error messages', () => {
            const multilineMessage = `Invalid codon detected:
            Codon: AUX
            Invalid character: X
            Position: 2`;
            const error = new InvalidCodonError(multilineMessage, 'AUX');

            expect(error.message).toBe(multilineMessage);
            expect(error.message).toContain('\n');
        });
    });

    describe('codon context errors', () => {
        test('handles start codon errors', () => {
            const error = new InvalidCodonError(
                'Start codon AUG not found at beginning of sequence',
                'AUG'
            );

            expect(error.codonSequence).toBe('AUG');
            expect(error.message).toContain('Start codon');
        });

        test('handles frameshift errors', () => {
            const error = new InvalidCodonError(
                'Frameshift mutation detected, codon out of frame',
                'UGA'
            );

            expect(error.codonSequence).toBe('UGA');
            expect(error.message).toContain('Frameshift');
        });

        test('handles premature stop codon errors', () => {
            const error = new InvalidCodonError(
                'Premature stop codon UAG found',
                'UAG'
            );

            expect(error.codonSequence).toBe('UAG');
            expect(error.message).toContain('Premature stop');
        });
    });

    describe('serialization and inspection', () => {
        test('can be stringified', () => {
            const error = new InvalidCodonError('Test error', 'AUX');
            const stringified = error.toString();

            expect(stringified).toContain('Error: Test error');
        });

        test('preserves all properties', () => {
            const error = new InvalidCodonError('Test error', 'AUX');

            const properties = Object.getOwnPropertyNames(error);
            expect(properties).toContain('codonSequence');
            expect(properties).toContain('message');
        });

        test('properties are enumerable', () => {
            const error = new InvalidCodonError('Test error', 'AUX');

            const enumerable = Object.keys(error);
            expect(enumerable).toContain('codonSequence');
        });
    });

    describe('error catching and handling', () => {
        test('can be caught as Error', () => {
            try {
                throw new InvalidCodonError('Test', 'AUX');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(InvalidCodonError);
            }
        });

        test('can be caught and type checked', () => {
            try {
                throw new InvalidCodonError('Test', 'AUX');
            } catch (error) {
                if (error instanceof InvalidCodonError) {
                    expect(error.codonSequence).toBe('AUX');
                } else {
                    fail('Expected InvalidCodonError');
                }
            }
        });

        test('maintains type information when thrown', () => {
            const throwAndCatch = () => {
                try {
                    throw new InvalidCodonError('Test', 'AUX');
                } catch (error) {
                    return error;
                }
            };

            const caught = throwAndCatch();
            expect(caught).toBeInstanceOf(InvalidCodonError);
            if (caught instanceof InvalidCodonError) {
                expect(caught.codonSequence).toBe('AUX');
            }
        });
    });

    describe('comparison with other error types', () => {
        test('different from generic Error', () => {
            const codonError = new InvalidCodonError('Codon error', 'AUX');
            const genericError = new Error('Generic error');

            expect(codonError).toBeInstanceOf(InvalidCodonError);
            expect(genericError).not.toBeInstanceOf(InvalidCodonError);
            expect(codonError).toBeInstanceOf(Error);
            expect(genericError).toBeInstanceOf(Error);
        });

        test('has additional properties compared to Error', () => {
            const codonError = new InvalidCodonError('Codon error', 'AUX');
            const genericError = new Error('Generic error');

            expect('codonSequence' in codonError).toBe(true);
            expect('codonSequence' in genericError).toBe(false);
        });
    });

    describe('real-world codon scenarios', () => {
        test('handles common stop codons', () => {
            const stopCodons = ['UAA', 'UAG', 'UGA'];

            stopCodons.forEach(codon => {
                const error = new InvalidCodonError(`Stop codon ${codon} in wrong context`, codon);
                expect(error.codonSequence).toBe(codon);
                expect(error.message).toContain(codon);
            });
        });

        test('handles start codon AUG', () => {
            const error = new InvalidCodonError('Missing start codon', 'AUG');

            expect(error.codonSequence).toBe('AUG');
            expect(error.codonSequence).toHaveLength(3);
        });

        test('handles common amino acid codons', () => {
            const commonCodons = ['UUU', 'CUU', 'UCU', 'UAU', 'UGU', 'UUA'];

            commonCodons.forEach(codon => {
                const error = new InvalidCodonError(`Context error for ${codon}`, codon);
                expect(error.codonSequence).toBe(codon);
                expect(error.codonSequence).toHaveLength(3);
            });
        });
    });
});