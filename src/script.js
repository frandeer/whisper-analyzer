// Global variables for professional subtitle viewer
let audioPlayer;
let conversationData = [];
let currentTypingTimeout = null;
let filesLoaded = false;
let speakerNames = {
    1: '인간',
    2: 'AI'
};
let currentActiveSlide = null;
let previousActiveSlide = null;
let globalAnimationId = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Simulate loading
    setTimeout(() => {
        document.getElementById('loadingScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 600);
    }, 1500);

    // Initialize core components
    initializeApp();
    setupEventListeners();
    
    // Auto-load default files
    setTimeout(() => {
        loadDefaultFiles();
    }, 2000);

    console.log('🎬 Professional AI Podcast Viewer initialized');
});

function initializeApp() {
    audioPlayer = document.createElement('audio');
    audioPlayer.addEventListener('timeupdate', updateCinematicSubtitles);
    audioPlayer.addEventListener('loadedmetadata', updateTimeDisplay);
    audioPlayer.addEventListener('ended', handleAudioEnd);
    document.body.appendChild(audioPlayer);
}

function setupEventListeners() {
    // Settings panel toggle
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsPanel = document.getElementById('settingsPanel');
    
    settingsToggle.addEventListener('click', function() {
        settingsPanel.classList.toggle('expanded');
    });

    // File input handlers
    const audioFileInput = document.getElementById('audioFile');
    const jsonFileInput = document.getElementById('jsonFile');
    const loadFilesBtn = document.getElementById('loadFilesBtn');
    const loadDefaultBtn = document.getElementById('loadDefaultBtn');
    const resetBtn = document.getElementById('resetBtn');

    audioFileInput.addEventListener('change', handleFileSelect);
    jsonFileInput.addEventListener('change', handleFileSelect);
    loadFilesBtn.addEventListener('click', loadCustomFiles);
    loadDefaultBtn.addEventListener('click', loadDefaultFiles);
    resetBtn.addEventListener('click', resetApplication);

    // Speaker name inputs
    const speaker1Input = document.getElementById('speaker1Name');
    const speaker2Input = document.getElementById('speaker2Name');
    
    speaker1Input.addEventListener('input', (e) => {
        speakerNames[1] = e.target.value;
        updateActiveSpeakerLabels();
    });
    
    speaker2Input.addEventListener('input', (e) => {
        speakerNames[2] = e.target.value;
        updateActiveSpeakerLabels();
    });

    // Audio control event listeners
    setupAudioControls();
    
    // Show initial empty status
    showEmptyStatus();
}

function setupAudioControls() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = document.getElementById('playPauseIcon');
    const skipBackBtn = document.getElementById('skipBackBtn');
    const skipForwardBtn = document.getElementById('skipForwardBtn');
    const timelineSlider = document.getElementById('timelineSlider');
    const speedSelector = document.getElementById('speedSelector');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');

    // Play/Pause functionality
    playPauseBtn.addEventListener('click', () => {
        if (!filesLoaded) {
            showStatusMessage(
                '콘텐츠 없음', 
                'fas fa-exclamation-triangle',
                '먼저 오디오 파일을 로드해주세요'
            );
            return;
        }

        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseIcon.className = 'fas fa-pause';
        } else {
            audioPlayer.pause();
            playPauseIcon.className = 'fas fa-play';
        }
    });

    // Skip controls
    skipBackBtn.addEventListener('click', () => {
        if (filesLoaded) {
            audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
        }
    });

    skipForwardBtn.addEventListener('click', () => {
        if (filesLoaded) {
            audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 10);
        }
    });

    // Timeline scrubbing
    timelineSlider.addEventListener('input', (e) => {
        if (filesLoaded && audioPlayer.duration) {
            const newTime = (e.target.value / 100) * audioPlayer.duration;
            audioPlayer.currentTime = newTime;
        }
    });

    // Playback speed
    speedSelector.addEventListener('change', (e) => {
        if (filesLoaded) {
            audioPlayer.playbackRate = parseFloat(e.target.value);
        }
    });

    // Volume control
    volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        audioPlayer.volume = volume;
        updateVolumeIcon(volume);
    });

    // Audio event listeners
    audioPlayer.addEventListener('play', () => {
        playPauseIcon.className = 'fas fa-pause';
        hideStatusMessage(); // 재생 시작하면 상태 메시지 숨김
    });

    audioPlayer.addEventListener('pause', () => {
        playPauseIcon.className = 'fas fa-play';
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
        initializeWaveform();
        updateTimeDisplay();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (!filesLoaded) return;

        switch(e.code) {
            case 'Space':
                e.preventDefault();
                playPauseBtn.click();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                skipBackBtn.click();
                break;
            case 'ArrowRight':
                e.preventDefault();
                skipForwardBtn.click();
                break;
        }
    });
}

