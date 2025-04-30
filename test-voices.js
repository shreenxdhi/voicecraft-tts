// Comprehensive voice testing script
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SERVER_URL = 'http://localhost:3001';
const OUTPUT_DIR = path.join(__dirname, 'voice-tests');
const TEST_TEXT = "The quick brown fox jumps over the lazy dog. This is a test of the text to speech system.";
const TEST_TEXT_OTHER_LANGS = {
  'de': "Der schnelle braune Fuchs springt über den faulen Hund. Dies ist ein Test des Text-zu-Sprache-Systems.",
  'fr': "Le rapide renard brun saute par-dessus le chien paresseux. Ceci est un test du système de synthèse vocale.",
  'es': "El rápido zorro marrón salta sobre el perro perezoso. Esta es una prueba del sistema de texto a voz.",
  'it': "La rapida volpe marrone salta sopra il cane pigro. Questo è un test del sistema di sintesi vocale."
};

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Fetch system status and available voices
async function getSystemInfo() {
  try {
    const statusResponse = await axios.get(`${SERVER_URL}/api/system-status`);
    const voicesResponse = await axios.get(`${SERVER_URL}/api/voices`);
    
    return {
      systemStatus: statusResponse.data,
      availableVoices: voicesResponse.data
    };
  } catch (error) {
    console.error('Failed to fetch system info:', error.message);
    throw error;
  }
}

