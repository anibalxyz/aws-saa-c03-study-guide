# Diagram Viewer Specification

## Purpose

Lazy Mermaid diagrams with fullscreen viewer.

## Requirements

### Requirement: Lazy Render

The system MUST render mermaid fences client-side in a client:visible island, MUST lazy-load the runtime, and MUST skip it on non-diagram pages.

#### Scenario: On demand

- GIVEN diagrams page
- WHEN blocks near viewport
- THEN they render as SVG

### Requirement: Modal Warn-Only

The system MUST open a fullscreen modal with pan/pinch/scroll and MUST never fail the build on bad diagrams (warn-only).

#### Scenario: Modal works

- GIVEN rendered diagram
- WHEN reader opens it
- THEN fullscreen pan/pinch/scroll work

#### Scenario: Bad isolated

- GIVEN malformed block
- WHEN page builds and renders
- THEN build passes with warning
