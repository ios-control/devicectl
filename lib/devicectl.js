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

/**
 * @typedef {object} devicectlResult
 * @property {string} stdout - The output of the subprocess standard output
 *    stream.
 * @property {string} stderr - The output of the subprocess standard error
 *    stream.
 * @property {number} [status] - The exit code of the subprocess, or `null` if
 *    the subprocess terminated due to a signal.
 * @property {string} [signal] - The signal used to kill the subprocess, or
 *    `null` if the subprocess did not terminate due to a signal.
 * @property {Error} [error] - The error object if the child process failed or
 *    timed out.
 */

/**
 * @typedef {object} devicectlJSONResult
 * @extends devicectlResult
 * @property {Object} [json] - The structured output of the subprocess result.
 */

module.exports = {
  /**
   * Checks that devicectl is available and can be invoked without errors.
   *
   * @returns {boolean} Whether prerequisites are met.
   */
  check_prerequisites: function () {
    const result = spawnSync('xcrun', ['devicectl', 'help'], { stdio: 'ignore', encoding: 'utf8' });

    if (result.status === 0) {
      return true;
    }

    return false;
  },

  /**
   * Returns the devicectl version number as an array.
   *
   * @returns {number[]} The major and minor components of the version number.
   */
  devicectl_version: function () {
    const res = spawnSync('xcrun', ['devicectl', '--version'], { encoding: 'utf8' });
    return res.stdout.split('.').map((v) => parseInt(v, 10));
  },

  /**
   * Returns the Xcode version number as an array.
   *
   * @returns {number[]} The major and minor components of the version number.
   */
  xcode_version: function () {
    const res = spawnSync('xcodebuild', ['-version'], { encoding: 'utf8' });
    const versionMatch = /Xcode (.*)/.exec(res.stdout);
    const versionString = versionMatch[1];

    return versionString.split('.').map((v) => parseInt(v, 10));
  },

  /**
   * Retrieves help information about devicectl or a specific devicectl
   * command.
   *
   * @param {string} [subcommand] - The subcommand (if any) for which to
   *    retrieve help information.
   * @returns {devicectlResult} The devicectl result. The help output is in the
   *    `stdout` property as a string.
   */
  help: function (subcommand) {
    if (subcommand) {
      return spawnSync('xcrun', ['devicectl', 'help', subcommand], { encoding: 'utf8' });
    } else {
      return spawnSync('xcrun', ['devicectl', 'help'], { encoding: 'utf8' });
    }
  },

  /**
   * Known valid options for the {@link list} command.
   *
   * @readonly
   * @enum {string}
   */
  ListTypes: Object.freeze({
    Devices: 'devices',
    PreferredDDI: 'preferredDDI'
  }),

  /**
   * Lists known devices or developer disk images.
   *
   * @param {string} type - The type of objects to list. If possible, use the
   *    {@link ListTypes} enum to provide a known value.
   * @returns {devicectlJSONResult} The returned list in structured JSON
   *    format.
   */
  list: function (type = module.exports.ListTypes.Devices) {
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

  /**
   * Known valid options for the {@link info} command.
   *
   * @readonly
   * @enum {string}
   */
  InfoTypes: Object.freeze({
    AppIcon: 'appIcon',
    Apps: 'apps',
    AuthListing: 'authListing',
    DDIServices: 'ddiServices',
    Details: 'details',
    Displays: 'displays',
    Files: 'files',
    LockState: 'lockState',
    Processes: 'processes'
  }),

  /**
   * Retrieves information about a specific device.
   *
   * @param {string} infoType - The type of information to retrieve. If
   *    possible, use the {@link InfoTypes} enum to provide a known value.
   * @param {string} deviceId - The identifier of the device from which to
   *    retrieve information.
   * @returns {devicectlJSONResult} The returned information in structured JSON
   *    format.
   */
  info: function (infoType, deviceId) {
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

  /**
   * Installs the specified app bundle on the specified device.
   *
   * @param {string} deviceId - The identifier of the device on which to
   *    install the app.
   * @param {string} appPath - The path to the app bundle to be installed.
   * @param {object} [options] - Additional options to devicectl.
   * @param {string} [options.stdio] - Override for the stdio handling for the
   *    install command. Valid values are `inherit`, `ignore`, or `pipe`.
   * @returns {devicectlResult} The result of the app installation command.
   */
  install: function (deviceId, appPath, options = {}) {
    const spawnOpts = { encoding: 'utf8' };

    if (options.stdio) {
      spawnOpts.stdio = options.stdio;
    }

    return spawnSync('xcrun', ['devicectl', 'device', 'install', 'app', '--device', deviceId, appPath], spawnOpts);
  },

  /**
   * Launches the app with the specified bundle ID on the specified device.
   *
   * @param {string} deviceId - The identifier of the device on which to
   *    launch the app.
   * @param {string} bundleId - The bundle identifier for the application to be
   *    launched.
   * @param {string[]} [argv] - Optional array of arguments to be passed to the
   *    launched application.
   * @param {object} [options] - Additional options to devicectl.
   * @param {string} [options.stdio] - Override for the stdio handling for the
   *    install command. Valid values are `inherit`, `ignore`, or `pipe`.
   * @param {boolean} [options.console] - Whether to attach the console to the
   *    launched application.
   * @param {boolean} [options.startStopped] - Whether the app should launch in
   *    a stopped state, allowing a debugger to attach.
   * @returns {devicectlResult} The result of the app launch command.
   */
  launch: function (deviceId, bundleId, argv = [], options = {}) {
    const args = ['devicectl', 'device', 'process', 'launch', '--device', deviceId];
    const spawnOpts = { encoding: 'utf8' };

    if (options.stdio) {
      spawnOpts.stdio = options.stdio;
    }

    if (options.waitForDebugger || options.startStopped) {
      args.push('--start-stopped');
    }

    if (options.console) {
      args.push('--console');
    }

    args.push(bundleId);
    args.push(...argv);

    return spawnSync('xcrun', args, spawnOpts);
  }
};
