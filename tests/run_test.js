/* jslint node: true, esnext: true */

'use strict';

import path from 'path';
import test from 'ava';

const execa = require('execa');

test('rtsp-archive', async t => {
  return execa(path.join(__dirname, '..', 'bin', 'rtsp-archive'), ['-h']).then(result => {
    console.log(result.stdout);
    //=> 'unicorns'
  });
});
