import type { NextConfig } from "next";

// GitHub Pages (proje sitesi) icin statik export.
// Repo: iot-prompt-injection-lab -> site /iot-prompt-injection-lab/ altinda yayinlanir.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: "/iot-prompt-injection-lab",
};

export default nextConfig;
