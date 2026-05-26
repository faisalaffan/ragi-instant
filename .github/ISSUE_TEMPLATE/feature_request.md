---
name: Feature Request
about: Suggest a feature for Ragi-Instant
title: "[Feature] "
labels: ["enhancement"]
assignees: []
body:
  - type: markdown
    attributes:
      value: Thanks for the idea! Please fill out the details below.
  - type: textarea
    id: problem
    attributes:
      label: Problem
      description: What problem does this feature solve?
    validations:
      required: true
  - type: textarea
    id: proposal
    attributes:
      label: Proposed solution
      description: What would you like to see implemented?
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
      description: Any alternative approaches or workarounds?
  - type: checkboxes
    id: scope
    attributes:
      label: Would this be a breaking change?
      options:
        - label: Yes, this changes existing behavior
        - label: No, this is purely additive
