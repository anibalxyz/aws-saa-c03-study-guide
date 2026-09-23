# Study Routes Specification

## Purpose

SSG module routes with sidebar across three reading modes.

## Requirements

### Requirement: Route Sidebar

The system MUST generate per-module full, ultra-fast, fast-learn, diagrams, quiz routes with ordered sidebar labels, badges, and preserved Move-to chain.

#### Scenario: Routes resolve

- GIVEN synced docs
- WHEN a reader opens routes and Move-to
- THEN pages render with sidebar and next module opens

### Requirement: Modes Budget

The system MUST offer ULTRA-FAST, FAST, FULL modes and MUST score above 95 on mobile Lighthouse.

#### Scenario: Budget met

- GIVEN production build
- WHEN Lighthouse runs on mobile
- THEN scores exceed 95
