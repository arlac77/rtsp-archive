/* jslint node: true, esnext: true */

'use strict';

import path from 'path';
import test from 'ava';

const execa = require('execa');

test('rtsp-archive', async t => {
  return execa(path.join(__dirname, '..', 'bin', 'rtsp-archive'), ['-h']).then(result => {
    console.log(result.stdout);
  });
});

/*
test('rtsp-archive with config', async t => {
  return execa(path.join(__dirname, '..', 'bin', 'rtsp-archive'), [
    `--configx=${path.join(__dirname,'..','config','config.json')}`, '-h'
  ]).then(result => {
    console.log(result.stdout);
    //=> 'unicorns'
  });
});
*/
