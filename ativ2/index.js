import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();

app.get('/', async (req, res) => {
  const directory = req.query.directory;

  if (!directory) {
    res.status(400).send('Directory not provided.');
    return;
  }

  try {
    const files = await fs.readdir(directory);
    const fileList = await Promise.all(files.map(async (file) => {
      const filePath = path.join(directory, file);
      const fileStat = await fs.stat(filePath);
      const isDirectory = fileStat.isDirectory();
      const link = isDirectory ? `${file}/` : file;
      return `<li><a href="${link}">${file}</a></li>`;
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

    res.status(200).send(html);
  } catch (err) {
    res.status(500).send('Error reading the directory.');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
