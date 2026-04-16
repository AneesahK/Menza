/** @typedef  {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @typedef  {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */
/** @type { PrettierConfig | SortImportsConfig | TailwindConfig } */
const prettierConfig = {
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],

  tailwindStylesheet: "./packages/ui/src/styles.css",
  tailwindFunctions: ["cn", "clsx", "cva", "tv"],

  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",

  importOrder: [
    "",
    "^(react/(.*)$)|^(react$)",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    "@/",
    "[./]",
    "[../]",
  ],
  importOrderTypeScriptVersion: "5.0.2",
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
};

export default prettierConfig;
