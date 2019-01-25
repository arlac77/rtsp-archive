import { expand } from "config-expander";
import { version, description } from "../package.json";
import { join, basename, dirname, resolve } from "path";
import { open, promises } from "fs";
import { spawn } from "child_process";
import program from "caporal";

const { tcp, createBrowser } = require("mdns");

program
  .version(version)
  .description(description)
  .option("-c, --config <dir>", "use config directory")
  .action(async (args, options, logger) => {
    const configDir = process.env.CONFIGURATION_DIRECTORY || options.config;

    const config = Object.assign(
      await expand(
        configDir ? "${include('" + join(configDir, "config.json") + "')}" : {},
        {
          constants: {
            basedir: configDir || process.cwd(),
            installdir: resolve(__dirname, "..")
          }
        }
      ),
      { recorders: {}, record: { dir: "/tmp" } }
    );

    const browser = createBrowser(tcp("rtsp"));

    browser.on("serviceUp", service => {
      console.log(`got ${JSON.stringify(service)}`);

      const m = service.name.match(/^([^\s]+)\s+(.*)/);

      if (m) {
        const recorderName = m[1];
        const videoType = m[2];

        if (!videoPriorities[videoType]) {
          return;
        }

        let recorder = config.recorders[recorderName];
        if (recorder === undefined) {
          recorder = config.recorders[recorderName] = {
            fileFormat: "mp4",
            width: 640,
            height: 480,
            framerate: 15
          };
        }
        if (recorder.videoTypes === undefined) {
          recorder.videoTypes = {};
        }

        for (const vT in recorder.videoTypes) {
          if (vT === videoType) {
            return;
          }
        }

        for (const a of service.addresses) {
          if (a.match(/^[0-9\.]+$/)) {
            recorder.address = a;
            break;
          }
        }

        recorder.port = service.port;
        recorder.videoTypes[videoType] = service.txtRecord.path;
        startRecording(config, recorderName, logger);
      }
    });

    browser.on("serviceDown", service => {
      const m = service.name.match(/^([^\s]+)\s+(.*)/);

      if (m !== undefined) {
        const slot = m[1];

        const recorder = recorders[slot];
        if (recorder !== undefined) {
          if (recorder.child) {
            recorder.child.kill("SIGHUP");
          }
          delete recorders[slot];
        }
      }
    });

    logger.info(`waiting for services`);

    browser.start();
  });

program.parse(process.argv);

const videoPriorities = {
  "H.264": 2,
  "MPEG-4": 1,
  NONE: 0
};

const fileFormats = {
  avi: {
    openRTSP: "-i"
  },
  mp4: {
    openRTSP: "-4"
  }
};

async function startRecording(config, recorderName, logger) {
  const recorder = config.recorders[recorderName];
  if (recorder === undefined) {
    return;
  }

  let videoType = "NONE";

  for (const vT in recorder.videoTypes) {
    if (videoPriorities[vT] > videoPriorities[videoType]) {
      videoType = vT;
    }
  }

  if (videoType === "NONE") {
    return;
  }

  if (recorder.recordingType !== undefined) {
    if (recorder.recordingType === videoType) {
      return;
    }

    delete recorder.recordingType;
    if (recorder.child) {
      recorder.child.kill();
    }
    setTimeout(() => startRecording(config, recorderName), 1000);
    return;
  }

  recorder.recordingType = videoType;

  const openrtsp = "/usr/local/bin/openRTSP";

  const today = new Date();
  const dir = join(
    config.record.dir,
    recorderName,
    String(today.getFullYear()),
    String(today.getMonth()),
    String(today.getMinutes())
  );

  recorder.file = join(
    dir,
    `${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.${
      recorder.fileFormat
    }`
  );

  await promises.mkdir(dir, { recursive: true, mode: "0755" });

  const stdout = await promises.open(recorder.file, "w+");
  const stderr = await promises.open(recorder.file + ".err", "w+");

  const options = [
    "-t",
    fileFormats[recorder.fileFormat].openRTSP,
    "-d",
    config.record.duration
  ];

  const properties = {
    width: "-w",
    height: "-h",
    framerate: "-f"
  };

  Object.keys(properties).forEach(o => {
    if (recorder[o] !== undefined) {
      options.push(properties[o], recorder[o]);
    }
  });

  if (recorder.user !== undefined) {
    options.push("-u", recorder.user, recorder.password);
  }

  if (recorder.url === undefined) {
    recorder.url = `rtsp://${recorder.address}:${recorder.port}/${
      recorder.videoTypes[videoType]
    }`;
  }

  options.push(recorder.url);

  recorder.child = spawn(openrtsp, options, {
    stdio: ["ignore", stdout, stderr]
  });
  recorder.child.on("exit", () => {
    delete recorder.child;
    delete recorder.recordingType;
    startRecording(config, recorderName, logger);
  });

  setTimeout(() => {
    if (recorder.child !== undefined) {
      recorder.child.kill("SIGTERM");
    }
  }, (config.record.duration + 5) * 1000);
}
