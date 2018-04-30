import base from '../rollup.config.js';

export default [
  base,
  {
    input: 'tests/run-test.js',
    external: ['ava'],

    plugins: [],

    output: {
      file: 'build/run-test.js',
      format: 'cjs',
      sourcemap: true
    }
  }
];
