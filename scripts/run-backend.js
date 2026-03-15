/**
 * Cross-platform backend runner.
 * Detects OS and uses the correct venv python path.
 */
const { spawn } = require("child_process");
const path = require("path");

const pythonPath = path.join(
  "venv",
  process.platform === "win32" ? "Scripts" : "bin",
  "python"
);

const child = spawn(
  pythonPath,
  ["-m", "uvicorn", "backend.app.main:app", "--reload", "--port", "8000"],
  { stdio: "inherit", shell: true }
);

child.on("exit", (code) => process.exit(code || 0));
