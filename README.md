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

### Step 1: Clone the repository

```bash
git clone https://github.com/yourusername/tts.git
cd tts
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

### Step 4: Install Coqui TTS (optional, for high-quality voices)

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

## Running the Application

### Basic Run (Google TTS only)

```bash
npm start
```

### Run with Coqui TTS (if installed)

```bash
# On macOS/Linux:
export VIRTUAL_ENV=$PWD/coqui-env-py311 && node server.js --dev

# On Windows:
# set VIRTUAL_ENV=%CD%\coqui-env-py311 && node server.js --dev
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
- Jenny (American Female, natural)
- David (American Male, deep)
- Thorsten (German Male)
- Céline (French Female)
- Miguel (Spanish Male)
- Sophia (Italian Female)
- Global (Multi-lingual)

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

## License

[MIT License](LICENSE)

