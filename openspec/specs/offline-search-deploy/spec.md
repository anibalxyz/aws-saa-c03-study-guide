# Offline Search Deploy Specification

## Purpose

Offline deployment with native search and CI.

## Requirements

### Requirement: Precache

The system MUST precache all routes via @vite-pwa/astro generateSW with html in Workbox globPatterns plus navigation fallback bound to the exact precache key (slashless base root, no index.html suffix). The system MUST serve public/favicon.svg so pages load with zero console errors.

#### Scenario: Offline reload

- GIVEN installed PWA
- WHEN network drops and route reloads
- THEN page renders from cache

### Requirement: Search Deploy

The system MUST provide Pagefind native search with zero custom index and MUST deploy via CI sync-then-build to Pages and Vercel.

#### Scenario: Search deploy

- GIVEN production build
- WHEN reader searches and CI deploys
- THEN results return and targets publish
