import { Result, success, failure, isFailure } from '../result/index.js';
import { parseRNA } from '../sequence/index.js';
import type { RNA } from '../sequence/index.js';
import {
  geneCoord,
  transcriptCoord,
  type GeneCoord,
  type GenomicRegion,
  type TranscriptCoord,
} from '../coordinates/index.js';
import type { Gene } from '../gene/index.js';
import { PreMRNA } from './PreMRNA.js';
import { UNSAFE_PREMRNA_KEY } from './internal-keys.js';
import type { TranscriptionError } from './errors.js';

/**
 * Reconstructs a {@link PreMRNA} from saved data.
 *
 * Intended for callers holding a previously-serialized transcript (test fixtures, persisted
 * state). The normal path to a pre-mRNA is the `transcribe(gene)` pipeline, which derives all
 * inputs from the gene definition and enforces the biological invariants (TSS upstream of
 * every exon start, TSS inside the gene sequence). Those invariants are deliberately *not*
 * re-enforced here: a reconstruction may legitimately describe a partial-first-exon
 * transcript (TSS downstream of an exon start) or a synthetic edge case (TSS past the gene
 * end). The exon/intron translation is forgiving in both directions: exons that fall entirely
 * outside the transcript window are dropped; partial exons are clamped at use sites.
 *
 * Validation:
 * 1. The RNA sequence string is parsed via {@link parseRNA}.
 * 2. The TSS must be a finite non-negative integer.
 *
 * @param sequence - The RNA transcript string (will be parsed)
 * @param sourceGene - The gene that was transcribed
 * @param transcriptionStartSite - Gene-relative TSS (will be branded)
 * @param polyadenylationSite - Optional transcript-relative cleavage site (will be branded)
 * @returns `Result<PreMRNA, TranscriptionError>`
 *
 * @example
 * ```typescript
 * const gene = parseGene('ATGCCCGGGAAATTTAAA', [{ start: 0, end: 18 }]).unwrap();
 * const preMRNA = parsePreMRNA('AUGCCCGGGAAAUUUAAA', gene, 0).unwrap();
 * ```
 */
export function parsePreMRNA(
  sequence: string,
  sourceGene: Gene,
  transcriptionStartSite: number,
  polyadenylationSite?: number,
): Result<PreMRNA, TranscriptionError> {
  const rnaResult = parseRNA(sequence);
  if (isFailure(rnaResult)) {
    return failure({
      kind: 'tss-out-of-bounds',
      tss: transcriptionStartSite,
      sequenceLength: 0,
    });
  }
  const rna = rnaResult.data;

  if (!Number.isFinite(transcriptionStartSite) || transcriptionStartSite < 0) {
    return failure({
      kind: 'tss-out-of-bounds',
      tss: transcriptionStartSite,
      sequenceLength: sourceGene.sequence.sequence.length,
    });
  }

  const tss = geneCoord(transcriptionStartSite);
  const polyA =
    polyadenylationSite === undefined ? undefined : transcriptCoord(polyadenylationSite);
  return success(unsafePreMRNA(rna, sourceGene, tss, polyA));
}

/**
 * Constructs a {@link PreMRNA} without re-running validation. Reserved for
 * `transcription/`-internal callers (the {@link parsePreMRNA} parser, the `transcribe`
 * pipeline). Not exported from the package barrel.
 *
 * Translates `sourceGene.exons` into transcript coordinates and derives the corresponding
 * intron regions from the gaps between adjacent transcript-coordinate exons.
 *
 * @param sequence - Validated RNA transcript
 * @param sourceGene - The gene that was transcribed
 * @param transcriptionStartSite - Gene-relative TSS (branded)
 * @param polyadenylationSite - Optional transcript-relative cleavage site (branded)
 * @returns A new `PreMRNA`
 *
 * @internal
 */
export function unsafePreMRNA(
  sequence: RNA,
  sourceGene: Gene,
  transcriptionStartSite: GeneCoord,
  polyadenylationSite: TranscriptCoord | undefined,
): PreMRNA {
  const transcriptLength = sequence.sequence.length;
  const exonRegions = translateExonsToTranscript(
    sourceGene.exons,
    transcriptionStartSite,
    transcriptLength,
  );
  const intronRegions = deriveTranscriptIntrons(exonRegions);
  return new PreMRNA(
    sequence,
    sourceGene,
    transcriptionStartSite,
    polyadenylationSite,
    exonRegions,
    intronRegions,
    UNSAFE_PREMRNA_KEY,
  );
}

/**
 * Translates gene-coordinate exons into transcript-coordinate regions.
 *
 * The TSS-relative start is `exon.start - tss`. Exons that fall entirely upstream of the TSS
 * (transformed `end <= 0`) or entirely past the transcript end (transformed `start >= length`)
 * are dropped; partial exons are kept with their out-of-range bound preserved (negative start
 * or oversized end) so downstream consumers (`getCodingSequence`, splicing) can clamp.
 *
 * @param exons - Gene-coordinate exons in source-gene order
 * @param tss - Gene-relative transcription start site
 * @param transcriptLength - Length of the transcript (for filtering downstream-of-end exons)
 * @returns Transcript-coordinate exon regions in source-gene order
 */
function translateExonsToTranscript(
  exons: readonly GenomicRegion<GeneCoord>[],
  tss: GeneCoord,
  transcriptLength: number,
): GenomicRegion<TranscriptCoord>[] {
  const translated: GenomicRegion<TranscriptCoord>[] = [];
  for (const exon of exons) {
    const start = transcriptCoord(exon.start - tss);
    const end = transcriptCoord(exon.end - tss);
    if (end > 0 && start < transcriptLength) {
      translated.push({ start, end, name: exon.name });
    }
  }
  return translated;
}

/**
 * Derives intron regions from a transcript-coordinate exon list.
 *
 * Sorts the exons by `start`, then emits an intron for each adjacent pair where the gap is
 * positive. Intron `name` is left undefined (the historical convention; downstream RNA
 * processing identifies introns by position, not name).
 *
 * @param exons - Transcript-coordinate exon regions
 * @returns Transcript-coordinate intron regions in `start`-ascending order
 */
function deriveTranscriptIntrons(
  exons: readonly GenomicRegion<TranscriptCoord>[],
): GenomicRegion<TranscriptCoord>[] {
  if (exons.length <= 1) {
    return [];
  }
  const sorted = [...exons].sort((a, b) => a.start - b.start);
  const introns: GenomicRegion<TranscriptCoord>[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.end < next.start) {
      introns.push({ start: current.end, end: next.start, name: undefined });
    }
  }
  return introns;
}
