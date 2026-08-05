---
name: next
description: Shows only the single next concrete step to work on — never the whole board (that's "progress"). Use whenever the user asks what to do right now — phrases like "what do I do now", "what's the next step", "what should I do next", "what should I work on", "give me the next task", "give me the next thing to do". Also triggers on explicit /next invocation. Reads tasks via TaskList, the same source "progress" uses. Do NOT use this when the user wants the full picture (every bucket, every epic) — that's "progress"; use "next" only when they want one actionable item instead of an overview. Do NOT use this when the user is telling you they finished or completed something — that's "done", which marks it and shows the next step in one motion.
---

# Next

Show the single next concrete step — one task, not a board. Someone asking "what do I do now" wants an answer they can act on immediately, not a list they still have to triage themselves.

## Step 1: Read the board

Call `TaskList`.

If it returns no tasks, say so in one line — "no tasks registered in this session yet" — and stop. Don't suggest running `/breakdown`; the user might be checking on work that lives outside this plugin entirely, and assuming otherwise is a guess this skill doesn't need to make.

## Step 2: Categorize

Same rule as `progress` — status first, `blockedBy` second:

- `completed` → **done**
- `in_progress` → **working**, regardless of `blockedBy` — a task someone already claimed is being worked on, whether or not its blockers are technically closed
- `pending` with an empty `blockedBy` → **todo** — free to start right now
- `pending` with a non-empty `blockedBy` → **blocked**

## Step 3: Pick the one task to show

Work through these in order — the first one that has a candidate wins:

**1. Any task in working?** Pick the lowest ID. `TaskList` itself recommends working tasks in ID order ("earlier tasks often set up context for later ones"), and there's no timestamp field to do better than that. Finishing what's already claimed comes before starting something new.

**2. Any task in todo?** Pick the one that unlocks the most other work. Build this count from data you already have in Step 1 — no extra tool calls:

- Look only at tasks in the **blocked** bucket (pending, non-empty `blockedBy`).
- For each blocked task, its `blockedBy` list names the open blockers still standing in its way.
- Tally how many times each task ID appears across all of those lists. A todo task's "unlock count" is its tally.

Only tally `blockedBy` from **blocked** tasks — never from **working** tasks. A working task can technically still carry a non-empty `blockedBy` (nothing stops someone from claiming a task before its blockers close), but it's already being executed regardless of that list, so it isn't actually waiting to be freed. Counting it would inflate a todo task's priority for unblocking work that was never really stuck.

Pick the todo task with the highest unlock count; tie-break by lowest ID (same reasoning as case 1 — ties usually mean the tasks are genuinely independent, and ID order is the least arbitrary fallback).

**3. Nothing in working or todo — only done and/or blocked left:**

- If every task is `completed`: say so — something like "🎉 all done — no tasks pending." — and stop.
- Otherwise there's at least one blocked task and nothing free. Pick the one closest to unblocking: fewest open blockers remaining (count of its own `blockedBy` list). Tie-break by highest unlock count (using the same tally from case 2 — which blocked task, once freed, would free the most others). Final tie-break: lowest ID.

  Name its blockers the same way `progress` does — IDs and subjects, not bare numbers: "waiting on #4 (Wire up button clicks), #5 (Keyboard support)".

## Step 4: Present it

Always name the epic the chosen task belongs to — read `metadata.epic`; if absent, call it "other tasks" (same convention as `progress`). Format: epic, then task ID and subject, then a one-line note depending on which case in Step 3 produced it:

- **working**: note that it's already in progress.
- **todo**: note that it's free to start.
- **blocked** (fallback case): name what it's still waiting on.

**Example, working:**
```
epic: digital-calculator-web
#1 Build the calculator's HTML structure — already in progress
```

**Example, todo:**
```
epic: apartment-move
#12 Hire a moving company — free to start
```

**Example, blocked fallback:**
```
epic: digital-calculator-web
#7 Test chained operations — waiting on #4 (Wire up button clicks), #5 (Keyboard support)
```

## No config, no verbosity

Same as `progress`: this skill doesn't check `.task-breaker/config.json` and ignores `verbosity` even when the file exists. It's a read and a deterministic pick, not a multi-step flow with a decision worth narrating.

## Handing off

After showing the next step, mention three things, whichever are relevant: `/execute` can implement the step for you instead of you doing it by hand; `/done` marks it complete and shows the following step in one motion, for whenever you've done it yourself and are ready to close it out; and `/progress` shows the whole board — every bucket, every epic — for whenever the single-item view isn't enough.
