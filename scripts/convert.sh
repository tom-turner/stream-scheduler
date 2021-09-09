ffmpeg -i volaraw.mp4 -c:v libx264 -preset medium -b:v 3000k -maxrate 3000k -bufsize 6000k \
-vf "scale=1280:-1,format=yuv420p" -g 50 -c:a aac -b:a 128k -ac 2 -ar 44100 vola.flv