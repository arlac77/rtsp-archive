import { readFileSync } from "node:fs";
import { join } from "node:path";
import initialize from "./initialize.mjs";
import pkg from "../package.json" with { type: "json" };
import { StandaloneServiceProvider } from "@kronos-integration/service";

const args = process.argv.slice(2);

switch (args[0]) {
  case "--version":
    {
      console.log(pkg.version);
      process.exit(0);
    }
    break;
  case "--help":
  case "-h":
    {
      console.log(`${pkg.description} (${pkg.version});
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

initializeServiceProvider();

async function initializeServiceProvider() {
  try {
    let serviceProvider;
    try {
      const m = await import("@kronos-integration/service-systemd");
      serviceProvider = new m.default();
    } catch (e) {
      serviceProvider = new StandaloneServiceProvider(
        JSON.parse(
          readFileSync(join(args[1], "config.json"), "utf8")
        )
      );
    }

    await initialize(serviceProvider);
    await serviceProvider.start();
  } catch (error) {
    console.error(error);
  }
}
