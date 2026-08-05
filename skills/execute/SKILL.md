---
name: execute
description: Actually implements a task from the board — writing/editing code, running commands — instead of just marking it done after a human did the work by hand. Use whenever the user wants Claude itself to do the work: phrases like "run task #23", "implement this task", "run and implement the next one", "let's execute the board", "do this part yourself". Also triggers on explicit /execute invocation, with or without a task ID or "epic" argument. Picks the task the same way "next" would when no ID is given. Do NOT use this to mark something complete after a human already did the work manually — that's "done". Do NOT use this for planning or decomposing a spec into tasks — that's "breakdown". Always stops for explicit confirmation before any irreversible action (git commit/push/reset, deleting a file, deploying) and whenever something is genuinely ambiguous or a check fails — never guesses, never marks a task blocked and silently moves on to the next one.
---

# Execute

Actually do a task from the board — read it, implement it, verify it, mark it done — instead of just tracking that someone else did.

## Why this matters

Every other skill here tracks work; this one performs it. That's a bigger claim than "show me the next step" or "mark this done," so it carries more responsibility: a wrong guess here isn't a mis-worded task description, it's code that got written and maybe already ran. Every rule below exists to keep that responsibility from quietly turning into overreach.

## Setup — separate from intake/breakdown's config

Check `.task-breaker/config.json` for three fields specific to this skill: `executionScope`, `pauseBetweenTasks`, `verification`. These are independent of `autoExecute`/`verbosity` (those control tone during spec-writing; these control how execution itself behaves) — a project that already has `autoExecute`/`verbosity` set from `/intake` or `/breakdown` still needs this setup the first time `/execute` runs there.

**If any of the three fields is missing**, run setup once, in this order:

