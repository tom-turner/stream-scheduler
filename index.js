const express = require('express');
const app = express();
const http = require('http').Server(app);
const bp = require('body-parser');
const pm2 = require('pm2')
const io = require('socket.io')(http);
const port = process.env.port || 5000;
const sessionTimeoutInMs = 3000 || 10800000

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.render('index.ejs');
});

io.on('connection', (socket) => {

  socket.on("join", (sessionId)=> {
    console.log("user joined " + sessionId)
    socket.join(sessionId)

    var processName = sessionId
    checkIfRunning(processName)

  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


function checkIfRunning(processName){

  console.log("pn" , processName)
  pm2.describe(processName, (err, data) => {

    if (data !== 'undefined' && data.length > 0) {
      console.log("data: ", data)
      sendMessageToClient(processName, "Hello Again", true)
    } else { 
      console.log("no data: ", data)
      sendMessageToClient(processName, "Enter your source file, RTMP URL and Stream Key to get started.", false)
    }
    pm2.disconnect()
  })
  return 
}


function sendMessageToClient(sessionId, message, online, error) {
  
  var data = {
    message: message,
    online: online,
    error: error ? error : false
  }

  console.log(data)

  io.to(sessionId).emit("message", data)

}

function generateNewId() {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < 36; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
     charactersLength));
  }
  return result;
}

function startFfmpeg(sessionId) {

  pm2.start({
    name   : sessionId,
    script: 'ffmpeg.js',
  }, (err, apps) => {
    pm2.disconnect()
    if (err) { 
      pm2.delete(sessionId)
      throw err
    }
  })
  setTimeout( function() {
    stopFfmpeg(sessionId); 
    sendMessageToClient( sessionId, "Session Ended - Your File Is Longer Than 3 Hours", false, true)
  }, sessionTimeoutInMs );

  sendMessageToClient(sessionId, "Started", true)
  return 
}

function stopFfmpeg(sessionId) {
  pm2.delete(sessionId)
  sendMessageToClient(sessionId, "Stopped", false)
  return
}

app.post('/startffmpeg', async function (req) {
  if(!req.body.file || !req.body.rtmp || !req.body.key) {
    return sendMessageToClient(req.body.sessionId, "Invalid Input")
  }
  sendMessageToClient(req.body.sessionId, "Received", false)
  startFfmpeg(req.body.sessionId)
  return 
});

app.post('/stopffmpeg', function (req) {
  stopFfmpeg(req.body.sessionId)
  return
});

// Gives a new user an ID.
app.post('/newUserId', async function (req, res) {
  console.log("new user connected")
  return res.json(generateNewId())
})


//
// Starting the App
//
const server = http.listen(process.env.PORT || 5000, function() {
  console.log('listening on *:5000');
});
