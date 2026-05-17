/**
 * Module-private trusted constructor for {@link PreMRNA}, plus the coordinate-translation
 * helpers it composes. Reserved for `transcription/`-internal callers (the `transcribe`
 * pipeline) that already know the inputs are well-formed.
 *
 * Not re-exported from `src/transcription/index.ts`; package consumers reach the validated
 * construction path through {@link parsePreMRNA} (reconstruction) or the `transcribe`
 * pipeline.
 *
 * @internal
 */

import type { RNA } from '../sequence/index.js';
import {
  transcriptCoord,
  type GeneCoord,
  type GenomicRegion,
  type TranscriptCoord,
} from '../coordinates/index.js';
import type { Gene } from '../gene/index.js';
import { PreMRNA } from './PreMRNA.js';
import { UNSAFE_PREMRNA_KEY } from './internal-keys.js';

/**
 * Constructs a {@link PreMRNA} without re-running the biological-invariant validation done
 * by `transcribe`. Translates `sourceGene.exons` into transcript coordinates and derives the
 * corresponding intron regions from the gaps between adjacent transcript-coordinate exons.
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
    if (current === undefined || next === undefined) {
      continue;
    }
    if (current.end < next.start) {
      introns.push({ start: current.end, end: next.start, name: undefined });
    }
  }
  return introns;
}