1. Ask: "would you like me to execute one task at a time (default), or the whole epic in sequence when I call `/execute`?" → sets `executionScope: "single"` or `"epic"`.
2. Ask: "in epic mode, should I stop between tasks for your confirmation (default), or keep going without stopping until it's done?" → sets `pauseBetweenTasks: true` or `false`. Ask this even if the user picked `single` in question 1 — they might switch later via an explicit argument, and re-asking then would be worse than asking once now.
3. For verification: try to find check commands first. Look for a `package.json` (or the project's equivalent manifest) and read its scripts. If you find plausible candidates (commonly named things like `test`, `lint`, `typecheck`, `build`), show them and ask: "found these scripts: `<list>` — use these, adjust, or none?" If you find nothing, ask directly: "which commands run lint/test/typecheck in this project? Answer 'none' if there aren't any." Either way, the result is a list of shell commands (possibly empty) saved as `verification`.

Save all three into `.task-breaker/config.json`, merging with whatever `autoExecute`/`verbosity` already exist there. Don't ask again in future runs in this project — the file is the record.

**If all three are already present**, read them silently and proceed.

## Step 1: Pick the task

Three ways this can be invoked, and they're distinguished by syntax, not guessed from the shape of the argument:

- **`/execute <task ID>`** (a bare number) — confirm it exists via `TaskList` first, the same check `/done` already does before touching a named ID. If it doesn't exist, say so in one line and stop. If it's already `completed`, say so and stop — there's nothing to implement. If it has an open `blockedBy`, that's the same judgment call `/done` already makes for marking a blocked task done directly: the tracked blocker reflects the plan, not necessarily reality, so an explicitly-named ID is allowed to proceed anyway rather than being refused. Otherwise, that task is the target.
- **`/execute epic <slug>`** (the literal word `epic`, then an epic slug) — first filter `TaskList` down to only tasks whose `metadata.epic` matches that slug, then apply `/next`'s selection logic (below) to that filtered subset only. This is what "starting from that epic's own next pick" means, and skips the need for a first unscoped pick to discover which epic to run.
- **`/execute`** (no argument) — the target is whatever `/next` would currently select across the whole unfiltered board. This is also how, in `epic` mode with no argument, the first pick tells you which epic to stay within for the rest of the run.

Either way, run `/next`'s selection logic exactly — read `skills/next/SKILL.md` and replicate its Steps 1-3 (categorize, then working-by-lowest-ID > todo-by-highest-unlock-count > blocked-closest-to-unblocking) — against the whole board or the epic-filtered subset, per whichever case above applies. Don't reinvent it here, same reasoning `/done` already follows: duplicating it by hand risks the two skills drifting apart.

If there's nothing to pick (no tasks, or everything already `completed`), say so the same way `/next` would and stop — there's nothing to execute.

Read the target task's full `description` via `TaskGet`, not just its subject — the subject is a label, the description is what actually needs to happen.

## Step 2: Implement

Do the work the task describes — `Edit`/`Write`/`Bash` as needed, following the project's own conventions (this is what the project's existing skills like `clean-code`, `nestjs-best-practices`, `react-stack`, etc. are for — this skill doesn't re-specify code style, it just does the work and lets those keep triggering normally on the code being touched).

**Two things always stop the work, in every mode, with no config to loosen either one:**

1. **An irreversible action becomes necessary** — a `git commit`/`push`/`reset`/`rebase`, deleting a file, deploying, or anything else your standing rules already gate even inside an approved plan. State the action plainly and wait for explicit confirmation before doing it. This skill doesn't grant that authorization by existing — it only inherits whatever your standing rules already require.
2. **Something is genuinely ambiguous, missing, or fails in a way you can't resolve from what you already know** — stop, explain the blocker in plain terms, and wait for a decision. Don't guess an answer to keep moving, and don't mark the task `blocked` and move to the next one on your own — a guess that's already become code is much harder to undo than a guess in a sentence, and a task quietly left half-done is easy to lose track of later. The task's status stays exactly as it was until the user decides.

In `epic` mode, either of these stops the whole loop, not just the current task — don't skip ahead to the next task in the epic when one is stuck.

## Step 3: Verify before marking done

If `verification` has any commands configured, run them. If they all pass, continue to Step 4. **If any of them fails, stop the same way Step 2's blockers do** — show what failed, don't mark the task done, don't move on. This isn't optional and isn't softened by `pauseBetweenTasks` or `executionScope` — a task that fails its own project's checks isn't finished regardless of how the rest of this skill is configured.

If `verification` is empty (the project has none configured), skip straight to Step 4 — there's nothing to run.

## Step 4: Mark done

Run `/done`'s Step 2 (read `skills/done/SKILL.md`): mark the target task `completed`. Don't run `/done`'s Step 3 (the "show what's next" presentation) yet if `executionScope` is `"epic"` (or an explicit "epic" argument was given) — Step 5 below decides what to present in that case, and showing `/done`'s own global pick first would just put a second, possibly contradictory "next" in front of the user a moment later. In `single` mode, run `/done`'s Step 3 too — there's no epic loop to reconcile it against, so it can just render normally.

## Step 5: Epic mode — decide whether to continue, and what to show

Only applies when `executionScope` is `"epic"` (or an explicit "epic" argument was given for this run). Skip entirely in `single` mode — Step 4 already showed what's next.

**Don't use `/next`'s global, unscoped pick to decide this** — on any board with more than one active epic it can easily point at a task in a completely different epic even while the current one still has free work sitting in it. Instead, call `TaskList` yourself and filter it down to the epic just worked on (same filter as the "epic argument" case in Step 1). Check directly whether that filtered set still has a `working` task or a free `todo` task in it:

- **If yes**, there's more to do in this epic. Present that epic-scoped task as what's next (same one-line format `/next` uses), then:
  - If `pauseBetweenTasks` is `true`, stop here and wait for the user to say to continue before looping back to Step 1, epic-filtered.
  - If `pauseBetweenTasks` is `false`, loop back to Step 1 automatically, epic-filtered, without narrating a transition.
- **If no** `working` or free `todo` remains in that filtered set (only `completed`, or only `blocked` tasks whose blockers lie outside this epic), the epic is done. Say so, then run `/next`'s global selection for real and show that as what's next overall — this is the one point where the global pick belongs in the output, now that there's nothing left to reconcile it against. Epic mode never spills over into other epics on its own.

## Handing off

In `single` mode, `/done`'s own output already covers this. In `epic` mode, Step 5's output is the last word on what's next — don't add `/progress`'s or `/next`'s own closing lines on top of either.
