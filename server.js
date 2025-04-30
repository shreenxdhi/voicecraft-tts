require('dotenv').config();
const express = require('express');
const path = require('path');
const gTTS = require('gtts');
const fs = require('fs');
const axios = require('axios');
const multer = require('multer');
const { requireAuth, requireOnboarding } = require('./auth-middleware');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3001;

// Add CORS headers middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Available voices with proper gTTS language codes
const AVAILABLE_VOICES = [
    'en-us',     // Sarah (American Female)
    'en-gb',     // Emma (British Female)
    'en-au',     // Nicole (Australian Female)
    'en-in',     // Priya (Indian Female)
    'custom'     // Custom voice cloning
];

// Voice configuration
const VOICE_CONFIG = {
    'en-us': {
        name: 'Sarah',
        accent: 'American Female',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en',
        tld: 'com'
    },
    'en-gb': {
        name: 'Emma',
        accent: 'British Female',
        pitch: 0.9,  // Lower pitch for British voice
        speed: 0.95, // Slightly slower
        lang: 'en',
        tld: 'co.uk'
    },
    'en-au': {
        name: 'Nicole',
        accent: 'Australian Female',
        pitch: 1.1,  // Higher pitch for Australian
        speed: 1.05, // Slightly faster
        lang: 'en',
        tld: 'com.au'
    },
    'en-in': {
        name: 'Priya',
        accent: 'Indian Female',
        pitch: 1.05, // Slightly higher pitch
        speed: 0.9,  // Slower pace
        lang: 'en',
        tld: 'co.in'
    },
    'custom': {
        name: 'Custom Voice',
        accent: 'Cloned Voice',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en'
    }
};

// Store generated audio files temporarily with their metadata
const audioFiles = new Map();

// Cleanup old files every 5 minutes
setInterval(() => {
    const now = Date.now();
    audioFiles.forEach((metadata, filename) => {
        if (now - metadata.timestamp > 5 * 60 * 1000) {
            const filepath = path.join(outputDir, filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            audioFiles.delete(filename);
        }
    });
}, 5 * 60 * 1000);

// Text transformation functions
function transformProfessional(text) {
    return text
        .replace(/(\w+)/g, word => {
            if (word.length > 3) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }
            return word;
        })
        .replace(/(!|\?)+/g, '.');
}

function transformCasual(text) {
    return text
        .replace(/\./g, '...')
        .replace(/!+/g, '!')
        .toLowerCase();
}

function transformFormal(text) {
    return text
        .split('. ')
        .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
        .join('. ');
}

function transformCreative(text) {
    return text
        .split(' ')
        .map((word, i) => i % 2 === 0 ? word.toUpperCase() : word.toLowerCase())
        .join(' ');
}

function transformConcise(text) {
    return text
        .replace(/\b(very|really|quite|basically|actually|literally)\b\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function transformDetailed(text) {
    return text
        .split('. ')
        .map(sentence => sentence + ' Indeed.')
        .join('. ');
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get available voices
app.get('/voices', (req, res) => {
    res.json({ voices: AVAILABLE_VOICES });
});

// Apply authentication to API endpoints that require it
app.post('/api/tts', requireAuth, requireOnboarding, (req, res) => {
    // Existing TTS endpoint logic
});

app.post('/clone-voice', requireAuth, requireOnboarding, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        // Here you would typically:
        // 1. Process the audio file for voice cloning
        // 2. Save the voice model
        // 3. Return a success response

        res.json({
            success: true,
            message: 'Voice cloning initiated',
            fileId: req.file.filename
        });
    } catch (error) {
        console.error('Error in voice cloning:', error);
        res.status(500).json({ error: 'Failed to clone voice' });
    }
});

app.post('/convert-voice', requireAuth, requireOnboarding, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        const { targetVoice } = req.body;
        if (!targetVoice || !AVAILABLE_VOICES.includes(targetVoice)) {
            return res.status(400).json({ error: 'Invalid target voice' });
        }

        // Here you would typically:
        // 1. Process the audio file for voice conversion
        // 2. Convert to target voice
        // 3. Return the converted audio

        res.json({
            success: true,
            message: 'Voice conversion initiated',
            fileId: req.file.filename
        });
    } catch (error) {
        console.error('Error in voice conversion:', error);
        res.status(500).json({ error: 'Failed to convert voice' });
    }
});

