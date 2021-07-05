var https = require('https')

// from https://stackoverflow.com/a/49428486
function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}


https.get('https://www.dropbox.com/s/2nfbkjsuw2ehxie/Untitled.mp4?dl=0', async res => {
  var page = await streamToString(res)
  var dropboxLink = page.match(/https:\/\/.*?previews.dropboxusercontent.com.*?.m3u8/)[0]
  console.log(dropboxLink);
})
