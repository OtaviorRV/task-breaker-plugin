---
name: breakdown
argument-hint: "[spec or idea]"
description: Turns a specification or idea into an ordered, executable list of tasks — the kind someone could start working through immediately, one item at a time, without having to first figure out what order things go in or what depends on what. Use this whenever the user has a plan, goal, or spec (their own, or one just produced by the "intake" skill) and wants it turned into concrete steps — phrases like "break this down", "what are the steps to do this", "turn this into a task list", or right after a spec has been confirmed and the user is ready to move to execution. Also triggers on explicit /breakdown invocation. Do NOT use this for still-vague input that isn't organized yet (no clear goal, boundaries, or constraints) — that's what the intake skill is for; use breakdown once there's something concrete to decompose.
---

# Breakdown

Turn something concrete — a spec, a plan, or a clearly-stated idea — into tasks someone can actually start executing, in the right order, without re-reading the whole plan to figure out what to do first.

## Pausing between steps

Check once, at the start, for `.task-breaker/config.json` in the project.

- **File missing (first run in this project, whether from `/intake` or `/breakdown`):** ask once, in a single short message — (1) "would you like me to pause at each step for your confirmation (default), or run straight through without stopping?" and (2) "would you like answers with no explanation (default), with brief reasoning, or with full explanation?" — then create `.task-breaker/config.json` with `{"autoExecute": <bool>, "verbosity": <"silent"|"medium"|"full">}`, and proceed under those settings. Don't ask again in future runs.
- **File present:** read both fields and follow them silently.

If `autoExecute` is `true`, move through Steps 1-4 without stopping between them — with one exception: if Step 1 had to guess at something missing, the confirmation it requires before creating tasks still happens regardless of `autoExecute`. That's a correctness safety net, not a tone pause — `autoExecute` only skips the "does this look right" step below, never the assumption check. Otherwise (the default): stop after Step 2 and show the task list before creating anything in Step 3 — a one-line "does this look right, or is there anything to adjust before I create the tasks?" is enough. The persistence question in Step 4 is asked either way — it's never skipped, since it's a one-time question, not a repeated pause.

## Tone

Default (`verbosity` absent or `"silent"`): short and direct throughout — the task list itself (subjects, descriptions) is the deliverable and can be as detailed as the work needs; everything else (the completeness check, the confirmation, the persistence question) should read like a quick exchange, not a narrated one. Don't explain your reasoning process out loud (why a task depends on another, why the spec counted as complete) unless the user asks — just state conclusions and act.

If `verbosity` is `"medium"`: same brevity everywhere except one short sentence of reasoning is allowed where it's genuinely non-obvious — still not a full narration.

If `verbosity` is `"full"`: narrate your reasoning as you go — why a task depends on another, why the spec counted as complete, how the decomposition was ordered. Still state the task list itself as the deliverable, not a narration of it.

## Why this matters

A pile of things that need to happen isn't the same as a list you can work through. The value here isn't listing everything the idea implies — it's ordering it, sizing each piece so it's actually actionable (not "build the app," but the first concrete thing to do toward that), and making dependencies explicit so nobody starts step 4 before step 1 is done. Decomposition done badly (too coarse, no order, hidden dependencies) is barely better than no decomposition at all.

## Step 1: Check whether there's enough to work with

Before decomposing anything, look at what you actually have — the confirmed spec from `intake` if one exists in this conversation, or whatever the user just gave you directly.

