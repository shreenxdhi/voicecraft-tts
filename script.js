document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const voiceSelect = document.getElementById('voice-select');
    const emotionSelect = document.getElementById('emotion-select');
    const rateSelect = document.getElementById('rate-select');
    const speakBtn = document.getElementById('speak-btn');
    const stopBtn = document.getElementById('stop-btn');
    const clearBtn = document.getElementById('clear-btn');
    const previewBtn = document.getElementById('preview-btn');
    const rewriteBtn = document.getElementById('rewrite-btn');
    const characterCount = document.querySelector('.character-count');
    const rewriteOptions = document.getElementById('rewrite-options');
    
    let audioContext;
    let currentAudioBuffer;
    let currentAudioSource;
    
    // Update character count
    textInput.addEventListener('input', () => {
        characterCount.textContent = `${textInput.value.length} characters`;
    });
    
    // Initialize voices
    async function initializeVoices() {
        try {
            const response = await fetch('/voices');
            const data = await response.json();
            
            voiceSelect.innerHTML = '';
            data.voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice;
                option.textContent = voice.charAt(0).toUpperCase() + voice.slice(1);
                voiceSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading voices:', error);
            voiceSelect.innerHTML = '<option value="">Error loading voices</option>';
        }
    }
    
    async function synthesizeSpeech(text, voice, emotion, rate) {
        try {
            const response = await fetch('/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    voice,
                    emotion
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to synthesize speech');
            }
            
            const audioData = await response.arrayBuffer();
            return audioData;
        } catch (error) {
            console.error('Error in speech synthesis:', error);
            throw error;
        }
    }
    
    async function playAudio(audioData, rate) {
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Stop any currently playing audio
            if (currentAudioSource) {
                currentAudioSource.stop();
            }
            
            // Decode the audio data
            currentAudioBuffer = await audioContext.decodeAudioData(audioData);
            
            // Create and configure the audio source
            currentAudioSource = audioContext.createBufferSource();
            currentAudioSource.buffer = currentAudioBuffer;
            currentAudioSource.playbackRate.value = rate;
            
            // Connect to the audio context's destination
            currentAudioSource.connect(audioContext.destination);
            
            // Play the audio
            currentAudioSource.start(0);
            
            // Handle completion
            currentAudioSource.onended = () => {
                currentAudioSource = null;
            };
        } catch (error) {
            console.error('Error playing audio:', error);
            throw error;
        }
    }
    
    async function speakText(text, voice, emotion, rate) {
        if (text.trim() === '') return;
        
        try {
            const audioData = await synthesizeSpeech(text, voice, emotion, rate);
            await playAudio(audioData, rate);
        } catch (error) {
            console.error('Error in speakText:', error);
            alert('Failed to synthesize speech. Please try again.');
        }
    }
    
    async function rewriteText(text, style) {
        try {
            const response = await fetch('/rewrite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    style
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to rewrite text');
            }
            
            const data = await response.json();
            return data.rewrittenText;
        } catch (error) {
            console.error('Error rewriting text:', error);
            return text; // Return original text if rewrite fails
        }
    }
    
    // Initialize voices when the page loads
    initializeVoices();
    
    // Rewrite button functionality
    rewriteBtn.addEventListener('click', async () => {
        const originalText = textInput.value;
        if (originalText.trim() === '') return;
        
        const style = rewriteOptions.value;
        const rewrittenText = await rewriteText(originalText, style);
        textInput.value = rewrittenText;
        characterCount.textContent = `${rewrittenText.length} characters`;
    });
    
    // Speak button functionality
    speakBtn.addEventListener('click', async () => {
        const text = textInput.value;
        const voice = voiceSelect.value;
        const emotion = emotionSelect.value;
        const rate = parseFloat(rateSelect.value);
        
        if (!voice) {
            alert('Please select a voice');
            return;
        }
        
        await speakText(text, voice, emotion, rate);
    });
    
    // Preview button functionality
    previewBtn.addEventListener('click', async () => {
        const previewText = document.querySelector('.preview-text').textContent;
        const voice = voiceSelect.value;
        const emotion = emotionSelect.value;
        const rate = parseFloat(rateSelect.value);
        
        if (!voice) {
            alert('Please select a voice');
            return;
        }
        
        await speakText(previewText, voice, emotion, rate);
    });
    
    // Stop button functionality
    stopBtn.addEventListener('click', () => {
        if (currentAudioSource) {
            currentAudioSource.stop();
            currentAudioSource = null;
        }
    });
    
    // Clear button functionality
    clearBtn.addEventListener('click', () => {
        textInput.value = '';
        characterCount.textContent = '0 characters';
    });
}); 