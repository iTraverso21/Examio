import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["tesseract.js", "pdfjs-dist"],
};

export default nextConfig;
