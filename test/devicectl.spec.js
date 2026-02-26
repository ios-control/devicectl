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

const test = require('node:test');
const childProcess = require('node:child_process');

const originalSpawnSync = childProcess.spawnSync;
const spawnMock = test.mock.method(childProcess, 'spawnSync');

const devicectl = require('../lib/devicectl');

test.beforeEach(() => {
  spawnMock.mock.resetCalls();
});

test('exports', (t) => {
  t.assert ||= require('node:assert');

  t.assert.equal(typeof devicectl.check_prerequisites, 'function');
  t.assert.equal(typeof devicectl.devicectl_version, 'function');
  t.assert.equal(typeof devicectl.xcode_version, 'function');
  t.assert.equal(typeof devicectl.help, 'function');
  t.assert.equal(typeof devicectl.list, 'function');
  t.assert.equal(typeof devicectl.info, 'function');
  t.assert.equal(typeof devicectl.install, 'function');
  t.assert.equal(typeof devicectl.launch, 'function');
});

test('check_prerequisites fail', (t) => {
  t.assert ||= require('node:assert');

  spawnMock.mock.mockImplementationOnce(() => {
    return { status: 1 };
  });

  const retObj = devicectl.check_prerequisites();
  t.assert.ok(retObj.stdout);
  t.assert.match(retObj.stdout, /devicectl was not found./);
});

test('check_prerequisites success', (t) => {
  t.assert ||= require('node:assert');

  spawnMock.mock.mockImplementationOnce(() => {
    return { status: 0 };
  });

  const retObj = devicectl.check_prerequisites();
  t.assert.equal(retObj.stdout, undefined);
});

test('xcode version', (t) => {
  t.assert ||= require('node:assert');

  spawnMock.mock.mockImplementationOnce((...args) => {
    return originalSpawnSync.call(childProcess, ...args);
  });

  const retObj = devicectl.xcode_version();
  t.assert.ok(retObj[0] >= 15);
});

test('devicectl version', (t) => {
  t.assert ||= require('node:assert');

  spawnMock.mock.mockImplementationOnce((...args) => {
    return originalSpawnSync.call(childProcess, ...args);
  });

  const retObj = devicectl.devicectl_version();
  t.assert.ok(retObj[0] >= 100);
});

test('devicectl help', async (ctx) => {
  await ctx.test('with no arguments', (t) => {
    t.assert ||= require('node:assert');

    spawnMock.mock.mockImplementationOnce(() => {
      return { status: 0, stdout: '' };
    });

    devicectl.help();
    t.assert.deepEqual(spawnMock.mock.calls[0].arguments[1], ['devicectl', 'help']);
  });

  await ctx.test('with a subcommand', (t) => {
    t.assert ||= require('node:assert');

    spawnMock.mock.mockImplementationOnce(() => {
      return { status: 0, stdout: '' };
    });

    devicectl.help('manage');
    t.assert.deepEqual(spawnMock.mock.calls[0].arguments[1], ['devicectl', 'help', 'manage']);
  });
});

test('devicectl list', async (ctx) => {
  ctx.beforeEach((t) => {
    t.mock.method(console, 'error', () => {});
  });

  await ctx.test('with no arguments', (t) => {
    t.assert ||= require('node:assert');

    spawnMock.mock.mockImplementationOnce(() => {
      return { status: 0, stdout: '{"result":{"devices":[]}}' };
    });

    const retObj = devicectl.list();
    t.assert.deepEqual(spawnMock.mock.calls[0].arguments[1], ['devicectl', 'list', 'devices', '--quiet', '--json-output', '/dev/stdout']);
    t.assert.deepEqual(retObj.json, { result: { devices: [] } });
  });

  await ctx.test('with preferredDDI argument', (t) => {
    t.assert ||= require('node:assert');

    spawnMock.mock.mockImplementationOnce(() => {
      return { status: 0, stdout: '{"result":{"platforms":[]}}' };
    });

    const retObj = devicectl.list('preferredDDI');
    t.assert.deepEqual(spawnMock.mock.calls[0].arguments[1], ['devicectl', 'list', 'preferredDDI', '--quiet', '--json-output', '/dev/stdout']);
    t.assert.deepEqual(retObj.json, { result: { platforms: [] } });
  });

  await ctx.test('with parsing error', (t) => {
    t.assert ||= require('node:assert');

    spawnMock.mock.mockImplementationOnce(() => {
      return { status: 0, stdout: 'This is not valid JSON' };
    });

    const retObj = devicectl.list();
    t.assert.match(console.error.mock.calls[0].arguments[0], /SyntaxError: Unexpected token/);
    t.assert.equal(retObj.json, undefined);
  });
});

test('devicectl install', (t) => {
  t.assert ||= require('node:assert');

  spawnMock.mock.mockImplementationOnce(() => {
    return { status: 0, stdout: '' };
  });

  devicectl.install('device_id', 'path/to/bundle.app');
  t.assert.deepEqual(spawnMock.mock.calls[0].arguments[1], ['devicectl', 'device', 'install', 'app', '--device', 'device_id', 'path/to/bundle.app']);
});

test('devicectl launch', async (ctx) => {
  await ctx.test('with no argv arguments', (t) => {
    t.assert ||= require('node:assert');

    spawnMock.mock.mockImplementationOnce(() => {
      return { status: 0, stdout: '' };
    });

    devicectl.launch('device_id', 'com.example.myapp');
    t.assert.deepEqual(spawnMock.mock.calls[0].arguments[1], ['devicectl', 'device', 'process', 'launch', '--device', 'device_id', 'com.example.myapp']);
  });

  await ctx.test('with argv arguments', (t) => {
    t.assert ||= require('node:assert');

    spawnMock.mock.mockImplementationOnce(() => {
      return { status: 0, stdout: '' };
    });

    devicectl.launch('device_id', 'com.example.myapp', ['https://example.com']);
    t.assert.deepEqual(spawnMock.mock.calls[0].arguments[1], ['devicectl', 'device', 'process', 'launch', '--device', 'device_id', 'com.example.myapp', 'https://example.com']);
  });

  await ctx.test('with startStopped option', (t) => {
    t.assert ||= require('node:assert');

    spawnMock.mock.mockImplementationOnce(() => {
      return { status: 0, stdout: '' };
    });

    devicectl.launch('device_id', 'com.example.myapp', [], { startStopped: true });
    t.assert.deepEqual(spawnMock.mock.calls[0].arguments[1], ['devicectl', 'device', 'process', 'launch', '--device', 'device_id', '--start-stopped', 'com.example.myapp']);
  });

  await ctx.test('with console option', (t) => {
    t.assert ||= require('node:assert');

    spawnMock.mock.mockImplementationOnce(() => {
      return { status: 0, stdout: '' };
    });

    devicectl.launch('device_id', 'com.example.myapp', [], { console: true });
    t.assert.deepEqual(spawnMock.mock.calls[0].arguments[1], ['devicectl', 'device', 'process', 'launch', '--device', 'device_id', '--console', 'com.example.myapp']);
  });
});