// Enhanced TTS endpoint with more features
app.post('/synthesize', async (req, res) => {
    try {
        const { text, voice, emotion, pitch = 1.0, speed = 1.0, volume = 1.0 } = req.body;
        
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Text is required and cannot be empty' });
        }

        if (!voice || !AVAILABLE_VOICES.includes(voice)) {
            return res.status(400).json({ 
                error: 'Invalid voice selected',
                availableVoices: AVAILABLE_VOICES,
                voiceConfig: VOICE_CONFIG
            });
        }

        // Add emotion-specific text modifications
        let modifiedText = text;
        const voiceSettings = VOICE_CONFIG[voice];
        
        switch(emotion) {
            case 'happy':
                modifiedText = text.replace(/\./g, '!');
                break;
            case 'sad':
                modifiedText = text.replace(/\./g, '...');
                break;
            case 'angry':
                modifiedText = text.toUpperCase();
                break;
            case 'excited':
                modifiedText = text.replace(/\./g, '!!!');
                break;
        }

        // Generate unique filename
        const filename = `speech_${voiceSettings.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
        const filepath = path.join(outputDir, filename);
        const tempFilepath = path.join(outputDir, `temp_${filename}`);

        // Create gTTS instance with voice settings
        const gtts = new gTTS(modifiedText, voiceSettings.lang);
        
        // Set TLD for gTTS
        if (voiceSettings.tld) {
            gtts.tld = voiceSettings.tld;
        }
        
        // Save to temp file
        await new Promise((resolve, reject) => {
            gtts.save(tempFilepath, (err) => {
                if (err) {
                    console.error('Error saving audio file:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // Calculate final pitch and speed values
        const finalPitch = (voiceSettings.pitch * parseFloat(pitch)).toFixed(2);
        const finalSpeed = (voiceSettings.speed * parseFloat(speed)).toFixed(2);
        
        // Apply voice modifications using ffmpeg
        await new Promise((resolve, reject) => {
            // Command to modify pitch and speed
            const ffmpegCmd = `ffmpeg -i ${tempFilepath} -af "asetrate=44100*${finalSpeed},aresample=44100,atempo=1/0.9,volume=${volume}" -vn ${filepath}`;
            
            exec(ffmpegCmd, (error) => {
                // Delete the temp file
                fs.unlink(tempFilepath, () => {});
                
                if (error) {
                    console.error('Error modifying audio:', error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        // Track the file for cleanup
        audioFiles.set(filename, {
            timestamp: Date.now(),
            voice: voice,
            emotion: emotion
        });

        // Send the file
        res.sendFile(filepath);
        
    } catch (error) {
        console.error('Error in speech synthesis:', error);
        res.status(500).json({ error: 'Failed to synthesize speech', details: error.message });
    }
});

// Batch processing endpoint
app.post('/batch-synthesize', async (req, res) => {
    try {
        const { texts, voice, emotion } = req.body;
        
        if (!Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({ error: 'Texts array is required and cannot be empty' });
        }

        const results = await Promise.all(texts.map(async (text) => {
            const response = await fetch(`http://localhost:${port}/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice, emotion })
            });
            return response.json();
        }));

        res.json({ results });
    } catch (error) {
        console.error('Error in batch synthesis:', error);
        res.status(500).json({ error: 'Failed to process batch synthesis' });
    }
});

// Download audio file endpoint
app.get('/download/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filepath = path.join(outputDir, filename);

        // Security check: only allow downloading files we've generated
        if (!audioFiles.has(filename)) {
            return res.status(404).json({ error: 'Audio file not found or expired' });
        }

        // Check if file exists
        if (!fs.existsSync(filepath)) {
            audioFiles.delete(filename); // Clean up metadata if file doesn't exist
            return res.status(404).json({ error: 'Audio file not found' });
        }

        const metadata = audioFiles.get(filename);
        const downloadName = `${metadata.voice}_${metadata.emotion || 'neutral'}_${Date.now()}.mp3`;

        res.download(filepath, downloadName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error downloading file' });
                }
            }
        });
    } catch (error) {
        console.error('Error in download:', error);
        res.status(500).json({ error: 'Failed to download file: ' + error.message });
    }
});

// Get audio file info
app.get('/audio/:filename/info', (req, res) => {
    try {
        const { filename } = req.params;
        const metadata = audioFiles.get(filename);
        
        if (!metadata) {
            return res.status(404).json({ error: 'Audio file not found or expired' });
        }

        res.json(metadata);
    } catch (error) {
        console.error('Error getting audio info:', error);
        res.status(500).json({ error: 'Failed to get audio info: ' + error.message });
    }
});

// Text rewriting endpoint
app.post('/rewrite', async (req, res) => {
    try {
        const { text, style } = req.body;
        let rewrittenText = text;

        switch (style) {
            case 'professional':
                rewrittenText = transformProfessional(text);
                break;
            case 'casual':
                rewrittenText = transformCasual(text);
                break;
            case 'formal':
                rewrittenText = transformFormal(text);
                break;
            case 'creative':
                rewrittenText = transformCreative(text);
                break;
            case 'concise':
                rewrittenText = transformConcise(text);
                break;
            case 'detailed':
                rewrittenText = transformDetailed(text);
                break;
        }
        
        res.json({ rewrittenText });
    } catch (error) {
        console.error('Error rewriting text:', error);
        res.status(500).json({ error: 'Failed to rewrite text' });
    }
});

// Hugging Face rewrite endpoint
app.post('/api/rewrite', async (req, res) => {
    try {
        const { text, style } = req.body;
        
        // Validate input
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const response = await axios.post(
            'https://api-inference.huggingface.co/models/google/flan-t5-base',
            {
                inputs: `Rewrite this text in ${style || 'a better'} style: ${text}`,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const rewrittenText = response.data[0]?.generated_text || text;
        res.json({ rewrittenText });
    } catch (error) {
        console.error('Error in rewrite:', error.message);
        res.status(500).json({ error: 'Failed to rewrite text', details: error.message });
    }
});

// Add a profile endpoint
app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        // Return the user profile data
        res.json({ 
            user: req.user
        });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Vocalith is running on http://localhost:${port}`);
}); 