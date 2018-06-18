import test from 'ava';
import { join } from 'path';
import execa from 'execa';

test('rtsp-archive', async t => {
  const result = await execa(join(__dirname, '..', 'bin', 'rtsp-archive'), [
    '-h'
  ]);
  t.regex(result.stdout, /--config <file>/);
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
