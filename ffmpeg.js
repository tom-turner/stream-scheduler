var ffmpeg = require('fluent-ffmpeg');
var stream = ffmpeg();
var getStreamableUrl = require('./scripts/get-streamable-url')

console.log("hello")

//
// implement FFMPEG and log responses to main server.
//

async function start(body) {

	var inputs = await getStreamableUrl(body.file)
	inputs.forEach(input => stream.input(input))
	stream.inputOption('-re')
	.videoBitrate('4500k')
	.format('flv')
	.save(body.rtmp+'/'+body.key)

	.on('start', function(commandLine) {
		console.log('Spawned Ffmpeg with command: ' + commandLine)
		res.write(formatResponse(false, 'Started with command: ' + commandLine))
	})

	.on('progress', function(progress) {
		console.log('Processing: ' + progress.timemark + ' ' + progress.currentKbps)
		res.write(formatResponse(
			true,
			'Progress: ' + progress.timemark +
			' | Frames: ' + progress.frames +
			' | Kbps: ' + progress.currentKbps +
			' | Fps: ' + progress.currentFps
			))
	})

	.on('error', function(err, stdout, stderr) {
		console.log('Cannot process video: ' + err.message);
		res.write(formatResponse(false, 'Streaming Stopped: ' + err.message, true, err.message))
		stream.kill()
	})

	.on('end', function() {
		console.log('Finished')
		res.write(formatResponse(false, 'Finished', true))
		stream.kill()

	})
}
