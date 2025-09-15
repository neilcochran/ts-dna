import { InvalidNucleotidePatternError } from '../../../src/model/errors/InvalidNucleotidePatternError';

describe('InvalidNucleotidePatternError', () => {
    describe('constructor', () => {
        test('creates error with message and nucleotide pattern', () => {
            const message = 'Invalid IUPAC nucleotide pattern';
            const nucleotidePattern = 'AXTG';

            const error = new InvalidNucleotidePatternError(message, nucleotidePattern);

            expect(error.message).toBe(message);
            expect(error.nucleotidePattern).toBe(nucleotidePattern);
        });

        test('extends Error class', () => {
            const error = new InvalidNucleotidePatternError('test', 'AXTG');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(InvalidNucleotidePatternError);
        });

        test('sets error name correctly', () => {
            const error = new InvalidNucleotidePatternError('test', 'AXTG');

            expect(error.name).toBe('Error'); // Default from Error class
        });

        test('preserves stack trace', () => {
            const error = new InvalidNucleotidePatternError('test', 'AXTG');

            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('invalid-nucleotide-pattern-error');
        });
    });

    describe('properties', () => {
        test('nucleotidePattern property is readonly', () => {
            const error = new InvalidNucleotidePatternError('test', 'WRKS');

            expect(error.nucleotidePattern).toBe('WRKS');
            // TypeScript prevents modification at compile time
        });

        test('preserves original message', () => {
            const message = 'IUPAC code X is not recognized';
            const error = new InvalidNucleotidePatternError(message, 'AXTG');

            expect(error.message).toBe(message);
        });
    });

    describe('invalid IUPAC codes', () => {
        test('handles invalid single character codes', () => {
            const error = new InvalidNucleotidePatternError(
                'Invalid IUPAC code X found',
                'X'
            );

            expect(error.nucleotidePattern).toBe('X');
            expect(error.message).toContain('Invalid IUPAC code X');
        });

        test('handles multiple invalid characters', () => {
            const error = new InvalidNucleotidePatternError(
                'Invalid IUPAC codes X, Z found',
                'AXZG'
            );

            expect(error.nucleotidePattern).toBe('AXZG');
            expect(error.message).toContain('X, Z');
        });

        test('handles numbers in patterns', () => {
            const error = new InvalidNucleotidePatternError(
                'Numbers not allowed in IUPAC patterns',
                'A1TG'
            );

            expect(error.nucleotidePattern).toBe('A1TG');
        });

        test('handles special characters in patterns', () => {
            const error = new InvalidNucleotidePatternError(
                'Special characters not allowed in IUPAC patterns',
                'A-TG'
            );

            expect(error.nucleotidePattern).toBe('A-TG');
        });
    });

    describe('valid IUPAC codes in wrong context', () => {
        test('handles DNA-specific codes in RNA context', () => {
            const error = new InvalidNucleotidePatternError(
                'IUPAC code T not valid in RNA context',
                'ATRG'
            );

            expect(error.nucleotidePattern).toBe('ATRG');
            expect(error.message).toContain('not valid in RNA');
        });

        test('handles RNA-specific codes in DNA context', () => {
            const error = new InvalidNucleotidePatternError(
                'IUPAC code U not valid in DNA context',
                'AURG'
            );

            expect(error.nucleotidePattern).toBe('AURG');
            expect(error.message).toContain('not valid in DNA');
        });

        test('handles ambiguous codes in strict context', () => {
            const error = new InvalidNucleotidePatternError(
                'Ambiguous IUPAC codes not allowed in strict mode',
                'ANRG'
            );

            expect(error.nucleotidePattern).toBe('ANRG');
            expect(error.message).toContain('Ambiguous IUPAC codes');
        });
    });

    describe('pattern length and structure errors', () => {
        test('handles empty patterns', () => {
            const error = new InvalidNucleotidePatternError(
                'Pattern cannot be empty',
                ''
            );

            expect(error.nucleotidePattern).toBe('');
            expect(error.nucleotidePattern).toHaveLength(0);
        });

        test('handles too short patterns', () => {
            const error = new InvalidNucleotidePatternError(
                'Pattern must be at least 3 nucleotides long',
                'AT'
            );

            expect(error.nucleotidePattern).toBe('AT');
            expect(error.nucleotidePattern).toHaveLength(2);
        });

        test('handles very long patterns', () => {
            const longPattern = 'A'.repeat(1000) + 'X';
            const error = new InvalidNucleotidePatternError(
                'Pattern too long or contains invalid characters',
                longPattern
            );

            expect(error.nucleotidePattern).toBe(longPattern);
            expect(error.nucleotidePattern).toHaveLength(1001);
        });
    });

    describe('case sensitivity errors', () => {
        test('handles lowercase invalid characters', () => {
            const error = new InvalidNucleotidePatternError(
                'Invalid lowercase character x found',
                'axtg'
            );

            expect(error.nucleotidePattern).toBe('axtg');
        });

        test('handles mixed case with invalid characters', () => {
            const error = new InvalidNucleotidePatternError(
                'Mixed case with invalid character',
                'AxtG'
            );

            expect(error.nucleotidePattern).toBe('AxtG');
        });

        test('handles valid IUPAC codes in wrong case', () => {
            const error = new InvalidNucleotidePatternError(
                'IUPAC codes must be uppercase',
                'wrks'
            );

            expect(error.nucleotidePattern).toBe('wrks');
        });
    });

    describe('whitespace and control character errors', () => {
        test('handles whitespace in patterns', () => {
            const error = new InvalidNucleotidePatternError(
                'Whitespace not allowed in patterns',
                'AT GC'
            );

            expect(error.nucleotidePattern).toBe('AT GC');
        });

        test('handles tabs in patterns', () => {
            const error = new InvalidNucleotidePatternError(
                'Tab characters not allowed in patterns',
                'AT\\tGC'
            );

            expect(error.nucleotidePattern).toBe('AT\\tGC');
        });

        test('handles newlines in patterns', () => {
            const error = new InvalidNucleotidePatternError(
                'Newline characters not allowed in patterns',
                'AT\\nGC'
            );

            expect(error.nucleotidePattern).toBe('AT\\nGC');
        });

        test('handles unicode whitespace', () => {
            const error = new InvalidNucleotidePatternError(
                'Unicode whitespace not allowed',
                'AT GC'  // Non-breaking space
            );

            expect(error.nucleotidePattern).toContain('AT');
            expect(error.nucleotidePattern).toContain('GC');
        });
    });

    describe('unicode and special character handling', () => {
        test('handles unicode characters', () => {
            const error = new InvalidNucleotidePatternError(
                'Unicode characters not allowed in IUPAC patterns',
                'AT🧬GC'
            );

            expect(error.nucleotidePattern).toBe('AT🧬GC');
        });

        test('handles accented characters', () => {
            const error = new InvalidNucleotidePatternError(
                'Accented characters not valid IUPAC codes',
                'ÀTGC'
            );

            expect(error.nucleotidePattern).toBe('ÀTGC');
        });

        test('handles mathematical symbols', () => {
            const error = new InvalidNucleotidePatternError(
                'Mathematical symbols not allowed',
                'AT±GC'
            );

            expect(error.nucleotidePattern).toBe('AT±GC');
        });
    });

    describe('error message handling', () => {
        test('handles empty error message', () => {
            const error = new InvalidNucleotidePatternError('', 'AXTG');

            expect(error.message).toBe('');
            expect(error.nucleotidePattern).toBe('AXTG');
        });

        test('handles complex error messages', () => {
            const complexMessage = 'Invalid IUPAC nucleotide pattern "AXTG" contains invalid character "X" at position 1. Valid IUPAC codes are: A, C, G, T, U, R, Y, S, W, K, M, B, D, H, V, N.';
            const error = new InvalidNucleotidePatternError(complexMessage, 'AXTG');

            expect(error.message).toBe(complexMessage);
            expect(error.message).toContain('position 1');
            expect(error.message).toContain('A, C, G, T, U');
        });

        test('handles multiline error messages', () => {
            const multilineMessage = `Invalid nucleotide pattern detected:
            Pattern: AXTG
            Invalid character: X
            Position: 1
            Suggestion: Use R for purine (A or G)`;
            const error = new InvalidNucleotidePatternError(multilineMessage, 'AXTG');

            expect(error.message).toBe(multilineMessage);
            expect(error.message).toContain('\n');
        });
    });

    describe('IUPAC code validation context', () => {
        test('handles invalid degeneracy codes', () => {
            const error = new InvalidNucleotidePatternError(
                'Invalid degeneracy code Q found',
                'AQTG'
            );

            expect(error.nucleotidePattern).toBe('AQTG');
            expect(error.message).toContain('degeneracy code Q');
        });

        test('handles partial IUPAC code matching', () => {
            const error = new InvalidNucleotidePatternError(
                'Character looks like IUPAC code but is invalid',
                'AOTG'  // O looks like 0
            );

            expect(error.nucleotidePattern).toBe('AOTG');
        });

        test('handles gap characters in wrong context', () => {
            const error = new InvalidNucleotidePatternError(
                'Gap character - not allowed in search patterns',
                'AT-GC'
            );

            expect(error.nucleotidePattern).toBe('AT-GC');
        });
    });

    describe('serialization and inspection', () => {
        test('can be stringified', () => {
            const error = new InvalidNucleotidePatternError('Test error', 'AXTG');
            const stringified = error.toString();

            expect(stringified).toContain('Error: Test error');
        });

        test('preserves all properties', () => {
            const error = new InvalidNucleotidePatternError('Test error', 'AXTG');

            const properties = Object.getOwnPropertyNames(error);
            expect(properties).toContain('nucleotidePattern');
            expect(properties).toContain('message');
        });

        test('properties are enumerable', () => {
            const error = new InvalidNucleotidePatternError('Test error', 'AXTG');

            const enumerable = Object.keys(error);
            expect(enumerable).toContain('nucleotidePattern');
        });
    });

    describe('error catching and handling', () => {
        test('can be caught as Error', () => {
            try {
                throw new InvalidNucleotidePatternError('Test', 'AXTG');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(InvalidNucleotidePatternError);
            }
        });

        test('can be caught and type checked', () => {
            try {
                throw new InvalidNucleotidePatternError('Test', 'AXTG');
            } catch (error) {
                if (error instanceof InvalidNucleotidePatternError) {
                    expect(error.nucleotidePattern).toBe('AXTG');
                } else {
                    fail('Expected InvalidNucleotidePatternError');
                }
            }
        });

        test('maintains type information when thrown', () => {
            const throwAndCatch = () => {
                try {
                    throw new InvalidNucleotidePatternError('Test', 'AXTG');
                } catch (error) {
                    return error;
                }
            };

            const caught = throwAndCatch();
            expect(caught).toBeInstanceOf(InvalidNucleotidePatternError);
            if (caught instanceof InvalidNucleotidePatternError) {
                expect(caught.nucleotidePattern).toBe('AXTG');
            }
        });
    });

    describe('real-world IUPAC pattern scenarios', () => {
        test('handles promoter sequence patterns with errors', () => {
            const error = new InvalidNucleotidePatternError(
                'Invalid character in TATA box pattern',
                'TATAXAW'
            );

            expect(error.nucleotidePattern).toBe('TATAXAW');
            expect(error.message).toContain('TATA box');
        });

        test('handles restriction site patterns with errors', () => {
            const error = new InvalidNucleotidePatternError(
                'Invalid character in EcoRI recognition site',
                'GAXTXC'
            );

            expect(error.nucleotidePattern).toBe('GAXTXC');
        });

        test('handles consensus sequence patterns', () => {
            const error = new InvalidNucleotidePatternError(
                'Invalid consensus sequence pattern',
                'CGXRNYKG'
            );

            expect(error.nucleotidePattern).toBe('CGXRNYKG');
        });

        test('handles splice site patterns', () => {
            const error = new InvalidNucleotidePatternError(
                'Invalid character in splice site pattern',
                'GTXAGT'
            );

            expect(error.nucleotidePattern).toBe('GTXAGT');
        });
    });

    describe('comparison with other error types', () => {
        test('different from generic Error', () => {
            const patternError = new InvalidNucleotidePatternError('Pattern error', 'AXTG');
            const genericError = new Error('Generic error');

            expect(patternError).toBeInstanceOf(InvalidNucleotidePatternError);
            expect(genericError).not.toBeInstanceOf(InvalidNucleotidePatternError);
            expect(patternError).toBeInstanceOf(Error);
            expect(genericError).toBeInstanceOf(Error);
        });

        test('has additional properties compared to Error', () => {
            const patternError = new InvalidNucleotidePatternError('Pattern error', 'AXTG');
            const genericError = new Error('Generic error');

            expect('nucleotidePattern' in patternError).toBe(true);
            expect('nucleotidePattern' in genericError).toBe(false);
        });
    });

    describe('edge cases and boundary conditions', () => {
        test('handles single character patterns', () => {
            const error = new InvalidNucleotidePatternError(
                'Single character pattern invalid',
                'X'
            );

            expect(error.nucleotidePattern).toBe('X');
            expect(error.nucleotidePattern).toHaveLength(1);
        });

        test('handles null-like strings', () => {
            const error = new InvalidNucleotidePatternError(
                'Invalid null-like pattern',
                'null'
            );

            expect(error.nucleotidePattern).toBe('null');
        });

        test('handles undefined-like strings', () => {
            const error = new InvalidNucleotidePatternError(
                'Invalid undefined-like pattern',
                'undefined'
            );

            expect(error.nucleotidePattern).toBe('undefined');
        });

        test('handles boolean-like strings', () => {
            const error = new InvalidNucleotidePatternError(
                'Invalid boolean-like pattern',
                'true'
            );

            expect(error.nucleotidePattern).toBe('true');
        });
    });
});