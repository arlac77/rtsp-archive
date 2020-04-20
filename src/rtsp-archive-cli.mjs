import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { setup } from "./rtsp-archive.mjs";

const { version, description } = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
    { encoding: "utf8" }
  )
);

const args = process.argv.slice(2);

let config;

switch (args[0]) {
  case "--version":
    console.log(version);
    process.exit(0);
  case "--help":
  case "-h":
    console.log(`${description} (${version})
usage:
 -h --help this help screen
 -c --config <directory> set config directory`);
    process.exit(0);
    break;

  case "--config":
  case "-c":
    config = JSON.parse(
      readFileSync(join(args[1], "config.json"), { encoding: "utf8" })
    );

    break;
}

try {
  setup(new StandaloneServiceProvider(config));
} catch (error) {
  console.log(error);
}
