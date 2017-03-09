/* jslint node: true, esnext: true */

'use strict';

const program = require('caporal'),
  path = require('path'),
  fs = require('fs'),
  child_process = require('child_process'),
  mdns = require('mdns'),
  asyncModule = require('async'),
  mkdirp = require('mkdirp');


import {
  expand
}
from 'config-expander';

program
  .version(require(path.join(__dirname, '..', 'package.json')).version)
  .description('archive rtsp stream with openRTSP')
  .option('-c, --config <file>', 'use config file')
  .action(async(args, options, logger) => {
    const constants = {
      basedir: path.dirname(options.config || process.cwd()),
      installdir: path.resolve(__dirname, '..')
    };

    const config = await expand(options.config ? "${include('" + path.basename(options.config) + "')}" : {}, {
      constants
    });
    const recorders = config.recorders || {};
    const browser = mdns.createBrowser(mdns.tcp('rtsp'));
    browser.on('serviceUp', service => {
      const m = service.name.match(/^([^\s]+)\s+(.*)/);

      if (m) {
        const recorderName = m[1];
        const videoType = m[2];

        if (!videoPriorities[videoType]) return;

        let recorder = recorders[recorderName];
        if (!recorder) recorder = recorders[recorderName] = {
          fileFormat: 'mp4',
          width: 640,
          height: 480,
          framerate: 15
        };
        if (!recorder.videoTypes) recorder.videoTypes = {};

        for (let vT in recorder.videoTypes)
          if (vT === videoType)
            return;

        for (let i in service.addresses) {
          const a = service.addresses[i];
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

      if (m) {
        const slot = m[1];
        const type = m[2];

        const recorder = recorders[slot];
        if (recorder) {
          if (recorder.child) recorder.child.kill('SIGHUP');
          delete recorders[slot];
        }
      }
    });

    browser.start();
  });

program
  .parse(process.argv);


const videoPriorities = {
  'H.264': 2,
  'MPEG-4': 1,
  'NONE': 0
};

const fileFormats = {
  'avi': {
    'openRTSP': '-i'
  },
  'mp4': {
    'openRTSP': '-4'
  }
};


function startRecording(config, recorderName) {

  let recorder = config.recorders[recorderName];
  if (!recorder) return;

  let videoType = 'NONE';
  for (let vT in recorder.videoTypes)
    if (videoPriorities[vT] > videoPriorities[videoType])
      videoType = vT;
  if (videoType === 'NONE') {
    return;
  }

  if (recorder.recordingType) {
    if (recorder.recordingType != videoType) {
      delete recorder.recordingType;
      if (recorder.child) {
        recorder.child.kill();
      }
      setTimeout(() => startRecording(recorderName), 1000);
      return;
    } else
      return;
  }

  recorder.recordingType = videoType;

  const openrtsp = '/usr/local/bin/openRTSP';

  const today = new Date();
  const dir = path.join(config.record.dir, recorderName, Date.format(today, 'Y'), Date.format(today, 'm'), Date.format(
    today, 'd'));
  recorder.file = path.join(dir, Date.format(today, 'H-i-s') + '.' + recorder.fileFormat);

  mkdirp(dir, '0755', error => {
    if (error) {
      return;
    }
    if (recorder.recordingType != videoType) return;

    asyncModule.map([recorder.file, recorder.file + '.err'], (arg, callback) => fs.open(arg, 'w+', callback), (
      error,
      results) => {
      if (error) {
        return;
      }

      const options = [
        '-t', fileFormats[recorder.fileFormat].openRTSP,
        '-d', config.record.duration
      ];

      if (recorder.width) {
        options.push('-w', recorder.width);
      }

      if (recorder.height) {
        options.push('-h', recorder.height);
      }

      if (recorder.framerate) {
        options.push('-f', recorder.framerate);
      }

      if (recorder.user) {
        options.push('-u', recorder.user, recorder.password);
      }

      if (!recorder.url) {
        recorder.url = 'rtsp://' + recorder.address + ":" + recorder.port + "/" + recorder.videoTypes[videoType];
      }

      options.push(recorder.url);

      recorder.child = child_process.spawn(openrtsp, options, {
        stdio: ['ignore', results[0], results[1]]
      });
      recorder.child.on('exit', code => {
        delete recorder.child;
        delete recorder.recordingType;
        startRecording(recorderName);
      });

      setTimeout(() => {
        if (recorder.child) {
          recorder.child.kill('SIGTERM');
        }
      }, (config.record.duration + 3) * 1000);
    });
  });
}
