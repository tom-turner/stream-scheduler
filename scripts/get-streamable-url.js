var https = require('https')
var ytdl = require('ytdl-core')

// from https://stackoverflow.com/a/49428486
async function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}

async function getDropboxStreamableUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, async res => {
      var page = await streamToString(res)
      var dropboxLink = page.match(/https:\/\/.*?previews.dropboxusercontent.com.*?.m3u8/)
      if (dropboxLink[0])
        resolve([dropboxLink[0]])
      else
        reject([])
    })
  })
}

async function getYoutubeStreamableUrl(url) {
  var info = await ytdl.getInfo(url)
  var video = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' })
  var audio = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
  return [video.url, audio.url]
}

async function getStreamableUrl(url) {
  if (url.match(/youtube.com/))
    return getYoutubeStreamableUrl(url)
  else if (url.match(/youtu.be/))
    return getYoutubeStreamableUrl(url)
  else if (url.match(/dropbox.com/))
    return await getDropboxStreamableUrl(url)
  else
    return [url]
}

module.exports = getStreamableUrl;
