import cleanup from "rollup-plugin-cleanup";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import executable from "rollup-plugin-executable";
import json from "rollup-plugin-json";
import pkg from "./package.json";
import babel from "rollup-plugin-babel";

export default {
  output: {
    file: pkg.bin["rtsp-archive"],
    format: "cjs",
    banner:
      '#!/bin/sh\n":" //# comment; exec /usr/bin/env node --experimental-modules --experimental-worker "$0" "$@"',
    interop: false
  },
  plugins: [
    commonjs(),
    json({
      include: "package.json",
      preferConst: true,
      compact: true
    }),
    babel({
      runtimeHelpers: false,
      externalHelpers: true,
      babelrc: false,
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              safari: "tp"
            }
          }
        ]
      ],
      exclude: "node_modules/**"
    }),
    cleanup(),
    executable()
  ],
  external: [
    "fs",
    "util",
    "child_process",
    "path",
    "config-expander",
    "caporal"
  ],
  input: pkg.module
};
