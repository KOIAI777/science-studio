import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: [
    "@science-studio/experiment-schema",
    "@science-studio/simulation-core",
    "@science-studio/templates",
  ],
};

export default nextConfig;
