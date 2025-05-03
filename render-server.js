require('dotenv').config();
const express = require('express');
const path = require('path');
const gTTS = require('gtts');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3001;

// Define global variables for TTS engines availability
let COQUI_INSTALLED = false;
let FFMPEG_INSTALLED = false;
let ESPEAK_INSTALLED = false;
let COQUI_DEBUG_OUTPUT = ''; // Store detailed debug info for Coqui

// Define available voices
const AVAILABLE_VOICES = ['vits-ljspeech', 'vits-vctk-female', 'vits-vctk-male', 'google-us'];

// Voice configuration
const VOICE_CONFIG = {
    'vits-ljspeech': {
        name: 'Aria',
        accent: 'American Female',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en',
        engine: 'coqui',
        model: 'tts_models/en/ljspeech/vits',
        vocoder: null,
        description: 'Premium American female voice with excellent clarity and natural intonation'
    },
    'vits-vctk-male': {
        name: 'Thomas',
        accent: 'British Male',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en',
        engine: 'coqui',
        model: 'tts_models/en/vctk/vits',
        speaker: 'p273',
        vocoder: null,
        description: 'Clear and professional British male voice with excellent articulation'
    },
    'vits-vctk-female': {
        name: 'Sophia',
        accent: 'British Female',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en',
        engine: 'coqui',
        model: 'tts_models/en/vctk/vits',
        speaker: 'p236',
        vocoder: null,
        description: 'Premium British female voice with natural intonation'
    },
    'google-us': {
        name: 'Google (Fallback)',
        accent: 'American',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en',
        tld: 'com',
        engine: 'gtts',
        description: 'Fallback voice when Coqui is unavailable'
    }
};

// Store generated audio files temporarily with their metadata
const audioFiles = new Map();

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get available voices
app.get('/voices', (req, res) => {
    const formattedVoices = {};
    AVAILABLE_VOICES.forEach(id => {
        const voice = VOICE_CONFIG[id];
        if (voice) {
            formattedVoices[id] = {
                name: voice.name,
                accent: voice.accent,
                language: voice.lang,
                engine: voice.engine,
                description: voice.description || ''
            };
        }
    });
    
    res.json({
        voices: formattedVoices,
        defaultVoice: AVAILABLE_VOICES[0] || 'google-us'
    });
});

