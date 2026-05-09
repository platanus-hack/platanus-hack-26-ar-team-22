import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      { source: "/admin", destination: "/admin/events", permanent: false },
    ];
  },
};

export default nextConfig;
