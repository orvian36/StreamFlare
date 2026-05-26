import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { env } from "./env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = resolve(__dirname, "../../python/recommend.py");

export interface RecommendInput {
  movieTitle: string;
  movies: Array<{ id: number; title: string }>;
  limit?: number;
}

export function runRecommendation(input: RecommendInput): Promise<number[]> {
  return new Promise((resolveP, rejectP) => {
    const proc = spawn(env.PYTHON_BIN, [SCRIPT_PATH]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", rejectP);
    proc.on("close", (code) => {
      if (code !== 0) {
        return rejectP(new Error(`python exited ${code}: ${stderr}`));
      }
      try {
        resolveP(JSON.parse(stdout.trim()) as number[]);
      } catch (_e) {
        rejectP(new Error(`python output not JSON: ${stdout}`));
      }
    });
    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}
