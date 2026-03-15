/**
 * Cross-platform install script.
 * Installs root npm, frontend npm, and Python deps using the correct venv pip.
 */
const { execSync } = require("child_process");
const path = require("path");

const pipPath = path.join(
  "venv",
  process.platform === "win32" ? "Scripts" : "bin",
  "pip"
);

const fs = require("fs");
if (!fs.existsSync("venv")) {
  console.log("🐍 Creating Python virtual environment...");
  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  execSync(`${pythonCmd} -m venv venv`, { stdio: "inherit" });
}

console.log("📦 Installing root npm packages...");
execSync("npm install", { stdio: "inherit" });

console.log("📦 Installing frontend npm packages...");
execSync("npm install", { cwd: "frontend", stdio: "inherit" });

console.log("🐍 Installing Python dependencies...");
execSync(`${pipPath} install -r backend/requirements.txt`, {
  stdio: "inherit",
});

console.log("✅ All dependencies installed!");
