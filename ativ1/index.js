const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  const directory = process.argv[2]; // Get the directory name from the command line argument

  // Check if the directory is provided
  if (!directory) {
    res.statusCode = 400;
    res.end('Directory not provided.');
    return;
  }

  // Check if the directory exists
  fs.access(directory, fs.constants.F_OK, (err) => {
    if (err) {
      res.statusCode = 404;
      res.end('Directory not found.');
      return;
    }

    // Read the content of the directory
    fs.readdir(directory, (err, files) => {
      if (err) {
        res.statusCode = 500;
        res.end('Error reading directory.');
        return;
      }

      // Create an HTML list with files and subdirectories
      const fileList = files.map((file) => {
        const filePath = path.join(directory, file);
        fs.stat(filePath, (err, stats) => {
          if (err) {
            // Handle error
            return;
          }
          const isDirectory = stats.isDirectory();
          const link = isDirectory ? `${file}/` : file;
          const listItem = `<li><a href="${link}">${file}</a></li>`;
          res.write(listItem); // Write each list item to the response as they are processed
        });
      });

      // After all files and subdirectories are processed, send the HTML response
      Promise.all(fileList)
        .then(() => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          res.end('</ul></body></html>'); // Close the HTML tags
        })
        .catch((err) => {
          res.statusCode = 500;
          res.end('Error processing files.');
        });
    });
  });
});

const port = 4723;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});