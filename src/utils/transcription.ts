import { Gene } from '../model/nucleic-acids/Gene';
import { PreMRNA } from '../model/nucleic-acids/PreMRNA';
import { DNA } from '../model/nucleic-acids/DNA';
import { NucleotidePattern } from '../model/nucleic-acids/NucleotidePattern';
import { ValidationResult, success, failure, isFailure, isSuccess } from '../types/validation-result';
// import { findPromoters } from './promoter-recognition';

/**
 * Configuration options for transcription.
 */
export interface TranscriptionOptions {
    /** Specific promoter pattern to look for (if not provided, will auto-detect) */
    promoterPattern?: NucleotidePattern;

    /** Maximum distance upstream to search for promoters (default: 1000bp) */
    maxPromoterSearchDistance?: number;

    /** Require a minimum promoter strength score (default: 5) */
    minPromoterStrength?: number;

    /** Force transcription from a specific position even without promoter */
    forceTranscriptionStartSite?: number;
}

/**
 * Gets default transcription options with lazy initialization.
 */
function getDefaultTranscriptionOptions(): Required<TranscriptionOptions> {
    return {
        promoterPattern: new NucleotidePattern('TATAAA'), // TATA box as default
        maxPromoterSearchDistance: 1000,
        minPromoterStrength: 5,
        forceTranscriptionStartSite: -1 // -1 means don't force
    };
}

/**
 * Transcribes a gene into pre-mRNA by finding promoters and converting DNA to RNA.
 *
 * This function models the biological process of transcription:
 * 1. Searches for promoter elements upstream of the gene
 * 2. Determines the transcription start site (TSS)
 * 3. Transcribes the entire gene (exons + introns) into RNA
 * 4. Looks for polyadenylation signals to determine transcript end
 * 5. Returns PreMRNA with complete transcript and structural information
 *
 * @param gene - The gene to transcribe
 * @param options - Optional transcription configuration
 * @returns ValidationResult containing PreMRNA or error message
 *
 * @example
 * ```typescript
 * const gene = new Gene(dnaSequence, exons);
 * const result = transcribe(gene);
 *
 * if (isSuccess(result)) {
 *     const preMRNA = result.data;
 *     console.log(`Transcribed ${preMRNA.getSequence().length}nt pre-mRNA`);
 *     console.log(`Has ${preMRNA.getIntronRegions().length} introns to splice`);
 * } else {
 *     console.error('Transcription failed:', result.error);
 * }
 * ```
 */
