#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext:
      "TASK-BREAKER ATIVO — use /next (próximo passo), /progress (board completo) ou /done (marcar tarefa concluída)."
  }
}));
