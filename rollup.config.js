import builtins from "builtin-modules";
import cleanup from "rollup-plugin-cleanup";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import executable from "rollup-plugin-executable";
import json from "rollup-plugin-json";
import pkg from "./package.json";


const external = [...builtins];

export default {
  output: {
    file: pkg.bin["rtsp-archive"],
    format: "cjs",
    banner:
      '#!/bin/sh\n":" //# comment; exec /usr/bin/env node --experimental-modules "$0" "$@"',
    interop: false,
    externalLiveBindings: false
  },
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    json({
      include: "package.json",
      preferConst: true,
      compact: true
    }),
    cleanup({
      extensions: ['js','mjs','jsx','tag']
    }),
    executable()
  ],
  external,
  input: pkg.module
};
