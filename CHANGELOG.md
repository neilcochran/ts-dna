# Version 1.3.0
- Fix coordinate system mismatch in splice site validation

# Version 1.2.0
- Remove CJS and dual build support, targeting only ESM

# Version 1.0.3
- Added strict TypeScript linting rules for explicit return types, nullish coalescing, and enhanced type safety
- Remove RNASubType since we now have classes for RNA types
- Correct Polypeptide constructor to take in MRNA not RNA

# Version 1.0.2

- Update the README to use the shields.io npm version badge to avoid long caching issues

## Version 1.0.1

- Update README documentation link to point to GitHub pages

## Version 1.0.0

- First full release!
- Added more biological constants
- Exported a few missing items
- Change documentation output dir to `docs` for use with GitHub pages

## Version 0.16.0

- Add realistic gene test sequences with proper biological constraints (20bp+ introns, valid splice sites, start/stop codons)
- Establish biologically accurate test foundation for Gene → Pre-mRNA → mRNA → Protein pipeline
- Validate end-to-end molecular biology modeling with scientifically accurate splice site recognition and processing

## Version 0.15.0

- Add complete mature mRNA processing pipeline with processRNA() function that handles 5' capping, splicing, polyadenylation, and coding sequence identification
- Add MRNA class extending RNA with mature mRNA properties including 5' cap status, poly-A tail, coding boundaries, and UTR analysis
- Add comprehensive biological validation ensuring proper GT...AG splice sites and in-frame stop codons for realistic molecular biology modeling

## Version 0.14.0

- Add alternative splicing system with SpliceVariant support for generating multiple protein isoforms from single genes
- Add comprehensive splicing validation and processing functions (spliceRNAWithVariant, processAllSplicingVariants, validateSpliceVariant)
- Remove redundant utility functions (convertNucleicAcid, validateGeneSpliceSites, analyzeRNAProcessing) for cleaner API design

## Version 0.13.0

- Add complete RNA processing pipeline with polyadenylation signal recognition (AAUAAA variants), RNA splicing with GT...AG consensus validation, 5' capping, and 3' polyadenylation
- Add ProcessedRNA class to properly handle RNA modifications as properties rather than sequence manipulation
- Add Gene class with exon/intron validation, promoter recognition (TATA, Inr, DPE elements), and realistic transcription workflow from DNA → Pre-mRNA → mature RNA
- Add AminoAcidData interface and refactor amino acid system with unified SLC_AMINO_ACID_DATA_MAP as single source of truth

## Version 0.12.0

- Add PreMRNA class for pre-messenger RNA with transcription metadata and processing support
- Add complete transcription system with promoter recognition, TSS determination, and polyadenylation signal detection
- Backfilled missing unit test coverage for some model classes.

## Version 0.11.0

- Add PromoterElement class for individual promoter sequence elements (TATA, Inr, DPE, CAAT, GC boxes)
- Add Promoter class for complete promoters with multiple elements and strength scoring
- Add findPromoters() function for promoter recognition in DNA sequences
- Add identifyTSS() function for transcription start site prediction

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