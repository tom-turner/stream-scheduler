const express = require('express');
const expressLayouts = require('express-layouts')
const app = express();
const http = require('http').Server(app);
const bp = require('body-parser');
const pm2 = require('pm2')
const io = require('socket.io')(http);
const port = process.env.port || 5000;
const sessionTimeoutInMs = 10800000

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'));
app.use(expressLayouts);
app.set('layout', 'application');
app.set('view engine', 'ejs');



// Render index.ejs
app.get('/', function (req, res) {
  res.render('index.ejs');
});

// Connect to client with Socket.io
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


//
// Functions
//

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

function checkIfRunning(processName){
  pm2.describe(processName, (err, data) => {

    if (data !== 'undefined' && data.length > 0) {
      sendMessageToClient(processName, "Hello Again", 'streaming')
    } else { 
      sendMessageToClient(processName, "Welcome - Enter your source file, RTMP URL and Stream Key to get started.")
    }
  })
  return 
}

function sendMessageToClient(sessionId, message, status) {
  var data = {
    message: message,
    status: status,
  }
  io.to(sessionId).emit("message", data)
}

function startFfmpeg(data) {
  var sessionId = data.sessionId

  pm2.start({
    name   : sessionId,
    script: 'ffmpeg.js',
  }, (err, apps) => {
    connectToProcess(data)
    if (err) { 
      sendMessageToClient(sessionId, "An error occurred whilst starting", 'errored')
      pm2.delete(sessionId)
      throw err
    }
  })

  startTimeoutCounter(sessionId)
  sendMessageToClient(sessionId, "Process initiated", 'processing')
  return 
}

function startTimeoutCounter(sessionId) {
  setTimeout( function() {
    stopFfmpeg(sessionId); 
    sendMessageToClient( sessionId, "Session Ended - Your File Is Longer Than 3 Hours", 'finished')
  }, sessionTimeoutInMs );
}

function connectToProcess(data) {
  var sessionId = data.sessionId
  var processIds = [];
  pm2.connect(function(){
    pm2.list(function(err, processes) {
      for (var i in processes) {  
        if(processes[i].name == sessionId) {
          processIds.push({
            id: processes[i].pm_id,
            name: processes[i].name
          })
        }
      }

      pm2.sendDataToProcessId(processIds[0].id, {
        data : data,
        topic: 'some topic'
      }, function(err, res) {
        if (res.error){
          sendMessageToClient(sessionId, res.error, 'errored')
          stopFfmpeg(sessionId)
        }
      });

      pm2.launchBus((err, bus) => {
        bus.on('process:msg', (packet) => {

          sendMessageToClient(
            sessionId, 
            packet.data.message, 
            packet.data.status, 
            )
          if (packet.data.status === 'errored'){
            stopFfmpeg(sessionId)
          }
          if (packet.data.status === 'finished'){
            stopFfmpeg(sessionId)
          }
        })
      })
    })
  })
  return
}

function stopFfmpeg(sessionId) {
  pm2.delete(sessionId)
  sendMessageToClient(sessionId, 'Process stopped', 'finished')
  return
}

//
// Routes
//

app.post('/newUserId', async function (req, res) {
  console.log("new user connected")
  return res.json(generateNewId())
})

app.post('/startffmpeg', async function (req) {
  var stream = req.body
  if(!stream.file || !stream.rtmp || !stream.key) {
    return sendMessageToClient(stream.sessionId, "Invalid Input", 'errored')
  }
  sendMessageToClient(stream.sessionId, "Received", 'processing')
  startFfmpeg(stream)
  return 
});

app.post('/stopffmpeg', function (req) {
  stopFfmpeg(req.body.sessionId)
  return sendMessageToClient(sessionId, 'Request received', 'processing')
});


//
// Starting the App
//
const server = http.listen(process.env.PORT || 5000, function() {
  console.log('listening on *:5000');
});
