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
      "OLDSTUFF/**",
      ".agents/**",
      ".gemini-backup/**",
    ],
  },
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
