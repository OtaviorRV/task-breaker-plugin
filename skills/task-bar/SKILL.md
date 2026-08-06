---
name: task-bar
argument-hint: "[on|off]"
description: Turns the TASK-BAR status badge on or off — the "[TASK-BAR:🟢]"/"[TASK-BAR:⚪]" marker shown on every prompt via the UserPromptSubmit hook, plus the task-breaker reminder sent to the model when on. Use when the user says "/task-bar on", "/task-bar off", "ativa o task-bar", "desativa o task-bar", "liga/desliga o lembrete do task-breaker". With no argument, reports the current state without changing it. Do NOT use this for marking tasks done or checking task progress — that's "done"/"progress"/"next"; this only toggles the badge's visibility.
---

# Task Bar

Toggles the on-disk state that `hooks/task-status.js` reads. Doesn't touch task data — only whether the status badge and reminder show up.

## State file

`~/.claude/task-breaker-state.json` — `{"enabled": true|false}`. Same absolute path and format the hook reads, so keep them in sync if either ever changes.

## Step 1: Read current state

Read the state file at the expanded home-directory path (e.g. `C:\Users\<user>\.claude\task-breaker-state.json` on Windows). If it doesn't exist or isn't valid JSON, treat the current state as `enabled: false` — don't error out.

## Step 2: Act on the argument

- **No argument**: report the current state in one line — "TASK-BAR is 🟢 on" or "TASK-BAR is ⚪ off" — and stop. Don't write anything.
- **`on`**: create the `.claude` directory under the home directory if it doesn't exist, then write `{"enabled": true}` to the state file. Confirm in one line: "TASK-BAR turned on — [TASK-BAR:🟢] starting next prompt."
- **`off`**: create the `.claude` directory if needed, then write `{"enabled": false}` to the state file. Confirm in one line: "TASK-BAR turned off — [TASK-BAR:⚪] starting next prompt."
- **Anything else**: say the argument wasn't recognized, list the valid options (`on`, `off`, or none), and stop without writing.
