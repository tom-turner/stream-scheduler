const express = require('express');
const app = express();
const http = require('http').Server(app);
const port = process.env.port || 5000;
const bp = require('body-parser');
var ffmpeg = require('fluent-ffmpeg');
var command = ffmpeg();

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.render('index.ejs');
});

var ffmpegLogs = [];

app.post('/ffmpeg', function (req, res) {

if(!req.body.file || !req.body.rtmp || !req.body.key) {
  return res.write("invalid input")
}

res.write("received")

ffmpeg()
  .input(req.body.file)
  .format('flv')
  .save(req.body.rtmp+'/'+req.body.key)

  .on('stderr', function(stderrLine) {
    console.log('Stderr output: ' + stderrLine);
    res.write('Stderr output: ' + stderrLine)
  }) 

  .on('start', function(commandLine) {
    console.log('Spawned Ffmpeg with command: ' + commandLine)
    
    ffmpegLogs = 'Spawned Ffmpeg with command: ' + commandLine;

    res.write(JSON.stringify({"started": true, message: 'Spawned Ffmpeg with command: ' + commandLine}))
  })

  .on('progress', function(progress) {
    console.log('Processing: ' + progress.percent + '% done')
    res.write('Processing: ' + progress.percent + '% done')
  })

  .on('error', function(err, stdout, stderr) {
    console.log('Cannot process video: ' + err.message);
      return res.write('Cannot process video: ' + err.message)
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