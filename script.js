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
        const count = textInput.value.length;
        const countDisplay = document.querySelector('.character-count span');
        countDisplay.textContent = count;
        
        // Change color if approaching limit
        if (count > 1800) {
            countDisplay.classList.add('limit-warning');
        } else {
            countDisplay.classList.remove('limit-warning');
        }
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

    // Update parameter displays with proper formatting and gradient
    speedSlider.addEventListener('input', () => {
        const value = parseFloat(speedSlider.value);
        const speedValue = document.querySelector('#speed-slider + .slider-value');
        speedValue.textContent = `${value.toFixed(1)}x`;
        
        // Update gradient
        const percent = ((value - 0.5) / 1.5) * 100;
        speedSlider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percent}%, var(--bg-tertiary) ${percent}%, var(--bg-tertiary) 100%)`;
    });

    pitchSlider.addEventListener('input', () => {
        const value = parseFloat(pitchSlider.value);
        const pitchValue = document.querySelector('#pitch-slider + .slider-value');
        pitchValue.textContent = value.toFixed(1);
        
        // Update gradient
        const percent = ((value - 0.5) / 1) * 100;
        pitchSlider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percent}%, var(--bg-tertiary) ${percent}%, var(--bg-tertiary) 100%)`;
    });

    volumeSlider.addEventListener('input', () => {
        const value = parseFloat(volumeSlider.value);
        const volumeValue = document.querySelector('#volume-slider + .slider-value');
        volumeValue.textContent = `${value.toFixed(0)}%`;
        
        // Update gradient
        const percent = value;
        volumeSlider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percent}%, var(--bg-tertiary) ${percent}%, var(--bg-tertiary) 100%)`;
    });

    // Initialize slider gradients
    const initSlider = (slider) => {
        const value = parseFloat(slider.value);
        let percent = 0;
        
        if (slider.id === 'speed-slider') {
            percent = ((value - 0.5) / 1.5) * 100;
        } else if (slider.id === 'pitch-slider') {
            percent = ((value - 0.5) / 1) * 100;
        } else if (slider.id === 'volume-slider') {
            percent = value;
        }
        
        slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percent}%, var(--bg-tertiary) ${percent}%, var(--bg-tertiary) 100%)`;
    };
    
    // Initialize all sliders
    initSlider(speedSlider);
    initSlider(pitchSlider);
    initSlider(volumeSlider);

    // Action buttons
    const speakBtn = document.getElementById('speak-btn');
    const stopBtn = document.getElementById('stop-btn');
    let currentAudio = null;
    let currentAudioFilename = null;

    // Load voice options and system status from the server
    async function loadVoicesAndStatus() {
        try {
            const response = await fetch('/api/voices');
            const data = await response.json();
            
            if (data) {
                // Update voice dropdown with available voices
                if (data.voices && data.details) {
                    updateVoiceSelect(data.voices, data.details);
                }
                
                // Display installation status
                if (data.hasOwnProperty('coqui_installed')) {
                    updateSystemStatusDisplay(data.coqui_installed, data.ffmpeg_installed);
                }
            }
        } catch (error) {
            console.error('Error loading voices:', error);
            showNotification('Error loading voice options', 'error');
        }
    }

    // Update the system status display
    function updateSystemStatusDisplay(coquiInstalled, ffmpegInstalled) {
        // Create or update status banner if not installed
        if (!coquiInstalled || !ffmpegInstalled) {
            let statusDiv = document.getElementById('system-status');
            
            if (!statusDiv) {
                statusDiv = document.createElement('div');
                statusDiv.id = 'system-status';
                statusDiv.className = 'system-status-banner';
                
                // Add to the top of the page content
                const container = document.querySelector('.container');
                if (container) {
                    container.insertBefore(statusDiv, container.firstChild);
                } else {
                    document.body.insertBefore(statusDiv, document.body.firstChild);
                }
            }
            
            // Build status message
            let statusMessage = '<strong>System Status:</strong> ';
            
            if (!coquiInstalled) {
                statusMessage += '<span class="status-warning">Coqui TTS not installed. Using gTTS for all voices.</span> ';
            }
            
            if (!ffmpegInstalled) {
                statusMessage += '<span class="status-warning">ffmpeg not installed. Some audio features limited.</span>';
            }
            
            // Add installation instructions button
            statusMessage += '<button id="installation-help" class="small-button">Installation Help</button>';
            
            statusDiv.innerHTML = statusMessage;
            
            // Add event listener to installation help button
            document.getElementById('installation-help').addEventListener('click', showInstallationHelp);
        }
    }

    // Show installation help dialog
    function showInstallationHelp() {
        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';
        dialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Installation Instructions</h3>
                    <button class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <h4>Installing Coqui TTS</h4>
                    <p>To use high-quality Coqui TTS voices, you need to install Coqui TTS:</p>
                    <pre>npm run install-coqui</pre>
                    <p>Or manually with pip:</p>
                    <pre>pip install TTS</pre>
                    
                    <h4>Installing ffmpeg</h4>
                    <p>For audio processing features, install ffmpeg:</p>
                    <ul>
                        <li><strong>macOS:</strong> <code>brew install ffmpeg</code></li>
                        <li><strong>Ubuntu/Debian:</strong> <code>sudo apt-get install ffmpeg</code></li>
                        <li><strong>Windows:</strong> Download from <a href="https://ffmpeg.org/download.html" target="_blank">ffmpeg.org</a></li>
                    </ul>
                    
                    <p><strong>Note:</strong> After installation, restart the server for changes to take effect.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Handle close button
        dialog.querySelector('.close-button').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // Close on click outside
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
            }
        });
    }

    // Update the voice dropdown with available options
    function updateVoiceSelect(voices, details) {
        const voiceSelect = document.getElementById('voice-select');
        
        // Clear existing options
        voiceSelect.innerHTML = '';
        
        // Group options by language/type
        const groups = {
            'English (gTTS)': [],
            'English (Coqui)': [],
            'Other Languages': [],
            'Multilingual': []
        };
        
        // Sort voices into groups
        voices.forEach(voice => {
            const voiceDetail = details[voice];
            if (!voiceDetail) return;
            
            const option = document.createElement('option');
            option.value = voice;
            option.textContent = `${voiceDetail.name} (${voiceDetail.accent})`;
            
            // Determine which group this voice belongs to
            if (voice.startsWith('coqui-en-')) {
                groups['English (Coqui)'].push(option);
            } else if (voice.startsWith('coqui-multilingual')) {
                groups['Multilingual'].push(option);
            } else if (voice.startsWith('coqui-')) {
                groups['Other Languages'].push(option);
            } else if (voice !== 'custom') {
                groups['English (gTTS)'].push(option);
            }
        });
        
        // Add the groups to the select
        for (const [groupName, options] of Object.entries(groups)) {
            if (options.length === 0) continue;
            
            const group = document.createElement('optgroup');
            group.label = groupName;
            
            options.forEach(option => group.appendChild(option));
            voiceSelect.appendChild(group);
        }
        
        // Custom voice option
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = 'Custom Voice (Voice Cloning)';
        voiceSelect.appendChild(customOption);
        
        // Update any voice-specific UI elements
        voiceSelect.addEventListener('change', handleVoiceChange);
        
        // Trigger change to update UI for initial selection
        handleVoiceChange();
    }

    // Handle voice change to update relevant UI elements
    function handleVoiceChange() {
        const voiceSelect = document.getElementById('voice-select');
        const selectedVoice = voiceSelect.value;
        
        // Show or hide language select for multilingual models
        const languageSelectContainer = document.getElementById('language-select-container') || createLanguageSelectElement();
        
        if (selectedVoice === 'coqui-multilingual') {
            languageSelectContainer.style.display = 'block';
        } else {
            languageSelectContainer.style.display = 'none';
        }
    }

    // Create language select element if it doesn't exist
    function createLanguageSelectElement() {
        const controlsPanel = document.querySelector('.controls-panel');
        const voiceSelector = document.querySelector('.voice-selector');
        
        // Create container
        const languageSelectContainer = document.createElement('div');
        languageSelectContainer.id = 'language-select-container';
        languageSelectContainer.className = 'control-group';
        languageSelectContainer.style.display = 'none';
        
        // Create label
        const label = document.createElement('label');
        label.htmlFor = 'language-select';
        label.textContent = 'Language';
        
        // Create custom select wrapper
        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';
        
        // Create select element
        const languageSelect = document.createElement('select');
        languageSelect.id = 'language-select';
        
        // Add language options
        const languages = [
            { code: 'en', name: 'English' },
            { code: 'es', name: 'Spanish' },
            { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' },
            { code: 'it', name: 'Italian' },
            { code: 'pt', name: 'Portuguese' },
            { code: 'pl', name: 'Polish' },
            { code: 'tr', name: 'Turkish' },
            { code: 'ru', name: 'Russian' },
            { code: 'nl', name: 'Dutch' },
            { code: 'cs', name: 'Czech' },
            { code: 'ar', name: 'Arabic' },
            { code: 'zh-cn', name: 'Chinese' },
            { code: 'ja', name: 'Japanese' },
            { code: 'ko', name: 'Korean' },
            { code: 'hi', name: 'Hindi' }
        ];
        
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name;
            languageSelect.appendChild(option);
        });
        
        // Add icon
        const icon = document.createElement('i');
        icon.className = 'fas fa-chevron-down';
        
        // Assemble the elements
        customSelect.appendChild(languageSelect);
        customSelect.appendChild(icon);
        languageSelectContainer.appendChild(label);
        languageSelectContainer.appendChild(customSelect);
        
        // Insert after voice selector
        voiceSelector.parentNode.insertBefore(languageSelectContainer, voiceSelector.nextSibling);
        
        return languageSelectContainer;
    }

    // Enhanced TTS request handling
    speakBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        
        if (!text) {
            showNotification('Please enter some text first', 'error');
            return;
        }
        
        if (text.length > 2000) {
            showNotification('Text is too long. Maximum is 2000 characters.', 'error');
            return;
        }

        try {
            speakBtn.disabled = true;
            speakBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            const emotion = emotionSelect ? emotionSelect.value : 'neutral';
            const speedValue = speedSlider ? parseFloat(speedSlider.value) : 1.0;
            const pitchValue = pitchSlider ? parseFloat(pitchSlider.value) : 1.0;
            const volumeValue = volumeSlider ? parseFloat(volumeSlider.value) : 100;
            const selectedVoice = voiceSelect.value;
            
            // Get language for multilingual models
            let language = null;
            if (selectedVoice === 'coqui-multilingual') {
                const languageSelect = document.getElementById('language-select');
                if (languageSelect) {
                    language = languageSelect.value;
                }
            }
            
            console.log('Sending TTS request with:', {
                text,
                voice: selectedVoice,
                emotion,
                speed: speedValue,
                pitch: pitchValue,
                volume: volumeValue,
                language
            });

            const response = await fetch('/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    voice: selectedVoice,
                    emotion,
                    speed: speedValue,
                    pitch: pitchValue,
                    volume: volumeValue / 100, // Convert to 0-1 range
                    language
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate speech');
            }

            // Get the audio data
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Extract filename from the response header if present
            const contentDisposition = response.headers.get('content-disposition');
            let filename = null;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                    currentAudioFilename = filename; // Store the filename
                }
            } else {
                // If header isn't present, try to extract from URL
                const urlParts = response.url.split('/');
                const lastPart = urlParts[urlParts.length - 1];
                if (lastPart && lastPart.includes('.mp3')) {
                    currentAudioFilename = lastPart;
                }
            }

            console.log('Received audio blob:', audioBlob.type, audioBlob.size);

            // Play the audio
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }
            
            currentAudio = new Audio(audioUrl);
            
            // Add error handling for mobile devices
            currentAudio.addEventListener('error', async (e) => {
                console.error('Audio playback error:', e);
                
                // Try fallback for mobile devices if error occurs
                try {
                    showNotification('Trying alternative playback method...', 'warning');
                    
                    // Use fallback TTS if needed
                    const fallbackResponse = await fetch('/api/fallback-tts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            text,
                            voice: selectedVoice
                        }),
                    });
                    
                    if (!fallbackResponse.ok) {
                        throw new Error('Fallback TTS failed');
                    }
                    
                    const fallbackBlob = await fallbackResponse.blob();
                    const fallbackUrl = URL.createObjectURL(fallbackBlob);
                    
                    // Try playing the fallback audio
                    if (currentAudio) {
                        currentAudio.pause();
                    }
                    
                    currentAudio = new Audio(fallbackUrl);
                    await currentAudio.play();
                    
                } catch (fallbackError) {
                    console.error('Fallback playback failed:', fallbackError);
                    showNotification('Audio playback not supported on this device', 'error');
                }
            });
            
            // Fix for iOS requiring user interaction
            const playPromise = currentAudio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Auto-play prevented. Waiting for user interaction.', error);
                    
                    // Create a play button overlay for mobile devices
                    createPlayOverlay(() => {
                        currentAudio.play().catch(e => {
                            console.error('Play failed after user interaction:', e);
                            showNotification('Audio playback failed. Try again.', 'error');
                        });
                    });
                });
            }
            
            // Show the download button if we have an audio file
            updateDownloadButton();
            
            showNotification('Speech generated successfully!', 'success');
        } catch (error) {
            console.error('TTS error:', error);
            showNotification(error.message || 'Failed to generate speech', 'error');
        } finally {
            speakBtn.disabled = false;
            speakBtn.innerHTML = '<i class="fas fa-play"></i> Generate';
        }
    });

    // Create play overlay for mobile devices that require user interaction
    function createPlayOverlay(callback) {
        // Remove any existing overlay
        const existingOverlay = document.getElementById('play-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'play-overlay';
        overlay.className = 'play-overlay';
        
        // Create play button
        const playButton = document.createElement('button');
        playButton.className = 'play-overlay-btn';
        playButton.innerHTML = '<i class="fas fa-play-circle"></i>';
        
        // Add event listener
        playButton.addEventListener('click', () => {
            callback();
            overlay.remove();
        });
        
        // Assemble and add to page
        overlay.appendChild(playButton);
        document.body.appendChild(overlay);
    }

    // Create download button element
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn secondary-btn download-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
    downloadBtn.style.display = 'none'; // Hide initially
    downloadBtn.addEventListener('click', downloadAudio);

    // Add download button to the action buttons div
    const actionButtons = document.querySelector('.action-buttons');
    actionButtons.appendChild(downloadBtn);

    // Function to update download button visibility
    function updateDownloadButton() {
        if (currentAudioFilename) {
            downloadBtn.style.display = 'inline-flex';
        } else {
            downloadBtn.style.display = 'none';
        }
    }

    // Function to download the current audio
    function downloadAudio() {
        if (!currentAudioFilename) {
            showNotification('No audio available to download', 'error');
            return;
        }
        
        try {
            // Create a download link
            const downloadLink = document.createElement('a');
            downloadLink.href = `/download/${currentAudioFilename}`;
            downloadLink.download = `voicecraft_${new Date().toISOString().replace(/[:.]/g, '-')}.mp3`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            showNotification('Download started!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showNotification('Failed to download audio', 'error');
        }
    }

    // Reset when stopping
    stopBtn.addEventListener('click', () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        // Don't reset currentAudioFilename so users can still download
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

    // Tab navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const contentAreas = document.querySelectorAll('.content-area');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Update active tab
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding content area
            const targetContent = link.textContent.trim().toLowerCase().replace(/\s+/g, '-');
            contentAreas.forEach(area => {
                area.classList.remove('active');
                if (area.id === targetContent) {
                    area.classList.add('active');
                }
            });
        });
    });
    
    // Advanced features panel toggle
    const toggleAdvancedBtn = document.querySelector('.toggle-advanced');
    const advancedFeaturesContent = document.querySelector('.advanced-features-panel .panel-content');
    
    if (toggleAdvancedBtn) {
        toggleAdvancedBtn.addEventListener('click', () => {
            advancedFeaturesContent.classList.toggle('collapsed');
            toggleAdvancedBtn.querySelector('i').classList.toggle('fa-chevron-up');
            toggleAdvancedBtn.querySelector('i').classList.toggle('fa-chevron-down');
        });
    }
    
    // Settings panel toggle
    const toggleSettingsBtn = document.querySelector('.toggle-settings');
    const settingsPanelContent = document.querySelector('.settings-panel .panel-content');
    
    if (toggleSettingsBtn) {
        toggleSettingsBtn.addEventListener('click', () => {
            settingsPanelContent.classList.toggle('collapsed');
            toggleSettingsBtn.querySelector('i').classList.toggle('fa-cog');
            toggleSettingsBtn.querySelector('i').classList.toggle('fa-times');
        });
    }

    // Voice preview functionality
    const voicePreviewBtns = document.querySelectorAll('.voice-preview-btn');
    
    voicePreviewBtns.forEach((btn, index) => {
        btn.addEventListener('click', async () => {
            const voiceName = btn.parentElement.querySelector('h3').textContent;
            let voiceValue = '';
            
            // Map voice name to value
            switch(voiceName) {
                case 'Sarah': voiceValue = 'en-us'; break;
                case 'Emma': voiceValue = 'en-gb'; break;
                case 'Nicole': voiceValue = 'en-au'; break;
                case 'Priya': voiceValue = 'en-in'; break;
                default: voiceValue = 'en-us';
            }
            
            try {
                // Show loading state
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                btn.disabled = true;
                
                // Sample text for preview
                const sampleText = "This is a sample of my voice. How do I sound?";
                
                // Send to backend
                const response = await fetch('/synthesize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: sampleText,
                        voice: voiceValue,
                        emotion: 'neutral',
                        speed: 1.0,
                        pitch: 1.0,
                        volume: 100
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to generate preview');
                }
                
                // Get the audio data
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Play the audio
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                }
                
                currentAudio = new Audio(audioUrl);
                currentAudio.volume = 1.0;
                
                currentAudio.oncanplaythrough = () => {
                    currentAudio.play()
                        .then(() => {
                            console.log('Preview playback started successfully');
                        })
                        .catch(error => {
                            console.error('Preview play() failed:', error);
                            showNotification('Failed to play preview', 'error');
                        });
                };
                
                // Set voice in the main selector
                voiceSelect.value = voiceValue;
                
                // Show success message
                showNotification(`Playing ${voiceName} voice sample`, 'success');
                
                // Switch to Text to Speech tab after preview
                navLinks[0].click();
                
            } catch (error) {
                console.error('Error generating preview:', error);
                showNotification('Failed to preview voice', 'error');
            } finally {
                // Reset button state
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    });

    // Enhanced notification system
    function showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Fix mobile UI issues and optimize button layout
    function optimizeMobileUI() {
        const isMobile = window.innerWidth <= 768;
        const actionButtons = document.querySelector('.action-buttons');
        
        // Create a container for the buttons if it doesn't exist
        let buttonsContainer = document.querySelector('.buttons-container');
        if (!buttonsContainer) {
            buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'buttons-container';
            
            // Move all buttons to the container
            while (actionButtons.firstChild) {
                buttonsContainer.appendChild(actionButtons.firstChild);
            }
            
            actionButtons.appendChild(buttonsContainer);
        }
        
        // Adjust button sizes and layout based on screen size
        if (isMobile) {
            buttonsContainer.classList.add('mobile-layout');
            
            // Reorder buttons for better mobile experience
            const buttons = Array.from(buttonsContainer.children);
            buttons.forEach(button => {
                // Make all buttons same size on mobile
                button.style.flex = '1';
                button.style.minWidth = 'auto';
                
                // Reduce padding for better fit
                button.style.padding = '8px 12px';
            });
        } else {
            buttonsContainer.classList.remove('mobile-layout');
            
            // Reset styles for desktop
            const buttons = Array.from(buttonsContainer.children);
            buttons.forEach(button => {
                button.style.flex = '';
                button.style.minWidth = '';
                button.style.padding = '';
            });
        }
    }

    // Handle window resize events
    window.addEventListener('resize', optimizeMobileUI);

    // Initialize the page
    document.addEventListener('DOMContentLoaded', () => {
        // Load voices from the server
        loadVoicesAndStatus();
        
        // Initialize theme based on user preference
        initTheme();
        
        // Optimize UI for current screen size
        optimizeMobileLayout();
        
        // Apply listeners to all buttons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('touchstart', function(e) {
                // Add active class on touch
                this.classList.add('touch-active');
            });
            
            button.addEventListener('touchend', function(e) {
                // Remove active class when touch ends
                this.classList.remove('touch-active');
            });
        });
        
        // Make sure audio controls are visible and large enough on mobile
        const audioPlayer = document.getElementById('audio-player');
        if (audioPlayer) {
            audioPlayer.setAttribute('controlsList', 'nodownload');
            audioPlayer.style.width = '100%';
        }
        
        // Add theme toggle button if it doesn't exist
        addThemeToggleButton();
    });

    // Toggle dark/light mode
    function toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Update body attribute
        body.setAttribute('data-theme', newTheme);
        
        // Store preference in localStorage
        localStorage.setItem('theme', newTheme);
        
        // Update theme toggle button if it exists
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    // Expose toggleTheme to the global scope
    window.toggleTheme = toggleTheme;

    // Set theme based on saved preference or system preference
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultTheme = prefersDark ? 'dark' : 'light';
        const theme = savedTheme || defaultTheme;
        
        document.body.setAttribute('data-theme', theme);
        
        // Update theme toggle button if it exists
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    // Add theme toggle button to header
    function addThemeToggleButton() {
        const header = document.querySelector('.app-header');
        if (header && !document.getElementById('theme-toggle')) {
            const themeToggle = document.createElement('button');
            themeToggle.id = 'theme-toggle';
            themeToggle.className = 'theme-toggle';
            themeToggle.setAttribute('aria-label', 'Toggle theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            themeToggle.onclick = toggleTheme;
            
            header.appendChild(themeToggle);
            
            // Update icon based on current theme
            const currentTheme = document.body.getAttribute('data-theme') || 'light';
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    // Optimize the layout for mobile
    function optimizeMobileLayout() {
        const isMobile = window.innerWidth < 768;
        
        // Get the control elements
        const controlsPanel = document.querySelector('.controls-panel');
        const actionButtons = document.querySelector('.action-buttons');
        const voiceSelector = document.querySelector('.voice-selector');
        
        if (isMobile) {
            // Rearrange elements for mobile
            if (controlsPanel) controlsPanel.classList.add('mobile-layout');
            if (actionButtons) actionButtons.classList.add('mobile-grid');
            if (voiceSelector) voiceSelector.classList.add('full-width');
            
            // Shrink padding and margins
            document.querySelectorAll('.card').forEach(card => {
                card.classList.add('mobile-card');
            });
            
            // Adjust text area size
            const textInput = document.getElementById('text-input');
            if (textInput) textInput.rows = 4;
        } else {
            // Desktop layout
            if (controlsPanel) controlsPanel.classList.remove('mobile-layout');
            if (actionButtons) actionButtons.classList.remove('mobile-grid');
            if (voiceSelector) voiceSelector.classList.remove('full-width');
            
            // Reset card layout
            document.querySelectorAll('.card').forEach(card => {
                card.classList.remove('mobile-card');
            });
            
            // Reset text area size
            const textInput = document.getElementById('text-input');
            if (textInput) textInput.rows = 6;
        }
    }

    // Add window resize listeners
    window.addEventListener('load', optimizeMobileLayout);
    window.addEventListener('resize', optimizeMobileLayout);

    // Add touchstart event listeners for better mobile responsiveness
    document.addEventListener('DOMContentLoaded', () => {
        // Apply listeners to all buttons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('touchstart', function(e) {
                // Add active class on touch
                this.classList.add('touch-active');
            });
            
            button.addEventListener('touchend', function(e) {
                // Remove active class when touch ends
                this.classList.remove('touch-active');
            });
        });
        
        // Make sure audio controls are visible and large enough on mobile
        const audioPlayer = document.getElementById('audio-player');
        if (audioPlayer) {
            audioPlayer.setAttribute('controlsList', 'nodownload');
            audioPlayer.style.width = '100%';
        }
    });

    // Make the handleSubmit function available globally
    window.handleSubmit = handleSubmit;

    // Toggle settings panel visibility
    window.togglePanel = function(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.toggle('collapsed');
            
            // Update chevron icon
            const header = panel.previousElementSibling;
            if (header) {
                const icon = header.querySelector('.fa-chevron-down, .fa-chevron-up');
                if (icon) {
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                }
            }
        }
    };
}); 