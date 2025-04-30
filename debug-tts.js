// Debug TTS voices
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const gTTS = require('gtts');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'debug-output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Available voice configurations
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
        pitch: 0.9,
        speed: 0.95,
        lang: 'en',
        tld: 'co.uk',
        engine: 'gtts'
    },
    'en-au': {
        name: 'Nicole',
        accent: 'Australian Female',
        pitch: 1.1,
        speed: 1.05,
        lang: 'en',
        tld: 'com.au',
        engine: 'gtts'
    },
    'en-in': {
        name: 'Priya',
        accent: 'Indian Female',
        pitch: 1.05,
        speed: 0.9,
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
        speaker: 'p273',
        vocoder: null
    },
    'coqui-en-vctk-female': {
        name: 'Charlotte',
        accent: 'British Female (High Quality)',
        pitch: 1.05,
        speed: 1.0,
        lang: 'en',
        engine: 'coqui',
        model: 'tts_models/en/vctk/vits',
        speaker: 'p236',
        vocoder: null
    },
    'coqui-en-jenny': {
        name: 'Jenny',
        accent: 'American Female (Natural)',
        pitch: 1.0,
        speed: 1.0,
        lang: 'en',
        engine: 'coqui',
        model: 'tts_models/en/jenny/jenny',
        vocoder: null
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
        vocoder: null
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
        lang: 'en',
        engine: 'coqui',
        model: 'tts_models/multilingual/multi-dataset/xtts_v2',
        vocoder: null
    }
};

// Sample texts for different languages
const TEST_TEXTS = {
    'en': "Hello, this is a test of the text to speech system.",
    'de': "Hallo, dies ist ein Test des Text-zu-Sprache-Systems.",
    'fr': "Bonjour, ceci est un test du système de synthèse vocale.",
    'es': "Hola, esta es una prueba del sistema de texto a voz.",
    'it': "Ciao, questo è un test del sistema di sintesi vocale."
};

// Check if Coqui TTS is installed
async function checkCoquiInstallation() {
    return new Promise((resolve) => {
        exec('tts --version', (error, stdout, stderr) => {
            if (error) {
                console.log('⚠️ Coqui TTS is NOT installed');
                console.log('Error:', error.message);
                resolve(false);
            } else {
                console.log('✅ Coqui TTS is installed');
                console.log('Version:', stdout.trim());
                resolve(true);
            }
        });
    });
}

// Check if ffmpeg is installed
async function checkFFmpegInstallation() {
    return new Promise((resolve) => {
        exec('ffmpeg -version', (error, stdout) => {
            if (error) {
                console.log('⚠️ ffmpeg is NOT installed');
                console.log('Error:', error.message);
                resolve(false);
            } else {
                console.log('✅ ffmpeg is installed');
                const versionMatch = stdout.match(/version\s([^\s]+)/);
                if (versionMatch) {
                    console.log('Version:', versionMatch[1]);
                }
                resolve(true);
            }
        });
    });
}

// Test gTTS voice
async function testGTTSVoice(voiceId, voiceSettings) {
    console.log(`\n🔊 Testing gTTS voice: ${voiceSettings.name} (${voiceId})`);
    const text = TEST_TEXTS[voiceSettings.lang.split('-')[0]] || TEST_TEXTS['en'];
    const outputFile = path.join(outputDir, `${voiceId}_test.mp3`);
    
    try {
        // Create gTTS instance
        const gtts = new gTTS(text, voiceSettings.lang);
        if (voiceSettings.tld) {
            gtts.tld = voiceSettings.tld;
        }
        
        // Save to file
        await new Promise((resolve, reject) => {
            gtts.save(outputFile, (err) => {
                if (err) {
                    console.error('❌ Error saving gTTS audio:', err);
                    reject(err);
                } else {
                    console.log(`✅ gTTS audio saved to: ${outputFile}`);
                    resolve();
                }
            });
        });
        
        return {
            success: true,
            outputFile,
            message: `Voice "${voiceSettings.name}" generated successfully`
        };
    } catch (error) {
        console.error(`❌ Error testing gTTS voice ${voiceId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Test Coqui TTS voice
async function testCoquiVoice(voiceId, voiceSettings) {
    console.log(`\n🔊 Testing Coqui voice: ${voiceSettings.name} (${voiceId})`);
    const text = TEST_TEXTS[voiceSettings.lang.split('-')[0]] || TEST_TEXTS['en'];
    const outputFile = path.join(outputDir, `${voiceId}_test.wav`);
    
    try {
        // Create command for Coqui TTS
        let coquiCmd = `tts --text "${text.replace(/"/g, '\\"')}" --model_name ${voiceSettings.model}`;
        
        if (voiceSettings.vocoder) {
            coquiCmd += ` --vocoder_name ${voiceSettings.vocoder}`;
        }
        
        if (voiceSettings.speaker) {
            coquiCmd += ` --speaker_idx ${voiceSettings.speaker}`;
        }
        
        coquiCmd += ` --out_path ${outputFile}`;
        
        console.log(`📝 Coqui command: ${coquiCmd}`);
        
        // Run Coqui TTS command
        const result = await new Promise((resolve, reject) => {
            exec(coquiCmd, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Error generating speech with Coqui TTS:', error);
                    if (stderr) console.error('stderr:', stderr);
                    if (stdout) console.log('stdout:', stdout);
                    
                    // Check for common errors
                    let errorType = 'unknown';
                    let suggestion = '';
                    
                    if (stderr.includes('No module named')) {
                        errorType = 'missing_module';
                        suggestion = 'Try running: pip install TTS';
                    } else if (stderr.includes('not found') && stderr.includes('model')) {
                        errorType = 'model_not_found';
                        suggestion = 'The model might not be downloaded. Run: tts --list_models';
                    }
                    
                    reject({
                        error,
                        errorType,
                        suggestion,
                        stderr,
                        stdout
                    });
                    return;
                }
                
                console.log(`✅ Coqui TTS audio generated: ${outputFile}`);
                if (stdout) console.log('Output:', stdout);
                
                resolve({
                    success: true,
                    outputFile
                });
            });
        });
        
        return {
            success: true,
            outputFile: result.outputFile,
            message: `Voice "${voiceSettings.name}" generated successfully`
        };
        
    } catch (error) {
        console.error(`❌ Error testing Coqui voice ${voiceId}:`, error);
        return {
            success: false,
            error: error.message || 'Unknown error',
            details: error
        };
    }
}

