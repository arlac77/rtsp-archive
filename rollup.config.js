import builtins from "builtin-modules";
import cleanup from "rollup-plugin-cleanup";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import executable from "rollup-plugin-executable";
import json from "rollup-plugin-json";
import pkg from "./package.json";

// require('module').builtinModules
const external = [
  "assert",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stream",
  "string_decoder",
  "sys",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "zlib"
];

export default {
  output: {
    file: pkg.bin["rtsp-archive"],
    format: "cjs",
    banner:
      '#!/bin/sh\n":" //# comment; exec /usr/bin/env node --experimental-modules "$0" "$@"',
    interop: false
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
