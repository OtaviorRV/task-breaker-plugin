# task-breaker

A Claude Code plugin that turns an already-written dev task into a working task board — organize it, break it into ordered steps, execute them for real, and track progress as you go.

> ⚠️ **The board is session-only.** Tasks created by `/task-breaker:breakdown` live in Claude Code's native task tool, which does **not** persist once the session ends, and is **not** shared between concurrent sessions of Claude Code. If you close the terminal or open a new session, the board is gone — there's no durable storage behind it. This plugin is a workflow aid for a single continuous working session, not a substitute for a real issue tracker.

## Installation

```
claude plugin marketplace add OtaviorRV/task-breaker-plugin
claude plugin install task-breaker@task-breaker
```

Open a new Claude Code session afterward — skills only become invokable at the start of a session, not mid-session.

Plugin skills are namespaced: the commands below are `/task-breaker:intake`, `/task-breaker:breakdown`, and so on. The bare form (`/intake`, `/breakdown`, ...) also works as long as no other installed plugin claims the same name — for a name as generic as `/next` or `/done`, that's not guaranteed, so this README uses the namespaced form throughout.

## Commands

| Command | What it does |
|---|---|
| `/task-breaker:intake [task]` | Turns an already-written dev task (ticket, bug report, pasted spec) into a structured spec, by extracting what's there — never by interviewing. Asks a question only when something genuinely blocking is missing. |
| `/task-breaker:breakdown [spec or idea]` | Decomposes a confirmed spec into an ordered, executable list of native tasks, with explicit dependencies. |
| `/task-breaker:progress` | Shows the full board as a table — every task, every epic, current status. |
| `/task-breaker:next` | Shows just the single next concrete step to work on. |
| `/task-breaker:execute [id \| epic <slug>]` | Actually implements a task — `Edit`/`Write`/`Bash`, following the target project's own conventions — instead of just tracking that someone did it. Explicit-invocation only (has side effects, so it never triggers on its own). Stops for explicit confirmation before any irreversible action, and whenever something is genuinely ambiguous or a check fails. |
| `/task-breaker:done [id]` | Marks a task complete and immediately shows what's next, in one motion. |

## Example workflow

```
/task-breaker:intake TICKET-142: add cursor-based pagination to GET /users,
max 50 items per page, return next_cursor when more pages remain
```

`/task-breaker:intake` extracts a spec (Goal / Scope / Constraints / Success criteria / Edge cases) from the ticket text — no interview, since everything needed is already there.

```
/task-breaker:breakdown
```

Turns the confirmed spec into an ordered set of native tasks with dependencies wired up, ready to work through.

```
/task-breaker:execute
```

Picks the next free task (same selection `/task-breaker:next` uses), implements it for real, runs whatever verification is configured for the project, and marks it done — then shows what's next.

```
/task-breaker:done
```

For anything you implemented yourself instead of running `/task-breaker:execute` — marks the current task complete and shows the next one.

## Configuration

The first time `/task-breaker:intake`, `/task-breaker:breakdown`, or `/task-breaker:execute` runs in a project, they ask a couple of setup questions and save the answers to `.task-breaker/config.json` so they're not asked again:

```json
{
  "autoExecute": false,
  "verbosity": "medium",
  "executionScope": "single",
  "pauseBetweenTasks": true,
  "verification": ["npm test", "npm run lint"]
}
```

| Field | Set by | Meaning |
|---|---|---|
| `autoExecute` | `/task-breaker:intake`, `/task-breaker:breakdown` | Whether to skip the "does this look right?" confirmation pauses. |
| `verbosity` | `/task-breaker:intake`, `/task-breaker:breakdown` | `"silent"` (default), `"medium"`, or `"full"` — how much reasoning gets narrated. |
| `executionScope` | `/task-breaker:execute` | `"single"` (one task per invocation) or `"epic"` (run a whole epic in sequence). |
| `pauseBetweenTasks` | `/task-breaker:execute` | In `epic` mode, whether to stop and confirm between tasks. |
| `verification` | `/task-breaker:execute` | Shell commands to run before marking a task done. Empty if the project has none. |

Two things `/task-breaker:execute` never does regardless of configuration: it always stops for explicit confirmation before an irreversible action (`git commit`/`push`/`reset`, deleting a file, deploying), and it always stops — never guesses, never marks a task `blocked` and silently moves on — when something is genuinely ambiguous or a verification check fails.

## License

MIT — see [LICENSE](./LICENSE).