// Run tests for all voices
async function runTests() {
    console.log('🔍 Starting TTS diagnostics...');
    console.log('==============================');
    
    // Check dependencies
    const coquiInstalled = await checkCoquiInstallation();
    const ffmpegInstalled = await checkFFmpegInstallation();
    
    console.log('\n📁 Output directory:', outputDir);
    
    // Track results
    const results = {
        gtts: { total: 0, success: 0, failed: 0 },
        coqui: { total: 0, success: 0, failed: 0 },
        failed_voices: []
    };
    
    // Test each voice
    for (const [voiceId, voiceSettings] of Object.entries(VOICE_CONFIG)) {
        if (voiceSettings.engine === 'gtts') {
            results.gtts.total++;
            const result = await testGTTSVoice(voiceId, voiceSettings);
            if (result.success) {
                results.gtts.success++;
            } else {
                results.gtts.failed++;
                results.failed_voices.push({
                    id: voiceId,
                    name: voiceSettings.name,
                    engine: 'gtts',
                    error: result.error
                });
            }
        } else if (voiceSettings.engine === 'coqui') {
            // Skip Coqui tests if not installed
            if (!coquiInstalled) {
                console.log(`⏩ Skipping Coqui voice ${voiceId} (Coqui TTS not installed)`);
                continue;
            }
            
            results.coqui.total++;
            const result = await testCoquiVoice(voiceId, voiceSettings);
            if (result.success) {
                results.coqui.success++;
            } else {
                results.coqui.failed++;
                results.failed_voices.push({
                    id: voiceId,
                    name: voiceSettings.name,
                    engine: 'coqui',
                    error: result.error,
                    details: result.details
                });
            }
        }
    }
    
    // Print summary
    console.log('\n📊 Test Results Summary');
    console.log('==============================');
    console.log(`gTTS voices: ${results.gtts.success}/${results.gtts.total} successful`);
    console.log(`Coqui voices: ${results.coqui.success}/${results.coqui.total} successful`);
    console.log('------------------------------');
    
    if (results.failed_voices.length > 0) {
        console.log('\n❌ Failed Voices:');
        results.failed_voices.forEach(voice => {
            console.log(`- ${voice.name} (${voice.id}): ${voice.error}`);
        });
        
        // Provide troubleshooting tips
        console.log('\n🔧 Troubleshooting Tips:');
        if (!coquiInstalled) {
            console.log('1. Install Coqui TTS: npm run install-coqui');
        }
        if (!ffmpegInstalled) {
            console.log('2. Install ffmpeg:');
            console.log('   - Ubuntu/Debian: sudo apt-get install ffmpeg');
            console.log('   - macOS: brew install ffmpeg');
            console.log('   - Windows: https://ffmpeg.org/download.html');
        }
        
        // Check for common Coqui errors
        const coquiModelErrors = results.failed_voices.filter(v => 
            v.engine === 'coqui' && v.details && v.details.errorType === 'model_not_found'
        );
        
        if (coquiModelErrors.length > 0) {
            console.log('3. Download missing Coqui models:');
            console.log('   Run: tts --list_models');
            console.log('   Then download specific models with:');
            console.log('   tts --text "test" --model_name <model_name> --out_path test.wav');
        }
        
        console.log('\n4. Try updating the server.js file to handle these errors gracefully.');
    } else {
        console.log('\n✅ All tested voices are working correctly!');
    }
}

// Run all tests
runTests().catch(error => {
    console.error('Error running tests:', error);
}); 