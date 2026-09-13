import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // Pin the workspace root: the monorepo has multiple lockfiles, so Next's
  // inference is ambiguous. Point it at the repo root so module/asset
  // resolution (including @picantully/design-system assets) is deterministic.
  turbopack: {
    root: fileURLToPath(new URL("../..", import.meta.url)),
  },
};

export default nextConfig;
