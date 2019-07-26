import { version, description } from "../package.json";
import { join, resolve } from "path";
import fs from "fs";
import { spawn } from "child_process";
import program from "commander";
import { expand } from "config-expander";
import nbonjour from "nbonjour";
import { removeSensibleValues } from "remove-sensible-values";

program
  .version(version)
  .description(description)
  .option("-c, --config <dir>", "use config directory")
  .action(async () => {
    const configDir = process.env.CONFIGURATION_DIRECTORY || program.config;

    const config = await expand(configDir ? "${include('config.json')}" : {}, {
      constants: {
        basedir: configDir || process.cwd(),
        installdir: resolve(__dirname, "..")
      },
      default: {
        recorders: {},
        record: { dir: "${first(env.STATE_DIRECTORY,'/tmp')}" }
      }
    });

    console.log(removeSensibleValues(config));

    const bonjour = nbonjour.create();

    startRecorders(config, bonjour);

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
  })
  .parse(process.argv);

const videoPriorities = {
  "H.264": 2,
  "MPEG-4": 1,
  NONE: 0
};

function videoEncoding(type) {
  if (type.startsWith("H.264")) {
    return "H.264";
  }

  return undefined;
}

async function startRecorders(config, bonjour) {
  bonjour.find({ type: "rtsp" }, service => {
    console.log("Found an RTSP server", service);

    const m = service.fqdn.match(/^([^\s]+)\s+(.*)/);

    if (m) {
      const recorderName = m[1];
      const videoType = m[2];

      const encoding = videoEncoding(m[2]);

      console.log("RECORDER", recorderName, encoding);

      if (encoding === undefined) {
        console.log("ERROR unsupported encoding", m[2]);

        return;
      }

      let recorder = config.recorders[recorderName];
      if (recorder === undefined) {
        recorder = config.recorders[recorderName] = {
          fileFormat: "fragment-%03d.mp4",
          width: 640,
          height: 480,
          framerate: 15
        };
      }

      recorder.name = recorderName;

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
      
      startRecording(config, bonjour, recorder);
    }
  });
}

async function startRecording(config, bonjour, recorder) {
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

  function nts(n) {
    const s = "00" + n;
    return s.substring(s.length - 2);
  }

  const dir = join(
    config.record.dir,
    recorderName,
    String(today.getFullYear()),
    nts(today.getMonth() + 1),
    nts(today.getDate())
  );

  recorder.file = join(
    dir,
    `${nts(today.getHours())}-${nts(today.getMinutes())}-${nts(
      today.getSeconds()
    )}${recorder.fileFormat}`
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

    "-map",
    "0",
    "-f",
    "segment",
    "-segment_time",
    "900",
    "-segment_format",
    "mp4",
    recorder.file

    /*
    "-y",
    recorder.file
    */
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

  recorder.child.on("exit", code => {
    console.log("EXIT", code);
    delete recorder.child;
    delete recorder.recordingType;
    startRecorders(config, bonjour);
  });

  /*
  setTimeout(() => {
    if (recorder.child !== undefined) {
      recorder.child.kill("SIGTERM");
    }
  }, (config.record.duration + 5) * 1000);
  */
}
