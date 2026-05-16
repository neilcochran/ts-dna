/**
 * Net charge of an amino acid at physiological pH (7.0).
 */
export enum AminoAcidCharge {
  /** Net positive side-chain charge (Arg, Lys, His). */
  POSITIVE = 'positive',
  /** Net negative side-chain charge (Asp, Glu). */
  NEGATIVE = 'negative',
  /** No net charge on the side chain. */
  NEUTRAL = 'neutral',
}

/**
 * Side-chain polarity classification for an amino acid.
 */
export enum AminoAcidPolarity {
  /** Polar side chain (e.g. Ser, Thr, Asn, Gln, Tyr, Cys). */
  POLAR = 'polar',
  /** Nonpolar (hydrophobic) side chain (e.g. Ala, Val, Leu, Ile, Met, Phe, Trp). */
  NONPOLAR = 'nonpolar',
}

/**
 * Chemical classification of an amino-acid side chain.
 */
export enum AminoAcidSideChainType {
  /** Aliphatic side chain (Ala, Val, Leu, Ile, Gly). */
  ALIPHATIC = 'aliphatic',
  /** Aromatic side chain (Phe, Tyr, Trp). */
  AROMATIC = 'aromatic',
  /** Basic side chain (Lys, Arg, His). */
  BASIC = 'basic',
  /** Acidic side chain (Asp, Glu). */
  ACIDIC = 'acidic',
  /** Amide side chain (Asn, Gln). */
  AMIDE = 'amide',
  /** Sulfur-containing side chain (Cys, Met). */
  SULFUR_CONTAINING = 'sulfur-containing',
  /** Hydroxyl-containing side chain (Ser, Thr). */
  HYDROXYL_CONTAINING = 'hydroxyl-containing',
  /** Imino side chain (Pro). */
  IMINO = 'imino',
}
