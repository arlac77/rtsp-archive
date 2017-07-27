import { expand } from 'config-expander';

const makeDir = require('make-dir');
const del = require('del');

const program = require('caporal'),
  path = require('path'),
  fs = require('fs'),
  child_process = require('child_process'),
  mdns = require('mdns'),
  asyncModule = require('async');

program
  .version(require(path.join(__dirname, '..', 'package.json')).version)
  .description('archive rtsp stream with openRTSP')
  .option('-c, --config <file>', 'use config file')
  .action(async (args, options, logger) => {
    const config = await expand(
      options.config
        ? "${include('" + path.basename(options.config) + "')}"
        : {},
      {
        constants: {
          basedir: path.dirname(options.config || process.cwd()),
          installdir: path.resolve(__dirname, '..')
        }
      }
    );
    const recorders = config.recorders || {};
    const browser = mdns.createBrowser(mdns.tcp('rtsp'));

    logger.info(`waiting for services`);

    browser.on('serviceUp', service => {
      logger.info(`got ${service}`);

      const m = service.name.match(/^([^\s]+)\s+(.*)/);

      if (m !== undefined) {
        const recorderName = m[1];
        const videoType = m[2];

        if (!videoPriorities[videoType]) {
          return;
        }

        let recorder = recorders[recorderName];
        if (!recorder) {
          recorder = recorders[recorderName] = {
            fileFormat: 'mp4',
            width: 640,
            height: 480,
            framerate: 15
          };
        }
        if (!recorder.videoTypes) {
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
        startRecording(recorderName);
      }
    });

    browser.on('serviceDown', service => {
      const m = service.name.match(/^([^\s]+)\s+(.*)/);

      if (m !== undefined) {
        const slot = m[1];

        const recorder = recorders[slot];
        if (recorder !== undefined) {
          if (recorder.child) {
            recorder.child.kill('SIGHUP');
          }
          delete recorders[slot];
        }
      }
    });

    browser.start();
  });

program.parse(process.argv);

const videoPriorities = {
  'H.264': 2,
  'MPEG-4': 1,
  NONE: 0
};

const fileFormats = {
  avi: {
    openRTSP: '-i'
  },
  mp4: {
    openRTSP: '-4'
  }
};

async function startRecording(config, recorderName) {
  const recorder = config.recorders[recorderName];
  if (recorder === undefined) {
    return;
  }

  let videoType = 'NONE';

  for (const vT in recorder.videoTypes) {
    if (videoPriorities[vT] > videoPriorities[videoType]) {
      videoType = vT;
    }
  }

  if (videoType === 'NONE') {
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
    setTimeout(() => startRecording(recorderName), 1000);
    return;
  }

  recorder.recordingType = videoType;

  const openrtsp = '/usr/local/bin/openRTSP';

  const today = new Date();
  const dir = path.join(
    config.record.dir,
    recorderName,
    Date.format(today, 'Y'),
    Date.format(today, 'm'),
    Date.format(today, 'd')
  );
  recorder.file = path.join(
    dir,
    Date.format(today, 'H-i-s') + '.' + recorder.fileFormat
  );

  if (recorder.recordingType !== videoType) {
    return;
  }

  await makeDir(dir, '0755');

  asyncModule.map(
    [recorder.file, recorder.file + '.err'],
    (arg, callback) => fs.open(arg, 'w+', callback),
    (error, results) => {
      if (error) {
        return;
      }

      const options = [
        '-t',
        fileFormats[recorder.fileFormat].openRTSP,
        '-d',
        config.record.duration
      ];

      if (recorder.width !== undefined) {
        options.push('-w', recorder.width);
      }

      if (recorder.height !== undefined) {
        options.push('-h', recorder.height);
      }

      if (recorder.framerate !== undefined) {
        options.push('-f', recorder.framerate);
      }

      if (recorder.user !== undefined) {
        options.push('-u', recorder.user, recorder.password);
      }

      if (recorder.url === undefined) {
        recorder.url = `rtsp://${recorder.address}:${recorder.port}/${recorder
          .videoTypes[videoType]}`;
      }

      options.push(recorder.url);

      recorder.child = child_process.spawn(openrtsp, options, {
        stdio: ['ignore', results[0], results[1]]
      });
      recorder.child.on('exit', () => {
        delete recorder.child;
        delete recorder.recordingType;
        startRecording(recorderName);
      });

      setTimeout(() => {
        if (recorder.child !== undefined) {
          recorder.child.kill('SIGTERM');
        }
      }, (config.record.duration + 5) * 1000);
    }
  );
}
