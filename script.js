document.addEventListener('DOMContentLoaded', () => {
    // Load voices from the server
    loadVoicesAndStatus();
    
    // Initialize theme toggle if it exists
    initThemeToggle();
    
    // Add event listeners for buttons
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.addEventListener('click', handleSubmit);
    }
    
    const clearButton = document.getElementById('clear-button');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            const textInput = document.getElementById('text-input');
            if (textInput) {
                textInput.value = '';
            }
            
            const audioPlayer = document.getElementById('audio-player');
            if (audioPlayer) {
                audioPlayer.style.display = 'none';
                audioPlayer.src = '';
            }
        });
    }
    
    const playButton = document.getElementById('play-button');
    if (playButton) {
        playButton.addEventListener('click', () => {
            const audioPlayer = document.getElementById('audio-player');
            if (audioPlayer && audioPlayer.src) {
                audioPlayer.style.display = 'block';
                audioPlayer.play();
            } else {
                showNotification('No audio to play', 'warning');
            }
        });
    }
    
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', downloadAudio);
    }
    
    // Set up advanced settings panel toggle
    const advancedSettings = document.getElementById('advanced-settings');
    if (advancedSettings) {
        const panelHeader = document.querySelector('.panel-header');
        if (panelHeader) {
            panelHeader.addEventListener('click', () => {
                advancedSettings.classList.toggle('collapsed');
                const icon = panelHeader.querySelector('.fa-chevron-down');
                if (icon) {
                    icon.classList.toggle('fa-chevron-up');
                }
            });
        }
    }
    
    // Initialize range controls
    initRangeControls();
});

// Initialize theme toggle
function initThemeToggle() {
    const themeToggle = document.createElement('button');
    themeToggle.id = 'theme-toggle';
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.setAttribute('aria-label', 'Toggle theme');
    
    // Add theme toggle button to the body
    document.body.appendChild(themeToggle);
    
    // Set initial theme based on preference
    const savedTheme = localStorage.getItem('theme') || 
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update icon based on current theme
    const icon = themeToggle.querySelector('i');
    if (icon) {
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // Add event listener
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (icon) {
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    });
}

// Initialize range controls (speed, pitch, volume)
function initRangeControls() {
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
        const valueDisplay = input.parentElement.querySelector('.range-value');
        if (!valueDisplay) return;
        
        // Add event listener to update value display
        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            valueDisplay.textContent = value.toFixed(1);
        });
        
        // Initialize value display
        const value = parseFloat(input.value);
        valueDisplay.textContent = value.toFixed(1);
    });
}

// Handle form submission
async function handleSubmit() {
    const textInput = document.getElementById('text-input');
    const voiceSelect = document.getElementById('voice-select');
    const speedRange = document.getElementById('speed-range');
    const pitchRange = document.getElementById('pitch-range');
    const volumeRange = document.getElementById('volume-range');
    const audioPlayer = document.getElementById('audio-player');
    const emotionSelect = document.getElementById('emotion-select');
    
    if (!textInput || !textInput.value.trim()) {
        showNotification('Please enter some text to synthesize', 'warning');
        return;
    }
    
    // Show loading state
    const submitButton = document.getElementById('submit-button');
    const originalText = submitButton ? submitButton.innerHTML : '';
    if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitButton.disabled = true;
    }
    
    try {
        // Prepare request parameters
        const params = {
            text: textInput.value.trim(),
            voice: voiceSelect ? voiceSelect.value : 'en-us',
            speed: speedRange ? speedRange.value : 1.0,
            pitch: pitchRange ? pitchRange.value : 1.0,
            volume: volumeRange ? volumeRange.value : 1.0,
            emotion: emotionSelect ? emotionSelect.value : 'neutral'
        };
        
        // Make API request
        const response = await fetch('/synthesize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        // Get audio data
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Update audio player
        if (audioPlayer) {
            audioPlayer.src = audioUrl;
            audioPlayer.style.display = 'block';
            audioPlayer.play();
        }
        
        showNotification('Speech synthesized successfully', 'success');
        
    } catch (error) {
        console.error('Error synthesizing speech:', error);
        showNotification('Failed to synthesize speech: ' + error.message, 'error');
    } finally {
        // Reset button state
        if (submitButton) {
            submitButton.innerHTML = originalText || '<i class="fas fa-play"></i> Synthesize';
            submitButton.disabled = false;
        }
    }
}

// Load voices from the server
async function loadVoicesAndStatus() {
    try {
        const response = await fetch('/api/voices');
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update voice select dropdown if available
        if (data.voices && data.voices.length > 0) {
            updateVoiceSelect(data.voices, data.details || {});
        }
        
        // Check if Coqui is installed
        if (data.hasOwnProperty('coqui_installed') && !data.coqui_installed) {
            showNotification('Coqui TTS not installed. Using basic voices.', 'warning');
        }
    } catch (error) {
        console.error('Error loading voices:', error);
    }
}

// Update voice selection dropdown
function updateVoiceSelect(voices, details) {
    const voiceSelect = document.getElementById('voice-select');
    if (!voiceSelect) return;
    
    // Clear existing options
    voiceSelect.innerHTML = '';
    
    // Add each voice as an option
    voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.id || voice;
        
        // Create display name
        let displayName = voice.name || voice;
        if (details[voice.id || voice]) {
            displayName = details[voice.id || voice].name || displayName;
            
            // Add language/accent info if available
            if (details[voice.id || voice].language) {
                const language = details[voice.id || voice].language;
                const accent = details[voice.id || voice].accent;
                if (accent) {
                    displayName += ` (${accent})`;
                } else if (language) {
                    displayName += ` (${language})`;
                }
            }
        }
        
        option.textContent = displayName;
        voiceSelect.appendChild(option);
    });
}

// Download the synthesized audio
function downloadAudio() {
    const audioPlayer = document.getElementById('audio-player');
    
    if (!audioPlayer || !audioPlayer.src || audioPlayer.src.startsWith('blob:') === false) {
        showNotification('No audio available to download', 'warning');
        return;
    }
    
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = audioPlayer.src;
    
    // Set filename - use text input for filename or fallback to default
    const textInput = document.getElementById('text-input');
    let filename = 'speech-output.mp3';
    
    if (textInput && textInput.value.trim()) {
        // Use first few words for filename
        const words = textInput.value.trim().split(/\s+/);
        if (words.length > 0) {
            const shortName = words.slice(0, 3).join('-').toLowerCase();
            // Remove special characters
            filename = shortName.replace(/[^a-z0-9-]/g, '') + '.mp3';
            
            // If filename is too short, use default
            if (filename.length < 5) {
                filename = 'speech-output.mp3';
            }
        }
    }
    
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    showNotification('Downloading audio file', 'success');
}

// Show notification message
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    // Set notification text and type
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type);
    
    // Show notification
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
}

// Toggle advanced settings panel
function togglePanel(id) {
    const panel = document.getElementById(id);
    if (panel) {
        panel.classList.toggle('collapsed');
        const header = panel.previousElementSibling;
        if (header) {
            const icon = header.querySelector('i.fas.fa-chevron-down');
            if (icon) {
                icon.classList.toggle('fa-chevron-up');
            }
        }
    }
}

// Make the handleSubmit function available globally
window.handleSubmit = handleSubmit;
window.togglePanel = togglePanel; 