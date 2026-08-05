---
name: intake
argument-hint: "[task]"
description: Turns an already-written dev task — a ticket, a pasted spec, a bug report, a Slack message, a short technical paragraph — into a structured spec ready for /breakdown to decompose, by extracting what's already there instead of interviewing for it. Use this whenever the user hands over concrete work to build (a feature request, an endpoint, a bug fix, a technical change), even if they just paste raw ticket text or describe it in one paragraph, and even if they don't explicitly say "organize this" or use the word "intake." Also triggers on explicit /intake invocation. Do NOT use this for a vague idea still being explored ("I want to build something for X" with no concrete task yet) — there's no interview step here for that, run brainstorming or similar instead. If the input already has a clear goal, scope, and constraints, /breakdown already handles it directly via its own completeness check — /intake only adds value when the input needs organizing first.
---

# Intake

Turn an already-written dev task into a spec precise enough for `/breakdown` to decompose — by organizing what's there, not by interviewing for what's missing.

## Pausing between steps

Check once, at the start, for `.task-breaker/config.json` in the project.

- **File missing (first run in this project, whether from `/intake` or `/breakdown`):** ask once, in a single short message — (1) "would you like me to pause at each step for your confirmation (default), or run straight through without stopping?" and (2) "would you like answers with no explanation (default), with brief reasoning, or with full explanation?" — then create `.task-breaker/config.json` with `{"autoExecute": <bool>, "verbosity": <"silent"|"medium"|"full">}` based on the answers, and proceed under those settings for the rest of this run. Don't ask again in future runs; the file is the record of the answers.
- **File present:** just read both fields and follow them silently, no need to mention the file.

If `autoExecute` is `true`, skip the "does this look right" confirmation below and go straight from the finished spec to the persistence question. Otherwise (the default) always show the finished spec and wait for a quick confirmation before asking about persistence. This confirmation step is a correctness safety net, not a tone pause — it's the only thing standing between a misread ticket and a wrong task list, so it stays even under `verbosity: "silent"`.

## Tone

Default (`verbosity` absent or `"silent"`): short and direct. No preamble, no restating the task back at the user before extracting it, no narrating your own reasoning process out loud. The spec template is the one place that's allowed to be as detailed as the task needs, because it's the actual deliverable — everything else should read like a quick exchange, not a narrated one.

If `verbosity` is `"medium"`: same brevity everywhere except you may add one short sentence of reasoning where it's genuinely non-obvious (e.g. why a gap counted as blocking). Still not a full narration.

If `verbosity` is `"full"`: narrate your reasoning as you go — what you inferred from the raw task, why a gap did or didn't count as blocking. Still skip restating what the user just said.

## Why this matters

A dev handing over a task has usually already done the thinking — a ticket, a Slack message, a paragraph describing what needs to change. Re-interviewing them from scratch re-asks things they already answered and adds friction where none is needed. But raw task descriptions are still often loose: implicit assumptions, missing edge cases, constraints mentioned in passing instead of stated plainly. The job here is to make that structure explicit without inventing content that isn't there.

## Process

1. **Read the task as given.** Don't ask about anything the input already covers, even implicitly.
2. **Extract, don't invent.** For each category below, pull only what's actually present in the input — inferred from context is fine (e.g. "endpoint" implies an HTTP API), invented from nothing is not. If a category has no information to extract, write "not specified" — never fill it with a guess dressed up as fact.
3. **Categories to extract** (same shape `/breakdown` expects):
   - **Goal** — what does "done" look like, in one sentence
   - **Scope boundaries** — what's explicitly in, what's explicitly out
   - **Constraints** — stack, tooling, performance, security, anything hard-fixed the task mentions
   - **Success criteria** — how would someone know this worked
   - **Edge cases** — technical edge cases the task already implies or explicitly calls out
4. **Check for a blocking gap.** A gap is blocking only when its absence would make `/breakdown` produce a fundamentally different task list — different order, different tasks entirely — not a missing detail that just makes the spec less polished. If genuinely blocking, ask exactly one objective question (multiple-choice when possible) — don't turn it into an interview, one answer is enough to unblock. If not blocking, mark the field "not specified" and move on.
5. **If the input is too vague to extract at all** — the Goal itself can't be inferred, not just one field missing — this isn't a one-question fix, and forcing one would turn intake back into the interview it exists to avoid. Say plainly that the task isn't concrete enough yet and point to `brainstorming` to work it up into something extractable. Don't guess a goal just to have something to extract.

## Presenting the finished spec

Once extraction is done, present it using this template, filled in — don't leave placeholders, and don't invent content to avoid writing "not specified":

```
# Spec: <title>

## Goal
<one or two sentences>

## Scope
**In:** <bullet list>
**Out:** <bullet list — explicitly excluded, prevents scope creep later>

## Constraints
<bullet list, or "not specified">

## Success criteria
<bullet list — observable/checkable, not vague adjectives>

## Edge cases
<bullet list, or "not specified">
```

Ask the user to confirm it looks right before moving on (skipped only when `autoExecute` is `true`, per the rule above). If they want changes, revise and re-present — don't silently guess.

## Handing off to breakdown

Once the user confirms the spec, tell them it's ready and that running `/breakdown` will turn it into an executable task list. Don't invoke breakdown yourself — let the user decide when to move to execution. The spec stays in the conversation; `/breakdown` reads it from there directly, no file needed for this handoff.

## Persistence — ask once, don't assume, don't improvise

After the spec is confirmed, ask exactly one question about persistence, and only ever offer one of these two outcomes — nothing else:

1. **An MCP tool that is specifically an issue/task tracker is actually present in this session's available tools** (e.g. Jira, Linear, GitHub Issues, Asana, or an equivalent tool whose job is tracking discrete work items with status) — name that specific tool and offer to register the spec there.
2. **No such tool is present** — say plainly that without one, the spec only lives in this conversation.

Issue/task tracker means exactly that: a system whose core purpose is tracking work items through states like to-do/in-progress/done. It does **not** include note-taking apps, personal knowledge bases, "vaults," wikis, document stores, file systems, or general-purpose databases — even when one of those is genuinely connected in the session and even when it has a tool named something like `create_project` or `create_page`. A place to write a note is not a place to track a task, and offering it here would resurface the exact problem this rule exists to prevent: presenting the user with a persistence option that isn't really what they asked for.

It also does **not** include a tool that merely *can* connect to a tracker but hasn't yet — if the only tools you see are named things like `authenticate` or `complete_authentication`, that's a login handshake, not a connection. Having the door does not mean someone is already inside. Only count a tracker as present if you can see an actual tool for creating or querying issues/tasks, not just for logging in. When you're unsure whether a connected MCP tool qualifies, it doesn't — treat it as outcome 2.

Do not invent a third option, and do not suggest saving to a file — the two outcomes above are the entire menu; don't get creative here.

**Keep this terse.** Check available tools silently, then state only the conclusion — one sentence naming the tool, or one sentence saying none is available. Don't narrate which tools you inspected or why each one didn't qualify; that reasoning is for you to apply, not for the user to read.
