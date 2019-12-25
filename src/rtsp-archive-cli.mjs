import program from "commander";
import version from 'consts:version';
import description from 'consts:description';
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { setup } from "./rtsp-archive.mjs";

program
  .version(version)
  .description(description)
  .option("-c, --config <directory>", "use config from directory")
  .action(async () => {
    if (program.config) {
    }

    try {
      setup(new StandaloneServiceProvider());
    } catch (error) {
      console.log(error);
    }
  })
  .parse(process.argv);
