---
name: done
description: Marks a task as completed and immediately shows what's next — closes the loop of "show me the next step, I did it, mark it, show me the one after that." Use whenever the user says they finished, completed, or did the current or a specific task — phrases like "mark as done", "I finished this task", "I completed this", "mark this as done", "I finished this", "done with this one", "mark #20 as done". Also triggers on explicit /done invocation, with or without a task ID. Do NOT use this to mark a task as started/in_progress (that's plain conversation, not this skill) or to just look at what's next without finishing anything (that's "next").
---

# Done

Mark a task completed, then show the next concrete step — the two halves of one motion, so finishing something doesn't leave the user wondering what to pick up next.

## Why this matters

`/next` answers "what should I do." Without a matching "I did it," the only way to close that loop is to ask in plain language and hope `TaskUpdate` gets called correctly. This skill makes that half of the cycle as deliberate as the other half — mark, then immediately re-orient.

## Step 1: Find the target task

**If a task ID was given** (explicitly, like "/done 20" or "mark #20 as done"): that's the target. Confirm it exists via `TaskList` — if it doesn't, say so in one line and stop; don't touch anything.

**If no ID was given**: the target is whatever task `/next` would currently select. Run that selection logic exactly — read `skills/next/SKILL.md` and replicate its Steps 1-3 (categorize, then working-by-lowest-ID > todo-by-highest-unlock-count > blocked-closest-to-unblocking, in that order). Don't reinvent this logic here; it already exists and stayed correct through its own evals — duplicating it by hand risks the two skills drifting apart.

If `TaskList` returns no tasks at all, or every task is already `completed`, there's nothing to mark — say the same thing `/next` would in that state ("no tasks registered" or "🎉 all done") and stop. This isn't an error; it's just nothing to do.

## Step 2: Mark it

Call `TaskUpdate` on the target task with `status: "completed"`.

If the target (whether chosen by ID or by the `/next` logic) is already `completed`, don't call `TaskUpdate` again — say it was already done, then continue to Step 3 anyway. The user still wants to know what's next; a redundant status is not a reason to stop there.

Mark straight to `completed` — never route through `in_progress` here, even for a task that was still `todo` or `blocked`. `in_progress` is for signaling "I'm working on this," which matters for longer or multi-session work; that stays a plain-language request outside this skill (e.g. "starting on #17"). A task this skill marks is, by definition, one the user is telling you is *finished* — for an atomic action like "have coffee," there was never a meaningful in-between state to pass through anyway. This also means a `blocked` task can be marked done directly if the user says so: the tracked blocker reflects the plan, not necessarily what happened in reality, and second-guessing that isn't this skill's job.

## Step 3: Show what's next

Immediately run `/next`'s full Steps 1-4 (selection + presentation) again and show the result, exactly as `/next` would render it — same table-free single-item format, same epic mention. Don't add a preamble like "marked, now let's see what's next" — under the same terse spirit as `/progress` and `/next`, just show the confirmation and the next step, nothing narrated in between.

Skip `/next`'s own closing mention of `/progress` — this skill is already re-running `/next`'s presentation, so repeating that handoff line here would just be noise the user has already seen once this same turn.

## No config, no confirmation

Same as `/progress` and `/next`: don't check `.task-breaker/config.json`, don't pause to confirm before marking. Marking a task done is low-risk and trivially reversible (call `TaskUpdate` again to undo it) — it doesn't need the pause-and-confirm treatment that `/breakdown` gives to creating a batch of new tasks.

## Examples

**No ID, target was in `working`:**
```
✅ #2 Implement Stripe webhook validation — marked as completed.

epic: auth-service
#5 Implement the refund endpoint — free to start
```

**With ID, already completed:**
```
#15 was already completed.

epic: move-schedule
#16 Notify the building manager of the move date — free to start
```

**Nothing left:**
```
✅ #22 Have an evening snack at 9pm — marked as completed.

🎉 all done — no tasks pending.
```
