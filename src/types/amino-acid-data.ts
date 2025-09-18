import { AminoAcidCharge } from '../enums/amino-acid-charge';
import { AminoAcidPolarity } from '../enums/amino-acid-polarity';
import { AminoAcidSideChainType } from '../enums/amino-acid-side-chain-type';

/**
 * Static properties of an amino acid type
 * Contains immutable characteristics independent of the specific codon
 */
export interface AminoAcidData {
  readonly name: string;
  readonly abbrv: string;
  readonly slc: string;
  readonly molecularWeight: number;
  readonly polarity: AminoAcidPolarity;
  readonly charge: AminoAcidCharge;
  readonly hydrophobicity: number;
  readonly sideChainType: AminoAcidSideChainType;
}
