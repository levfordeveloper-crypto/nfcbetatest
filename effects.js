// Add this at the beginning of your effects.js file
let isSynced = false;
let audioDuration = 0;
let wasHidden = false;

function handleOverlayClick() {
    const overlay = document.getElementById('overlay');
    const overlayBtn = overlay ? overlay.querySelector('button') : null;
    const gif = document.querySelector('.background');
    const audio = document.getElementById('backgroundsong');
    const mainContent = document.getElementById('user-page');
    
    // Hide the button completely
    if (overlayBtn) {
        overlayBtn.style.display = 'none';
    }
    
    // Show main content but keep GIF hidden initially
    if (mainContent) {
        mainContent.style.display = 'flex';
    }
    
    // Start GIF hidden (it will load but stay invisible)
    if (gif) {
        gif.style.display = 'none'; // Keep hidden
        gif.preload = 'auto';
        // Reload GIF to restart it
        const currentSrc = gif.src;
        gif.src = '';
        gif.src = currentSrc; // This restarts the GIF
    }
    
    // Start audio muted and playing with loop
    if (audio) {
        audio.loop = true; // Ensure loop is enabled
        audio.volume = 0.3;
        audio.muted = true; // Start muted
        audio.currentTime = 0; // Reset to beginning
        audio.load();
        audio.play().catch(e => console.log('Autoplay prevented'));
        
        // Get the audio duration when it's loaded
        audio.addEventListener('loadedmetadata', function() {
            audioDuration = audio.duration;
            console.log('Audio duration:', audioDuration, 'seconds');
        });
    }
    
    // Wait 3 seconds then show everything
    setTimeout(() => {
        showContentTogether();
    }, 1000);
}

function showContentTogether() {
    const overlay = document.getElementById('overlay');
    const gif = document.querySelector('.background');
    const audio = document.getElementById('backgroundsong');
    
    // Show the GIF and restart it
    if (gif) {
        // Restart the GIF by reloading it
        const currentSrc = gif.src;
        gif.src = '';
        gif.src = currentSrc;
        gif.style.display = 'block';
    }
    
    // Unmute the audio and ensure it's playing from start with loop
    if (audio) {
        audio.loop = true; // Ensure loop is still enabled
        audio.currentTime = 0; // Reset to beginning
        audio.muted = false;
        audio.play().catch(e => console.log('Autoplay prevented'));
        
        // Get audio duration if not already set
        if (!audioDuration && audio.duration) {
            audioDuration = audio.duration;
        }
    }
    
    // Start sync based on audio duration
    startSyncLoop();
    
    // Set up visibility change listener to pause audio when tab is hidden
    setupVisibilityListener();
    
    // Fade out overlay
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(function() { 
            overlay.style.display = 'none';
        }, 500);
    }
}

function setupVisibilityListener() {
    const audio = document.getElementById('backgroundsong');
    const gif = document.querySelector('.background');
    
    // Handle page visibility changes (user switches tabs or apps)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page is hidden (user switched tabs or apps)
            wasHidden = true;
            
            // Pause audio
            if (audio && !audio.paused) {
                audio.pause();
                console.log('Audio paused - page hidden');
            }
            
            // Hide GIF
            if (gif) {
                gif.style.display = 'none';
                console.log('GIF hidden - page hidden');
            }
        } else {
            // Page is visible again (user came back)
            if (wasHidden) {
                // RELOOP both when coming back
                console.log('Page visible again - relooping both');
                
                // Reloop audio from start
                if (audio) {
                    audio.currentTime = 0;
                    audio.muted = false;
                    audio.play().catch(e => console.log('Autoplay prevented'));
                    console.log('Audio relooped - page visible');
                }
                
                // Reloop GIF from start
                if (gif) {
                    const currentSrc = gif.src;
                    gif.src = '';
                    gif.src = currentSrc;
                    gif.style.display = 'block';
                    console.log('GIF relooped - page visible');
                }
                
                wasHidden = false;
            }
        }
    });
    
    // Also handle page unload (user closes tab or navigates away)
    window.addEventListener('beforeunload', function() {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            console.log('Audio stopped - page unloading');
        }
        if (gif) {
            gif.style.display = 'none';
        }
    });
    
    // For Safari on iOS specifically - handle pagehide event
    window.addEventListener('pagehide', function() {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            console.log('Audio stopped - page hiding');
        }
        if (gif) {
            gif.style.display = 'none';
        }
    });
    
    // Also handle focus/blur for additional reliability
    window.addEventListener('blur', function() {
        if (audio && !audio.paused) {
            audio.pause();
            console.log('Audio paused - window lost focus');
        }
        if (gif) {
            gif.style.display = 'none';
        }
    });
    
    window.addEventListener('focus', function() {
        if (!document.hidden) {
            // Reloop both when window gains focus
            console.log('Window gained focus - relooping both');
            
            // Reloop audio from start
            if (audio) {
                audio.currentTime = 0;
                audio.muted = false;
                audio.play().catch(e => console.log('Autoplay prevented'));
                console.log('Audio relooped - window focus');
            }
            
            // Reloop GIF from start
            if (gif && gif.style.display === 'none') {
                const currentSrc = gif.src;
                gif.src = '';
                gif.src = currentSrc;
                gif.style.display = 'block';
                console.log('GIF relooped - window focus');
            }
        }
    });
}

