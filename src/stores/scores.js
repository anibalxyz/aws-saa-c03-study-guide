// Persistent quiz-score store: question id ("<module>-q<N>") -> "1" | "0".
// Per-question results let each quiz page derive its own module score
// without a second index to keep in sync.
import { persistentMap } from '@nanostores/persistent';
import { SCORES_STORAGE_KEY } from './storage-keys.js';

export const scoresStore = persistentMap(SCORES_STORAGE_KEY, {}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export function recordAnswer(id, correct) {
  scoresStore.setKey(id, correct ? '1' : '0');
}

// Score for one module's question ids, restored from localStorage on reload.
export function moduleScore(ids) {
  const data = scoresStore.get();
  const answered = ids.filter((id) => id in data);
  return {
    answered: answered.length,
    correct: answered.filter((id) => data[id] === '1').length,
    total: ids.length,
  };
}
