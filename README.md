# task-breaker

A Claude Code plugin that turns an already-written dev task into a working task board — organize it, break it into ordered steps, execute them for real, and track progress as you go.

> ⚠️ **The board is session-only.** Tasks created by `/breakdown` live in Claude Code's native task tool, which does **not** persist once the session ends, and is **not** shared between concurrent sessions of Claude Code. If you close the terminal or open a new session, the board is gone — there's no durable storage behind it. This plugin is a workflow aid for a single continuous working session, not a substitute for a real issue tracker.

## Installation

```
claude plugin marketplace add OtaviorRV/task-breaker-plugin
claude plugin install task-breaker@task-breaker
```

Open a new Claude Code session afterward — skills only become invokable at the start of a session, not mid-session.

## Commands

| Command | What it does |
|---|---|
| `/intake [task]` | Turns an already-written dev task (ticket, bug report, pasted spec) into a structured spec, by extracting what's there — never by interviewing. Asks a question only when something genuinely blocking is missing. |
| `/breakdown [spec or idea]` | Decomposes a confirmed spec into an ordered, executable list of native tasks, with explicit dependencies. |
| `/progress` | Shows the full board as a table — every task, every epic, current status. |
| `/next` | Shows just the single next concrete step to work on. |
| `/execute [id \| epic <slug>]` | Actually implements a task — `Edit`/`Write`/`Bash`, following the target project's own conventions — instead of just tracking that someone did it. Stops for explicit confirmation before any irreversible action, and whenever something is genuinely ambiguous or a check fails. |
| `/done [id]` | Marks a task complete and immediately shows what's next, in one motion. |

## Example workflow

```
/intake TICKET-142: add cursor-based pagination to GET /users,
max 50 items per page, return next_cursor when more pages remain
```

`/intake` extracts a spec (Goal / Scope / Constraints / Success criteria / Edge cases) from the ticket text — no interview, since everything needed is already there.

```
/breakdown
```

Turns the confirmed spec into an ordered set of native tasks with dependencies wired up, ready to work through.

```
/execute
```

Picks the next free task (same selection `/next` uses), implements it for real, runs whatever verification is configured for the project, and marks it done — then shows what's next.

```
/done
```

For anything you implemented yourself instead of running `/execute` — marks the current task complete and shows the next one.

## Configuration

The first time `/intake`, `/breakdown`, or `/execute` runs in a project, they ask a couple of setup questions and save the answers to `.task-breaker/config.json` so they're not asked again:

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
| `autoExecute` | `/intake`, `/breakdown` | Whether to skip the "does this look right?" confirmation pauses. |
| `verbosity` | `/intake`, `/breakdown` | `"silent"` (default), `"medium"`, or `"full"` — how much reasoning gets narrated. |
| `executionScope` | `/execute` | `"single"` (one task per invocation) or `"epic"` (run a whole epic in sequence). |
| `pauseBetweenTasks` | `/execute` | In `epic` mode, whether to stop and confirm between tasks. |
| `verification` | `/execute` | Shell commands to run before marking a task done. Empty if the project has none. |

Two things `/execute` never does regardless of configuration: it always stops for explicit confirmation before an irreversible action (`git commit`/`push`/`reset`, deleting a file, deploying), and it always stops — never guesses, never marks a task `blocked` and silently moves on — when something is genuinely ambiguous or a verification check fails.

## License

MIT — see [LICENSE](./LICENSE).
