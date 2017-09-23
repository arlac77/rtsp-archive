import babel from 'rollup-plugin-babel';

export default {
  input: 'tests/run-test.js',
  external: ['ava'],

  plugins: [
    babel({
      babelrc: false,
      presets: ['stage-3'],
      exclude: 'node_modules/**'
    })
  ],

  output: {
    file: 'build/test-bundle.js',
    format: 'cjs',
    sourcemap: true
  }
};
