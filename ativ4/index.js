const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const { promisify } = require('util');

dotenv.config();

const readFile = promisify(fs.readFile);

async function readDirectory(directory) {
  try {
    const files = await fs.readdir(directory);
    return files;
  } catch (error) {
    throw new Error('Error reading directory.');
  }
}

function generateFileList(files, directory) {
  return files.map((file) => {
    const filePath = path.join(directory, file);
    const isDirectory = fs.statSync(filePath).isDirectory();
    const link = isDirectory ? `${file}/` : file;
    return `<li><a href="${link}">${file}</a></li>`;
  }).join('');
}

async function handleRequest(req, res) {
  const directory = process.argv[2];

  try {
    if (!directory) {
      res.statusCode = 400;
      res.end('Directory not specified.');
      return;
    }

    const exists = await fs.access(directory).then(() => true).catch(() => false);
    if (!exists) {
      res.statusCode = 404;
      res.end('Directory not found.');
      return;
    }

    const files = await readDirectory(directory);
    const fileList = generateFileList(files, directory);
    const html = await readFile(path.join(__dirname, 'template.html'), 'utf8')
      .then((template) => template.replace('{{fileList}}', fileList));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  } catch (error) {
    res.statusCode = 500;
    res.end('Internal Server Error.');
  }
}

const server = http.createServer(handleRequest);

const port = process.env.PORT || 4723;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
