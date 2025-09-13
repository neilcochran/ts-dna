## Version 0.10.0

  - Add NucleotidePattern search methods: findMatches(), findFirst(), and matchesEitherStrand()
  - Fix line ending consistency issues (CRLF → LF) and update .gitattributes
  - Add Gene class extending DNA with exon/intron structure and splice site validation
  - Add GenomicRegion interface with overlap detection algorithms
  - Add splice site validation utilities with GT-AG consensus sequence checking

## Version 0.9.0

- Add stop codon constants (STOP_CODON_UAA, STOP_CODON_UAG, STOP_CODON_UGA, STOP_CODONS)
- Add biochemical properties to AminoAcid class: molecularWeight, polarity, charge, hydrophobicity, sideChainType
- Add supporting enums: AminoAcidPolarity, AminoAcidCharge, AminoAcidSideChainType
- BREAKING: Remove AminoAcidProperties and AminoAcidName interfaces - consolidated into AminoAcid class
- BREAKING: Reorganize file structure with new folder conventions (enums/, types/, data/, utils/, model/)
- Update file naming conventions: PascalCase.ts for classes, kebab-case.ts for utilities
- Reorganize test files to match new src structure

## Version 0.8.0

- BREAKING: Remove support for empty DNA/RNA objects - sequences now required in constructors
- BREAKING: Update to ES modules with dual ESM/CommonJS support (Node.js >=18.0.0 required)
- Add ValidationResult pattern - no longer throws exceptions for validation violations
- Add static factory methods (DNA.create(), RNA.create()) that return ValidationResult
- Update to modern TypeScript 5.4+ with ES2022 target
- Make objects immutable - remove setSequence() methods
- Update dependencies: Jest 27→29, TypeScript 4.6→5.4, Node types 17→20
- Fixed circular import issue

## Version 0.7.1

- Push updated build to NPM (not pushed in 0.7.0)

## Version 0.7.0

- Add full Regex support to NucleotidePattern

## Version 0.6.0

- Change package to commonjs (remove package.json `"type": "module"`)

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