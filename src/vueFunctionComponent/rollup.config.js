import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

/** @type {import('rollup').RollupOptions} */

function resolveReplace() {
  const replacements = {
    // "process.env.NODE_ENV": '"production"',
  };

  if (Object.keys(replacements).length) {
    return [
      replace({
        values: replacements,
        preventAssignment: true,
        // "process.env.NODE_ENV": JSON.stringify("production"),
      }),
    ];
  } else {
    return [];
  }
}

export default [
  {
    input: "./packages/src/index.ts",
    output: [
      {
        file: "./packages/dist/vueFunctionComponent.cjs.js",
        format: "cjs",
        exports: "named",
      },
      {
        file: "./packages/dist/vueFunctionComponent.cjs.prod.js",
        format: "cjs",
        exports: "named",
        plugins: [terser()],
      },
      {
        file: "./packages/dist/vueFunctionComponent.esm.js",
        format: "es",
        exports: "named",
      },
      {
        file: "./packages/dist/vueFunctionComponent.esm.prod.js",
        format: "es",
        exports: "named",
        plugins: [terser()],
      },
      {
        file: "./packages/dist/vueFunctionComponent.global.js",
        format: "iife",
        name: "VueFunctionComponent",
        exports: "named",
      },
      {
        file: "./packages/dist/vueFunctionComponent.global.prod.js",
        format: "iife",
        name: "VueFunctionComponent",
        exports: "named",
        plugins: [terser()],
      },
    ],
    define: {},
    external: ["vue"],
    plugins: [
      typescript({
        outputToFilesystem: true,
      }),
      ...resolveReplace(),
      resolve({
        exports: true,
        extensions: [".js", ".json", ".node"],
        mainFields: ["module", "main"],
      }),
      commonjs(),
    ],
  },
  {
    input: "./packages/src/index.ts",
    output: {
      file: "./packages/types/index.d.ts",
      format: "es",
    },
    plugins: [
      dts({
        compilerOptions: {
          skipLibCheck: true,
        },
      }),
    ],
  },
];
