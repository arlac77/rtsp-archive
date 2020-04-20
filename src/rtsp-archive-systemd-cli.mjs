import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import ServiceSystemd from "@kronos-integration/service-systemd";
import { setup } from "./rtsp-archive.mjs";

const { version, description } = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
    { encoding: "utf8" }
  )
);

const args = process.argv.slice(2);

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
    process.env.CONFIGURATION_DIRECTORY = args[1];
    break;
}

try {
  setup(new ServiceSystemd());
} catch (error) {
  console.log(error);
}