function startSyncLoop() {
    const gif = document.querySelector('.background');
    const audio = document.getElementById('backgroundsong');
    
    if (!audio || !gif) return;
    
    // Get audio duration
    if (!audioDuration && audio.duration) {
        audioDuration = audio.duration;
    }
    
    // If we don't have duration yet, wait for it
    if (!audioDuration || audioDuration === Infinity) {
        audio.addEventListener('loadedmetadata', function() {
            audioDuration = audio.duration;
            if (audioDuration && audioDuration !== Infinity) {
                performSync();
            }
        });
        return;
    }
    
    performSync();
}

function performSync() {
    const gif = document.querySelector('.background');
    const audio = document.getElementById('backgroundsong');
    
    if (!gif || !audio || !audioDuration) return;
    
    // Sync when audio reaches the end (loops)
    audio.addEventListener('timeupdate', function() {
        // Check if audio is near the end (within 0.1 seconds)
        if (audio.duration && audio.currentTime >= audio.duration - 0.1) {
            // Prepare to restart GIF when audio loops
            if (!isSynced) {
                isSynced = true;
            }
        }
    });
    
    // When audio actually loops or ends
    audio.addEventListener('ended', function() {
        // Restart GIF when audio ends/loops
        restartGif();
        isSynced = false;
    });
    
    // For browsers that handle loop differently
    audio.addEventListener('seeked', function() {
        // If audio was reset to beginning (looped)
        if (audio.currentTime < 0.5) {
            restartGif();
            isSynced = false;
        }
    });
    
    // Also use a more reliable method - check every 100ms
    let lastTime = 0;
    setInterval(() => {
        if (audio && audio.duration && audioDuration) {
            // If audio is playing and we detected a loop
            if (audio.currentTime < lastTime && audio.currentTime < 1) {
                // Audio looped back to start
                restartGif();
                isSynced = false;
            }
            lastTime = audio.currentTime;
        }
    }, 100);
}

function restartGif() {
    const gif = document.querySelector('.background');
    if (gif) {
        const currentSrc = gif.src;
        gif.src = '';
        gif.src = currentSrc;
    }
}

// Your existing functions remain unchanged
function copyAddress(id) {
    const svgElement = document.getElementById(id + 'Input');
    const title = svgElement.getAttribute('title');

    navigator.clipboard.writeText(title).then(() => {
        alert('copied the discord to clipboard: @' + title);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function removeOverlay() {
    handleOverlayClick();
}

function toggleMusic() {
    var mutebtn = document.getElementById("mutetext");
    if (mutebtn.innerHTML == "off") mutebtn.innerHTML = "on";
    else mutebtn.innerHTML = "off";
    
    var audio = document.getElementById('backgroundsong');
    audio.muted = !audio.muted;
}

// Modified DOMContentLoaded event
document.addEventListener("DOMContentLoaded", () => {
    // Hide GIF and main content initially
    const gif = document.querySelector('.background');
    const mainContent = document.getElementById('user-page');
    const audio = document.getElementById('backgroundsong');
    
    if (gif) {
        gif.style.display = 'none';
    }
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    // Set audio to loop from the start
    if (audio) {
        audio.loop = true;
        audio.currentTime = 0;
        
        // Get audio duration
        audio.addEventListener('loadedmetadata', function() {
            audioDuration = audio.duration;
            console.log('Audio duration:', audioDuration, 'seconds');
        });
    }
    
    // Your existing typewriter code
    const prefix = "⠐ ";
    const titleText = "decal";
    let index = 0;
    let isDeleting = false;

    function typeWriter() {
        document.title = prefix + titleText.substring(0, index);

        if (!isDeleting && index < titleText.length) {
            index++;
            setTimeout(typeWriter, 200);
        } else if (isDeleting && index > 0) {
            index--;
            setTimeout(typeWriter, 200);
        } else {
            isDeleting = !isDeleting;
            setTimeout(typeWriter, 1000);
        }
    }

    typeWriter();
});