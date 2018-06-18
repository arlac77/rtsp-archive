import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import executable from 'rollup-plugin-executable';
import pkg from './package.json';

export default {
  output: {
    file: pkg.bin['rtsp-archive'],
    format: 'cjs',
    banner: '#!/usr/bin/env node',
    interop: false
  },
  plugins: [nodeResolve(), commonjs(), json(), executable()],
  external: ['fs', 'util', 'child_process', 'path', 'config-expander'],
  input: pkg.module
};