Ask yourself: does this have a clear goal, some sense of boundaries (what's in/out), and enough constraints that reasonable tasks can be derived from it? If yes, move straight to Step 2.

If something's obviously missing — the kind of gap where you'd have to *guess* at a decision rather than infer it from what's already there — don't guess and don't refuse either. If there's a concrete task with a gap in it (e.g. a ticket that doesn't say which auth method to use), say what's missing and suggest running `/intake` first — it can extract the rest and ask the one blocking question. If there's no concrete task at all yet (e.g. someone says "I want to build a calculator" with literally nothing else — no goal, no boundaries, nothing to extract), suggest `brainstorming` instead; `/intake` would just bounce the same input back to `brainstorming` anyway, so skip the extra hop. If the user would rather not stop, state your best-guess assumptions explicitly and get at least a quick "ok, go ahead" before creating anything — never create tasks first and mention the assumptions afterward. A guess embedded in a paragraph of text is trivial to correct; a guess already turned into native tasks is not, so the correction window has to come before Step 3, not after.

This is a judgment call, not a rigid gate — most real inputs will have enough to work with, especially anything that already went through `/intake`.

## Step 2: Decompose

1. **Identify the natural phases or milestones first**, then break each into concrete tasks. Don't flatten everything into one undifferentiated list if the work has real structure (e.g. "setup" → "core feature" → "polish").
2. **Each task should be a single, startable action** — something with a clear "done" state, small enough to finish in one sitting. "Implement the UI" is not a task; "build the button grid layout" is closer.
3. **Make dependencies explicit.** If task 5 can't start before task 2 finishes, that has to be visible, not left for the user to discover.
4. **Order matters more than completeness.** A shorter, correctly-ordered list beats an exhaustive one where the user has to figure out the sequence themselves.
5. **Don't invent scope.** Every task should trace back to something in the spec/idea — if you notice a genuine gap that needs a new task not implied by the input, flag it as a suggestion rather than slipping it in silently.

## Step 3: Populate the task list

Derive an `epic` slug from the spec's **Title** (the `<title>` in `# Spec: <title>` — short and descriptive by construction, unlike the Goal, which is a full sentence that can open with filler words and produce a poor slug if truncated directly).

If there's no formal spec — a raw idea or a pasted ticket — don't slice the raw input text directly either; unstructured text can open with filler the same way a Goal sentence can ("so I was thinking of putting together something to..."). Some inputs already carry a natural title (a Jira ticket usually opens with "TICKET-123: short summary" — use that part). When it doesn't, distill one yourself: a short, descriptive phrase naming the core of what's being decomposed, the same kind of phrase a spec's Title would hold, and slugify that instead of the first ~50 characters of raw prose.

Either way, slugify the same way: lowercase, strip accents, replace anything that isn't a letter or number with a hyphen, collapse repeated hyphens, then cut at the nearest hyphen at or before ~50 characters — not mid-word. This slug is how `/progress` later tells apart tasks from different decompositions sitting in the same project instead of flattening everything into one confusing board.

Check `TaskList` first. If tasks tagged with this same `epic` slug are already sitting there, don't create duplicates — tell the user what already exists and ask whether to add to it, replace it, or leave it alone. Match by the `epic` value in each task's `metadata`, not by guessing from subject text — the slug is the reliable signal, subjects can drift.

Otherwise, create each task with `TaskCreate` first (it only takes `subject`, `description`, `activeForm`, `metadata` — it doesn't accept dependency fields), passing `metadata: {"epic": "<slug>"}` on every one. Once every task exists and you have their IDs, go back with `TaskUpdate` on each one to wire up `addBlockedBy`/`addBlocks` per the dependencies you identified in Step 2. Create-then-link, in that order — not in one step, because the tool doesn't support that. Don't announce the transition between the two phases (no "now wiring up dependencies" line) — under `verbosity: "silent"` that's still preamble, not a conclusion.

This gives the user a live, native task board (visible in the UI, with pending/in_progress/completed state) instead of a static list that goes stale the moment something gets done. Don't write your own file-based task list or checklist format — `TaskCreate`/`TaskUpdate` already are the task-tracking mechanism here, the same as they would be for any other multi-step work in this environment.

## Step 4: Persistence — same rule as intake, adapted

After the tasks are created, ask once whether the user also wants them registered in a real issue/task tracker (Jira, Linear, GitHub Issues, or equivalent — a tool whose job is tracking work items through states, not a notes app, vault, wiki, or document store, even if one of those happens to be connected). A tool that only lets you *log in* to a tracker (named something like `authenticate`) doesn't count as the tracker being present — you need an actual create/query-issue tool visible, not just the door to one. If no such tool is genuinely available in this session, say so plainly — the tasks already exist as native tasks in this session via `TaskCreate`, which is enough for now, and nothing further needs to happen.

Don't invent a third option, and don't write a file to disk.

**Keep this terse.** Check available tools silently, then state only the conclusion in one sentence. Don't narrate which tools you inspected or why each one didn't qualify.

## Handing off

Once tasks exist, tell the user they're ready to work — `/progress` shows the full board, `/next` shows just the single next concrete step, `/execute` implements a step for you instead of doing it by hand, and `/done` marks a step complete and shows what's next in one motion.
