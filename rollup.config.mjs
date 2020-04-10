import { readFileSync } from "fs";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import executable from "rollup-plugin-executable";
import native from "rollup-plugin-native";
import cleanup from "rollup-plugin-cleanup";
import consts from "rollup-plugin-consts";

import builtins from "builtin-modules";

const { name, version, description, main, module, bin } = JSON.parse(
  readFileSync("./package.json", { encoding: "utf8" })
);

const external = [...builtins, "bufferutil", "utf-8-validate"];

const plugins = [
  consts({
    name,
    version,
    description,
  }),
  commonjs(),
  resolve(),
  native(),
  cleanup({
    extensions: ["js", "mjs"],
  }),
];

const config = Object.keys(bin).map((name) => {
  return {
    input: `src/${name}-cli.mjs`,
    output: {
      plugins: [executable()],
      file: bin[name],
    },
  };
});

if (module !== undefined && main !== undefined) {
  config.push({
    input: module,
    output: {
      file: main,
    },
  });
}

export default config.map((c) => {
  c.output = {
    interop: false,
    externalLiveBindings: false,
    format: "cjs",
    ...c.output,
  };
  return { plugins, external, ...c };
});
