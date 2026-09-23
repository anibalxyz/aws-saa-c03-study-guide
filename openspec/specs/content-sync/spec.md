# Content Sync Specification

## Purpose

Import allowlisted source to docs and quiz JSON.

## Requirements

### Requirement: Pinned Sync

The system MUST copy only allowlisted files from SHA-pinned checkout (CONTENT_SOURCE_DIR fallback) including 14-Practice/11-Analytics exceptions.

#### Scenario: Copy

- GIVEN pinned SHA and allowlist
- WHEN sync runs
- THEN docs hold allowlisted files only

#### Scenario: Exceptions

- GIVEN exception layouts
- WHEN sync runs
- THEN sync succeeds

### Requirement: Transform Assert

The system MUST inject title/sidebar frontmatter, MUST rewrite links preserving Move-to chain, MUST emit quiz JSON, MUST assert 298Q (283 branch-A + 15 branch-B)/217 diagrams, and MUST use placeholders plus paraphrase-plus-link only.

#### Scenario: Validated

- GIVEN synced output
- WHEN CI checks
- THEN all checks pass
