## Version 0.5.3
- Correct documentation version number

## Version 0.5.2
- Add `CHANGELOG.md`
- Add examples to `TSDoc` comments using `@example`

## Version 0.5.1
- Update tests to check the error type thrown

## Version 0.5.0
- Add custom error classes (all extending node's `Error`)
- Restrict amino acids to having RNA codons only. Tweak lint script
- Convert `private` class members to `public readonly` where possible
- Move all package scripts to `scripts` directory
- Add `TSDoc` comments documentation
- Use `TypeDoc` to generate HTML documentation from `TSDoc` comments
- Externally host documentation (link in `README.md`)

## Version 0.4.0
- Move all classes to new `model/` directory
- Add nucleotide pattern support
- Add `RNASubType`

## Version 0.3.0
- Update `package.json` to only publish types & built code

## Version 0.2.1
- Update `README.md` with installation instructions

## Version 0.2.0
- Correct package name to `ts-dna`

## Version 0.1.0
- Initial library beta release with core functions, tests, and tooling