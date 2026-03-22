// Copies MediaPipe WASM files from node_modules so they always match
// the installed @mediapipe/tasks-vision package version.
// Run automatically via "postinstall" in package.json.
import { copyFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const src = "node_modules/@mediapipe/tasks-vision/wasm";
const dest = "public/mediapipe-wasm";

try {
  mkdirSync(dest, { recursive: true });
  const files = readdirSync(src);
  for (const file of files) {
    copyFileSync(join(src, file), join(dest, file));
  }
  console.log(`✓ MediaPipe WASM synced (${files.length} files) → ${dest}`);
} catch (err) {
  console.warn("Could not sync MediaPipe WASM:", err.message);
  console.warn("Existing files in public/mediapipe-wasm/ will be used.");
}
