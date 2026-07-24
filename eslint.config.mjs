import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "mercorama-main/**",
      "scratch/**",
      "docs/**",
      "scripts/**",
    ],
  },
];

export default eslintConfig;
