---
name: Bug Report
about: Report a bug in Ragi-Instant
title: "[Bug] "
labels: ["bug"]
assignees: []
body:
  - type: markdown
    attributes:
      value: Thanks for taking the time to file a bug report.
  - type: input
    id: version
    attributes:
      label: Version
      placeholder: "e.g. 0.1.0"
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: Describe the bug
      description: What happened? What did you expect to happen?
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to reproduce
      description: |
        1. ...
        2. ...
        3. ...
      render: bash
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Relevant output
      description: Error messages, stack traces, or logs.
      render: text
  - type: input
    id: environment
    attributes:
      label: Environment
      placeholder: "e.g. Python 3.12, macOS 15"
