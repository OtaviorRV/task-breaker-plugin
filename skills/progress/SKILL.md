---
name: progress
description: Shows the current state of the native task board — what's done, what's being worked on, what's ready to start right now, and what's stuck waiting on a dependency. Use this whenever the user asks about progress, status, or how much is left — phrases like "how's the progress going", "what's already done", "how many tasks are left", "what's left to do", "show me the board", "what's the status". Also triggers on explicit /progress invocation. Reads the tasks created by the "breakdown" skill (or any native task in this session) via TaskList — do NOT use this to create or decompose tasks (that's "breakdown"), to organize an already-written task into a spec (that's "intake"), or when the user only wants the single next actionable step instead of the whole picture (that's "next").
---

# Progress

Show the current state of the task board — what's done, what's being worked on, what's free to start right now, and what's stuck waiting on something else.

## Why this matters

A task list only helps if it's easy to check without re-reading every task's dependencies by hand. The value here is turning the raw `TaskList` output — a flat set of tasks with status and blockers — into a board someone can glance at and immediately know what to pick up next, without doing that reasoning themselves each time.

## Step 1: Read the board

Call `TaskList`.

If it returns no tasks, say so in one line — something like "no tasks registered in this session yet" — and stop there. Don't suggest running `/breakdown`; the user might be checking on work that lives outside this plugin entirely, and assuming otherwise is a guess this skill doesn't need to make.

## Step 2: Categorize

For each task, decide its bucket using status first and `blockedBy` second:

- `completed` → **done**
- `in_progress` → **working**, regardless of `blockedBy`. A task someone already claimed and is actively running on isn't "stuck," even though `TaskUpdate` doesn't technically stop anyone from moving a blocked task to `in_progress` — status is the stronger signal of real-world state here.
- `pending` with an empty `blockedBy` → **todo** — free to start right now.
- `pending` with a non-empty `blockedBy` → **blocked**. `TaskList` already resolves `blockedBy` down to only the still-open blockers, so you don't need to cross-check each blocker's own status — if the list is non-empty, something real is still in the way.

## Step 3: Group by epic, but only if it's actually useful

Read each task's `metadata.epic` — this is set by `/breakdown` when it created the task, as a slug derived from that decomposition's spec. Tasks with no `epic` in their metadata (created outside `/breakdown`, or before this field existed) belong to a shared group called "other tasks".

Count the distinct groups, including "other tasks" if it's non-empty. If there's exactly one, skip grouping and show a single flat board — a header for one group tells the user nothing they didn't already know. If there are two or more, show one mini-board per group, headed by the epic name, so unrelated work sitting in the same project doesn't get flattened into one confusing list.

## Step 4: Present the board

For each group (or the single flat table if there's only one), render one markdown table ordered by task ID ascending — not grouped by bucket. This shows the real sequence of the work top to bottom instead of splitting it across four sections. Three columns: ID, Status, Task.

- **Status** is the bucket name from Step 2 (`done`, `working`, `todo`, `blocked`), prefixed with a colored circle so the bucket reads at a glance without parsing the word: ✅ `done`, 🟡 `working`, ⚪ `todo`, 🔴 `blocked`. Center this column (`:---:` in the table's alignment row) — markdown tables have no font-size control, so a centered single-glyph-plus-word is the most compact this can get without embedding raw HTML that may not render consistently everywhere this output is read.
- **Task** is the subject. For a `blocked` task, append what's blocking it in the same cell instead of a separate column — the blocking tasks' IDs and subjects, not just bare numbers, since "waiting on #4 (Wire up button clicks)" is something the user can act on and "waiting on #4" isn't.

**Example, single group:**

```
| ID  |  Status   | Task |
|-----|:---------:|--------|
| #1  | 🟡 working | Build the calculator's HTML structure |
| #2  | ⚪ todo    | Style the calculator in CSS |
| #3  | ✅ done    | Implement the basic operations logic in JS |
| #7  | 🔴 blocked | Test chained operations — waiting on #4 (Wire up button clicks), #5 (Keyboard support) |
```

**Example, multiple groups:**

```
## digital-calculator-web
| ID  | Status  | Task |
|-----|:-------:|--------|
| #2  | ⚪ todo  | Style the calculator in CSS |
| #3  | ✅ done  | Implement the basic operations logic in JS |

## apartment-move
| ID  |  Status   | Task |
|-----|:---------:|--------|
| #12 | 🟡 working | Hire a moving company |
| #15 | 🔴 blocked | Set up the kitchen — waiting on #12 (Hire a moving company) |
```

## No config, no verbosity

This skill doesn't check `.task-breaker/config.json` and ignores `verbosity` even when the file exists — there's no decision here worth narrating and no multi-step flow that needs a pause-and-confirm gate. It's a read and a render, the same way every time, regardless of what `intake` or `breakdown` were configured with earlier in the project.

## Handing off

After showing the board, mention that `/next` shows just the single next concrete step instead of the whole picture, for whenever that's more useful than seeing everything at once.
