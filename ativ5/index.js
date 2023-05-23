const http = require('http');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const createLinks = require('./create_link');

const handleFileRequest = async (filePath, res) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const parentDirectory = path.dirname(filePath);
    const backButton = parentDirectory !== '/' ? `<a href="${parentDirectory}">Voltar</a>` : '<a href="${parentDirectory}">Voltar</a>';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>File Content</title>
        </head>
        <body>
          <h1>File Content</h1>
          ${backButton}
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
    res.statusCode = 500;
    res.end('reading mistake.');
  }
};

const handleDirectoryRequest = async (directory, res) => {
  try {
    const files = await fs.readdir(directory);
    const fileList = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(directory, file);
        const isDirectory = (await fs.stat(filePath)).isDirectory();
        const link = isDirectory ? `${file}/` : file;
        const filelink = createLinks.createLinkFiles(link, file);
        return filelink;
      })
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>File List/title>
        </head>
        <body>
          <h1>File List</h1>
          <ul>${fileList.join('')}</ul>
        </body>
      </html>
    `
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  } catch (err) {
    res.statusCode = 500;
    res.end('Error reading directory.');
  }
};

const handleRequest = async (req, res) => {
  const directory = process.argv[2];

  if (!directory) {
    res.statusCode = 400;
    res.end('uninformed directory.');
    return;
  }

  if (!fs.existsSync(directory)) {
    res.statusCode = 404;
    res.end('uninformed directory.');
    return;
  }

  const url = req.url === '/' ? '' : req.url;
  const filePath = path.join(directory, url);

  try {
    if (fs.existsSync(filePath)) {
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        await handleFileRequest(filePath, res);
        return;
      }
    }

    await handleDirectoryRequest(directory, res);
  } catch (err) {
    res.statusCode = 500;
    res.end('Error processing.');
  }
};

const server = http.createServer(handleRequest);

const port = process.env.PORT || 4723;
try {
  server.listen(port, () => {
    console.log(`server running on http://localhost:${port}`);
  });
} catch (err) {
  console.error('Error starting the server:', err);
}