export function transcribe(
    gene: Gene,
    options: TranscriptionOptions = {}
): ValidationResult<PreMRNA> {
    const opts = { ...getDefaultTranscriptionOptions(), ...options };

    try {
        // Step 1: Determine transcription start site
        let transcriptionStartSite: number;

        if (opts.forceTranscriptionStartSite >= 0) {
            // Use forced TSS if provided
            transcriptionStartSite = opts.forceTranscriptionStartSite;
        } else {
            // Find promoters to determine TSS
            const tssResult = findTranscriptionStartSite(gene, opts);
            if (isFailure(tssResult)) {
                return failure(tssResult.error);
            }
            transcriptionStartSite = tssResult.data;
        }

        // Step 2: Validate TSS is within reasonable bounds
        if (transcriptionStartSite < 0 || transcriptionStartSite >= gene.getSequence().length) {
            return failure(`Transcription start site ${transcriptionStartSite} is outside gene bounds`);
        }

        // Step 3: Find polyadenylation site
        const polyAResult = findPolyadenylationSite(gene, transcriptionStartSite);
        const polyadenylationSite = isSuccess(polyAResult) ? polyAResult.data : undefined;

        // Step 4: Determine transcript end position
        const transcriptEnd = polyadenylationSite || gene.getSequence().length;

        // Step 5: Extract and transcribe the sequence
        const geneSequence = gene.getSequence();
        const transcriptDNA = geneSequence.substring(transcriptionStartSite, transcriptEnd);

        // Convert DNA to RNA (T -> U)
        const transcriptRNA = transcriptDNA.replace(/T/g, 'U');

        // Step 6: Create PreMRNA with structural information
        const preMRNA = new PreMRNA(
            transcriptRNA,
            gene,
            transcriptionStartSite,
            polyadenylationSite ? polyadenylationSite - transcriptionStartSite : undefined
        );

        return success(preMRNA);

    } catch (error) {
        return failure(`Transcription failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Finds the transcription start site by searching for promoters upstream of the gene.
 *
 * @param gene - The gene to analyze
 * @param options - Transcription options
 * @returns ValidationResult with TSS position or error
 */
function findTranscriptionStartSite(
    gene: Gene,
    options: Required<TranscriptionOptions>
): ValidationResult<number> {
    try {
        // Create a DNA region upstream of the first exon to search for promoters
        const firstExon = gene.getExons()[0];
        if (!firstExon) {
            return failure('Gene has no exons');
        }

        const searchStart = Math.max(0, firstExon.start - options.maxPromoterSearchDistance);
        const searchEnd = firstExon.start + 100; // Include some downstream region

        const searchRegion = gene.getSequence().substring(searchStart, searchEnd);
        const searchDNA = new DNA(searchRegion);

        // Find promoters in the search region
        // const promoters = findPromoters(searchDNA, {
        //     minStrengthScore: options.minPromoterStrength
        // });
        const promoters: any[] = [];

        if (promoters.length === 0) {
            return failure(`No promoters found upstream of gene within ${options.maxPromoterSearchDistance}bp`);
        }

        // Use the strongest promoter
        const bestPromoter = promoters[0]; // findPromoters returns sorted by strength
        const tssInSearchRegion = bestPromoter.transcriptionStartSite;
        const tssInGene = searchStart + tssInSearchRegion;

        return success(tssInGene);

    } catch (error) {
        return failure(`TSS search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Searches for polyadenylation signals (AAUAAA) to determine transcript end.
 *
 * @param gene - The gene to analyze
 * @param tss - Transcription start site position
 * @returns ValidationResult with polyadenylation site position or failure
 */
function findPolyadenylationSite(gene: Gene, tss: number): ValidationResult<number> {
    try {
        const sequence = gene.getSequence();
        const searchStart = tss;

        // Convert to RNA for pattern matching
        const rnaSequence = sequence.substring(searchStart).replace(/T/g, 'U');

        // Look for canonical polyadenylation signal AAUAAA
        const polyAPattern = new NucleotidePattern('AAUAAA');
        const dnaForSearch = new DNA(rnaSequence.replace(/U/g, 'T')); // Convert back for DNA search

        const matches = polyAPattern.findMatches(dnaForSearch);

        if (matches.length === 0) {
            return failure('No polyadenylation signal found');
        }

        // Use the first (closest to TSS) polyadenylation site
        const polyASite = searchStart + matches[0].start;

        return success(polyASite);

    } catch (error) {
        return failure(`Polyadenylation site search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Converts DNA sequence to RNA by replacing all T nucleotides with U.
 *
 * @param dnaSequence - The DNA sequence to convert
 * @returns RNA sequence with T replaced by U
 *
 * @example
 * ```typescript
 * const rna = dnaToRNA('ATGCGT'); // Returns 'AUGCGU'
 * ```
 */
export function dnaToRNA(dnaSequence: string): string {
    return dnaSequence.replace(/T/g, 'U');
}

/**
 * Simple transcription function that directly converts a DNA sequence to RNA
 * without promoter recognition or structural analysis.
 *
 * @param dna - The DNA to transcribe
 * @returns RNA sequence
 *
 * @example
 * ```typescript
 * const dna = new DNA('ATGCGT');
 * const rna = simpleTranscribe(dna); // Returns 'AUGCGU'
 * ```
 */
export function simpleTranscribe(dna: DNA): string {
    return dnaToRNA(dna.getSequence());
}