// Runs React Router with the newspaper's server settings and staged uploads.
// Usage: node scripts/run.mjs dev|build|preview
import { spawn } from "node:child_process";
import { cp, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const command = process.argv[2];
const commands = {
  dev: ["@react-router/dev/bin.cjs", "dev"],
  build: ["@react-router/dev/bin.cjs", "build"],
  preview: ["@react-router/serve/bin.cjs", "build/server/index.js"],
};
if (!Object.hasOwn(commands, command)) {
  throw new Error(`Unknown command: ${command}`);
}

// Server-only settings (see .env.example), never VITE_*. Variables already set in the
// environment win, so tests can point at fixture content.
try {
  process.loadEnvFile(resolve(root, ".env.local"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

if (command === "dev" || command === "build") {
  // Pages CMS uploads are served from /media until R2's public address replaces them.
  // Restart dev after pulling new uploads; removed uploads disappear on the next run.
  const media = resolve(
    root,
    process.env.HERALD_CONTENT_DIR || "content",
    "media",
  );
  const staged = resolve(root, "public/media");
  await rm(staged, { recursive: true, force: true });
  if (await stat(media).catch(() => null)) {
    await cp(media, staged, {
      recursive: true,
      filter: (source) => !source.endsWith(".gitkeep"),
    });
  }
}

const [entry, ...args] = commands[command];
const child = spawn(
  process.execPath,
  [resolve(root, "node_modules", entry), ...args, ...process.argv.slice(3)],
  {
    cwd: root,
    stdio: "inherit",
    env:
      command === "preview"
        ? {
            ...process.env,
            NODE_ENV: "production",
            HOST: process.env.HOST ?? "127.0.0.1",
            PORT: process.env.PORT ?? "4174",
          }
        : process.env,
  },
);
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
