#!/usr/bin/env node

/**
 * Render Deployment Monitor
 * 
 * This script checks the status of your Render deployment
 * and provides diagnostics for common issues.
 * 
 * Usage: node render-monitor.js <your-render-url>
 * Example: node render-monitor.js https://voicecraft-tts.onrender.com
 */

const fetch = require('node-fetch');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get the Render URL from command line or ask for it
let renderUrl = process.argv[2];

async function promptForUrl() {
  if (!renderUrl) {
    return new Promise((resolve) => {
      rl.question('Enter your Render URL (e.g., https://voicecraft-tts.onrender.com): ', (answer) => {
        resolve(answer.trim());
      });
    });
  }
  return renderUrl;
}

async function checkEndpoint(url, endpoint, method = 'GET', body = null) {
  try {
    console.log(`Checking ${endpoint}...`);
    
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${url}${endpoint}`, options);
    
    if (!response.ok) {
      console.error(`  ✖ Error: ${response.status} ${response.statusText}`);
      try {
        const errorText = await response.text();
        console.error(`  Response: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`);
      } catch (e) {
        console.error('  Could not read error response');
      }
      return null;
    }
    
    const data = await response.json();
    console.log(`  ✓ Success: ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`  ✖ Error accessing ${endpoint}: ${error.message}`);
    return null;
  }
}

async function testVoice(url, text = "This is a test of the TTS system") {
  console.log('\nTesting voice generation...');
  
  try {
    const response = await fetch(`${url}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        voice: 'google-us', // Use Google TTS for initial testing
        pitch: 1.0,
        speed: 1.0,
        volume: 1.0
      })
    });
    
    if (!response.ok) {
      console.error(`  ✖ Voice generation failed: ${response.status} ${response.statusText}`);
      try {
        const errorText = await response.text();
        console.error(`  Response: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`);
      } catch (e) {
        console.error('  Could not read error response');
      }
      return false;
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`  ✓ Voice generation successful!`);
      console.log(`  Audio URL: ${url}${data.audioUrl}`);
      console.log(`  Engine: ${data.engine}`);
      return true;
    } else {
      console.error(`  ✖ Voice generation failed: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error(`  ✖ Error testing voice: ${error.message}`);
    return false;
  }
}

async function runDiagnostics(url) {
  console.log('\n=============================================');
  console.log(`RENDER DEPLOYMENT DIAGNOSTICS`);
  console.log(`URL: ${url}`);
  console.log('=============================================\n');
  
  // Check if server is running
  try {
    const response = await fetch(url);
    console.log(`Server status: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.error(`Server unreachable: ${error.message}`);
    console.log('\nPossible issues:');
    console.log('1. Deployment is still in progress');
    console.log('2. Server crashed during startup');
    console.log('3. URL is incorrect');
    console.log('\nRecommendations:');
    console.log('- Check Render dashboard for deployment status');
    console.log('- Review build logs for errors');
    console.log('- Verify the URL is correct');
    return;
  }
  
  // Check system status
  const systemStatus = await checkEndpoint(url, '/system-check');
  
  if (systemStatus) {
    console.log('\nSystem capabilities:');
    console.log(`  Coqui TTS: ${systemStatus.coqui ? '✓ Available' : '✖ Not available'}`);
    console.log(`  FFmpeg: ${systemStatus.ffmpeg ? '✓ Available' : '✖ Not available'}`);
    console.log(`  Espeak: ${systemStatus.espeak ? '✓ Available' : '✖ Not available'}`);
    console.log(`  Available voices: ${systemStatus.available_voices.join(', ')}`);
    
    // If not all dependencies are available, show troubleshooting tips
    if (!systemStatus.coqui || !systemStatus.ffmpeg || !systemStatus.espeak) {
      console.log('\nMissing dependencies. Possible issues:');
      if (!systemStatus.coqui) {
        console.log('- Coqui TTS failed to install or initialize');
        console.log('  Check build logs for TTS installation errors');
      }
      if (!systemStatus.ffmpeg) {
        console.log('- FFmpeg is missing');
        console.log('  Check build command in render.yaml');
      }
      if (!systemStatus.espeak) {
        console.log('- Espeak is missing');
        console.log('  Check build command in render.yaml');
      }
    }
  }
  
  // Check voices API
  const voicesResponse = await checkEndpoint(url, '/voices');
  
  if (voicesResponse) {
    console.log('\nAvailable voices:');
    Object.entries(voicesResponse.voices).forEach(([id, info]) => {
      console.log(`  ${info.name} (${info.accent}) - Engine: ${info.engine}`);
    });
    console.log(`  Default voice: ${voicesResponse.defaultVoice}`);
  }
  
  // Test voice generation
  const voiceTestResult = await testVoice(url);
  
  if (!voiceTestResult) {
    console.log('\nVoice generation failed. Possible issues:');
    console.log('- Server error during audio processing');
    console.log('- Audio file permissions issue');
    console.log('- FFmpeg processing error');
    
    console.log('\nTry checking:');
    console.log('- Server logs in Render dashboard');
    console.log('- Debug endpoint at /debug-coqui');
  }
  
  // Advanced debug for Coqui
  if (systemStatus && systemStatus.coqui) {
    console.log('\nRunning Coqui TTS diagnostic...');
    const coquiDebug = await checkEndpoint(url, '/debug-coqui');
    
    if (coquiDebug) {
      if (coquiDebug.success) {
        console.log('  ✓ Coqui TTS test successful!');
      } else {
        console.log('  ✖ Coqui TTS test failed:');
        console.log(`     Error: ${coquiDebug.error || 'Unknown error'}`);
        
        if (coquiDebug.stdout) {
          console.log('\nStdout:');
          console.log(coquiDebug.stdout.substring(0, 500));
        }
        
        if (coquiDebug.stderr) {
          console.log('\nStderr:');
          console.log(coquiDebug.stderr.substring(0, 500));
        }
      }
      
      // Display system info
      if (coquiDebug.system) {
        console.log('\nSystem Info:');
        console.log(`  Platform: ${coquiDebug.system.platform}`);
        console.log(`  Node version: ${coquiDebug.system.node}`);
        console.log(`  Working directory: ${coquiDebug.system.cwd}`);
      }
    }
  }
  
  console.log('\n=============================================');
  console.log('DIAGNOSTICS COMPLETE');
  console.log('=============================================\n');
}

// Main function
async function main() {
  try {
    renderUrl = await promptForUrl();
    
    // Normalize URL (remove trailing slash)
    renderUrl = renderUrl.replace(/\/$/, '');
    
    if (!renderUrl.startsWith('http')) {
      renderUrl = 'https://' + renderUrl;
    }
    
    await runDiagnostics(renderUrl);
  } catch (error) {
    console.error(`Error running diagnostics: ${error.message}`);
  } finally {
    rl.close();
  }
}

main(); 