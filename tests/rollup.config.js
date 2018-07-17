import istanbul from 'rollup-plugin-istanbul';

import multiEntry from 'rollup-plugin-multi-entry';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import base from '../rollup.config.js';

export default [
  base,
  {
    input: 'tests/run-test.js',
    external: ['ava', 'path', 'execa'],

    plugins: [],

    output: {
      file: 'build/run-test.js',
      format: 'cjs',
      sourcemap: true,
      interop: false
    }
  }
];
