/*
The MIT License (MIT)

Copyright (c) 2026 Darryl Pogue.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

const { spawnSync } = require('node:child_process');

module.exports = {
  check_prerequisites: function () {
    const result = spawnSync('xcrun', ['devicectl', 'help'], { stdio: 'ignore', encoding: 'utf8' });

    if (result.status !== 0) {
      result.stdout = 'devicectl was not found.\n';
      result.stdout += 'Check that you have Xcode installed:\n';
      result.stdout += '\txcodebuild --version\n';
      result.stdout += 'Check that you have Xcode selected:\n';
      result.stdout += '\txcode-select --print-path\n';
    }

    return result;
  },

  devicectl_version: function () {
    const res = spawnSync('xcrun', ['devicectl', '--version'], { encoding: 'utf8' });
    return res.stdout.split('.').map((v) => parseInt(v, 10));
  },

  xcode_version: function () {
    const res = spawnSync('xcodebuild', ['-version'], { encoding: 'utf8' });
    const versionMatch = /Xcode (.*)/.exec(res.stdout);
    const versionString = versionMatch[1];

    return versionString.split('.').map((v) => parseInt(v, 10));
  },

  help: function (subcommand) {
    if (subcommand) {
      return spawnSync('xcrun', ['devicectl', 'help', subcommand], { encoding: 'utf8' });
    } else {
      return spawnSync('xcrun', ['devicectl', 'help'], { encoding: 'utf8' });
    }
  },

  list: function (type = 'devices') {
    const result = spawnSync('xcrun', ['devicectl', 'list', type, '--quiet', '--json-output', '/dev/stdout'], { encoding: 'utf8' });

    if (result.status === 0) {
      try {
        result.json = JSON.parse(result.stdout);
      } catch (err) {
        console.error(err.stack);
      }
    }

    return result;
  },

  InfoTypes: Object.freeze({
    AppIcon:        'appIcon',
    Apps:           'apps',
    AuthListing:    'authListing',
    DDIServices:    'ddiServices',
    Details:        'details',
    Displays:       'displays',
    Files:          'files',
    LockState:      'lockState',
    Processes:      'processes'
  }),

  info: function (infoType, deviceId) {
    if (!Object.values(module.exports.InfoTypes).contains(infoType)) {
        throw new TypeError(`Unexpected device info command '${infoType}'`);
    }

    const result = spawnSync('xcrun', ['devicectl', 'device', 'info', infoType, '--device', deviceId, '--quiet', '--json-output', '/dev/stdout'], { encoding: 'utf8' });

    if (result.status === 0) {
      try {
        result.json = JSON.parse(result.stdout);
      } catch (err) {
        console.error(err.stack);
      }
    }

    return result;
  },

  install: function (deviceId, appPath) {
    return spawnSync('xcrun', ['devicectl', 'device', 'install', 'app', '--device', deviceId, appPath], { encoding: 'utf8' });
  },

  launch: function (deviceId, bundleId, argv = [], options = {}) {
    const args = ['devicectl', 'device', 'process', 'launch', '--device', deviceId];

    if (options.waitForDebugger || options.startStopped) {
      args.push('--start-stopped');
    }

    if (options.console) {
      args.push('--console');
    }

    args.push(bundleId);
    args.push(...argv);

    return spawnSync('xcrun', args, { encoding: 'utf8' });
  }
};
