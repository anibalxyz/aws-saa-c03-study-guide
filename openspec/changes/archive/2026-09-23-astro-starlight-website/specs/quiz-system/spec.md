# Quiz System Specification

## Purpose

Interactive quizzes from two source markup variants.

## Requirements

### Requirement: Variant Parse

The system MUST parse variant A (01-13 details) and variant B (14-Practice ticks) into {module, questions: [{id, stem, options, answer, explanation, references}]} totaling 283.

#### Scenario: Parsed

- GIVEN all PRACTICE-QUESTIONS sources
- WHEN sync parses
- THEN JSON holds 283 uniform questions including tick answers

### Requirement: Island Scores

The system MUST give immediate feedback with explanations and MUST persist scores in localStorage.

#### Scenario: Scored

- GIVEN quiz island
- WHEN a reader answers
- THEN feedback, explanation, stored score appear
