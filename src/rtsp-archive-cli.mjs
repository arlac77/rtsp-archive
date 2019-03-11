import { expand } from "config-expander";
import { version, description } from "../package.json";
import { join, dirname, resolve } from "path";
import fs from "fs";
import { spawn } from "child_process";
import program from "commander";

const bonjour = require("nbonjour").create();

program
  .version(version)
  .description(description)
  .option("-c, --config <dir>", "use config directory")
  .action(async () => {
    const configDir = process.env.CONFIGURATION_DIRECTORY || program.config;

    const config = Object.assign(
      await expand(configDir ? "${include('config.json')}" : {}, {
        constants: {
          basedir: configDir || process.cwd(),
          installdir: resolve(__dirname, "..")
        }
      }),
      { recorders: {}, record: { dir: process.env.STATE_DIRECTORY || "/tmp" } }
    );

    if (process.env.STATE_DIRECTORY) {
      config.record.dir = process.env.STATE_DIRECTORY;
    }

    console.log(config);

    bonjour.find({ type: "rtsp" }, service => {
      console.log("Found an RTSP server:", service);

      const m = service.fqdn.match(/^([^\s]+)\s+(.*)/);

      if (m) {
        const recorderName = m[1];
        const videoType = m[2];

        /*if (!videoPriorities[videoType]) {
          return;
        }*/

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

        /*
        for (const vT in recorder.videoTypes) {
          if (vT === videoType) {
            return;
          }
        }
*/
        for (const a of service.addresses) {
          if (a.match(/^[0-9\.]+$/)) {
            recorder.address = a;
            break;
          }
        }

        recorder.url = `${service.protocol}:${service.referer.address}/${
          service.txt.ath
        }`;
        //recorder.url = "rtsp://10.0.3.2/mpeg4/1/media.amp";

        recorder.port = service.port;
        startRecording(config, recorderName);
      }
    });

    /*
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
*/
    console.log(`waiting for services`);
  })
  .parse(process.argv);

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

async function startRecording(config, recorderName) {
  const recorder = config.recorders[recorderName];

  console.log("START RECORDING", recorderName, recorder);
  if (recorder === undefined) {
    return;
  }

  if (recorder.child !== undefined) {
    console.log("ALREDY RUNNING", recorderName, recorder.child.pid);
    return;
  }

  let videoType = "NONE";

  for (const vT in recorder.videoTypes) {
    if (videoPriorities[vT] > videoPriorities[videoType]) {
      videoType = vT;
    }
  }

  /*
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
*/

  recorder.recordingType = videoType;

  const today = new Date();
  const dir = join(
    config.record.dir,
    recorderName,
    String(today.getFullYear()),
    String(today.getMonth()),
    String(today.getDate())
  );

  recorder.file = join(
    dir,
    `${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.${
      recorder.fileFormat
    }`
  );

  await fs.promises.mkdir(dir, { recursive: true, mode: "0755" });

  //recorder.url = "rtsp://10.0.3.2/mpeg4/1/media.amp";
  //ffmpeg -i rtsp://10.0.3.2/mpeg4/1/media.amp -b 900k -vcodec copy -r 60 -y MyVdeoFFmpeg.avi

  const options = [
    "-hide_banner",
    "-loglevel",
    "panic",
    "-i",
    recorder.url,
    "-acodec",
    "copy",
    "-vcodec",
    "copy",
    "-timestamp",
    "now",
    "-y",
    recorder.file
  ];

  const properties = {
    //    width: "-w",
    //    height: "-h",
    //    framerate: "-r"
  };

  Object.keys(properties).forEach(o => {
    if (recorder[o] !== undefined) {
      options.push(properties[o], recorder[o]);
    }
  });

  /*
  if (recorder.user !== undefined) {
    options.push("-u", recorder.user, recorder.password);
  }

  if (recorder.url === undefined) {
    recorder.url = `rtsp://${recorder.address}:${recorder.port}/${
      recorder.videoTypes[videoType]
    }`;
  }
*/

  console.log("ffmpeg", options);

  recorder.child = spawn("ffmpeg", options, { stdio: "inherit" });

  //console.log(recorder.child);

  recorder.child.on("exit", code => {
    console.log("EXIT", code);
    delete recorder.child;
    delete recorder.recordingType;
    startRecording(config, recorderName);
  });

  /*
  setTimeout(() => {
    if (recorder.child !== undefined) {
      recorder.child.kill("SIGTERM");
    }
  }, (config.record.duration + 5) * 1000);
  */
}
