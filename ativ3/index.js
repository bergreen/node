const http = require('http');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');
const { parse } = require('url');

config();

const server = http.createServer((req, res) => {
  const { pathname } = parse(req.url);
  const directory = pathname && pathname !== '/' ? pathname.slice(1) : null;

  if (!directory) {
    res.statusCode = 400;
    res.end('Directory not specified.');
    return;
  }

  fs.access(directory, fs.constants.F_OK, (err) => {
    if (err) {
      res.statusCode = 404;
      res.end('Directory not found.');
      return;
    }

    fs.readdir(directory, (err, files) => {
      if (err) {
        res.statusCode = 500;
        res.end('Error reading directory.');
        return;
      }

      Promise.all(files.map(async (file) => {
        const filePath = path.join(directory, file);
        const stats = await fs.promises.stat(filePath);
        const isDirectory = stats.isDirectory();
        const link = isDirectory ? `${file}/` : file;
        return `<li><a href="${link}">${file}</a></li>`;
      })).then((fileList) => {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>File List</title>
            </head>
            <body>
              <h1>File List</h1>
              <ul>
                ${fileList.join('')}
              </ul>
            </body>
          </html>
        `;

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
      }).catch((error) => {
        res.statusCode = 500;
        res.end('Error reading directory.');
      });
    });
  });
});

const port = process.env.PORT || 4723;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
