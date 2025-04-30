# VoiceCraft TTS

A modern Text-to-Speech application with multiple English accents, advanced voice transformation features, premium authentication system, and a UI inspired by ElevenLabs.

![VoiceCraft TTS Screenshot](https://i.imgur.com/abc123.png)

## Features

- **Modern UI/UX** with tabbed navigation and card-based layout
- **Multiple English accents** (US, UK, Australian, Indian)
- **Coqui TTS Integration** for high-quality voices in multiple languages
- **Multi-lingual support** via Coqui's XTTS model (16+ languages)
- **Emotion modifications** (Happy, Sad, Angry, Excited, Neutral)
- **Advanced voice settings** with speed, pitch, and volume control
- **Voice cloning capabilities**
- **Voice conversion between accents**
- **Batch processing support**
- **Light/Dark mode** with seamless transitions
- **Comprehensive authentication system** with multiple sign-in methods
- **User onboarding flow** for personalized experience
- **Works offline** (for authenticated users)
- **Mobile-optimized interface** with responsive design
- **Secure file handling** with multer

## Live Demo

Visit [https://voicecraft-tts.onrender.com](https://voicecraft-tts.onrender.com)

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/shreenxdhi/voicecraft-tts.git
cd voicecraft-tts
```

2. Install dependencies:
```bash
npm install
```

3. (Optional but recommended) Install Coqui TTS for high-quality voices:
```bash
# Using the npm script
npm run install-coqui

# Or directly with pip
pip install TTS
```

4. Create a `.env` file in the root directory (optional for advanced features):
```
HUGGING_FACE_API_KEY=your_huggingface_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. For production:
```bash
npm start
```

7. Open [http://localhost:3001](http://localhost:3001) in your browser

## Available Voices

### gTTS Voices (Default)
- Sarah (American Female)
- Emma (British Female)
- Nicole (Australian Female)
- Priya (Indian Female)

### Coqui TTS Voices (Requires Coqui Installation)
- Scarlett (American Female, High Quality)
- James (British Male, High Quality)
- Charlotte (British Female, High Quality)
- Jenny (American Female, Natural)
- David (American Male, Deep)
- Thorsten (German Male)
- Céline (French Female)
- Miguel (Spanish Male)
- Sophia (Italian Female)
- Global (Multi-Lingual, 16+ languages)

## Mobile Support

VoiceCraft is fully optimized for mobile devices:
- Responsive layout for all screen sizes
- Optimized button arrangement on smaller screens
- Special handling for audio playback on iOS and Android
- Fallback mechanisms for devices with limited audio capabilities

## User Interface

The application features a premium UI with three main sections:

1. **Text to Speech** - The main interface for generating speech from text
2. **Voice Library** - Browse available voices and clone your own voice
3. **History** - Access your previously generated audio files

## Authentication System

VoiceCraft features a robust authentication system with:

- Email/Password authentication
- Google OAuth sign-in
- GitHub authentication
- Anonymous access with limited features
- User profile management
- Email verification workflows

## Troubleshooting

### Audio not playing on mobile
- Ensure your volume is turned up
- Try downloading the audio file instead of streaming
- Some browsers require user interaction before playing audio

### Coqui TTS voices not available
- Make sure you've installed Coqui TTS (`npm run install-coqui`)
- Check that Python is installed and in your PATH
- Restart the server after installing Coqui

## Project Structure

```
voicecraft-tts/
├── index.html              # Main HTML file
├── styles.css              # Main stylesheet
├── script.js               # Client-side JavaScript
├── server.js               # Express server and API endpoints
├── auth-integration.js     # Auth integration for main app
├── auth-middleware.js      # Auth middleware for Express
├── output/                 # Temporary storage for generated audio
├── uploads/                # Temporary file storage for voice samples
├── auth/                   # Authentication system
│   ├── components/         # Auth UI components
│   ├── pages/              # Auth pages (login, register, etc.)
│   ├── utils/              # Auth utilities
│   └── styles/             # Auth stylesheets
├── package.json            # Project dependencies
└── README.md               # Project documentation
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/synthesize` | POST | Generate speech from text |
| `/voices` | GET | Get available voices |
| `/clone-voice` | POST | Upload and process voice sample for cloning |
| `/convert-voice` | POST | Convert audio between different voices |
| `/batch-synthesize` | POST | Process multiple text entries at once |
| `/rewrite` | POST | Transform text into different styles |

## Security Features

- Secure file upload handling
- Input validation and sanitization
- Regular dependency updates
- Protected routes and endpoints

## Deployment on Render

1. Fork this repository
2. Go to [render.com](https://render.com) and sign up/login
3. Click "New +" and select "Web Service"
4. Connect your GitHub account and select this repository
5. Configure the deployment:
   - Name: voicecraft-tts (or your preferred name)
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

The application will be automatically deployed and you'll get a URL like `https://your-app-name.onrender.com`

## Technologies Used

- Node.js
- Express.js
- Google Text-to-Speech (gTTS)
- Web Audio API
- Multer (File upload handling)
- Modern CSS with Flexbox and Grid
- Font Awesome icons
- Responsive Design

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. When contributing:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See LICENSE file for details

## Support

If you encounter any issues or have suggestions, please open an issue on the GitHub repository.

