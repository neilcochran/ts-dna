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
  deriveIntronsFromExons,
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
  const intronRegions = deriveIntronsFromExons(exonRegions);
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
