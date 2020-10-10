import { readFileSync } from "fs";
import { join } from "path";
import setup from "./rtsp-archive.mjs";
import { StandaloneServiceProvider } from "@kronos-integration/service";

const args = process.argv.slice(2);

switch (args[0]) {
  case "--version":
    {
      const { version } = info();
      console.log(version);
      process.exit(0);
    }
    break;
  case "--help":
  case "-h":
    {
      const { description, version } = info();
      console.log(`${description} (${version});
usage:
 -h --help this help screen
 -c --config <directory> set config directory`);
      process.exit(0);
    }
    break;

  case "--config":
  case "-c":
    process.env.CONFIGURATION_DIRECTORY = args[1];
    break;
}

initialize();

function info() {
  return JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url).pathname, {
      encoding: "utf8"
    })
  );
}

async function initialize() {
  try {
    let serviceProvider;
    try {
      const m = await import("@kronos-integration/service-systemd");
      serviceProvider = new m.default();
    } catch (e) {
      serviceProvider = new StandaloneServiceProvider(
        JSON.parse(
          readFileSync(join(args[1], "config.json"), { encoding: "utf8" })
        )
      );
    }

    await setup(serviceProvider);
  } catch (error) {
    console.error(error);
  }
}
