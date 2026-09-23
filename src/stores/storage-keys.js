// Single source of truth for persistent-storage keys.
//
// Both keys are versioned (`-v1` suffix) so a future schema change can bump
// the suffix without ever clashing with data already stored on readers'
// devices. Import these — never retype the literals.
export const PROGRESS_STORAGE_KEY = 'saa-progress-v1';
export const SCORES_STORAGE_KEY = 'saa-scores-v1';
