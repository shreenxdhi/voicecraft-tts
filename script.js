document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    function updateThemeIcon(theme) {
        themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Text input and character count
    const textInput = document.getElementById('text-input');
    const characterCount = document.querySelector('.character-count');
    
    textInput.addEventListener('input', () => {
        characterCount.textContent = `${textInput.value.length} characters`;
    });

    // Clear button functionality
    const clearBtn = document.getElementById('clear-btn');
    clearBtn.addEventListener('click', () => {
        textInput.value = '';
        characterCount.textContent = '0 characters';
    });

    // Voice and emotion controls
    const voiceSelect = document.getElementById('voice-select');
    const emotionSelect = document.getElementById('emotion-select');

    // Parameter controls
    const speedSlider = document.getElementById('speed-slider');
    const pitchSlider = document.getElementById('pitch-slider');
    const volumeSlider = document.getElementById('volume-slider');
    const speedDisplay = speedSlider.nextElementSibling;
    const pitchDisplay = pitchSlider.nextElementSibling;
    const volumeDisplay = volumeSlider.nextElementSibling;

    // Update parameter displays with proper formatting
    speedSlider.addEventListener('input', () => {
        speedDisplay.textContent = `${parseFloat(speedSlider.value).toFixed(1)}x`;
    });

    pitchSlider.addEventListener('input', () => {
        pitchDisplay.textContent = parseFloat(pitchSlider.value).toFixed(1);
    });

    volumeSlider.addEventListener('input', () => {
        volumeDisplay.textContent = `${parseFloat(volumeSlider.value).toFixed(0)}%`;
    });

    // Initialize parameter displays
    speedDisplay.textContent = `${parseFloat(speedSlider.value).toFixed(1)}x`;
    pitchDisplay.textContent = parseFloat(pitchSlider.value).toFixed(1);
    volumeDisplay.textContent = `${parseFloat(volumeSlider.value).toFixed(0)}%`;

    // Action buttons
    const speakBtn = document.getElementById('speak-btn');
    const stopBtn = document.getElementById('stop-btn');
    let currentAudio = null;

    // Speak button functionality
    speakBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (!text) {
            showNotification('Please enter some text', 'error');
            return;
        }

        try {
            // Show loading state
            speakBtn.disabled = true;
            speakBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

            console.log('Sending TTS request with:', {
                text,
                voice: voiceSelect.value,
                emotion: emotionSelect.value,
                speed: parseFloat(speedSlider.value),
                pitch: parseFloat(pitchSlider.value),
                volume: parseFloat(volumeSlider.value) / 100
            });

            // Send to backend
            const response = await fetch('/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    voice: voiceSelect.value,
                    emotion: emotionSelect.value,
                    speed: parseFloat(speedSlider.value),
                    pitch: parseFloat(pitchSlider.value),
                    volume: parseFloat(volumeSlider.value)
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Server response error:', response.status, errorData);
                throw new Error(errorData.error || 'Failed to generate speech');
            }

            // Get the audio data
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            console.log('Received audio blob:', audioBlob.type, audioBlob.size);

            // Play the audio
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }

            currentAudio = new Audio(audioUrl);
            currentAudio.volume = parseFloat(volumeSlider.value) / 100; // Convert to 0-1 range
            
            // Add error handling for audio playback
            currentAudio.onerror = (e) => {
                console.error('Audio playback error:', e);
                showNotification('Error playing the generated audio', 'error');
            };
            
            // Ensure audio is ready before playing
            currentAudio.oncanplaythrough = () => {
                currentAudio.play()
                    .then(() => {
                        console.log('Audio playback started successfully');
                    })
                    .catch(error => {
                        console.error('Audio play() failed:', error);
                        showNotification('Failed to play audio', 'error');
                    });
            };

            // Show success message
            showNotification('Speech generated successfully!', 'success');

        } catch (error) {
            console.error('Error generating speech:', error);
            showNotification(`Failed to generate speech: ${error.message}`, 'error');
        } finally {
            // Reset button state
            speakBtn.disabled = false;
            speakBtn.innerHTML = '<i class="fas fa-play"></i> Generate';
        }
    });

    // Stop button functionality
    stopBtn.addEventListener('click', () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
    });

    // Advanced Features
    const voiceCloningBtn = document.getElementById('voiceCloningBtn');
    const voiceConversionBtn = document.getElementById('voiceConversionBtn');
    const batchProcessBtn = document.getElementById('batchProcessBtn');
    const batchTextarea = document.getElementById('batchTextarea');
    const targetVoiceSelect = document.getElementById('targetVoiceSelect');

    // Voice Cloning
    voiceCloningBtn.addEventListener('click', async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                // Show loading state
                voiceCloningBtn.disabled = true;
                voiceCloningBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                
                // Create FormData and append the file
                const formData = new FormData();
                formData.append('voice_sample', file);
                
                // Send to backend
                const response = await fetch('/api/voice-cloning', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Voice cloning failed');
                }
                
                const data = await response.json();
                
                // Update UI with success message
                showNotification('Voice sample uploaded successfully!', 'success');
                
                // Update voice select options
                updateVoiceSelect(data.voiceId);
                
            } catch (error) {
                console.error('Voice cloning error:', error);
                showNotification('Failed to process voice sample', 'error');
            } finally {
                // Reset button state
                voiceCloningBtn.disabled = false;
                voiceCloningBtn.innerHTML = '<i class="fas fa-microphone"></i> Upload Voice Sample';
            }
        };
        
        input.click();
    });

    // Voice Conversion
    voiceConversionBtn.addEventListener('click', async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const targetVoice = targetVoiceSelect.value;
            if (!targetVoice) {
                showNotification('Please select a target voice', 'error');
                return;
            }
            
            try {
                // Show loading state
                voiceConversionBtn.disabled = true;
                voiceConversionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
                
                // Create FormData and append the file and target voice
                const formData = new FormData();
                formData.append('source_audio', file);
                formData.append('target_voice', targetVoice);
                
                // Send to backend
                const response = await fetch('/api/voice-conversion', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Voice conversion failed');
                }
                
                const data = await response.json();
                
                // Play the converted audio
                const audio = new Audio(data.audioUrl);
                audio.play();
                
                // Show success message
                showNotification('Voice converted successfully!', 'success');
                
            } catch (error) {
                console.error('Voice conversion error:', error);
                showNotification('Failed to convert voice', 'error');
            } finally {
                // Reset button state
                voiceConversionBtn.disabled = false;
                voiceConversionBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert Voice';
            }
        };
        
        input.click();
    });

    // Batch Processing
    batchProcessBtn.addEventListener('click', async () => {
        const texts = batchTextarea.value.trim().split('\n').filter(text => text.trim());
        if (texts.length === 0) {
            showNotification('Please enter some text to process', 'error');
            return;
        }
        
        try {
            // Show loading state
            batchProcessBtn.disabled = true;
            batchProcessBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            // Send to backend
            const response = await fetch('/api/batch-process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    texts,
                    voice: voiceSelect.value,
                    emotion: emotionSelect.value,
                    speed: speedSlider.value,
                    pitch: pitchSlider.value,
                    volume: volumeSlider.value
                })
            });
            
            if (!response.ok) {
                throw new Error('Batch processing failed');
            }
            
            const data = await response.json();
            
            // Create a download link for the batch results
            const downloadLink = document.createElement('a');
            downloadLink.href = data.downloadUrl;
            downloadLink.download = 'batch-results.zip';
            downloadLink.click();
            
            // Show success message
            showNotification(`Processed ${texts.length} texts successfully!`, 'success');
            
        } catch (error) {
            console.error('Batch processing error:', error);
            showNotification('Failed to process batch', 'error');
        } finally {
            // Reset button state
            batchProcessBtn.disabled = false;
            batchProcessBtn.innerHTML = '<i class="fas fa-tasks"></i> Process Batch';
        }
    });

    // Helper function to update voice select options
    function updateVoiceSelect(voiceId) {
        const option = document.createElement('option');
        option.value = voiceId;
        option.textContent = 'Custom Voice';
        voiceSelect.appendChild(option);
        voiceSelect.value = voiceId;
    }

    // Helper function to show notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}); 