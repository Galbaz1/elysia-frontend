const isStatic = process.env.NEXT_PUBLIC_IS_STATIC === "true";

const nextConfig = {
  // Only use static export when building for production (served by FastAPI)
  ...(isStatic && { output: "export" }),
  trailingSlash: false,
  webpack: (config) => {
    // Add a rule to handle .glsl files
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "raw-loader", // or "asset/source" in newer Webpack versions
        },
        {
          loader: "glslify-loader",
        },
      ],
    });

    return config;
  },
  // In dev mode, proxy /images to the backend (images served by FastAPI)
  async rewrites() {
    if (isStatic) {
      return []; // No rewrites in static export mode
    }
    return [
      {
        source: "/images/:path*",
        destination: "http://localhost:8000/images/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
