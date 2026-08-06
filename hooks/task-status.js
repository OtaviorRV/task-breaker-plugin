#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");

const statePath = path.join(os.homedir(), ".claude", "task-breaker-state.json");

const KEYWORDS = [
  "task",
  "tarefa",
  "board",
  "breakdown",
  "intake",
  "next",
  "progress",
  "done",
  "próximo passo",
  "próxima tarefa",
  "concluí",
  "terminei",
  "quebra isso",
  "task-bar",
  "task-breaker"
];

function readEnabled() {
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    return JSON.parse(raw).enabled === true;
  } catch {
    return false;
  }
}

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function isTaskBreakerProject(cwd) {
  if (!cwd) return false;
  try {
    return fs.existsSync(path.join(cwd, ".task-breaker", "config.json"));
  } catch {
    return false;
  }
}

function matchesKeyword(prompt) {
  if (!prompt) return false;
  const lower = prompt.toLowerCase();
  return KEYWORDS.some((keyword) => lower.includes(keyword));
}

const enabled = readEnabled();
const input = readStdin();

let output = {};

if (enabled && isTaskBreakerProject(input.cwd)) {
  if (matchesKeyword(input.prompt)) {
    output.hookSpecificOutput = {
      hookEventName: "UserPromptSubmit",
      additionalContext:
        "TASK-BREAKER EXCLUSIVE MODE — this message is about the board. Identify the right skill (breakdown/intake/next/progress/done) and invoke it now, without asking for extra confirmation."
    };
  } else {
    output = {
      decision: "block",
      reason:
        "task-breaker is ON and this message doesn't look board-related. Turn it off (/task-breaker:task-bar off) and resend, or rephrase mentioning the task/board."
    };
  }
}

process.stdout.write(JSON.stringify(output));
