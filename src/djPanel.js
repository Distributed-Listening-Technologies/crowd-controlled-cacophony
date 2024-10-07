class DJPanel {
    constructor(audioEngine, governanceModel, userInterface) {
        console.log('DJPanel constructor called');
        this.audioEngine = audioEngine;
        this.governanceModel = governanceModel;
        this.userInterface = userInterface;
        this.render(); // Call render in the constructor

        this.audioEngine.onProgressUpdate = (currentTime, duration) => {
            this.userInterface.updatePlaybackProgress(currentTime, duration);
        };

        this.audioEngine.onPlaybackEnded = () => {
            document.getElementById('play-button').textContent = 'Play';
            this.userInterface.hideControls();
        };
    }

    render() {
        console.log('DJPanel render method called');
        const djPanelElement = document.getElementById('dj-panel');
        if (!djPanelElement) {
            console.error('DJ panel element not found');
            return;
        }

        djPanelElement.innerHTML = ''; // Clear existing content
        this.createTrackSelector();
        this.createPlayButton();
        this.createGovernanceModelSelector();
        this.createMonitoringDisplay();
        console.log('DJ panel rendered');
    }

    initializeControls() {
        this.createTrackSelector();
        this.createPlayButton();
        this.createGovernanceModelSelector();
        this.createMonitoringDisplay();
    }

    createTrackSelector() {
        const trackSelector = document.createElement('select');
        trackSelector.id = 'track-selector';

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Select track";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        trackSelector.appendChild(defaultOption);

        const tracks = ['Track 1', 'Track 2', 'Track 3']; // Example tracks
        tracks.forEach((track, index) => {
            const option = document.createElement('option');
            option.value = `tracks/track${index + 1}.mp3`;
            option.textContent = track;
            trackSelector.appendChild(option);
        });

        trackSelector.addEventListener('change', (e) => this.selectAndLoadTrack(e.target.value));
        document.getElementById('dj-panel').appendChild(trackSelector);
    }

    createPlayButton() {
        const playButton = document.createElement('button');
        playButton.textContent = 'Play';
        playButton.id = 'play-button';
        playButton.disabled = true; // Disable initially
        playButton.addEventListener('click', () => this.togglePlay());
        document.getElementById('dj-panel').appendChild(playButton);
    }

    createGovernanceModelSelector() {
        const modelSelector = document.createElement('select');
        modelSelector.id = 'governance-model-selector';

        const models = ['anarchy', 'democracy', 'liquidDemocracy', 'sociocracy'];
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model.charAt(0).toUpperCase() + model.slice(1);
            modelSelector.appendChild(option);
        });

        modelSelector.addEventListener('change', (e) => this.selectGovernanceModel(e.target.value));
        document.getElementById('dj-panel').appendChild(modelSelector);
    }

    createMonitoringDisplay() {
        const monitoringDisplay = document.createElement('div');
        monitoringDisplay.id = 'monitoring-display';
        document.getElementById('dj-panel').appendChild(monitoringDisplay);
    }

    async selectAndLoadTrack(trackUrl) {
        if (!trackUrl) {
            console.log('No track selected');
            document.getElementById('play-button').disabled = true;
            return;
        }

        try {
            await this.audioEngine.loadTrack(trackUrl);
            console.log('Track loaded successfully');
            document.getElementById('play-button').disabled = false; // Enable play button
        } catch (error) {
            console.error('Error loading track:', error);
            document.getElementById('play-button').disabled = true;
        }
    }

    togglePlay() {
        if (this.audioEngine.isPlaying()) {
            this.audioEngine.stop();
            document.getElementById('play-button').textContent = 'Play';
            this.userInterface.hideControls();
        } else {
            this.governanceModel.resetState(); // Reset governance model state
            this.audioEngine.resetEffects(); // Reset audio engine effects
            this.audioEngine.play();
            document.getElementById('play-button').textContent = 'Stop';
            this.userInterface.showControls();
            this.userInterface.updateAllDisplays(); // Update UI to reflect reset values
        }
    }

    selectGovernanceModel(model) {
        this.governanceModel.setModel(model);
    }

    updateMonitoringDisplay(inputs) {
        const monitoringDisplay = document.getElementById('monitoring-display');
        monitoringDisplay.innerHTML = Object.entries(inputs)
            .map(([parameter, value]) => `<div>${parameter}: ${value.toFixed(2)}</div>`)
            .join('');
    }
}