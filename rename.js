import fs from 'fs';

fs.rename('dist/index.js', 'dist/terminal.min.js', (err) => {
    if (err) throw err;
    console.log('File renamed!');
});