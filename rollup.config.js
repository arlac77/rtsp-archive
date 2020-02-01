import copy from "rollup-plugin-copy";
import dev from "rollup-plugin-dev";
import { terser } from "rollup-plugin-terser";

import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

import executable from "rollup-plugin-executable";
import native from "rollup-plugin-native";
import cleanup from "rollup-plugin-cleanup";
import consts from "rollup-plugin-consts";
import acornClassFields from "acorn-class-fields";

import builtins from "builtin-modules";
import { name, version, description, main, module, bin } from "./package.json";

const external = [...builtins];

const plugins = [
  consts({
    name,
    version,
    description
  }),
  commonjs(),
  resolve(),
  native(),
  cleanup({
    extensions: ["js", "mjs"]
  })
];

const config = Object.keys(bin).map(name => {
  return {
    input: `src/${name}-cli.mjs`,
    output: {
      plugins: [executable()],
      file: bin[name]
    }
  };
});

if (module !== undefined && main !== undefined) {
  config.push({
    input: module,
    output: {
      file: main
    }
  });
}

export default config.map(c => {
  c.output = {
    interop: false,
    externalLiveBindings: false,
    format: "cjs",
    ...c.output
  };
  return { acornInjectPlugins: [acornClassFields], plugins, external, ...c };
});