// Test a specific voice
async function testVoice(voice, settings = {}) {
  try {
    const voiceLang = voice.startsWith('coqui-') ? 
      voice.split('-')[1] : voice.split('-')[0];
    
    // Use language-specific test text if available
    const text = TEST_TEXT_OTHER_LANGS[voiceLang] || TEST_TEXT;
    console.log(`\n🎙️ Testing voice: ${voice}`);
    console.log(`Text: "${text.substring(0, 40)}..."`);
    
    const outputFile = path.join(OUTPUT_DIR, `${voice}_test.mp3`);
    
    // Default settings
    const defaultSettings = {
      text,
      voice,
      emotion: 'neutral',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0
    };
    
    // Merge with custom settings
    const requestSettings = { ...defaultSettings, ...settings };
    
    let response;
    let useFallback = false;
    
    // First check if we need to use the fallback endpoint (if ffmpeg is not available)
    try {
      await execAsync('which ffmpeg');
    } catch (error) {
      console.log('⚠️ ffmpeg not available, using fallback endpoint');
      useFallback = true;
    }
    
    // Make the API request
    const startTime = Date.now();
    
    if (useFallback) {
      // Use the fallback-tts endpoint which doesn't require ffmpeg
      response = await axios({
        method: 'post',
        url: `${SERVER_URL}/api/fallback-tts`,
        data: {
          text: requestSettings.text,
          voice: requestSettings.voice
        },
        responseType: 'arraybuffer',
        validateStatus: null
      });
    } else {
      // Use the regular synthesize endpoint
      response = await axios({
        method: 'post',
        url: `${SERVER_URL}/synthesize`,
        data: requestSettings,
        responseType: 'arraybuffer',
        validateStatus: null, // Accept all status codes for debugging
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000; // seconds
    
    // Check response headers for fallback
    const usedFallback = response.headers['x-tts-fallback'] || (useFallback ? 'Used fallback endpoint' : null);
    
    // Save the response as an audio file
    fs.writeFileSync(outputFile, response.data);
    
    // Get file size
    const stats = fs.statSync(outputFile);
    const fileSizeInKB = Math.round(stats.size / 1024);
    
    // Analyze the audio file for quality metrics (duration, bitrate)
    let audioInfo = {};
    try {
      // Use ffprobe if available, otherwise report basic info
      const { stdout } = await execAsync(`ffprobe -v error -show_format -show_streams -print_format json "${outputFile}" 2>/dev/null`);
      const probeData = JSON.parse(stdout);
      
      // Extract useful information
      if (probeData.format) {
        audioInfo = {
          duration: parseFloat(probeData.format.duration || 0).toFixed(2),
          bitrate: Math.round(parseInt(probeData.format.bit_rate || 0) / 1000),
          format: probeData.format.format_name
        };
        
        if (probeData.streams && probeData.streams.length > 0) {
          audioInfo.codec = probeData.streams[0].codec_name;
          audioInfo.channels = probeData.streams[0].channels;
          audioInfo.sampleRate = probeData.streams[0].sample_rate;
        }
      }
    } catch (error) {
      // ffprobe not available, use basic info
      audioInfo = {
        note: 'ffprobe not available for detailed analysis'
      };
    }
    
    // Result summary
    const result = {
      voice,
      status: response.status,
      success: response.status === 200,
      usedFallback,
      timeTaken: `${timeTaken.toFixed(2)}s`,
      fileSize: `${fileSizeInKB}KB`,
      outputFile,
      audioInfo
    };
    
    // Print result summary
    if (result.success) {
      console.log(`✅ Voice test successful - ${outputFile}`);
    } else {
      console.log(`❌ Voice test failed - Status: ${response.status}`);
    }
    
    if (usedFallback) {
      console.log(`⚠️ Used fallback: ${usedFallback}`);
    }
    
    console.log(`⏱️ Time: ${result.timeTaken} | Size: ${result.fileSize}`);
    
    if (audioInfo.duration) {
      console.log(`🎵 Duration: ${audioInfo.duration}s | Bitrate: ${audioInfo.bitrate}kbps | Format: ${audioInfo.format}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to test voice ${voice}:`, error.message);
    return {
      voice,
      success: false,
      error: error.message
    };
  }
}

// Compare voice quality metrics
function compareVoiceQuality(results) {
  // Group results by voice type (gTTS vs Coqui fallbacks)
  const gTTSResults = results.filter(r => !r.voice.startsWith('coqui-') && r.success);
  const coquiFallbackResults = results.filter(r => r.voice.startsWith('coqui-') && r.success && r.usedFallback);
  
  console.log('\n\n=======================================');
  console.log('VOICE QUALITY COMPARISON');
  console.log('=======================================');
  
  if (gTTSResults.length > 0) {
    const avgDuration = gTTSResults.reduce((sum, r) => sum + parseFloat(r.audioInfo.duration || 0), 0) / gTTSResults.length;
    const avgBitrate = gTTSResults.reduce((sum, r) => sum + (r.audioInfo.bitrate || 0), 0) / gTTSResults.length;
    
    console.log('\n📊 gTTS Voices (average metrics):');
    console.log(`Duration: ${avgDuration.toFixed(2)}s`);
    console.log(`Bitrate: ${avgBitrate.toFixed(0)}kbps`);
  }
  
  if (coquiFallbackResults.length > 0) {
    const avgDuration = coquiFallbackResults.reduce((sum, r) => sum + parseFloat(r.audioInfo.duration || 0), 0) / coquiFallbackResults.length;
    const avgBitrate = coquiFallbackResults.reduce((sum, r) => sum + (r.audioInfo.bitrate || 0), 0) / coquiFallbackResults.length;
    
    console.log('\n📊 Coqui Fallback Voices (average metrics):');
    console.log(`Duration: ${avgDuration.toFixed(2)}s`);
    console.log(`Bitrate: ${avgBitrate.toFixed(0)}kbps`);
  }
  
  // Compare duration-to-filesize ratio (efficiency)
  console.log('\n📊 Most efficient voices (duration/filesize ratio):');
  const efficientVoices = results
    .filter(r => r.success && r.audioInfo.duration)
    .map(r => ({
      voice: r.voice,
      efficiency: parseFloat(r.audioInfo.duration) / (parseInt(r.fileSize) || 1)
    }))
    .sort((a, b) => b.efficiency - a.efficiency);
  
  efficientVoices.slice(0, 3).forEach((v, i) => {
    console.log(`${i+1}. ${v.voice} - ${v.efficiency.toFixed(4)} sec/KB`);
  });
}

// Main test function
async function runVoiceTests() {
  try {
    console.log('🔍 Starting comprehensive voice tests...');
    console.log('======================================');
    
    // Get system info
    const { systemStatus, availableVoices } = await getSystemInfo();
    console.log(`\n📋 System Status:`);
    console.log(`Coqui installed: ${systemStatus.coqui_installed ? 'Yes' : 'No'}`);
    console.log(`ffmpeg installed: ${systemStatus.ffmpeg_installed ? 'Yes' : 'No'}`);
    console.log(`Available voices from API: ${availableVoices.voices.length}`);
    console.log(`All voices in system: ${Object.keys(systemStatus.voice_details).length}`);
    
    // Get all voices from system status (will test all, even if Coqui is not installed)
    const allVoices = Object.keys(systemStatus.voice_details);
    
    // Run tests for all voices with standard settings
    console.log('\n🎙️ Testing all voices with standard settings...');
    const standardResults = [];
    
    for (const voice of allVoices) {
      // Skip custom voice
      if (voice === 'custom') continue;
      
      const result = await testVoice(voice);
      standardResults.push(result);
    }
    
    // Run additional tests with different emotions and settings
    console.log('\n🎭 Testing different emotions...');
    
    // Pick one gTTS and one Coqui voice for emotion tests
    const gTTSVoice = 'en-us';
    const coquiVoice = 'coqui-en-ljspeech';
    const emotions = ['happy', 'sad', 'angry', 'excited'];
    
    for (const emotion of emotions) {
      console.log(`\n😀 Testing emotion: ${emotion}`);
      // Test on gTTS voice
      await testVoice(gTTSVoice, { emotion });
      // Test on Coqui voice with fallback
      await testVoice(coquiVoice, { emotion });
    }
    
    // Test pitch and speed variations
    console.log('\n⚙️ Testing pitch and speed variations...');
    
    // Test low pitch
    await testVoice(gTTSVoice, { pitch: 0.7, speed: 1.0 });
    // Test high pitch
    await testVoice(gTTSVoice, { pitch: 1.3, speed: 1.0 });
    // Test slow speed
    await testVoice(gTTSVoice, { pitch: 1.0, speed: 0.7 });
    // Test fast speed
    await testVoice(gTTSVoice, { pitch: 1.0, speed: 1.3 });
    
    // Compare quality metrics
    compareVoiceQuality(standardResults);
    
    // Final summary
    const successCount = standardResults.filter(r => r.success).length;
    const totalCount = standardResults.length;
    const fallbackCount = standardResults.filter(r => r.usedFallback).length;
    
    console.log('\n\n📊 TEST SUMMARY');
    console.log('=======================================');
    console.log(`Success rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    console.log(`Used fallback: ${fallbackCount}/${totalCount} (${Math.round(fallbackCount/totalCount*100)}%)`);
    
    if (successCount === totalCount) {
      console.log('\n✅ All voice tests passed successfully!');
    } else {
      console.log('\n⚠️ Some voice tests failed. Check the logs above for details.');
      // List failed voices
      const failedVoices = standardResults.filter(r => !r.success).map(r => r.voice);
      console.log('Failed voices:', failedVoices.join(', '));
    }
  } catch (error) {
    console.error('Error in test suite:', error);
  }
}

// Run the tests
runVoiceTests(); 