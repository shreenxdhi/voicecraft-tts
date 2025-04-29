require('dotenv').config();
const express = require('express');
const path = require('path');
const gTTS = require('gtts');
const fs = require('fs');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3001;

// Available voices with proper gTTS language codes
const AVAILABLE_VOICES = [
    'en-us',     // Sarah (American Female)
    'en-in'      // Priya (Indian Female)
];

// Voice configuration
const VOICE_CONFIG = {
    'en-us': {
        name: 'Sarah',
        accent: 'American Female',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en',
        tld: 'com'  // Use .com TLD for American accent
    },
    'en-in': {
        name: 'Priya',
        accent: 'Indian Female',
        pitch: 1.0,
        speed: 0.9,
        lang: 'en',
        tld: 'co.in'  // Use .co.in TLD for Indian accent
    }
};

// Store generated audio files temporarily with their metadata
const audioFiles = new Map();

// Cleanup old files every 5 minutes
setInterval(() => {
    const now = Date.now();
    audioFiles.forEach((metadata, filename) => {
        if (now - metadata.timestamp > 5 * 60 * 1000) { // 5 minutes
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

// Text-to-Speech endpoint
app.post('/synthesize', async (req, res) => {
    try {
        const { text, voice, emotion } = req.body;
        
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

        // Create gTTS instance with voice settings
        const gtts = new gTTS(modifiedText, voiceSettings.lang);
        gtts.speed = voiceSettings.speed;
        gtts.tld = voiceSettings.tld;  // Set TLD for accent variation

        // Save to file
        await new Promise((resolve, reject) => {
            gtts.save(filepath, (err) => {
                if (err) {
                    console.error('Error saving audio:', err);
                    reject(new Error('Failed to generate audio file'));
                } else {
                    resolve();
                }
            });
        });

        // Store file metadata
        audioFiles.set(filename, {
            timestamp: Date.now(),
            text: text.substring(0, 50) + (text.length > 50 ? '...' : ''), // Store preview of text
            voice,
            emotion
        });

        // Stream the file
        const stat = fs.statSync(filepath);
        res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': stat.size,
            'X-Audio-Filename': filename // Send filename in header
        });

        const readStream = fs.createReadStream(filepath);
        readStream.pipe(res);

        readStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error streaming audio file' });
            }
        });

    } catch (error) {
        console.error('Error in TTS synthesis:', error);
        res.status(500).json({ error: 'Failed to synthesize speech: ' + error.message });
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

// Start the server
app.listen(port, () => {
    console.log(`Vocalith is running on http://localhost:${port}`);
}); 