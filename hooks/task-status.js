#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");

const statePath = path.join(os.homedir(), ".claude", "task-breaker-state.json");

function readEnabled() {
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    return JSON.parse(raw).enabled === true;
  } catch {
    return false;
  }
}

const enabled = readEnabled();

const output = {};

if (enabled) {
  output.hookSpecificOutput = {
    hookEventName: "UserPromptSubmit",
    additionalContext:
      "TASK-BREAKER ATIVO — use /next (próximo passo), /progress (board completo) ou /done (marcar tarefa concluída)."
  };
}

process.stdout.write(JSON.stringify(output));
