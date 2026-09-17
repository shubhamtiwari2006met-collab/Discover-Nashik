import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep Next inside this monorepo even when another lockfile exists above it on Windows.
  outputFileTracingRoot: projectRoot
};

export default nextConfig;
