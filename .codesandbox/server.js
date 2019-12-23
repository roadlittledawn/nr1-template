const childProcess = require('child_process');
const http = require('http');
const https = require('https');
const stream = require('stream');
const url = require('url');

const host = url.parse(process.env.SANDBOX_URL).hostname;
const location = 'https://one.newrelic.com?use_version=551d7e1f&nerdpacks=' + host;

childProcess.spawn('nr1', ['nerdpack:serve']);

if (process.env.API_KEY) {
  console.log('Load your sandbox at: ' + location);
}

class RemoveNrLocalTransform extends stream.Transform {
  _transform(chunk, _encoding, callback) {
    callback(
      null,
      chunk.toString().replace(/[0-9A-F]{32}\.nr-local\.net(?:[^/]*)?/gi, host),
    );
  }
}

const server = http.createServer((req, res) => {
  // No API key detected as a secret key.
  if (!process.env.API_KEY) {
    const message = [
      'Welcome to the New Relic NR1 CodeSandbox template',
      '-------------------------------------------------',
      '',
      'To make it work, you will need to register your API key:',
      '  1. Go to https://one.newrelic.com/launcher/developer-center.launcher',
      '  2. Generate an API key or use an existing one',
      '  3. Head to the "Server Control Panel" in CodeSandbox',
      '  4. Create a new "Secret Key" with name "API_KEY" and the key of step 2',
      '  5. Restart your server by clicking on "Restart Server"',
    ];

    res.end(message.join('\n'));
    return;
  }

  // The requested URL is the root of the page, redirect to NR1.
  if (req.url === '/') {
    res.writeHead(302, {location});
    res.end();
    return;
  }

  // Otherwise, proxy to the NR1 CLI.
  const options = Object.assign({
    hostname: 'localhost',
    port: 9973,
    method: req.method,
    path: req.url,
    headers: req.headers,
    rejectUnauthorized: false,
  });

  req.pipe(
    https.request(options, function(resLocal) {
      delete resLocal.headers['content-length'];
      delete resLocal.headers['transfer-encoding'];

      res.writeHead(resLocal.statusCode, resLocal.headers);
      resLocal.pipe(new RemoveNrLocalTransform()).pipe(res);
    }),
  );
});

server.listen(8080);
