/**
 * DNA replication domain: pure-function replication simulation, immutable Okazaki fragments
 * and RNA primers, organism profiles, and structured error variants.
 *
 * The module-private `unsafe*` factories are deliberately excluded from this barrel. Other
 * code under `src/` can import them from their respective `./OkazakiFragment.js` /
 * `./RNAPrimer.js` paths when it can prove the inputs are well-formed; package consumers
 * cannot reach them.
 *
 * Replication-specific biological constants (primer length bounds) live inline at
 * `./biological-constants.js` and are not re-exported here; they are implementation details
 * of the simulation rather than part of its public surface.
 */
export { OkazakiFragment, parseOkazakiFragment } from './OkazakiFragment.js';
export { RNAPrimer, parseRNAPrimer } from './RNAPrimer.js';
export { replicate, replicateSteps, type ReplicationOptions } from './replicate.js';
export type {
  ReplicationEvent,
  ReplicationEventKind,
  ReplicationOutput,
  ReplicationSnapshot,
  ReplicationStatistics,
} from './events.js';
export type { OrganismProfile } from './organism-profiles.js';
export { E_COLI, HUMAN } from './organism-profiles.js';
export type { RNAPrimerError, OkazakiFragmentError, ReplicationError } from './errors.js';
export {
  describeRNAPrimerError,
  describeOkazakiFragmentError,
  describeReplicationError,
} from './errors.js';
