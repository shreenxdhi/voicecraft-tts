# VoiceCraft TTS

A modern Text-to-Speech application with multiple English accents and text transformation features.

## Features

- Multiple English accents (US))
- Emotion modifications (Happy, Sad, Angry, Excited)
- Speed control
- No API key required
- Works offline

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

3. Start the server:
```bash
npm start
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

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
- Google Text-to-Speech
- Web Audio API

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

