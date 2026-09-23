# Progress Tracking Specification

## Purpose

Local progress with completion badges.

## Requirements

### Requirement: Trigger Stores

The system MUST detect completion via PageCompletionTrigger.client.js and MUST persist progress in Nano Stores with localStorage.

#### Scenario: Stored

- GIVEN unread page
- WHEN reader scrolls to end
- THEN slug persists as complete

### Requirement: Badges Reload

The system MUST show top-bar and sidebar badges from the same store and MUST restore them on reload.

#### Scenario: Badges persist

- GIVEN stored progress
- WHEN reader returns
- THEN badges restore from localStorage
