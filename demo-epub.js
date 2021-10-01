const epub = require('epub-gen');

const options = {
  title: 'Moby-Dick',
  author: 'Herman Melville',
  output: './moby-dick.epub',
  content: [
    {
      title: 'Chapter 1: Loomings',
      data: `<p>
        Call me Ishmael. Some years ago—never mind how long precisely
      </p>`
    }
  ]
};

new epub(options).promise.then(() => console.log('Done'));
