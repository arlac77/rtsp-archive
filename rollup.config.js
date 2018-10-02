import cleanup from "rollup-plugin-cleanup";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import json from "rollup-plugin-json";
import executable from "rollup-plugin-executable";
import pkg from "./package.json";

export default {
  output: {
    file: pkg.bin["rtsp-archive"],
    format: "cjs",
    banner:
      '#!/bin/sh\n":" //# comment; exec /usr/bin/env node --experimental-modules --experimental-worker "$0" "$@"',
    interop: false
  },
  plugins: [
    resolve(),
    commonjs(),
    json({
      include: "package.json",
      preferConst: true,
      compact: true
    }),
    cleanup(),
    executable()
  ],
  external: ["fs", "util", "child_process", "path", "config-expander"],
  input: pkg.module
};
