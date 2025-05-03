document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const textInput = document.getElementById('text-input');
    const voiceSelect = document.getElementById('voice-select');
    const submitButton = document.getElementById('submit-button');
    const clearButton = document.getElementById('clear-button');
    const audioPlayer = document.getElementById('audio-player');
    const audioContainer = document.getElementById('audio-container');
    const downloadButton = document.getElementById('download-button');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsSidebar = document.getElementById('settings-sidebar');
    const closeSettings = document.getElementById('close-settings');
    const themeToggle = document.getElementById('theme-toggle');
    const charCount = document.getElementById('char-count');
    const loadingOverlay = document.getElementById('loading-overlay');
    const resetSettings = document.getElementById('reset-settings');
    const applySettings = document.getElementById('apply-settings');
    
    // Sliders
    const stabilitySlider = document.getElementById('stability-slider');
    const pitchSlider = document.getElementById('pitch-slider');
    const speedSlider = document.getElementById('speed-slider');
    const volumeSlider = document.getElementById('volume-slider');
    
    // Track current audio URL
    let currentAudioUrl = '';
    
    // Initialize theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    
    // Load available voices
    loadVoicesAndStatus();
    
    // Add event listeners
    textInput.addEventListener('input', updateCharCount);
    submitButton.addEventListener('click', handleSubmit);
    clearButton.addEventListener('click', clearText);
    downloadButton.addEventListener('click', downloadAudio);
    settingsToggle.addEventListener('click', toggleSettings);
    closeSettings.addEventListener('click', toggleSettings);
    themeToggle.addEventListener('click', toggleTheme);
    resetSettings.addEventListener('click', resetVoiceSettings);
    applySettings.addEventListener('click', handleSubmit);
    
    // Add event listeners for sliders
    [stabilitySlider, pitchSlider, speedSlider, volumeSlider].forEach(slider => {
        if (slider) {
            slider.addEventListener('input', updateSliderValue);
        }
    });
    
    // Initialize character count
    updateCharCount();
    
    // Load available voices from the server
    async function loadVoicesAndStatus() {
        try {
            const response = await fetch('/api/voices');
            const data = await response.json();
            
            if (data && data.voices) {
                populateVoiceDropdown(data.voices, data.voice_config);
            }
        } catch (error) {
            console.error('Error loading voices:', error);
        }
    }
    
    // Populate voice dropdown with available voices
    function populateVoiceDropdown(voices, voiceConfig) {
        voiceSelect.innerHTML = '';
        
        voices.forEach(voiceId => {
            const voiceInfo = voiceConfig[voiceId];
            if (voiceInfo) {
                const option = document.createElement('option');
                option.value = voiceId;
                option.textContent = `${voiceInfo.name} (${voiceInfo.accent})`;
                
                // Add data attributes for additional info
                option.dataset.engine = voiceInfo.engine;
                option.dataset.language = voiceInfo.lang;
                
                voiceSelect.appendChild(option);
            }
        });
    }
    
    // Update character count
    function updateCharCount() {
        const text = textInput.value;
        const count = text.length;
        charCount.textContent = count;
        
        // Update progress bar in the sidebar
        const progressFill = document.querySelector('.progress-fill');
        const usageText = document.querySelector('.usage-text');
        
        if (progressFill && usageText) {
            const percentage = Math.min((count / 500) * 100, 100);
            progressFill.style.width = `${percentage}%`;
            usageText.textContent = `${count}/500 characters`;
        }
    }
    
    // Handle text-to-speech submission
    async function handleSubmit() {
        const text = textInput.value.trim();
        
        if (!text) {
            showNotification('Please enter text to convert to speech.', 'error');
            return;
        }
        
        const voice = voiceSelect.value;
        const emotion = getSelectedEmotion();
        const pitch = pitchSlider ? pitchSlider.value : 1.0;
        const speed = speedSlider ? speedSlider.value : 1.0;
        const volume = volumeSlider ? volumeSlider.value : 1.0;
        
        // Show loading overlay
        loadingOverlay.classList.remove('hidden');
        
        try {
            const response = await fetch('/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    voice,
                    emotion,
                    pitch,
                    speed,
                    volume
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to synthesize speech');
            }
            
            // Get the blob from the response
            const blob = await response.blob();
            
            // Create a URL for the blob
            const audioUrl = URL.createObjectURL(blob);
            
            // Revoke the previous URL to prevent memory leaks
            if (currentAudioUrl) {
                URL.revokeObjectURL(currentAudioUrl);
            }
            
            // Store the new URL
            currentAudioUrl = audioUrl;
            
            // Update the audio player
            audioPlayer.src = audioUrl;
            audioContainer.style.display = 'block';
            
            // Play the audio
            audioPlayer.play();
            
            // Close the settings sidebar if open
            if (settingsSidebar.classList.contains('open')) {
                settingsSidebar.classList.remove('open');
            }
            
        } catch (error) {
            console.error('Error synthesizing speech:', error);
            showNotification(error.message || 'Failed to synthesize speech', 'error');
        } finally {
            // Hide loading overlay
            loadingOverlay.classList.add('hidden');
        }
    }
    
    // Clear the text input
    function clearText() {
        textInput.value = '';
        updateCharCount();
        
        // Hide audio player
        audioContainer.style.display = 'none';
        audioPlayer.pause();
        audioPlayer.src = '';
        
        // Revoke object URL
        if (currentAudioUrl) {
            URL.revokeObjectURL(currentAudioUrl);
            currentAudioUrl = '';
        }
    }
    
    // Download the generated audio
    function downloadAudio() {
        if (!currentAudioUrl) return;
        
        const downloadLink = document.createElement('a');
        downloadLink.href = currentAudioUrl;
        
        // Generate a filename based on the current date/time
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        downloadLink.download = `voicecraft_${timestamp}.mp3`;
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    
    // Toggle settings sidebar
    function toggleSettings() {
        settingsSidebar.classList.toggle('open');
    }
    
    // Toggle theme (light/dark)
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateThemeIcon();
    }
    
    // Update theme icon based on current theme
    function updateThemeIcon() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const themeIcon = themeToggle.querySelector('i');
        
        if (themeIcon) {
            if (currentTheme === 'dark') {
                themeIcon.className = 'fas fa-sun';
            } else {
                themeIcon.className = 'fas fa-moon';
            }
        }
    }
    
    // Get the selected emotion
    function getSelectedEmotion() {
        const emotionRadios = document.querySelectorAll('input[name="emotion"]');
        for (const radio of emotionRadios) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return 'neutral'; // Default
    }
    
    // Update slider value display
    function updateSliderValue(event) {
        const slider = event.target;
        const valueDisplay = slider.nextElementSibling;
        
        if (valueDisplay) {
            if (slider.id === 'stability-slider') {
                valueDisplay.textContent = `${slider.value}%`;
            } else {
                valueDisplay.textContent = slider.value;
            }
        }
    }
    
    // Reset voice settings to defaults
    function resetVoiceSettings() {
        if (stabilitySlider) stabilitySlider.value = 50;
        if (pitchSlider) pitchSlider.value = 1.0;
        if (speedSlider) speedSlider.value = 1.0;
        if (volumeSlider) volumeSlider.value = 1.0;
        
        // Update displays
        document.querySelectorAll('.slider-value').forEach((valueDisplay, index) => {
            if (index === 0) {
                valueDisplay.textContent = '50%';
            } else {
                valueDisplay.textContent = '1.0';
            }
        });
        
        // Reset emotion
        const neutralEmotion = document.querySelector('input[value="neutral"]');
        if (neutralEmotion) {
            neutralEmotion.checked = true;
        }
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        // Create temporary notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            
            // Remove from DOM after animation completes
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}); 