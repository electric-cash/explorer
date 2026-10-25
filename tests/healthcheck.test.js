'use strict';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const {spawnSync} = require('child_process');

async function checkApplication() {
    const app = require('../app');
    const coreApi = require('../app/api/coreApi');
    let backendCalls = 0;
    let renders = 0;

    // A liveness request must never enter the RPC/page-rendering pipeline.
    for (const name of Object.keys(coreApi)) {
        if (typeof coreApi[name] === 'function') {
            coreApi[name] = () => {
                backendCalls++;
                throw new Error('Backend must not be called by liveness');
            };
        }
    }
    app.render = (view, options, callback) => {
        renders++;
        callback(new Error('Liveness must not render a template'));
    };

    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });

    function request(method, url, headers = {}) {
        return new Promise((resolve, reject) => {
            const req = http.request({
                host: '127.0.0.1', port: server.address().port,
                method, path: url, headers, agent: false,
            }, res => {
                let body = '';
                res.setEncoding('utf8');
                res.on('data', chunk => { body += chunk; });
                res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body}));
                res.on('error', reject);
            });
            req.setTimeout(2000, () => req.destroy(new Error('Health request timed out')));
            req.on('error', reject);
            req.end();
        });
    }

    function assertHealthy(response, body) {
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body, body);
        assert.match(response.headers['content-type'], /^text\/plain;/);
        assert.strictEqual(response.headers['cache-control'], 'no-store');
        assert.strictEqual(response.headers['set-cookie'], undefined);
        assert.strictEqual(response.headers['etag'], undefined);
        assert.strictEqual(response.headers['www-authenticate'], undefined);
    }

    try {
        assertHealthy(await request('GET', '/healthz'), 'ok\n');
        assertHealthy(await request('HEAD', '/healthz'), '');
        assertHealthy(await request('GET', '/healthz', {
            'User-Agent': 'kube-probe/test', Cookie: 'bad=%E0%A4%A',
        }), 'ok\n');
        assertHealthy(await request('GET', '/healthz', {'If-None-Match': '*'}), 'ok\n');

        // The Node process can be live even when the RPC backend is stalled.
        for (const name of Object.keys(coreApi)) {
            if (typeof coreApi[name] === 'function') {
                coreApi[name] = () => { backendCalls++; return new Promise(() => {}); };
            }
        }
        for (let i = 0; i < 20; i++) {
            assertHealthy(await request('GET', '/healthz'), 'ok\n');
        }
        if (process.env.BTCEXP_BASIC_AUTH_PASSWORD) {
            for (const url of ['/', '/node-status', '/healthz/other']) {
                assert.strictEqual((await request('GET', url)).status, 401);
            }
            assert.strictEqual((await request('POST', '/healthz')).status, 401);
        }
        assert.strictEqual(backendCalls, 0);
        assert.strictEqual(renders, 0);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
}

if (process.argv.includes('--worker')) {
    checkApplication().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
} else {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'explorer-health-test-'));
    try {
        // Do not inherit production RPC credentials, Redis URLs or dotenv files.
        for (const authenticated of [false, true]) {
            const env = {
                PATH: process.env.PATH, SystemRoot: process.env.SystemRoot,
                HOME: home, USERPROFILE: home, TMP: home, TEMP: home,
                NODE_ENV: 'production', DEBUG: 'health-test:none',
                BTCEXP_GENESIS_COINBASE_TRANSACTION: '{}',
                BTCEXP_BITCOIND_COOKIE: path.join(home, 'no-rpc-cookie'),
            };
            if (authenticated) env.BTCEXP_BASIC_AUTH_PASSWORD = 'local-test-only';
            const result = spawnSync(process.execPath, [__filename, '--worker'], {
                env, cwd: home, encoding: 'utf8', timeout: 15000,
            });
            assert.ifError(result.error);
            assert.strictEqual(result.status, 0, result.stderr || result.stdout);
            console.log(`PASS healthcheck: basic auth ${authenticated ? 'enabled' : 'disabled'}`);
        }
    } finally {
        fs.rmSync(home, {recursive: true, force: true});
    }
}
