import version from "consts:version";
import description from "consts:description";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { setup } from "./rtsp-archive.mjs";

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
 -c --config <dir> set config directory`);
    process.exit(0);
    break;

  case "--config":
  case "-c":
    process.env.CONFIGURATION_DIRECTORY = args[1];
    break;
}

try {
  setup(new StandaloneServiceProvider());
} catch (error) {
  console.log(error);
}
