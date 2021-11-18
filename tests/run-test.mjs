import test from "ava";
import { execa } from "execa";

test("rtsp-archive cli", async t => {
  const result = await execa("node", [
    new URL("../src/rtsp-archive-cli.mjs", import.meta.url).pathnme,
    "-h"
  ]);
  t.regex(result.stdout, /--config <directory>/);
});

/*
test('rtsp-archive with config', async t => {
  return execa(path.join(here, '..', 'bin', 'rtsp-archive'), [
    `--configx=${path.join(here,'..','config','config.json')}`, '-h'
  ]).then(result => {
    console.log(result.stdout);
    //=> 'unicorns'
  });
});
*/