// Text to speech API endpoint
app.post('/synthesize', (req, res) => {
    try {
        console.log('Received synthesize request:', req.body);
        
        const { text, voice = 'vits-ljspeech', volume = 1.0, speed = 1.0, pitch = 1.0 } = req.body;
        
        if (!text) {
            console.log('Error: Text is required');
            return res.status(400).json({ error: 'Text is required' });
        }
        
        // Get voice settings
        const voiceSettings = VOICE_CONFIG[voice] || VOICE_CONFIG['google-us'];
        const language = voiceSettings.lang || 'en';
        
        console.log(`Using voice: ${voice}, engine: ${voiceSettings.engine}`);
        console.log(`Coqui installed: ${COQUI_INSTALLED}, Espeak installed: ${ESPEAK_INSTALLED}`);
        
        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `speech-${timestamp}.${voiceSettings.engine === 'gtts' ? 'mp3' : 'wav'}`;
        const filepath = path.join(outputDir, filename);
        
        console.log(`Output filepath: ${filepath}`);
        
        // Function to handle response
        const sendResponse = (success, engine) => {
            // Store file metadata
            audioFiles.set(filename, {
                timestamp,
                text,
                voice,
                filepath
            });
            
            // Send the response with the audio URL
            const response = {
                success: true,
                audioUrl: `/output/${filename}`,
                engine: engine
            };
            
            console.log('Sending response:', response);
            res.json(response);
        };
        
        // Function to handle errors and fallback to Google TTS
        const handleErrorAndFallback = (error) => {
            console.error('Error occurred, falling back to Google TTS:', error);
            
            // Delete the failed file if it exists
            if (fs.existsSync(filepath)) {
                try {
                    fs.unlinkSync(filepath);
                } catch (err) {
                    console.error('Error removing failed output file:', err);
                }
            }
            
            // Create a new filename for Google TTS
            const googleFilename = `speech-${timestamp}-fallback.mp3`;
            const googleFilepath = path.join(outputDir, googleFilename);
            
            // Use Google TTS as fallback
            console.log('Using Google TTS as fallback');
            generateWithGTTS(text, VOICE_CONFIG['google-us'], googleFilepath, volume, speed, pitch)
                .then(() => {
                    console.log('Google TTS generation successful');
                    
                    // Store file metadata
                    audioFiles.set(googleFilename, {
                        timestamp,
                        text,
                        voice: 'google-us',
                        filepath: googleFilepath
                    });
                    
                    // Send the response with the audio URL
                    const response = {
                        success: true,
                        audioUrl: `/output/${googleFilename}`,
                        engine: 'gtts',
                        fallback: true
                    };
                    
                    console.log('Sending fallback response:', response);
                    res.json(response);
                })
                .catch(fallbackError => {
                    console.error('Fatal error: Both Coqui and Google TTS failed:', fallbackError);
                    res.status(500).json({ 
                        error: 'All text-to-speech services failed',
                        details: error.message,
                        fallbackError: fallbackError.message
                    });
                });
        };
        
        // Try Coqui first if selected and supposedly available
        if (voiceSettings.engine === 'coqui' && COQUI_INSTALLED) {
            console.log('Attempting to generate speech with Coqui TTS');
            
            generateWithCoqui(text, voiceSettings, filepath, volume, speed, pitch, language)
                .then(() => {
                    console.log('Coqui TTS generation successful');
                    sendResponse(true, 'coqui');
                })
                .catch(error => {
                    console.error('Error with Coqui TTS:', error);
                    handleErrorAndFallback(error);
                });
        } else {
            // Directly use Google TTS in other cases
            console.log('Using Google TTS directly');
            
            generateWithGTTS(text, voiceSettings.engine === 'coqui' ? VOICE_CONFIG['google-us'] : voiceSettings, filepath, volume, speed, pitch)
                .then(() => {
                    console.log('Google TTS generation successful');
                    sendResponse(true, 'gtts');
                })
                .catch(error => {
                    console.error('Error with Google TTS:', error);
                    res.status(500).json({ error: 'Failed to generate speech' });
                });
        }
    } catch (error) {
        console.error('Error in /synthesize:', error);
        res.status(500).json({ error: 'An error occurred during speech synthesis' });
    }
});

// Serve audio files
app.get('/output/:filename', (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(outputDir, filename);
    
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'Audio file not found' });
    }
    
    res.sendFile(filepath);
});

// Check system capabilities
app.get('/system-check', async (req, res) => {
    await checkSystemRequirements();
    
    res.json({
        coqui: COQUI_INSTALLED,
        ffmpeg: FFMPEG_INSTALLED,
        espeak: ESPEAK_INSTALLED,
        available_voices: AVAILABLE_VOICES
    });
});

