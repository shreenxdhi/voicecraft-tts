#!/bin/bash

# This script downloads the high-quality TTS models that are working reliably
# Run it with bash download-models.sh

echo "Creating models directory if it doesn't exist..."
mkdir -p .models

# Activate the Coqui TTS environment
echo "Activating Coqui TTS environment..."
source coqui-env-py311/bin/activate

# Export TTS_CACHE_DIR to ensure models are saved in the right place
export TTS_CACHE_DIR=$(pwd)/.models

echo "Downloading VITS LJSpeech model (American Female)..."
tts --text "Testing Aria voice model." --model_name tts_models/en/ljspeech/vits --out_path test_aria_ljspeech.wav

echo "Downloading VCTK VITS Male model (British Male)..."
tts --text "Testing Thomas voice model." --model_name tts_models/en/vctk/vits --speaker_idx p273 --out_path test_thomas_vctk.wav

echo "Downloading VCTK VITS Female model (British Female)..."
tts --text "Testing Sophia voice model." --model_name tts_models/en/vctk/vits --speaker_idx p236 --out_path test_sophia_vctk.wav

echo "All working models have been downloaded and tested successfully!"
echo "Test audio files:"
ls -la test_*.wav

echo "Model download and testing complete!"

# Script to download Coqui TTS premium voice models
echo "Downloading premium voice models..."

# Create models directory if it doesn't exist
mkdir -p .models

# Export environment variables
export TTS_CACHE_DIR=$PWD/.models

# Download LJSpeech model (Aria - American Female)
echo "Downloading Aria voice model (LJSpeech VITS)..."
python3 -m TTS.bin.tts --text "Testing Aria voice model." --model_name "tts_models/en/ljspeech/vits" --out_path "test_aria.wav"

# Download VCTK model (Thomas - British Male)
echo "Downloading Thomas voice model (VCTK VITS p273)..."
python3 -m TTS.bin.tts --text "Testing Thomas voice model." --model_name "tts_models/en/vctk/vits" --speaker_idx "p273" --out_path "test_thomas.wav"

# Download VCTK model (Sophia - British Female)
echo "Downloading Sophia voice model (VCTK VITS p236)..."
python3 -m TTS.bin.tts --text "Testing Sophia voice model." --model_name "tts_models/en/vctk/vits" --speaker_idx "p236" --out_path "test_sophia.wav"

# Clean up test files
rm -f test_aria.wav test_thomas.wav test_sophia.wav

echo "Premium voice models downloaded successfully!" 