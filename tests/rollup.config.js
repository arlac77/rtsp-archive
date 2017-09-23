import babel from 'rollup-plugin-babel';

export default {
  entry: 'tests/run-test.js',
  external: ['ava'],
  plugins: [
    babel({
      babelrc: false,
      presets: ['stage-3'],
      exclude: 'node_modules/**'
    })
  ],
  format: 'cjs',
  dest: 'build/test-bundle.js',
  sourceMap: true
};
