require('dotenv').config();
const express = require('express');
const path = require('path');
const gTTS = require('gtts');
const fs = require('fs');
const axios = require('axios');
const multer = require('multer');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3001;

// Always run in development mode
const DEV_MODE = true;

// Import mock authentication instead of Firebase auth
const { requireAuth, requireOnboarding } = require('./mock-auth');

// No need for conditional auth anymore
const applyAuth = requireAuth;

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

// Available voices with both gTTS and Coqui-TTS options
const AVAILABLE_VOICES = [
    // gTTS voices
    'en-us',     // Sarah (American Female)
    'en-gb',     // Emma (British Female)
    'en-au',     // Nicole (Australian Female)
    'en-in',     // Priya (Indian Female)
    
    // Coqui TTS voices
    'coqui-en-ljspeech',     // LJSpeech (American Female)
    'coqui-en-vctk-male',    // VCTK Male (British Male)
    'coqui-en-vctk-female',  // VCTK Female (British Female)
    'coqui-en-jenny',        // Jenny (American Female) 
    'coqui-en-blizzard',     // Blizzard (American Male)
    'coqui-de-thorsten',     // Thorsten (German Male)
    'coqui-fr-mai',          // Mai (French Female)
    'coqui-es-css10',        // CSS10 (Spanish Male)
    'coqui-it-mai',          // Mai (Italian Female)
    'coqui-multilingual',    // Multi-Lingual (Various)
    
    'custom'     // Custom voice cloning
];

