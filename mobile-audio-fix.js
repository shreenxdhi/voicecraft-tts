// Additional fixes for mobile audio playback issues
// Include this script in the index.html file for better mobile compatibility

(function() {
    // Debug flags
    const DEBUG_MODE = true;
    const LOG_PREFIX = '📱 MobileAudio:';
    
    // Log function for debugging
    function log(...args) {
        if (DEBUG_MODE) {
            console.log(LOG_PREFIX, ...args);
        }
    }
    
    // Feature detection
    const supportsWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    log('Browser detection:', { 
        isMobile, 
        isIOS, 
        supportsWebAudio, 
        userAgent: navigator.userAgent 
    });
    
    // Initialize audio context on first user interaction
    let audioContext = null;
    
    function initAudioContext() {
        if (audioContext) return audioContext;
        
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            
            // iOS specific unlock
            if (isIOS && audioContext.state === 'suspended') {
                const unlock = async () => {
                    await audioContext.resume();
                    
                    // Create and play a silent buffer to unlock audio
                    const buffer = audioContext.createBuffer(1, 1, 22050);
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContext.destination);
                    source.start(0);
                    
                    log('Audio context unlocked on iOS');
                    
                    // Remove listeners after unlocking
                    document.removeEventListener('touchstart', unlock);
                    document.removeEventListener('touchend', unlock);
                    document.removeEventListener('click', unlock);
                };
                
                document.addEventListener('touchstart', unlock, false);
                document.addEventListener('touchend', unlock, false);
                document.addEventListener('click', unlock, false);
            }
            
            log('Audio context initialized:', audioContext.state);
            return audioContext;
        } catch (e) {
            log('Error initializing audio context:', e);
            return null;
        }
    }
    
    // Attach event listeners to initialize audio
    document.addEventListener('DOMContentLoaded', function() {
        const interactionEvents = ['click', 'touchstart', 'keydown', 'scroll'];
        
        function onFirstInteraction() {
            log('First user interaction detected');
            initAudioContext();
            
            // Remove event listeners after first interaction
            interactionEvents.forEach(event => {
                document.removeEventListener(event, onFirstInteraction);
            });
        }
        
        // Add event listeners for first interaction
        interactionEvents.forEach(event => {
            document.addEventListener(event, onFirstInteraction, {once: true});
        });
        
        // Patch all audio elements for better mobile support
        patchAudioElements();
        
        // Add audio context status display in debug mode
        if (DEBUG_MODE) {
            addAudioDebugStatus();
        }
    });
    
    // Patch all audio elements to work better on mobile
    function patchAudioElements() {
        // Find all audio elements
        const audioElements = document.querySelectorAll('audio');
        
        audioElements.forEach(audio => {
            log('Patching audio element:', audio.id || 'unnamed');
            
            // Set attributes for better mobile compatibility
            audio.setAttribute('playsinline', '');
            audio.setAttribute('webkit-playsinline', '');
            
            // Make controls bigger on mobile
            if (isMobile) {
                audio.style.height = '44px';
            }
            
            // Patch the play method
            const originalPlay = audio.play;
            audio.play = function() {
                log('Play called on audio element');
                
                // Initialize audio context if not done already
                if (supportsWebAudio && !audioContext) {
                    initAudioContext();
                }
                
                // iOS specific: resume audio context before playing
                if (isIOS && audioContext && audioContext.state === 'suspended') {
                    log('Resuming suspended audio context on iOS');
                    audioContext.resume().then(() => {
                        log('Audio context resumed, now playing');
                        return originalPlay.apply(this);
                    }).catch(err => {
                        log('Error resuming audio context:', err);
                        return originalPlay.apply(this);
                    });
                } else {
                    return originalPlay.apply(this);
                }
            };
            
            // Add event listeners for debugging
            if (DEBUG_MODE) {
                audio.addEventListener('play', () => log('Audio played'));
                audio.addEventListener('pause', () => log('Audio paused'));
                audio.addEventListener('ended', () => log('Audio ended'));
                audio.addEventListener('error', e => log('Audio error:', e));
            }
        });
    }
    
    // Add a debug status display in the corner
    function addAudioDebugStatus() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'audio-debug-status';
        statusDiv.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 300px;
            overflow: hidden;
        `;
        
        // Initial status
        updateDebugStatus(statusDiv);
        
        // Update status every second
        setInterval(() => updateDebugStatus(statusDiv), 1000);
        
        document.body.appendChild(statusDiv);
    }
    
    // Update the debug status panel
    function updateDebugStatus(statusDiv) {
        const context = audioContext;
        const status = {
            context: context ? 'Initialized' : 'Not initialized',
            state: context ? context.state : 'N/A',
            sampleRate: context ? context.sampleRate : 'N/A',
            mobile: isMobile ? 'Yes' : 'No',
            ios: isIOS ? 'Yes' : 'No',
            webAudio: supportsWebAudio ? 'Supported' : 'Not supported',
            time: new Date().toLocaleTimeString()
        };
        
        statusDiv.innerHTML = Object.entries(status)
            .map(([key, value]) => `${key}: <strong>${value}</strong>`)
            .join('<br>');
            
        // Color code status
        if (context && context.state === 'running') {
            statusDiv.style.background = 'rgba(0,128,0,0.7)';
        } else if (context && context.state === 'suspended') {
            statusDiv.style.background = 'rgba(255,165,0,0.7)';
        } else if (!context) {
            statusDiv.style.background = 'rgba(255,0,0,0.7)';
        }
    }
    
    // Export functions for external use
    window.mobileAudioFix = {
        initAudioContext,
        patchAudioElements,
        isAudioContextRunning: () => audioContext && audioContext.state === 'running',
        resumeAudioContext: async () => {
            if (audioContext && audioContext.state === 'suspended') {
                return audioContext.resume();
            }
            return Promise.resolve();
        }
    };
})(); 