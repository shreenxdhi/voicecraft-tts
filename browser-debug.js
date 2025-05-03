// Debug helper for browser console
(async function debugTTSStatus() {
    console.log('Running VoiceCraft TTS debug...');
    
    // Check if the dropdown exists and is visible
    const voiceDropdown = document.getElementById('voice-select');
    console.log('Voice dropdown element:', voiceDropdown);
    console.log('Dropdown visibility:', 
        voiceDropdown ? 
        {
            display: window.getComputedStyle(voiceDropdown).display,
            visibility: window.getComputedStyle(voiceDropdown).visibility,
            height: window.getComputedStyle(voiceDropdown).height,
            options: voiceDropdown.options.length
        } : 'Not found');
    
    // Check system status
    try {
        console.log('Checking system status...');
        const response = await fetch('/system-check');
        const data = await response.json();
        console.log('System status:', data);
        
        // Check Coqui debug endpoint
        try {
            console.log('Running Coqui debug test...');
            const coquiResponse = await fetch('/debug-coqui');
            const coquiData = await coquiResponse.json();
            console.log('Coqui debug result:', coquiData);
            
            if (coquiData.success) {
                console.log('Coqui TTS test successful!');
            } else {
                console.error('Coqui TTS test failed:', coquiData.error);
            }
        } catch (coquiError) {
            console.error('Error testing Coqui:', coquiError);
        }
    } catch (error) {
        console.error('Error checking system status:', error);
    }
    
    // Try a minimal test of Google TTS
    try {
        console.log('Testing Google TTS...');
        const gttsResponse = await fetch('/synthesize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: 'Test Google TTS',
                voice: 'google-us',
                pitch: 1.0,
                speed: 1.0,
                volume: 1.0
            })
        });
        
        const gttsData = await gttsResponse.json();
        console.log('Google TTS test result:', gttsData);
        
        if (gttsData.success) {
            console.log('Google TTS working correctly');
        } else {
            console.error('Google TTS failed:', gttsData.error);
        }
    } catch (gttsError) {
        console.error('Error testing Google TTS:', gttsError);
    }
    
    console.log('Debug complete - check console for results');
})(); 