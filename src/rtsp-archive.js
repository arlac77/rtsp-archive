import { expand } from 'config-expander';
import { version } from '../package.json';

const makeDir = require('make-dir');
const del = require('del');

const program = require('caporal'),
  path = require('path'),
  fs = require('fs'),
  child_process = require('child_process'),
  mdns = require('mdns'),
  asyncModule = require('async');

program
  .version(version)
  .description('archive rtsp stream with openRTSP')
  .option('-c, --config <file>', 'use config file')
  .action(async (args, options, logger) => {
    const config = Object.assign(
      await expand(
        options.config
          ? "${include('" + path.basename(options.config) + "')}"
          : {},
        {
          constants: {
            basedir: path.dirname(options.config || process.cwd()),
            installdir: path.resolve(__dirname, '..')
          }
        }
      ),
      { recorders: {}, record: { dir: '/tmp' } }
    );

    const browser = mdns.createBrowser(mdns.tcp('rtsp'));

    browser.on('serviceUp', service => {
      //logger.info(`got ${JSON.stringify(service)}`);

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
            fileFormat: 'mp4',
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

    logger.info(`waiting for services`);

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

async function startRecording(config, recorderName, logger) {
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
    setTimeout(() => startRecording(config, recorderName), 1000);
    return;
  }

  recorder.recordingType = videoType;

  const openrtsp = '/usr/local/bin/openRTSP';

  const today = new Date();
  const dir = path.join(
    config.record.dir,
    recorderName,
    String(today.getFullYear()),
    String(today.getMonth()),
    String(today.getMinutes())
  );

  recorder.file = path.join(
    dir,
    `${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.${
      recorder.fileFormat
    }`
  );

  await makeDir(dir, '0755');

  asyncModule.map(
    [recorder.file, recorder.file + '.err'],
    (arg, callback) => fs.open(arg, 'w+', callback),
    (error, results) => {
      if (error) {
        logger.error(error);
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
        recorder.url = `rtsp://${recorder.address}:${recorder.port}/${
          recorder.videoTypes[videoType]
        }`;
      }

      options.push(recorder.url);

      recorder.child = child_process.spawn(openrtsp, options, {
        stdio: ['ignore', results[0], results[1]]
      });
      recorder.child.on('exit', () => {
        delete recorder.child;
        delete recorder.recordingType;
        startRecording(config, recorderName, logger);
      });

      setTimeout(() => {
        if (recorder.child !== undefined) {
          recorder.child.kill('SIGTERM');
        }
      }, (config.record.duration + 5) * 1000);
    }
  );
}
