import { loadEnvConfig } from "@next/env";

/** Next.js と同じ順序で .env / .env.local を読み込む */
export function loadEnv(): void {
  loadEnvConfig(process.cwd());
}
