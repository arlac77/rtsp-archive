/* jslint node: true, esnext: true */
'use strict';

import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  banner: '#!/usr/bin/env node',
  format: 'cjs',
  plugins: [nodeResolve(), commonjs()],
  external: ['config-expander']
};
