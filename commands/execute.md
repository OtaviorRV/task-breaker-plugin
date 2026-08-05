---
description: Actually implement a task from the board instead of just tracking it
argument-hint: [task ID | epic <slug>]
---

Use the execute skill to work on the board, exactly as that skill instructs: $ARGUMENTS

- No argument: pick the task the same way `/next` would.
- A bare number: that task ID is the target.
- The literal word `epic` followed by a slug: run within that epic, scoped to it from the start.
