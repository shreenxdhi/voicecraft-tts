# VoiceCraft TTS

A modern text-to-speech application with premium AI-powered natural voices.

## Features

- Premium voices (Aria - American Female, Thomas - British Male, Sophia - British Female)
- Google TTS fallback for reliability
- Voice history and library
- Advanced audio processing
- Mobile responsive design
- Dark/light mode

## Demo

You can access the demo at: [https://voicecraft-tts.onrender.com](https://voicecraft-tts.onrender.com)

## Deployment Instructions

### Deploying to Render.com

1. Fork or clone this repository
2. Sign up for a [Render](https://render.com) account
3. Create a new Web Service and connect your forked repository
4. Render will automatically detect the `render.yaml` file for configuration
5. Click "Deploy" and wait for the build to complete

### Manual Deployment

1. Install dependencies:
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Install Python requirements for Coqui TTS
   pip install TTS==0.22.0
   
   # Install system dependencies (Linux/macOS)
   apt-get install ffmpeg espeak-ng libsndfile1
   # or on macOS
   brew install ffmpeg espeak
   ```

2. Set up environment variables:
   ```
   PORT=3001
   TTS_CACHE_DIR=/path/to/tts/models
   ```

3. Run the server:
   ```bash
   npm start
   ```

## Development

To run in development mode with auto-restart:

```bash
npm run dev
```

## Debugging

The application includes several debug utilities:

- `/debug-coqui` - Tests Coqui TTS functionality
- `debug-coqui.js` - Direct test of Coqui TTS outside the server
- `browser-debug.js` - Client-side diagnostic tool

## Voice Quality

The application uses enhanced audio processing with FFmpeg to optimize voice quality:

- Optimized normalization parameters
- Frequency range filtering
- Dynamic audio normalization
- Speed adjustment for natural pacing

## License

MIT

