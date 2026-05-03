import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/latin-honors',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
