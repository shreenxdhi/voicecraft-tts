# VoiceCraft TTS

A versatile text-to-speech (TTS) application with support for Google TTS and Coqui TTS voices, offering a wide range of high-quality voices in multiple languages.

## Features

- Multiple TTS engines: Google TTS and Coqui TTS
- 15+ voices across different languages and accents
- Emotion controls for expressive speech (happy, sad, angry, excited)
- Pitch, speed, and volume adjustments
- Mobile-friendly UI with responsive design
- Audio playback that works on all devices
- Dark/light mode theming
- No authentication required (authentication has been removed)

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- ffmpeg (optional, but recommended for audio processing)
- Python 3.9-3.11 (optional, for Coqui TTS)
- espeak-ng or espeak (required for Coqui TTS phonemization)

### Step 1: Clone the repository

```bash
git clone https://github.com/shreenxdhi/voicecraft-tts.git
cd voicecraft-tts
```

### Step 2: Install Node.js dependencies

```bash
npm install
```

### Step 3: Install ffmpeg (optional, but recommended)

FFmpeg is used for audio processing like changing pitch, speed, and applying effects.

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)

### Step 4: Install espeak (required for Coqui TTS)

**macOS:**
```bash
brew install espeak
```

**Ubuntu/Debian:**
```bash
sudo apt-get install espeak-ng
```

**Windows:**
Download from [https://github.com/espeak-ng/espeak-ng/releases](https://github.com/espeak-ng/espeak-ng/releases)

### Step 5: Install Coqui TTS (optional, for high-quality voices)

1. Create a Python virtual environment:

```bash
# Create a virtual environment
python3.11 -m venv coqui-env-py311

# Activate the virtual environment
# On macOS/Linux:
source coqui-env-py311/bin/activate

# On Windows:
# coqui-env-py311\Scripts\activate
```

2. Install Coqui TTS in the virtual environment:

```bash
pip install TTS
```

3. Download the required models:

```bash
# On macOS/Linux:
npm run download-models

# On Windows:
npm run download-models-win
```

## Running the Application

### Basic Run (Google TTS only)

```bash
npm start
```

### Run with Coqui TTS (if installed)

```bash
# On macOS/Linux:
npm run start-with-coqui

# On Windows:
npm run start-with-coqui-win
```

Then open your browser to [http://localhost:3001](http://localhost:3001)

## Voice Options

### Google TTS Voices
- Sarah (American Female)
- Emma (British Female)
- Nicole (Australian Female)
- Priya (Indian Female)

### Coqui TTS Voices (when Coqui TTS is installed)
- Scarlett (American Female, high quality)
- James (British Male, high quality)
- Charlotte (British Female, high quality)
- Thorsten (German Male)
- Céline (French Female)
- Miguel (Spanish Male)

## Troubleshooting

### Common Issues

1. **"All voices sound robotic and the same"**: This typically means that Coqui TTS is not being used correctly. Try the following:
   - Check if espeak is installed (`brew install espeak` on macOS)
   - Make sure the Python virtual environment is activated when running the server
   - Run `npm run download-models` to download the required models
   - Start the server with `npm run start-with-coqui`

2. **"Failed to synthesize speech" error**: This may occur if the Coqui TTS models have not been properly downloaded. Try:
   - Running `npm run download-models` to install the Coqui TTS models
   - Check that the virtual environment is correctly set up
   - Check logs for specific errors (missing models, missing espeak, etc.)

3. **No Coqui voices appear in dropdown**: The server automatically detects which models are available. Make sure:
   - Coqui TTS is installed (`pip install TTS` in the virtual environment)
   - Models are downloaded (run `npm run download-models`)
   - The server is running with the virtual environment (`npm run start-with-coqui`)

## Fallback Mechanism

The application includes automatic fallback mechanisms:
- If Coqui TTS is not installed, it falls back to Google TTS
- If ffmpeg is not installed, basic audio is still generated without effects
- If a TTS request fails, appropriate error messages are displayed

## Development

### Testing Voices

To test all available voices:

```bash
node test-voices.js
```

### Debugging TTS Issues

To debug TTS issues:

```bash
node debug-tts.js
```

## Deployment Considerations

Before deploying to production:

1. Make sure to set proper CORS headers if needed
2. Consider implementing a caching strategy for generated audio files
3. For production environments, you may want to use a process manager like PM2

## Deploying to Render

This application is configured to work with Render for hosting. The Coqui TTS features are fully supported on Render with the included configuration.

### Steps for Render Deployment

1. Fork this repository to your GitHub account
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Render will automatically use the `render.yaml` configuration file

### Render Configuration

The `render.yaml` file includes:

- Installation of required system dependencies (ffmpeg, espeak, etc.)
- Python environment setup with TTS package installation
- Downloading of Coqui TTS models during build
- Setting up appropriate environment variables

### Troubleshooting Coqui TTS on Render

If you encounter issues with Coqui TTS voices on Render:

1. Check the build logs to ensure the models were downloaded successfully
2. Verify that the `espeak` dependency was installed correctly
3. Ensure you have enough disk space on your Render instance for the models
4. Try rebuilding the deployment if models were not downloaded completely

The application has intelligent fallback to Google TTS voices when Coqui fails, so it will remain functional even if there are issues with the Coqui setup.

## License

[MIT License](LICENSE)