// Voice configuration
const VOICE_CONFIG = {
    // gTTS voices
    'en-us': {
        name: 'Sarah',
        accent: 'American Female',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en',
        tld: 'com',
        engine: 'gtts'
    },
    'en-gb': {
        name: 'Emma',
        accent: 'British Female',
        pitch: 0.9,  // Lower pitch for British voice
        speed: 0.95, // Slightly slower
        lang: 'en',
        tld: 'co.uk',
        engine: 'gtts'
    },
    'en-au': {
        name: 'Nicole',
        accent: 'Australian Female',
        pitch: 1.1,  // Higher pitch for Australian
        speed: 1.05, // Slightly faster
        lang: 'en',
        tld: 'com.au',
        engine: 'gtts'
    },
    'en-in': {
        name: 'Priya',
        accent: 'Indian Female',
        pitch: 1.05, // Slightly higher pitch
        speed: 0.9,  // Slower pace
        lang: 'en',
        tld: 'co.in',
        engine: 'gtts'
    },
    
    // Coqui TTS voices
    'coqui-en-ljspeech': {
        name: 'Scarlett',
        accent: 'American Female (High Quality)',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en',
        engine: 'coqui',
        model: 'tts_models/en/ljspeech/glow-tts',
        vocoder: 'vocoder_models/universal/libri-tts/fullband-melgan'
    },
    'coqui-en-vctk-male': {
        name: 'James',
        accent: 'British Male (High Quality)',
        pitch: 0.95,
        speed: 1.0,
        lang: 'en',
        engine: 'coqui',
        model: 'tts_models/en/vctk/vits',
        speaker: 'p273', // Male VCTK speaker
        vocoder: null  // VITS doesn't need a separate vocoder
    },
    'coqui-en-vctk-female': {
        name: 'Charlotte',
        accent: 'British Female (High Quality)',
        pitch: 1.05,
        speed: 1.0,
        lang: 'en',
        engine: 'coqui',
        model: 'tts_models/en/vctk/vits',
        speaker: 'p236', // Female VCTK speaker
        vocoder: null  // VITS doesn't need a separate vocoder
    },
    'coqui-en-jenny': {
        name: 'Jenny',
        accent: 'American Female (Natural)',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en',
        engine: 'coqui',
        model: 'tts_models/en/jenny/jenny',
        vocoder: null // This model doesn't need a separate vocoder
    },
    'coqui-en-blizzard': {
        name: 'David',
        accent: 'American Male (Deep)',
        pitch: 0.9,
        speed: 0.95,
        lang: 'en',
        engine: 'coqui',
        model: 'tts_models/en/blizzard2013/capacitron-t2-c50',
        vocoder: 'vocoder_models/en/blizzard2013/hifigan_v2'
    },
    'coqui-de-thorsten': {
        name: 'Thorsten',
        accent: 'German Male',
        pitch: 1.0,
        speed: 1.0,
        lang: 'de',
        engine: 'coqui',
        model: 'tts_models/de/thorsten/tacotron2-DDC',
        vocoder: 'vocoder_models/de/thorsten/hifigan_v1'
    },
    'coqui-fr-mai': {
        name: 'Céline',
        accent: 'French Female',
        pitch: 1.05,
        speed: 1.0,
        lang: 'fr',
        engine: 'coqui',
        model: 'tts_models/fr/mai/tacotron2-DDC',
        vocoder: 'vocoder_models/universal/libri-tts/fullband-melgan'
    },
    'coqui-es-css10': {
        name: 'Miguel',
        accent: 'Spanish Male',
        pitch: 1.0,
        speed: 1.0,
        lang: 'es',
        engine: 'coqui',
        model: 'tts_models/es/css10/vits',
        vocoder: null // VITS doesn't need a separate vocoder
    },
    'coqui-it-mai': {
        name: 'Sophia',
        accent: 'Italian Female',
        pitch: 1.05,
        speed: 1.0,
        lang: 'it',
        engine: 'coqui',
        model: 'tts_models/it/mai/glow-tts',
        vocoder: 'vocoder_models/universal/libri-tts/fullband-melgan'
    },
    'coqui-multilingual': {
        name: 'Global',
        accent: 'Multi-Lingual',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en', // Default language
        engine: 'coqui',
        model: 'tts_models/multilingual/multi-dataset/xtts_v2',
        vocoder: null // This model doesn't need a separate vocoder
    },
    'custom': {
        name: 'Custom Voice',
        accent: 'Cloned Voice',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en',
        engine: 'gtts'
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
app.post('/api/tts', applyAuth, requireOnboarding, (req, res) => {
    // Existing TTS endpoint logic
});

app.post('/clone-voice', applyAuth, requireOnboarding, upload.single('audio'), async (req, res) => {
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

app.post('/convert-voice', applyAuth, requireOnboarding, upload.single('audio'), async (req, res) => {
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
app.post('/synthesize', applyAuth, async (req, res) => {
    try {
        const { text, voice, emotion, pitch = 1.0, speed = 1.0, volume = 1.0, language } = req.body;
        
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
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const filename = `speech_${voiceSettings.name}_${timestamp}_${randomId}.mp3`;
        const filepath = path.join(outputDir, filename);
        
        let usedEngine = voiceSettings.engine;
        
        // Try to check if Coqui TTS is installed for Coqui voices
        if (voiceSettings.engine === 'coqui') {
            try {
                await new Promise((resolve, reject) => {
                    // Use the full path to tts in the virtual environment
                    const ttsCommand = process.env.VIRTUAL_ENV 
                        ? `${process.env.VIRTUAL_ENV}/bin/tts --list_models` 
                        : './coqui-env-py311/bin/tts --list_models';
                        
                    exec(ttsCommand, (error) => {
                        if (error) {
                            console.warn('Coqui TTS not installed, falling back to gTTS');
                            reject(new Error('Coqui TTS not installed'));
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (error) {
                // Fall back to gTTS if Coqui is not installed
                console.log(`Coqui TTS not available, falling back to gTTS for voice: ${voice}`);
                usedEngine = 'gtts';
                
                // Create a quick notification for the client
                res.set('X-TTS-Fallback', 'Used gTTS instead of Coqui');
            }
        }
        
        // Generate speech based on the engine
        if (usedEngine === 'gtts' || voiceSettings.engine === 'gtts') {
            await generateWithGTTS(modifiedText, voiceSettings, filepath, volume, speed, pitch);
        } else if (usedEngine === 'coqui') {
            try {
                await generateWithCoqui(modifiedText, voiceSettings, filepath, volume, speed, pitch, language);
            } catch (coquiError) {
                // If Coqui fails, try using gTTS instead
                console.error('Error with Coqui TTS, falling back to gTTS:', coquiError.message);
                
                // Create fallback settings for gTTS
                const fallbackSettings = {
                    lang: voiceSettings.lang.split('-')[0],
                    tld: 'com',
                    engine: 'gtts'
                };
                
                // Set fallback header
                res.set('X-TTS-Fallback', 'Used gTTS due to Coqui failure');
                
                // Generate with gTTS
                await generateWithGTTS(modifiedText, fallbackSettings, filepath, volume, speed, pitch);
            }
        } else {
            throw new Error('Unsupported TTS engine');
        }

        // Check if file exists
        if (!fs.existsSync(filepath)) {
            throw new Error('Failed to generate audio file');
        }

        // Track the file for cleanup
        audioFiles.set(filename, {
            timestamp: Date.now(),
            voice: voice,
            emotion: emotion,
            text: text.substring(0, 50) + (text.length > 50 ? '...' : '') // Store partial text
        });

        // Set headers for audio delivery with appropriate caching settings
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Send the file
        res.sendFile(filepath, { maxAge: 0 });
        
    } catch (error) {
        console.error('Error in speech synthesis:', error);
        
        // Try to generate a fallback audio with basic gTTS
        try {
            const fallbackText = "I'm sorry, but I couldn't generate the speech you requested. Please try again or choose a different voice.";
            const fallbackFilepath = path.join(outputDir, `error_fallback_${Date.now()}.mp3`);
            
            const gtts = new gTTS(fallbackText, 'en');
            await new Promise((resolve, reject) => {
                gtts.save(fallbackFilepath, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // Set headers for audio delivery
            res.setHeader('Content-Disposition', `inline; filename="error_message.mp3"`);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('X-TTS-Error', error.message);
            
            // Send the fallback file
            return res.sendFile(fallbackFilepath);
        } catch (fallbackError) {
            // If even the fallback fails, just return an error
            res.status(500).json({ 
                error: 'Failed to synthesize speech', 
                details: error.message,
                suggestion: 'Try using a gTTS voice instead of Coqui TTS'
            });
        }
    }
});

// Function to generate speech with gTTS
async function generateWithGTTS(text, voiceSettings, filepath, volume, speed, pitch) {
    const tempFilepath = filepath.replace('.mp3', '_temp.mp3');
    
    // Create gTTS instance with voice settings
    const gtts = new gTTS(text, voiceSettings.lang);
    
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
        const ffmpegCmd = `ffmpeg -i ${tempFilepath} -af "asetrate=44100*${finalSpeed},aresample=44100,atempo=1/0.9,volume=${volume}" -vn -y ${filepath}`;
        
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
}

// Check system requirements at startup
let COQUI_INSTALLED = false;
let FFMPEG_INSTALLED = false;

// Check for Coqui TTS installation
function checkCoquiInstallation() {
    return new Promise((resolve) => {
        // Use the full path to tts in the virtual environment
        const ttsCommand = process.env.VIRTUAL_ENV 
            ? `${process.env.VIRTUAL_ENV}/bin/tts --list_models` 
            : './coqui-env-py311/bin/tts --list_models';
            
        exec(ttsCommand, (error, stdout) => {
            if (error) {
                console.log('⚠️ Coqui TTS is not installed. Coqui voices will fall back to gTTS.');
                console.log('To install Coqui TTS, run: npm run install-coqui');
                console.log('Error:', error.message);
                COQUI_INSTALLED = false;
            } else {
                console.log('✅ Coqui TTS is installed.');
                COQUI_INSTALLED = true;
            }
            resolve(COQUI_INSTALLED);
        });
    });
}

// Check for ffmpeg installation
function checkFFmpegInstallation() {
    return new Promise((resolve) => {
        exec('ffmpeg -version', (error, stdout) => {
            if (error) {
                console.log('⚠️ ffmpeg is not installed. Audio processing features will be limited.');
                console.log('To install ffmpeg:');
                console.log('- macOS: brew install ffmpeg');
                console.log('- Ubuntu/Debian: sudo apt-get install ffmpeg');
                console.log('- Windows: Download from https://ffmpeg.org/download.html');
                FFMPEG_INSTALLED = false;
            } else {
                const versionMatch = stdout.match(/version\s([^\s]+)/);
                console.log('✅ ffmpeg is installed. Version:', versionMatch ? versionMatch[1] : 'unknown');
                FFMPEG_INSTALLED = true;
            }
            resolve(FFMPEG_INSTALLED);
        });
    });
}

// Run checks at startup
async function checkSystemRequirements() {
    await checkCoquiInstallation();
    await checkFFmpegInstallation();
    
    console.log('\n🚀 TTS System Status:');
    console.log(`- Coqui TTS: ${COQUI_INSTALLED ? 'Installed ✅' : 'Not installed ⚠️'}`);
    console.log(`- ffmpeg: ${FFMPEG_INSTALLED ? 'Installed ✅' : 'Not installed ⚠️'}`);
    console.log(`- gTTS: Installed ✅`);
    console.log(`- Total voices available: ${AVAILABLE_VOICES.length}\n`);
}

// Add API endpoint to check system status
app.get('/api/system-status', (req, res) => {
    res.json({
        coqui_installed: COQUI_INSTALLED,
        ffmpeg_installed: FFMPEG_INSTALLED,
        available_voices: AVAILABLE_VOICES,
        voice_details: VOICE_CONFIG
    });
});

// Get voice info for client
app.get('/api/voices', (req, res) => {
    // Only return Coqui voices if Coqui is installed
    const availableVoices = AVAILABLE_VOICES.filter(voice => {
        const voiceConfig = VOICE_CONFIG[voice] || {};
        return voiceConfig.engine !== 'coqui' || COQUI_INSTALLED;
    });
    
    res.json({
        voices: availableVoices,
        details: VOICE_CONFIG,
        coqui_installed: COQUI_INSTALLED,
        ffmpeg_installed: FFMPEG_INSTALLED
    });
});

// Modified generateWithCoqui function with better error handling for mobile
async function generateWithCoqui(text, voiceSettings, filepath, volume, speed, pitch, language) {
    // If Coqui is not installed, fallback to gTTS immediately
    if (!COQUI_INSTALLED) {
        console.log(`Coqui TTS not installed, falling back to gTTS for voice: ${voiceSettings.name}`);
        
        // Find a suitable gTTS fallback voice based on language
        let fallbackLang = 'en';
        let tld = 'com';
        
        if (voiceSettings.lang === 'de') { 
            fallbackLang = 'de'; 
        } else if (voiceSettings.lang === 'fr') { 
            fallbackLang = 'fr'; 
        } else if (voiceSettings.lang === 'es') { 
            fallbackLang = 'es'; 
        } else if (voiceSettings.lang === 'it') { 
            fallbackLang = 'it'; 
        } else if (voiceSettings.lang.startsWith('en')) {
            // Match the right English accent if possible
            if (voiceSettings.accent && voiceSettings.accent.includes('British')) {
                fallbackLang = 'en';
                tld = 'co.uk';
            } else if (voiceSettings.accent && voiceSettings.accent.includes('Australian')) {
                fallbackLang = 'en';
                tld = 'com.au';
            } else if (voiceSettings.accent && voiceSettings.accent.includes('Indian')) {
                fallbackLang = 'en';
                tld = 'co.in';
            }
        }
        
        const fallbackSettings = {
            lang: fallbackLang,
            tld: tld,
            engine: 'gtts',
            pitch: voiceSettings.pitch || 1.0,
            speed: voiceSettings.speed || 1.0
        };
        
        return await generateWithGTTS(text, fallbackSettings, filepath, volume, speed, pitch);
    }
    
    const tempFilepath = filepath.replace('.mp3', '_temp.wav');
    
    try {
        // Create command for Coqui TTS
        // Use the full path to tts in the virtual environment
        const ttsBin = process.env.VIRTUAL_ENV 
            ? `${process.env.VIRTUAL_ENV}/bin/tts` 
            : './coqui-env-py311/bin/tts';
            
        let coquiCmd = `${ttsBin} --text "${text.replace(/"/g, '\\"')}" --model_name ${voiceSettings.model}`;
        
        // Add vocoder if specified
        if (voiceSettings.vocoder) {
            coquiCmd += ` --vocoder_name ${voiceSettings.vocoder}`;
        }
        
        // Add speaker if specified
        if (voiceSettings.speaker) {
            coquiCmd += ` --speaker_idx ${voiceSettings.speaker}`;
        }
        
        // Add language override if provided
        if (language && voiceSettings.model.includes('multilingual')) {
            coquiCmd += ` --language ${language}`;
        }
        
        // Set output path
        coquiCmd += ` --out_path ${tempFilepath}`;
        
        console.log("Running Coqui command:", coquiCmd);
        
        // Run Coqui TTS command with timeout
        await new Promise((resolve, reject) => {
            const process = exec(coquiCmd, { timeout: 60000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error generating speech with Coqui TTS:', error);
                    if (stderr) console.error('stderr:', stderr);
                    if (stdout) console.log('stdout:', stdout);
                    
                    reject(new Error(`Coqui TTS command failed: ${error.message}`));
                    return;
                }
                
                // Check if the file was created
                if (!fs.existsSync(tempFilepath)) {
                    reject(new Error('Coqui TTS did not generate an output file'));
                    return;
                }
                
                resolve();
            });
        });
        
        // Process with ffmpeg if installed, otherwise just rename the file
        if (FFMPEG_INSTALLED) {
            // Convert and apply audio effects with ffmpeg
            await new Promise((resolve, reject) => {
                // Calculate final values
                const finalPitch = (voiceSettings.pitch * parseFloat(pitch)).toFixed(2);
                const finalSpeed = (voiceSettings.speed * parseFloat(speed)).toFixed(2);
                
                // Command to convert wav to mp3 and apply effects
                const ffmpegCmd = `ffmpeg -i ${tempFilepath} -af "asetrate=44100*${finalSpeed},aresample=44100,atempo=1/0.9,volume=${volume}" -vn -y ${filepath}`;
                
                console.log("Running ffmpeg command:", ffmpegCmd);
                
                exec(ffmpegCmd, (error) => {
                    // Delete the temp file
                    fs.unlink(tempFilepath, () => {});
                    
                    if (error) {
                        console.error('Error processing audio with ffmpeg:', error);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            // Simple rename if ffmpeg is not available
            fs.renameSync(tempFilepath, filepath);
            console.log('ffmpeg not available, using unprocessed audio');
        }
        
        return true;
        
    } catch (error) {
        console.error("Detailed Coqui error:", error);
        
        // Fall back to gTTS if Coqui fails
        console.log("Falling back to gTTS for voice:", voiceSettings.name);
        
        // Find a suitable gTTS fallback voice
        let fallbackLang = 'en';
        let tld = 'com';
        
        if (voiceSettings.lang === 'de') { 
            fallbackLang = 'de'; 
        } else if (voiceSettings.lang === 'fr') { 
            fallbackLang = 'fr'; 
        } else if (voiceSettings.lang === 'es') { 
            fallbackLang = 'es'; 
        } else if (voiceSettings.lang === 'it') { 
            fallbackLang = 'it'; 
        } else if (voiceSettings.lang.startsWith('en')) {
            // Match the right English accent if possible
            if (voiceSettings.accent && voiceSettings.accent.includes('British')) {
                fallbackLang = 'en';
                tld = 'co.uk';
            } else if (voiceSettings.accent && voiceSettings.accent.includes('Australian')) {
                fallbackLang = 'en';
                tld = 'com.au';
            } else if (voiceSettings.accent && voiceSettings.accent.includes('Indian')) {
                fallbackLang = 'en';
                tld = 'co.in';
            }
        }
        
        const fallbackSettings = {
            lang: fallbackLang,
            tld: tld,
            engine: 'gtts',
            pitch: voiceSettings.pitch || 1.0,
            speed: voiceSettings.speed || 1.0
        };
        
        // Generate with gTTS instead
        return await generateWithGTTS(text, fallbackSettings, filepath, volume, speed, pitch);
    }
}

// Get voice list with details
app.get('/api/voices', (req, res) => {
    const voiceDetails = {};
    
    for (const voice of AVAILABLE_VOICES) {
        voiceDetails[voice] = VOICE_CONFIG[voice];
    }
    
    res.json({ 
        voices: AVAILABLE_VOICES,
        details: voiceDetails
    });
});

// Check if Coqui TTS is installed
app.get('/api/check-coqui', (req, res) => {
    // Use the full path to tts in the virtual environment
    const ttsCommand = process.env.VIRTUAL_ENV 
        ? `${process.env.VIRTUAL_ENV}/bin/tts --list_models` 
        : './coqui-env-py311/bin/tts --list_models';
        
    exec(ttsCommand, (error, stdout, stderr) => {
        if (error) {
            res.json({ 
                installed: false,
                error: error.message 
            });
        } else {
            res.json({ 
                installed: true,
                version: "Coqui TTS installed"
            });
        }
    });
});

// Add a fallback to gTTS if Coqui fails
app.post('/api/fallback-tts', async (req, res) => {
    try {
        const { text, voice } = req.body;
        
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Text is required and cannot be empty' });
        }
        
        // Always use gTTS for fallback
        const fallbackVoice = voice.startsWith('coqui-') ? 'en-us' : voice;
        const voiceSettings = VOICE_CONFIG[fallbackVoice];
        
        // Generate unique filename
        const filename = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
        const filepath = path.join(outputDir, filename);
        
        // Generate speech with gTTS
        const gtts = new gTTS(text, voiceSettings.lang);
        if (voiceSettings.tld) {
            gtts.tld = voiceSettings.tld;
        }
        
        await new Promise((resolve, reject) => {
            gtts.save(filepath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        
        // Track the file for cleanup
        audioFiles.set(filename, {
            timestamp: Date.now(),
            voice: fallbackVoice,
            text: text.substring(0, 50) + (text.length > 50 ? '...' : '')
        });
        
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.sendFile(filepath);
        
    } catch (error) {
        console.error('Error in fallback TTS:', error);
        res.status(500).json({ error: 'Failed to generate fallback speech' });
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
        // Create a user-friendly filename
        const voiceName = metadata.voice || 'voice';
        const emotion = metadata.emotion || 'neutral';
        const timestamp = new Date().toISOString().slice(0, 10);
        const downloadName = `voicecraft_${voiceName}_${emotion}_${timestamp}.mp3`;

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        // Send the file as a download
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
app.get('/api/profile', applyAuth, async (req, res) => {
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

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle 404 - Keep this as the last route
app.use(function(req, res) {
    res.status(404);
    
    // Check if the request wants JSON
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, '404.html'));
    } else if (req.accepts('json')) {
        res.json({ error: 'Not found' });
    } else {
        res.type('txt').send('Not found');
    }
});

// Start the server
app.listen(port, async () => {
    console.log(`\n🎙️ VoiceCraft TTS Server v1.0`);
    console.log(`➡️ Server running on http://localhost:${port}`);
    console.log(`🔐 Mode: ${DEV_MODE ? 'DEVELOPMENT (no auth required)' : 'PRODUCTION (auth required)'}`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
        console.log(`📁 Created output directory: ${outputDir}`);
    }
    
    // Check system requirements
    await checkSystemRequirements();
}); 