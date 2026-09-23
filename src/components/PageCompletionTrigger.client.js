// PageCompletionTrigger: marks the current page complete in the progress
// store once the reader reaches the end of the article.
//
// Primary signal: the `[data-page-sentinel]` rendered after the article
// footer (wired by the Footer component override) entering the viewport.
// Fallback for browsers without IntersectionObserver: a passive scroll
// listener that fires near the bottom of the document.
import { markPageComplete, slugFromPath } from '../stores/progress.js';

export function initPageCompletion() {
  if (typeof window === 'undefined') return;
  const done = () => markPageComplete(slugFromPath(window.location.pathname));

  const sentinel = document.querySelector('[data-page-sentinel]');
  if (!sentinel) {
    done();
    return;
  }

  let finished = false;
  let io = null;
  const finish = () => {
    if (finished) return;
    finished = true;
    done();
    window.removeEventListener('scroll', onScroll);
    if (io) io.disconnect();
  };
  const onScroll = () => {
    const nearEnd =
      window.innerHeight + window.scrollY >= document.body.scrollHeight - 240;
    if (nearEnd) finish();
  };
  // Backup for zero-height sentinels stuck in a shrunk-root dead-zone or
  // any IO blind spot: fires near the document end, marks complete once,
  // then removes itself and disconnects the IO.
  window.addEventListener('scroll', onScroll, { passive: true });

  if (!('IntersectionObserver' in window)) {
    return;
  }

  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        finish();
      }
    },
    { rootMargin: '0px' },
  );
  io.observe(sentinel);
}
