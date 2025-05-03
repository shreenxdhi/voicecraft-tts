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
    
    // Tab navigation
    const tabLinks = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Voice sample buttons
    const sampleButtons = document.querySelectorAll('.sample-button');
    
    // History storage
    let historyItems = JSON.parse(localStorage.getItem('ttsHistory')) || [];
    
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
    
    // Initialize history
    updateHistoryDisplay();
    
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
    
    // Add tab switching listeners
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            
            // Update active tab link
            tabLinks.forEach(tab => tab.classList.remove('active'));
            link.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');
        });
    });
    
    // Add voice sample button listeners
    sampleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const voiceId = button.getAttribute('data-voice');
            playSampleVoice(voiceId);
        });
    });
    
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
            const response = await fetch('/voices');
            const data = await response.json();
            
            if (data && data.voices) {
                populateVoiceDropdown(data.voices, data.defaultVoice);
                
                // Check if Coqui is installed and update UI accordingly
                if (data.coqui_installed) {
                    console.log("Coqui TTS is installed and available");
                } else {
                    console.log("Coqui TTS is not available, some high-quality voices will not be accessible");
                    showNotification("Some high-quality voices are not available. Using Google TTS voices only.", "warning");
                }
                
                // Check if espeak is installed and notify if not
                if (data.espeak_installed === false) {
                    console.log("Espeak not installed - Coqui TTS voices may not work properly");
                    showNotification("espeak not installed - Coqui voices may sound robotic", "warning");
                }
            }
        } catch (error) {
            console.error('Error loading voices:', error);
            showNotification('Error loading voices. Some features may be limited.', 'error');
        }
    }
    
    // Populate voice dropdown with available voices
    function populateVoiceDropdown(voices, defaultVoice) {
        voiceSelect.innerHTML = '';
        
        Object.entries(voices).forEach(([voiceId, voiceInfo]) => {
            if (voiceInfo) {
                const option = document.createElement('option');
                option.value = voiceId;
                option.textContent = `${voiceInfo.name} (${voiceInfo.accent})`;
                
                // Add data attributes for additional info
                option.dataset.engine = voiceInfo.engine;
                option.dataset.language = voiceInfo.language;
                
                voiceSelect.appendChild(option);
            }
        });
        
        // Set default voice if available
        if (defaultVoice && voiceSelect.querySelector(`option[value="${defaultVoice}"]`)) {
            voiceSelect.value = defaultVoice;
        }
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
            // First try with selected voice
            console.log('Trying to generate speech with voice:', voice);
            
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
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to synthesize speech');
            }
            
            // If we got here, the request was successful
            
            // Get the audio URL from the response
            const audioUrl = data.audioUrl;
            
            // Update the audio player
            audioPlayer.src = audioUrl;
            audioContainer.style.display = 'block';

            // Play the audio
            audioPlayer.play();
            
            // Show notification if fallback to Google TTS was used
            if (data.engine === 'gtts' && voice !== 'google-us') {
                showNotification('Premium voice unavailable, using Google TTS instead.', 'warning');
            }
            
            // Close the settings sidebar if open
            if (settingsSidebar.classList.contains('open')) {
                settingsSidebar.classList.remove('open');
            }
            
            // Add to history
            addToHistory(text, voice, audioUrl);
            
        } catch (error) {
            console.error('Error synthesizing speech:', error);
            
            // Try again with Google TTS if using a premium voice
            if (voice !== 'google-us') {
                showNotification('Having trouble with premium voice, trying Google TTS...', 'warning');
                
                try {
                    const fallbackResponse = await fetch('/synthesize', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text,
                            voice: 'google-us',
                            emotion,
                            pitch,
                            speed,
                            volume
                        })
                    });
                    
                    if (!fallbackResponse.ok) {
                        throw new Error('Failed with fallback voice too');
                    }
                    
                    const fallbackData = await fallbackResponse.json();
                    
                    if (!fallbackData.success) {
                        throw new Error('Failed with fallback voice too');
                    }
                    
                    // If we got here, the fallback request was successful
                    
                    // Get the audio URL from the response
                    const audioUrl = fallbackData.audioUrl;
                    
                    // Update the audio player
                    audioPlayer.src = audioUrl;
                    audioContainer.style.display = 'block';

                    // Play the audio
                    audioPlayer.play();
                    
                    // Show fallback notification
                    showNotification('Using Google TTS instead of premium voice.', 'info');
                    
                    // Close the settings sidebar if open
                    if (settingsSidebar.classList.contains('open')) {
                        settingsSidebar.classList.remove('open');
                    }
                    
                    // Add to history with note about fallback
                    addToHistory(text, 'google-us', audioUrl);
                    
                } catch (fallbackError) {
                    console.error('Error with fallback voice:', fallbackError);
                    showNotification('All text-to-speech services failed. Please try again later.', 'error');
                }
            } else {
                showNotification(error.message || 'Failed to synthesize speech', 'error');
            }
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
        if (!audioPlayer.src) return;
        
        const downloadLink = document.createElement('a');
        downloadLink.href = audioPlayer.src;
        
        // Generate a filename based on the current date/time
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = audioPlayer.src.endsWith('.mp3') ? 'mp3' : 'wav';
        downloadLink.download = `voicecraft_${timestamp}.${extension}`;
        
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
    
    // Function to play a sample voice
    async function playSampleVoice(voiceId) {
        const sampleText = "This is a sample of my voice. I hope you like how I sound.";
        
        try {
            // Disable all sample buttons temporarily
            sampleButtons.forEach(btn => {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Loading...</span>';
            });
            
            const response = await fetch('/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: sampleText,
                    voice: voiceId,
                    pitch: 1.0,
                    speed: 1.0,
                    volume: 1.0
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to synthesize sample');
            }
            
            const data = await response.json();
            
            // Create temporary audio player
            const tempAudio = new Audio(data.audioUrl);
            tempAudio.play();
            
            // Re-enable all sample buttons
            sampleButtons.forEach(btn => {
                const voice = btn.getAttribute('data-voice');
                if (voice === voiceId) {
                    btn.innerHTML = '<i class="fas fa-play"></i><span>Playing...</span>';
                    
                    tempAudio.onended = () => {
                        btn.innerHTML = '<i class="fas fa-play"></i><span>Sample</span>';
                        btn.disabled = false;
                    };
                } else {
                    btn.innerHTML = '<i class="fas fa-play"></i><span>Sample</span>';
                    btn.disabled = false;
                }
            });
            
        } catch (error) {
            console.error('Error playing sample:', error);
            showNotification('Error playing voice sample', 'error');
            
            // Re-enable all sample buttons
            sampleButtons.forEach(btn => {
                btn.innerHTML = '<i class="fas fa-play"></i><span>Sample</span>';
                btn.disabled = false;
            });
        }
    }
    
    // Function to update history display
    function updateHistoryDisplay() {
        const historyList = document.querySelector('.history-list');
        const historyPlaceholder = document.getElementById('history-placeholder');
        
        if (historyItems.length === 0) {
            // Show placeholder if no history
            if (historyPlaceholder) {
                historyPlaceholder.style.display = 'block';
            }
            return;
        }
        
        // Hide placeholder
        if (historyPlaceholder) {
            historyPlaceholder.style.display = 'none';
        }
        
        // Clear existing items except placeholder
        const existingItems = historyList.querySelectorAll('.history-item:not(#history-placeholder)');
        existingItems.forEach(item => item.remove());
        
        // Add history items, most recent first
        historyItems.slice(0, 10).forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const timestamp = new Date(item.timestamp).toLocaleString();
            const textPreview = item.text.length > 50 ? item.text.substring(0, 50) + '...' : item.text;
            
            historyItem.innerHTML = `
                <div class="history-text">
                    <p class="history-preview">"${textPreview}"</p>
                    <div class="history-meta">
                        <span class="history-voice">${item.voiceName}</span>
                        <span class="history-time">${timestamp}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-play" data-audio="${item.audioUrl}">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="history-use" data-text="${encodeURIComponent(item.text)}" data-voice="${item.voiceId}">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            `;
            
            historyList.appendChild(historyItem);
            
            // Add event listeners for history actions
            const playButton = historyItem.querySelector('.history-play');
            const useButton = historyItem.querySelector('.history-use');
            
            if (playButton) {
                playButton.addEventListener('click', () => {
                    audioPlayer.src = playButton.getAttribute('data-audio');
                    audioContainer.style.display = 'block';
                    audioPlayer.play();
                });
            }
            
            if (useButton) {
                useButton.addEventListener('click', () => {
                    const savedText = decodeURIComponent(useButton.getAttribute('data-text'));
                    const savedVoice = useButton.getAttribute('data-voice');
                    
                    textInput.value = savedText;
                    if (voiceSelect && savedVoice) {
                        voiceSelect.value = savedVoice;
                    }
                    
                    updateCharCount();
                    
                    // Switch to TTS tab
                    tabLinks.forEach(tab => tab.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    const ttsLink = document.querySelector('[data-tab="tts-tab"]');
                    if (ttsLink) {
                        ttsLink.classList.add('active');
                    }
                    
                    const ttsContent = document.getElementById('tts-tab');
                    if (ttsContent) {
                        ttsContent.classList.add('active');
                    }
                });
            }
        });
    }
    
    // Add to history
    function addToHistory(text, voice, audioUrl) {
        const historyItem = {
            text,
            voiceId: voice,
            audioUrl,
            timestamp: new Date().toISOString(),
            voiceName: voiceSelect.querySelector(`option[value="${voice}"]`).textContent
        };
        
        historyItems.unshift(historyItem);
        localStorage.setItem('ttsHistory', JSON.stringify(historyItems));
        
        updateHistoryDisplay();
    }
}); 