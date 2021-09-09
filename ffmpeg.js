var ffmpeg = require('fluent-ffmpeg');
var stream = ffmpeg();
var getStreamableUrl = require('./scripts/get-streamable-url')

process.on('message', function(packet) {
	console.log(packet.data)
	replyToServer("Request received: " + packet.data.rtmp + " | " + packet.data.key, 'processing')
	start(packet.data)
});

function replyToServer(message, status){
	console.log(status + " | " + message)
	process.send({
		type : 'process:msg',
		data : {
			message : message,
			status : status,
			success : true
		}
	});
}

async function start(body) {

	var inputs = await getStreamableUrl(body.file)
	inputs.forEach(input => stream.input(input))
	stream.inputOption('-re')
	.format('flv')
	.save(body.rtmp+'/'+body.key)

	.on('start', function(commandLine) {
		replyToServer('Started command', 'processing')
	})

	.on('progress', function(progress) {
		replyToServer('Progress: ' + progress.timemark + ' | Frames: ' + progress.frames + ' | Kbps: ' + progress.currentKbps + ' | Fps: ' + progress.currentFps, 'streaming' )
	})

	.on('error', function(err, stdout, stderr) {
		replyToServer('Streaming Stopped: ' + err.message, 'errored')
	})

	.on('end', function() {
		replyToServer("File has ended", 'finished' )
	})
}
