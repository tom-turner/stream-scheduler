const express = require('express');
const app = express();
const http = require('http').Server(app);
const port = process.env.port || 5000;
const bp = require('body-parser');
var ffmpeg = require('fluent-ffmpeg');
var command = ffmpeg();
var getStreamableUrl = require('./scripts/get-streamable-url')

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.render('index.ejs');
});

// add this to socket.io var ffmpegLogs = [];

function formatResponse(started, message) {
  return JSON.stringify({
    started: started,
    message: message
  }) + "\n"
}

app.post('/ffmpeg', async function (req, res) {
  if(!req.body.file || !req.body.rtmp || !req.body.key) {
    return res.write(formatResponse(false, "Invalid Input"))
  }

  res.write(formatResponse(false, "recieved"))

  var stream = ffmpeg()
  var inputs = await getStreamableUrl(req.body.file)
  inputs.forEach(input => stream.input(input))
  stream.inputOption('-re')
    .videoBitrate('4500k')
    .format('flv')
    .save(req.body.rtmp+'/'+req.body.key)


    .on('stderr', function(stderrLine) {
      console.log('Stderr output: ' + stderrLine);
      res.write(formatResponse(false, 'Error: ' + stderrLine))
    }) 

    .on('start', function(commandLine) {
      console.log('Spawned Ffmpeg with command: ' + commandLine)

      // sends logs to socket.io - ffmpegLogs = 'Spawned Ffmpeg with command: ' + commandLine;

      res.write(formatResponse(true, 'Spawned Ffmpeg with command: ' + commandLine))
    })

    .on('progress', function(progress) {
      console.log('Processing: ' + progress.percent + '% done')
      res.write(formatResponse(true, 'Processed: ' + progress.percent + '%'))
    })

    .on('error', function(err, stdout, stderr) {
      console.log('Cannot process video: ' + err.message);
      res.write(formatResponse(false, 'Cannot process video: ' + err.message))
    })

})

app.post('/stop', function (req, res) {

});

//
// Starting the App
//
const server = http.listen(process.env.PORT || 5000, function() {
  console.log('listening on *:5000');
});
