const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const TEST_TEXT = "This is a direct test of the Coqui TTS system.";
const OUTPUT_PATH = path.join(__dirname, 'output', 'coqui-direct-test.wav');

console.log('=== Coqui TTS Direct Debug ===');
console.log(`Test text: "${TEST_TEXT}"`);
console.log(`Output path: ${OUTPUT_PATH}`);
console.log('----------------------------');

// Create output directory if it doesn't exist
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
}

// Build command for direct TTS test
const command = `source coqui-env-py311/bin/activate && tts --text "${TEST_TEXT}" --model_name "tts_models/en/ljspeech/vits" --out_path "${OUTPUT_PATH}"`;

console.log(`Running command: ${command}`);
console.log('----------------------------');

// Execute the command
exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error('Error executing Coqui TTS:');
        console.error(error);
        console.error('\nStderr:');
        console.error(stderr);
        process.exit(1);
    }
    
    console.log('Command executed successfully!');
    console.log('\nOutput:');
    console.log(stdout);
    
    if (fs.existsSync(OUTPUT_PATH)) {
        const stats = fs.statSync(OUTPUT_PATH);
        console.log(`\nOutput file created: ${OUTPUT_PATH}`);
        console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log('----------------------------');
        console.log('Test completed successfully!');
    } else {
        console.error(`\nError: Output file not created at ${OUTPUT_PATH}`);
        process.exit(1);
    }
}); 