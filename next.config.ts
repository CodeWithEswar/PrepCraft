import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  devIndicators: false,
  partialPrefetching: true,
  async headers() {
    return [{source:"/:path*",headers:[
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"X-Frame-Options",value:"DENY"},
      {key:"Referrer-Policy",value:"no-referrer"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=()"},
      {key:"Content-Security-Policy",value:"frame-ancestors 'none'; base-uri 'self'; object-src 'none'"},
      {key:"Strict-Transport-Security",value:"max-age=31536000"},
    ]},{source:"/w/:path*",headers:[{key:"Cache-Control",value:"private, no-store, max-age=0"}]},{source:"/auth/:path*",headers:[{key:"Cache-Control",value:"private, no-store, max-age=0"}]}]
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
