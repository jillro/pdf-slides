/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is only needed for the Docker image (see Dockerfile).
  // `next start` does not work with standalone output, which breaks the E2E
  // test webServer, so we enable it only when building the Docker image.
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }]; // required to make Konva & react-konva work
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
