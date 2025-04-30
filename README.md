# VoiceCraft TTS

A modern Text-to-Speech application with multiple English accents and advanced voice transformation features.

## Features

- Multiple English accents (US, UK, Australian)
- Emotion modifications (Happy, Sad, Angry, Excited)
- Speed and pitch control
- Voice cloning capabilities
- Batch processing support
- No API key required
- Works offline
- Secure file handling with multer
- Modern UI with responsive design

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

3. Start the development server:
```bash
npm run dev
```

4. For production:
```bash
npm start
```

5. Open [http://localhost:3001](http://localhost:3001) in your browser

## Project Structure

```
voicecraft-tts/
├── public/          # Static files
│   ├── css/        # Stylesheets
│   ├── js/         # Client-side JavaScript
│   └── uploads/    # Temporary file storage
├── server.js       # Main application file
├── package.json    # Project dependencies
└── README.md       # Project documentation
```

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
- Google Text-to-Speech
- Web Audio API
- Multer (File upload handling)
- Modern CSS with Flexbox and Grid
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

