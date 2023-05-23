const { createLinkFiles } = require('./create_link.mjs');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

const handleFileRequest = async (filePath, res) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');

    const parentDirectory = path.dirname(filePath);
    const parentLink = parentDirectory !== '/' ? `<a href="${parentDirectory}">Back</a>` : '<a href="/">Back</a>';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>File Content</title>
        </head>
        <body>
          <h1>File Content</h1>
          ${parentLink}
          <hr>
          <br><br>
          <pre>${data}</pre>
        </body>
      </html>
    `;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('Error reading the file.');
  }
};

const handleDirectoryRequest = async (directory, url, res) => {
  try {
    const files = await fs.readdir(directory);

    const fileList = await Promise.all(files.map(async (file) => {
      const filePath = path.join(directory, file);
      const fileStats = await fs.stat(filePath);
      const isDirectory = fileStats.isDirectory();
      const link = isDirectory ? `${file}/` : file;
      const fileLink = createLinkFiles(link, file);
      return fileLink;
    }));

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>File List</title>
        </head>
        <body>
          <h1>File List</h1>
          <ul>${fileList.join('')}</ul>
        </body>
      </html>
    `;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('Error reading the directory.');
  }
};

const server = http.createServer(async (req, res) => {
  const directory = process.argv[2];

  if (!directory) {
    res.statusCode = 400;
    res.end('Directory not specified.');
    return;
  }

  if (!fs.existsSync(directory)) {
    res.statusCode = 404;
    res.end('Directory not found.');
    return;
  }

  const url = req.url === '/' ? '' : req.url;
  const filePath = path.join(directory, url);

  try {
    const fileStats = await fs.stat(filePath);
    if (fileStats.isFile()) {
      handleFileRequest(filePath, res);
    } else if (fileStats.isDirectory()) {
      handleDirectoryRequest(filePath, url, res);
    } else {
      res.statusCode = 404;
      res.end('File or directory not found.');
    }
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('Error processing the request.');
  }
});

const port = process.env.PORT || 4723;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