// Add a detailed debug endpoint for troubleshooting
app.get('/debug-coqui', async (req, res) => {
    try {
        console.log('Running Coqui TTS debug test...');
        
        // Try to run a simple test with Coqui TTS
        const testText = "This is a debug test for Coqui TTS.";
        const testOutputPath = path.join(outputDir, 'coqui-debug-test.wav');
        
        // Create a promise to run the TTS command
        const coquiTest = new Promise((resolve, reject) => {
            // Build the command
            const command = `source coqui-env-py311/bin/activate && tts --text "${testText}" --model_name "tts_models/en/ljspeech/vits" --out_path "${testOutputPath}"`;
            
            console.log(`Running test command: ${command}`);
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('Coqui TTS test error:', error);
                    console.error('Stderr:', stderr);
                    resolve({
                        success: false,
                        error: error.message,
                        stdout,
                        stderr
                    });
                    return;
                }
                
                resolve({
                    success: true,
                    message: 'Test completed successfully',
                    stdout,
                    stderr,
                    outputFile: fs.existsSync(testOutputPath)
                });
            });
        });
        
        // Wait for the test to complete with a timeout
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: false,
                    error: 'Timeout while running Coqui TTS test',
                    timeout: true
                });
            }, 15000); // 15 second timeout
        });
        
        // Race between the test and the timeout
        const result = await Promise.race([coquiTest, timeoutPromise]);
        
        // Add system info
        result.system = {
            platform: process.platform,
            node: process.version,
            cwd: process.cwd(),
            coquiInstalled: COQUI_INSTALLED,
            ffmpegInstalled: FFMPEG_INSTALLED,
            espeakInstalled: ESPEAK_INSTALLED,
            env: {
                PATH: process.env.PATH,
                VIRTUAL_ENV: process.env.VIRTUAL_ENV,
                TTS_CACHE_DIR: process.env.TTS_CACHE_DIR
            }
        };
        
        // Return detailed debug info
        res.json(result);
    } catch (error) {
        console.error('Error in debug-coqui endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Helper function to generate speech with Google TTS
async function generateWithGTTS(text, voiceSettings, filepath, volume, speed, pitch) {
    return new Promise((resolve, reject) => {
        const gtts = new gTTS(text, voiceSettings.lang || 'en', false, voiceSettings.tld || 'com');
        
        // Generate a temporary file path
        const tempFilePath = filepath.replace('.mp3', '_temp.mp3');
        
        gtts.save(tempFilePath, async (err) => {
            if (err) {
                console.error('Error saving gTTS audio:', err);
                reject(err);
                return;
            }
            
            try {
                // Process with ffmpeg if available to adjust parameters
                if (FFMPEG_INSTALLED) {
                    // Build ffmpeg command to adjust parameters
                    const speedFactor = parseFloat(speed) || 1.0;
                    const volumeFactor = parseFloat(volume) || 1.0;
                    const pitchFactor = parseFloat(pitch) || 1.0;
                    
                    // Calculate atempo based on speed
                    const atempo = 1 / (speedFactor * 0.92);
                    
                    // Create a temporary output file for FFmpeg processing
                    const ffmpegOutputPath = filepath.replace('.mp3', '_processed.mp3');
                    
                    // Use ffmpeg to process the audio
                    const ffmpegCmd = `ffmpeg -i ${tempFilePath} -af "asetrate=44100*${pitchFactor},aresample=44100,atempo=${atempo},volume=${volumeFactor},highpass=f=50,lowpass=f=15000,dynaudnorm=f=250:g=5:p=0.65,loudnorm=I=-14:LRA=9:TP=-2" -ar 44100 -ac 2 -vn -y ${ffmpegOutputPath}`;
                    
                    exec(ffmpegCmd, (error) => {
                        // Clean up temp file
                        try {
                            fs.unlinkSync(tempFilePath);
                        } catch (err) {
                            console.error('Error removing temp file:', err);
                        }
                        
                        if (error) {
                            console.error('Error processing audio with ffmpeg:', error);
                            // If ffmpeg fails, just use the original file
                            fs.renameSync(tempFilePath, filepath);
                        } else {
                            // Move processed file to the final destination
                            fs.renameSync(ffmpegOutputPath, filepath);
                        }
                        
                        resolve();
                    });
                } else {
                    // If ffmpeg is not available, just use the original file
                    fs.renameSync(tempFilePath, filepath);
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Helper function to generate speech with Coqui TTS
async function generateWithCoqui(text, voiceSettings, filepath, volume, speed, pitch, language) {
    return new Promise((resolve, reject) => {
        try {
            // Create temp file path
            const tempFilePath = filepath.replace('.wav', '_temp.wav');
            
            // Get environment variables
            const isRender = process.env.RENDER === 'true';
            const virtualEnv = process.env.VIRTUAL_ENV || '';
            const modelDir = process.env.TTS_CACHE_DIR || path.join(__dirname, '.models');
            
            // Get the TTS command path
            let ttsCommand;
            let usePythonModule = false;
            
            // Add detailed debug log
            console.log('Coqui TTS environment details:');
            console.log(`- isRender: ${isRender}`);
            console.log(`- virtualEnv: ${virtualEnv}`);
            console.log(`- modelDir: ${modelDir}`);
            console.log(`- platform: ${process.platform}`);
            
            if (isRender) {
                // On Render, use Python module approach for better compatibility
                ttsCommand = 'python3 -m TTS.bin.tts';
                usePythonModule = true;
                console.log('Using Python module approach (Render)');
            } else {
                // Locally, use the direct binary with explicit activation
                console.log('Using local binary approach with activation');
                ttsCommand = 'tts';
            }
            
            // Build model parameters
            const modelParams = [];
            
            // Add model name
            modelParams.push(`--model_name "${voiceSettings.model}"`);
            console.log(`Using model: ${voiceSettings.model}`);
            
            // Add vocoder if specified
            if (voiceSettings.vocoder) {
                modelParams.push(`--vocoder_name "${voiceSettings.vocoder}"`);
                console.log(`Using vocoder: ${voiceSettings.vocoder}`);
            }
            
            // Add speaker if specified
            if (voiceSettings.speaker) {
                modelParams.push(`--speaker_idx "${voiceSettings.speaker}"`);
                console.log(`Using speaker: ${voiceSettings.speaker}`);
            }
            
            // Remove speech_rate parameter - not supported
            
            // Add custom models path if on Render or if the models directory exists
            const modelsDir = path.join(__dirname, '.models');
            if ((isRender || fs.existsSync(modelsDir)) && !usePythonModule) {
                // Don't add custom_models_path as it's not supported
                // modelParams.push(`--custom_models_path "${modelDir}"`);
            }
            
            // Escape text for shell command
            const escapedText = text.replace(/"/g, '\\"').replace(/\$/g, '\\$');
            
            // Build the command
            let command;
            if (usePythonModule) {
                // Python module approach for Render
                command = `TTS_CACHE_DIR="${modelDir}" ${ttsCommand} --text "${escapedText}" ${modelParams.join(' ')} --out_path "${tempFilePath}"`;
            } else {
                // Direct binary approach for local development with explicit source activate
                command = `source coqui-env-py311/bin/activate && ${ttsCommand} --text "${escapedText}" ${modelParams.join(' ')} --out_path "${tempFilePath}"`;
            }
            
            console.log(`Running Coqui TTS command: ${command}`);
            
            // Execute the command
            exec(command, async (error, stdout, stderr) => {
                // Store debug output
                COQUI_DEBUG_OUTPUT = `STDOUT: ${stdout}\nSTDERR: ${stderr}`;
                
                if (error) {
                    console.error('Error generating speech with Coqui:', error);
                    console.error('Stderr:', stderr);
                    reject(error);
                    return;
                }
                
                console.log('Coqui TTS output:', stdout);
                
                try {
                    // Check if the file was created
                    if (!fs.existsSync(tempFilePath)) {
                        console.error('Temp file was not created by Coqui TTS');
                        fs.writeFileSync('coqui-debug.log', COQUI_DEBUG_OUTPUT);
                        reject(new Error('Temp file was not created'));
                        return;
                    }
                    
                    // Process with ffmpeg if available to adjust parameters
                    if (FFMPEG_INSTALLED) {
                        // Build ffmpeg command to adjust parameters
                        const speedFactor = parseFloat(speed) || 1.0;
                        const volumeFactor = parseFloat(volume) || 1.0;
                        const pitchFactor = parseFloat(pitch) || 1.0;
                        
                        // Calculate atempo based on speed
                        const atempo = 1 / (speedFactor * 0.95);
                        
                        // Create a temporary output file for FFmpeg processing
                        const ffmpegOutputPath = filepath.replace('.wav', '_processed.wav');
                        
                        // Use ffmpeg to process the audio
                        const ffmpegCmd = `ffmpeg -i ${tempFilePath} -af "asetrate=44100*${pitchFactor},aresample=44100,atempo=${atempo},volume=${volumeFactor},highpass=f=50,lowpass=f=15000,dynaudnorm=f=250:g=5:p=0.65,loudnorm=I=-14:LRA=9:TP=-2" -ar 44100 -ac 2 -vn -y ${ffmpegOutputPath}`;
                        
                        exec(ffmpegCmd, (error) => {
                            // Clean up temp file
                            try {
                                fs.unlinkSync(tempFilePath);
                            } catch (err) {
                                console.error('Error removing temp file:', err);
                            }
                            
                            if (error) {
                                console.error('Error processing audio with ffmpeg:', error);
                                // If ffmpeg fails, just use the original file
                                fs.renameSync(tempFilePath, filepath);
                            } else {
                                // Move processed file to the final destination
                                fs.renameSync(ffmpegOutputPath, filepath);
                            }
                            
                            resolve();
                        });
                    } else {
                        // If ffmpeg is not available, just use the original file
                        fs.renameSync(tempFilePath, filepath);
                        resolve();
                    }
                } catch (error) {
                    console.error('Error in file processing:', error);
                    reject(error);
                }
            });
        } catch (error) {
            console.error('Exception in generateWithCoqui:', error);
            reject(error);
        }
    });
}

// Helper function to check system requirements
async function checkSystemRequirements() {
    console.log('Checking system requirements...');
    
    // Check FFMPEG installation
    FFMPEG_INSTALLED = await checkFFmpegInstallation();
    console.log(`FFMPEG installed: ${FFMPEG_INSTALLED}`);
    
    // Check Coqui TTS installation
    COQUI_INSTALLED = await checkCoquiInstallation();
    console.log(`Coqui TTS installed: ${COQUI_INSTALLED}`);
    
    // Check espeak installation
    ESPEAK_INSTALLED = await checkEspeakInstallation();
    console.log(`Espeak installed: ${ESPEAK_INSTALLED}`);
}

// Check if ffmpeg is installed
function checkFFmpegInstallation() {
    return new Promise((resolve) => {
        exec('ffmpeg -version', (error) => {
            resolve(!error);
        });
    });
}

// Check if espeak is installed
function checkEspeakInstallation() {
    return new Promise((resolve) => {
        // Try espeak first
        exec('espeak --version', (error) => {
            if (!error) {
                resolve(true);
                return;
            }
            
            // If espeak fails, try espeak-ng
            exec('espeak-ng --version', (error2) => {
                resolve(!error2);
            });
        });
    });
}

// Function to check Coqui TTS installation
function checkCoquiInstallation() {
    return new Promise((resolve) => {
        // Get appropriate command based on environment
        const isRender = process.env.RENDER === 'true';
        const virtualEnv = process.env.VIRTUAL_ENV || '';
        
        let command;
        if (isRender) {
            // On Render, use Python module approach
            command = 'python3 -m TTS.bin.tts --list_models | head -n 1';
        } else {
            // Locally, try to use the direct binary
            const ttsPath = process.platform === 'win32' 
                ? path.join(virtualEnv, 'Scripts', 'tts')
                : path.join(virtualEnv, 'bin', 'tts');
            
            command = fs.existsSync(ttsPath) 
                ? `${ttsPath} --list_models | head -n 1` 
                : 'tts --list_models | head -n 1';
        }
        
        console.log(`Checking Coqui TTS with command: ${command}`);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error checking Coqui TTS installation:', error);
                console.error('Stderr:', stderr);
                resolve(false);
                return;
            }
            
            console.log('Coqui TTS check output:', stdout);
            resolve(true);
        });
    });
}

// Start server
app.listen(port, async () => {
    console.log(`Server listening at http://localhost:${port}`);
    
    // Check system requirements on startup
    await checkSystemRequirements();
    
    // Log status
    console.log('System capabilities:');
    console.log(`- Coqui TTS: ${COQUI_INSTALLED ? 'Available' : 'Not available'}`);
    console.log(`- FFmpeg: ${FFMPEG_INSTALLED ? 'Available' : 'Not available'}`);
    console.log(`- Espeak: ${ESPEAK_INSTALLED ? 'Available' : 'Not available'}`);
    console.log('Available voices:', AVAILABLE_VOICES);
}); 