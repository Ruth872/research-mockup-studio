// Runs backend tasks with the backend's virtual environment, from any directory.
//   node scripts/backend.mjs api            migrate the database, then serve the API with reload
//   node scripts/backend.mjs create-admin   create the first administrator (prompts for details)
//   node scripts/backend.mjs dev            the API and the Vite dev server together
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backend = path.join(root, "backend");
const python = process.platform === "win32"
  ? path.join(backend, ".venv", "Scripts", "python.exe")
  : path.join(backend, ".venv", "bin", "python");

// Port 8000 is used by other local projects on this machine; keep in step with vite.config.ts.
const API_HOST = "127.0.0.1";
const API_PORT = process.env.API_PORT || "8010";

function requireVenv() {
  if (existsSync(python)) return;
  console.error(
    "The backend virtual environment is missing. From the backend folder run:\n" +
      "  py -m venv .venv\n  .venv\\Scripts\\python -m pip install -r requirements.txt",
  );
  process.exit(1);
}

function run(args) {
  const result = spawnSync(python, args, { cwd: backend, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

/** Resolves true when something already accepts connections on the API port. */
function portInUse() {
  return new Promise((resolve) => {
    const socket = net.connect({ host: API_HOST, port: Number(API_PORT) });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

// Windows lets a second server bind a port that is already in use, and requests then
// go to either one, so an old API can keep answering after a restart. Refuse instead.
async function serveApi() {
  if (await portInUse()) {
    console.error(
      `Port ${API_PORT} is already in use, probably by an API started earlier.
` +
        "Stop it first (close its terminal, or press Ctrl+C there), then run this again.",
    );
    process.exit(1);
  }
  run(["-m", "alembic", "upgrade", "head"]);
  console.log(`Tele-Triage API: http://${API_HOST}:${API_PORT}  (health: /health)`);
  return spawn(
    python,
    ["-m", "uvicorn", "app.main:app", "--reload", "--host", API_HOST, "--port", API_PORT],
    { cwd: backend, stdio: "inherit" },
  );
}

const command = process.argv[2];
requireVenv();

if (command === "api") {
  (await serveApi()).on("exit", (code) => process.exit(code ?? 0));
} else if (command === "create-admin") {
  run(["-m", "alembic", "upgrade", "head"]);
  run(["-m", "app.scripts.create_admin", ...process.argv.slice(3)]);
} else if (command === "dev") {
  const api = await serveApi();
  const vite = spawn("npx", ["vite"], { cwd: root, stdio: "inherit", shell: true });
  const stop = () => {
    api.kill();
    vite.kill();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  api.on("exit", () => vite.kill());
  vite.on("exit", (code) => {
    api.kill();
    process.exit(code ?? 0);
  });
} else {
  console.error("Usage: node scripts/backend.mjs <api|create-admin|dev>");
  process.exit(1);
}
