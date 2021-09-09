ffmpeg -re -i volaraw.mp4 -c:v libx264 -preset veryfast -b:v 3000k -maxrate 3000k \
-bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ac 2 \
-ar 44100 -f flv rtmps://rtmp-global.cloud.vimeo.com:443/live/543db2e8-7ed9-4935-b86f-f4481b78b814