function updateVolumeIcon(volume) {
    const volumeIcon = document.getElementById('volumeIcon');
    
    if (volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

function initializeWaveform() {
    const canvas = document.getElementById('waveformCanvas');
    const ctx = canvas.getContext('2d');
    
    // Show loading animation first
    showWaveformLoading();
    
    // Simple waveform visualization - in a real app, you'd analyze the audio
    setTimeout(() => {
        drawStaticWaveform(ctx, canvas);
    }, 1000);
}

function showWaveformLoading() {
    const canvas = document.getElementById('waveformCanvas');
    const container = canvas.parentElement;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'waveform-loading';
    loadingDiv.innerHTML = `
        <div class="waveform-loading-bar"></div>
        <div class="waveform-loading-bar"></div>
        <div class="waveform-loading-bar"></div>
        <div class="waveform-loading-bar"></div>
        <div class="waveform-loading-bar"></div>
    `;
    
    canvas.style.display = 'none';
    container.appendChild(loadingDiv);
    
    setTimeout(() => {
        container.removeChild(loadingDiv);
        canvas.style.display = 'block';
    }, 1000);
}

function drawStaticWaveform(ctx, canvas) {
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, getComputedStyle(document.documentElement).getPropertyValue('--speaker1-primary'));
    gradient.addColorStop(1, getComputedStyle(document.documentElement).getPropertyValue('--speaker2-primary'));
    
    ctx.fillStyle = gradient;
    
    // Draw pseudo-waveform
    const barCount = 50;
    const barWidth = width / barCount;
    
    for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const normalizedHeight = Math.random() * 0.8 + 0.2; // Random between 0.2 and 1
        const barHeight = height * normalizedHeight;
        const y = (height - barHeight) / 2;
        
        ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const label = event.target.closest('.file-input-label');
    const textSpan = label.querySelector('.file-input-text');
    
    textSpan.textContent = file.name;
    label.classList.add('has-file');
}

async function loadCustomFiles() {
    const audioFile = document.getElementById('audioFile').files[0];
    const jsonFile = document.getElementById('jsonFile').files[0];
    
    if (!audioFile || !jsonFile) {
        showStatusMessage(
            '파일 선택 필요', 
            'fas fa-exclamation-triangle',
            '오디오 파일과 JSON 파일을 모두 선택해주세요'
        );
        return;
    }

    try {
        showLoadingStatus();
        
        // Load JSON data
        const jsonText = await jsonFile.text();
        conversationData = JSON.parse(jsonText);
        
        // Prepare conversation data for cinematic display
        prepareConversationData();
        
        // Load audio
        const audioURL = URL.createObjectURL(audioFile);
        audioPlayer.src = audioURL;
        
        filesLoaded = true;
        showReadyStatus();
        
        console.log('🎬 Custom files loaded successfully');
        
    } catch (error) {
        console.error('File loading error:', error);
        showStatusMessage(
            '로드 실패', 
            'fas fa-times',
            '파일을 불러오는 중 오류가 발생했습니다'
        );
    }
}

async function loadDefaultFiles() {
    try {
        showLoadingStatus();
        
        // Load default JSON
        const jsonResponse = await fetch('whisper-analysis.json');
        if (jsonResponse.ok) {
            conversationData = await jsonResponse.json();
        } else {
            throw new Error('Default JSON not found');
        }
        
        // Load default audio
        const audioResponse = await fetch('audio.wav');
        if (audioResponse.ok) {
            const audioBlob = await audioResponse.blob();
            const audioURL = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioURL;
        } else {
            throw new Error('Default audio not found');
        }
        
        // Prepare data
        prepareConversationData();
        filesLoaded = true;
        showReadyStatus();
        
        console.log('🎬 Default files loaded successfully');
        
    } catch (error) {
        console.log('Default files not available, manual upload required');
        showEmptyStatus();
    }
}

function prepareConversationData() {
    // Sort all segments by time and group by speaker changes
    const allSegments = [];
    
    conversationData.forEach((conversation) => {
        conversation.segments.forEach(segment => {
            allSegments.push({
                ...segment,
                speaker: conversation.speaker
            });
        });
    });
    
    // Sort by start time
    allSegments.sort((a, b) => a.startTime - b.startTime);
    
    // Group consecutive segments by same speaker
    const groupedSegments = [];
    let currentGroup = null;
    
    allSegments.forEach(segment => {
        if (!currentGroup || currentGroup.speaker !== segment.speaker || 
            (segment.startTime - currentGroup.endTime > 2)) {
            
            if (currentGroup) {
                groupedSegments.push(currentGroup);
            }
            
            currentGroup = {
                speaker: segment.speaker,
                segments: [segment],
                startTime: segment.startTime,
                endTime: segment.endTime,
                fullText: segment.text
            };
        } else {
            currentGroup.segments.push(segment);
            currentGroup.endTime = segment.endTime;
            currentGroup.fullText += ' ' + segment.text;
        }
    });
    
    if (currentGroup) {
        groupedSegments.push(currentGroup);
    }
    
    // Store prepared data globally
    window.cinematicGroups = groupedSegments;
    window.currentGroupIndex = -1;
    
    console.log('🎭 Conversation data prepared for cinematic display:', groupedSegments.length, 'groups');
    
    // Debug: 화자별 그룹 확인
    groupedSegments.forEach((group, index) => {
        console.log(`Group ${index}: Speaker ${group.speaker}, ${group.startTime}s-${group.endTime}s, "${group.fullText.substring(0, 50)}..."`);
    });
}

function updateCinematicSubtitles() {
    if (!filesLoaded || !window.cinematicGroups) return;
    
    const currentTime = audioPlayer.currentTime;
    
    // Update time display and progress
    updateTimeDisplay();
    
    // Find active group with improved gap handling
    let activeGroupIndex = -1;
    let nextGroupIndex = -1;
    let nextGroupStartTime = Infinity;
    
    for (let i = 0; i < window.cinematicGroups.length; i++) {
        const group = window.cinematicGroups[i];
        
        // Check if currently in this group (with 0.1s buffer)
        if (currentTime >= (group.startTime - 0.1) && currentTime <= (group.endTime + 0.1)) {
            activeGroupIndex = i;
            break;
        }
        
        // Find next upcoming group
        if (group.startTime > currentTime && group.startTime < nextGroupStartTime) {
            nextGroupIndex = i;
            nextGroupStartTime = group.startTime;
        }
    }
    
    // Gap handling: if no active group but next group starts within 3 seconds, maintain current
    let shouldKeepCurrent = false;
    if (activeGroupIndex === -1 && nextGroupIndex !== -1) {
        const timeToNext = nextGroupStartTime - currentTime;
        if (timeToNext <= 3.0 && window.currentGroupIndex !== -1) {
            console.log(`⏳ Gap detected: ${timeToNext.toFixed(1)}s until next group. Maintaining current.`);
            shouldKeepCurrent = true;
            activeGroupIndex = window.currentGroupIndex; // Keep current group
        }
    }
    
    // Enhanced debug logging
    if (activeGroupIndex !== window.currentGroupIndex && !shouldKeepCurrent) {
        console.log(`🎬 Time: ${currentTime.toFixed(1)}s, Active Group: ${activeGroupIndex}`);
        if (activeGroupIndex !== -1) {
            const group = window.cinematicGroups[activeGroupIndex];
            console.log(`   ▶️ Speaker ${group.speaker}: ${group.startTime}s-${group.endTime}s "${group.fullText.substring(0, 50)}..."`);
        } else {
            console.log(`   ⏸️ No active group, next starts at ${nextGroupStartTime.toFixed(1)}s`);
        }
    }
    
    // Handle group change (only if actually changing and not maintaining)
    if (activeGroupIndex !== window.currentGroupIndex && !shouldKeepCurrent) {
        if (activeGroupIndex !== -1) {
            // Double-check: only transition if we haven't already shown this group
            if (!currentActiveSlide || !currentActiveSlide.classList.contains(`speaker${window.cinematicGroups[activeGroupIndex].speaker}`)) {
                console.log(`🔄 Transitioning to group ${activeGroupIndex}`);
                transitionToGroup(activeGroupIndex, currentTime);
            }
        } else {
            // Only clear if next group is far away
            if (nextGroupStartTime - currentTime > 3.0) {
                console.log(`🧹 Clearing display (next group ${nextGroupStartTime - currentTime}s away)`);
                clearSubtitleDisplay();
            }
        }
        window.currentGroupIndex = activeGroupIndex;
    }
    
    // Update typing animation for current group
    if (activeGroupIndex !== -1) {
        updateGroupTypingAnimation(activeGroupIndex, currentTime);
    }
}

function transitionToGroup(groupIndex, currentTime) {
    const group = window.cinematicGroups[groupIndex];
    const subtitleContainer = document.getElementById('subtitleContainer');
    
    console.log(`🎬 Starting transition to group ${groupIndex} (Speaker ${group.speaker})`);
    
    // Prevent duplicate transitions
    if (currentActiveSlide && currentActiveSlide.dataset.groupIndex == groupIndex) {
        console.log(`   ⚠️ Already showing group ${groupIndex}, skipping transition`);
        return;
    }
    
    // Clear previous content
    const currentSlide = document.getElementById('currentSlide');
    const previousSlide = document.getElementById('previousSlide');
    
    // Move current to previous (if exists)
    if (currentActiveSlide) {
        console.log(`   📤 Moving previous slide content`);
        previousSlide.innerHTML = currentActiveSlide.innerHTML;
        const prevBubble = previousSlide.querySelector('.speaker-bubble');
        if (prevBubble) {
            prevBubble.classList.add('fade-out');
            prevBubble.classList.remove('active');
        }
    }
    
    // Create new subtitle bubble
    console.log(`   🎭 Creating new bubble for Speaker ${group.speaker}`);
    const speakerBubble = createCinematicSpeakerBubble(group);
    speakerBubble.dataset.groupIndex = groupIndex; // Track which group this is
    
    currentSlide.innerHTML = '';
    currentSlide.appendChild(speakerBubble);
    
    // Force immediate display with all necessary CSS properties
    speakerBubble.style.opacity = '1';
    speakerBubble.style.visibility = 'visible';
    speakerBubble.style.display = 'block';
    speakerBubble.style.transform = 'translateY(0) scale(1)';
    
    // Add active class immediately
    speakerBubble.classList.add('active');
    
    // Ensure the bubble is properly styled for its speaker
    if (group.speaker === 2) {
        console.log(`   🎨 Applying Speaker 2 styles`);
        speakerBubble.style.marginLeft = 'auto';
    }
    
    currentActiveSlide = speakerBubble;
    
    console.log(`   ✅ Transition completed for Speaker ${group.speaker}`);
    console.log(`   🎯 Current slide has ${currentSlide.children.length} children`);
    console.log(`   🔍 Bubble classes: ${speakerBubble.className}`);
}

function createCinematicSpeakerBubble(group) {
    console.log(`🎭 Creating bubble for Speaker ${group.speaker}: "${group.fullText.substring(0, 30)}..."`);
    
    const bubble = document.createElement('div');
    bubble.className = `speaker-bubble speaker${group.speaker}`;
    
    // Debug: 클래스 적용 확인
    console.log(`   📝 Bubble classes: ${bubble.className}`);
    
    // Speaker label
    const label = document.createElement('div');
    label.className = 'speaker-label';
    label.textContent = speakerNames[group.speaker] || `Speaker ${group.speaker}`;
    bubble.appendChild(label);
    
    // Message content container
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Typing text element
    const typingText = document.createElement('span');
    typingText.className = 'typing-text';
    typingText.textContent = '';
    typingText.dataset.fullText = group.fullText;
    typingText.dataset.segments = JSON.stringify(group.segments);
    
    messageContent.appendChild(typingText);
    bubble.appendChild(messageContent);
    
    // Debug: 완성된 bubble 구조 확인
    console.log(`   ✅ Bubble created with ${bubble.children.length} children`);
    
    return bubble;
}

function updateGroupTypingAnimation(groupIndex, currentTime) {
    const group = window.cinematicGroups[groupIndex];
    const typingElement = document.querySelector('#currentSlide .typing-text');
    
    if (!typingElement) return;
    
    // Find current segment
    const currentSegment = group.segments.find(seg => 
        currentTime >= seg.startTime && currentTime <= seg.endTime
    );
    
    if (currentSegment) {
        // Calculate typing progress within current segment
        const segmentProgress = (currentTime - currentSegment.startTime) / 
                             (currentSegment.endTime - currentSegment.startTime);
        
        // Calculate overall progress considering all previous completed segments
        let completedText = '';
        let currentSegmentIndex = group.segments.indexOf(currentSegment);
        
        // Add all completed segments
        for (let i = 0; i < currentSegmentIndex; i++) {
            completedText += group.segments[i].text + ' ';
        }
        
        // Add partial current segment
        const currentSegmentText = currentSegment.text;
        const typedLength = Math.floor(currentSegmentText.length * Math.min(1, segmentProgress));
        const typedCurrentText = currentSegmentText.substring(0, typedLength);
        
        // Create cinematic typing effect
        const displayText = completedText + typedCurrentText;
        
        // Apply character-by-character animation
        applyCinematicTyping(typingElement, displayText, typedLength < currentSegmentText.length);
    }
}

function applyCinematicTyping(element, text, showCursor) {
    // Clear any existing animation
    if (globalAnimationId) {
        cancelAnimationFrame(globalAnimationId);
    }
    
    // Get current content to avoid re-animating existing characters
    const currentText = element.textContent || '';
    
    // Only animate new characters that were added
    if (text.length <= currentText.length) {
        // Text is getting shorter or same, just update
        element.textContent = text;
        if (showCursor) {
            element.innerHTML = text + '<span class="typing-cursor"></span>';
        }
        return;
    }
    
    // Text is getting longer - animate new characters only
    const newCharsStartIndex = currentText.length;
    const newChars = text.slice(newCharsStartIndex);
    
    // Build HTML with existing text + new animated characters
    let htmlContent = currentText; // Existing text without animation
    
    Array.from(newChars).forEach((char, index) => {
        if (char === ' ') {
            htmlContent += ' ';
        } else {
            const delay = index * 80; // Faster for smoother flow
            htmlContent += `<span class="char-animate">${char}</span>`;
        }
    });
    
    // Add blinking cursor if still typing
    if (showCursor) {
        htmlContent += '<span class="typing-cursor"></span>';
    }
    
    element.innerHTML = htmlContent;
    
    // No animation needed - just display the characters
}

function clearSubtitleDisplay(force = false) {
    console.log(`🧹 Clearing subtitle display (force: ${force})`);
    
    const currentSlide = document.getElementById('currentSlide');
    const previousSlide = document.getElementById('previousSlide');
    
    if (currentActiveSlide) {
        console.log(`   🚫 Fading out current active slide`);
        currentActiveSlide.classList.add('fade-out');
        currentActiveSlide.classList.remove('active');
        
        if (force) {
            // Immediate clear for forced clearing
            currentSlide.innerHTML = '';
            previousSlide.innerHTML = '';
            currentActiveSlide = null;
            console.log(`   ✅ Slides cleared immediately`);
        } else {
            // Delayed clear for normal clearing
            setTimeout(() => {
                currentSlide.innerHTML = '';
                previousSlide.innerHTML = '';
                currentActiveSlide = null;
                console.log(`   ✅ Slides cleared after delay`);
            }, 600);
        }
    } else {
        // 즉시 클리어
        currentSlide.innerHTML = '';
        previousSlide.innerHTML = '';
        currentActiveSlide = null;
    }
}

function updateActiveSpeakerLabels() {
    const activeLabels = document.querySelectorAll('.speaker-label');
    activeLabels.forEach(label => {
        const bubble = label.closest('.speaker-bubble');
        if (bubble.classList.contains('speaker1')) {
            label.textContent = speakerNames[1];
        } else if (bubble.classList.contains('speaker2')) {
            label.textContent = speakerNames[2];
        }
    });
}

function showStatusMessage(message, iconClass, subtitle = null) {
    const statusMessage = document.getElementById('statusMessage');
    const statusIcon = statusMessage.querySelector('.status-icon i');
    const statusTitle = statusMessage.querySelector('.status-title');
    const statusSubtitle = statusMessage.querySelector('.status-subtitle');
    
    statusIcon.className = iconClass;
    statusTitle.textContent = message;
    
    if (subtitle) {
        statusSubtitle.textContent = subtitle;
    }
    
    statusMessage.style.display = 'block';
}

function showReadyStatus() {
    showStatusMessage(
        '재생 준비 완료', 
        'fas fa-play-circle',
        '아래 재생 버튼을 눌러 AI 팟캐스트를 시작하세요'
    );
}

function showLoadingStatus() {
    showStatusMessage(
        '콘텐츠 로딩 중...', 
        'fas fa-spinner fa-spin',
        '잠시만 기다려주세요'
    );
}

function showEmptyStatus() {
    showStatusMessage(
        '오디오 대기 중', 
        'fas fa-headphones',
        '설정에서 파일을 업로드하거나 기본 콘텐츠를 로드하세요'
    );
}

function hideStatusMessage() {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.style.display = 'none';
}

function updateTimeDisplay() {
    if (!filesLoaded || !audioPlayer) return;
    
    const current = audioPlayer.currentTime || 0;
    const duration = audioPlayer.duration || 0;
    
    // Update time displays
    document.getElementById('currentTime').textContent = formatTime(current);
    document.getElementById('totalTime').textContent = formatTime(duration);
    
    // Update timeline progress
    if (duration > 0) {
        const progress = (current / duration) * 100;
        document.getElementById('timelineProgress').style.width = `${progress}%`;
        document.getElementById('timelineSlider').value = progress;
        
        // Update waveform progress indicator
        const progressIndicator = document.getElementById('progressIndicator');
        if (progressIndicator) {
            progressIndicator.style.left = `${progress}%`;
        }
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function handleAudioEnd() {
    // Clear all active subtitles
    clearSubtitleDisplay();
    window.currentGroupIndex = -1;
    
    // Show completion message
    showStatusMessage(
        '재생 완료', 
        'fas fa-check-circle',
        '팟캐스트가 끝났습니다. 다시 재생하려면 재생 버튼을 눌러주세요'
    );
    
    console.log('🎬 Audio playback completed');
}

function resetApplication() {
    // Stop audio
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }
    
    // Clear data
    conversationData = [];
    window.cinematicGroups = [];
    window.currentGroupIndex = -1;
    filesLoaded = false;
    
    // Clear UI (force immediate clear)
    clearSubtitleDisplay(true);
    
    // Reset file inputs
    document.getElementById('audioFile').value = '';
    document.getElementById('jsonFile').value = '';
    
    // Reset file labels
    document.querySelectorAll('.file-input-label').forEach(label => {
        label.classList.remove('has-file');
        const textSpan = label.querySelector('.file-input-text');
        textSpan.textContent = textSpan.dataset.default;
    });
    
    // Reset speaker names
    document.getElementById('speaker1Name').value = '인간';
    document.getElementById('speaker2Name').value = 'AI';
    speakerNames = { 1: '인간', 2: 'AI' };
    
    // Show reset status
    showStatusMessage(
        '초기화 완료', 
        'fas fa-redo',
        '애플리케이션이 초기화되었습니다. 새로운 콘텐츠를 로드해주세요'
    );
    
    console.log('🔄 Application reset completed');
} 