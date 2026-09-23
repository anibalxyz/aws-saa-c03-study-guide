// PWA registration entry (bundled via the Head override).
//
// Manual registration: the service worker (dist/sw.js, built by
// scripts/generate-sw.js after `astro build`) is registered immediately so
// transit readers get offline coverage from the first paint, not the first
// idle moment. Skipped outside production builds, where no worker exists.
// The worker uses skipWaiting + clientsClaim, so updates apply without
// waiting; the controllerchange reload below surfaces the fresh pages,
// mirroring the old autoUpdate behavior.
const swUrl = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}sw.js`;

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // A controller already present means this load is an update, not a first
  // install — only updates reload, so the first visit never bounces.
  const isUpdate = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isUpdate || refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Eager re-check: do not wait for the browser's 24h cadence.
      registration.update().catch(() => {});
    })
    .catch((error) => {
      console.warn('[pwa] service worker registration failed.', error);
    });
}
