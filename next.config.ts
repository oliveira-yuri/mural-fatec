import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (banco em memória de src/lib/db/client.ts) carrega .wasm por caminho de arquivo real; sem isto, o bundler de servidor reescreve esse caminho e o build quebra.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
