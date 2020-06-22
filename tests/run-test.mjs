import test from "ava";
import { join, dirname } from "path";
import execa from "execa";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));

test("rtsp-archive", async t => {
  const result = await execa("node", [join(here, "..", "src", "rtsp-archive-cli.mjs"),
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
