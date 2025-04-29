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
    
    let currentAudio = null;
    
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
                option.textContent = voice === 'en-US' ? 'American English' : 'Australian English';
                voiceSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading voices:', error);
            voiceSelect.innerHTML = '<option value="">Error loading voices</option>';
        }
    }
    
    async function synthesizeSpeech(text, voice, emotion) {
        try {
            speakBtn.disabled = true;
            speakBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
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

            // Get the filename from the response header
            const filename = response.headers.get('X-Audio-Filename');
            
            // Create a blob from the audio data
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            return { audioUrl, filename };
        } catch (error) {
            console.error('Error in speech synthesis:', error);
            throw error;
        } finally {
            speakBtn.disabled = false;
            speakBtn.innerHTML = '<i class="fas fa-play"></i> Speak';
        }
    }
    
    async function playAudio(audioUrl, rate = 1) {
        try {
            // Stop any currently playing audio
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            
            // Create new audio element
            currentAudio = new Audio(audioUrl);
            currentAudio.playbackRate = rate;
            
            // Add error handling
            currentAudio.onerror = (e) => {
                console.error('Audio playback error:', e);
                alert('Error playing audio. Please try again.');
            };
            
            // Enable mobile audio playback
            currentAudio.setAttribute('playsinline', '');
            currentAudio.setAttribute('webkit-playsinline', '');
            
            // Play the audio
            const playPromise = currentAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Playback error:', error);
                    if (error.name === 'NotAllowedError') {
                        alert('Please enable autoplay in your browser settings or tap to play.');
                    }
                });
            }
            
            // Handle completion
            currentAudio.onended = () => {
                currentAudio = null;
            };
        } catch (error) {
            console.error('Error playing audio:', error);
            throw error;
        }
    }
    
    async function speakText(text, voice, emotion, rate) {
        if (text.trim() === '') return;
        
        try {
            const { audioUrl, filename } = await synthesizeSpeech(text, voice, emotion);
            await playAudio(audioUrl, rate);
            
            // Add download button after successful generation
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Audio';
            downloadBtn.onclick = () => {
                window.location.href = `/download/${filename}`;
            };
            
            // Remove any existing download button
            const existingBtn = document.querySelector('.download-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            // Add the new download button
            document.querySelector('.action-buttons').appendChild(downloadBtn);
        } catch (error) {
            console.error('Error in speakText:', error);
            alert('Failed to synthesize speech. Please try again.');
        }
    }
    
    async function rewriteText(text, style) {
        try {
            rewriteBtn.disabled = true;
            rewriteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rewriting...';
            
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
        } finally {
            rewriteBtn.disabled = false;
            rewriteBtn.innerHTML = '<i class="fas fa-edit"></i> AI Rewrite';
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
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
    });
    
    // Clear button functionality
    clearBtn.addEventListener('click', () => {
        textInput.value = '';
        characterCount.textContent = '0 characters';
        
        // Remove download button if it exists
        const downloadBtn = document.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.remove();
        }
    });
}); 