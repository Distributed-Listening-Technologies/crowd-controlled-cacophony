class UserInterface {
    constructor(audioEngine, governanceModel) {
        this.audioEngine = audioEngine;
        this.governanceModel = governanceModel;
        this.parameters = ['playbackRate', 'pitchShift', 'eqLow', 'eqMid', 'eqHigh', 'reverb'];
        this.initializeUIElements();
        this.hideControls(); // Hide controls initially
    }

    initializeUIElements() {
        this.parameters.forEach(param => {
            const element = document.querySelector(`#user-controls .parameter:has(label[for="${param}"])`);
            const increaseBtn = element.querySelector('.increase');
            const decreaseBtn = element.querySelector('.decrease');

            const incrementSize = this.audioEngine.getIncrementSize(param);
            increaseBtn.addEventListener('click', () => this.handleInput(param, incrementSize));
            decreaseBtn.addEventListener('click', () => this.handleInput(param, -incrementSize));
        });

        // Initialize playback progress bar and scrubber
        this.progressContainer = document.getElementById('progress-container');
        this.progressBar = document.getElementById('progress-bar');
        this.scrubber = document.createElement('div');
        this.scrubber.id = 'scrubber';
        this.progressContainer.appendChild(this.scrubber);
        this.currentTimeDisplay = document.getElementById('current-time');
        this.durationDisplay = document.getElementById('duration');
    }

    showControls() {
        const userControls = document.getElementById('user-controls');
        userControls.style.display = 'block';
        setTimeout(() => {
            userControls.classList.add('visible');
        }, 10);
    }

    hideControls() {
        const userControls = document.getElementById('user-controls');
        userControls.classList.remove('visible');
        setTimeout(() => {
            userControls.style.display = 'none';
        }, 300); // This should match the transition duration in CSS
    }

    enableControls() {
        this.parameters.forEach(param => {
            const element = document.querySelector(`#user-controls .parameter:has(#${param}-value)`);
            const increaseBtn = element.querySelector('.increase');
            const decreaseBtn = element.querySelector('.decrease');

            increaseBtn.disabled = false;
            decreaseBtn.disabled = false;
        });
    }

    handleInput(parameter, change) {
        const currentValue = this.governanceModel.getCurrentValue(parameter);
        let newValue;

        if (parameter === 'reverb') {
            // Handle reverb separately to allow for decrementing below 0.30
            newValue = Math.max(0, Math.min(1, parseFloat((currentValue + change).toFixed(2))));
        } else if (parameter === 'playbackRate' || parameter === 'pitchShift') {
            newValue = parseFloat((currentValue + change).toFixed(1));
        } else {
            newValue = Math.max(0, parseFloat((currentValue + change).toFixed(1)));
        }

        const processedValue = this.governanceModel.processInput(parameter, newValue);

        if (processedValue !== undefined) {
            this.audioEngine.applyEffect(parameter, processedValue);
            this.updateAggregateDisplay();
            this.visualizeGovernance(parameter, newValue, processedValue);
            sendCrowdInput(parameter, newValue);
        }
    }

    updateAggregateDisplay() {
        const aggregateState = this.governanceModel.getAggregateState();
        const aggregateDisplay = document.getElementById('aggregate-display');
        aggregateDisplay.innerHTML = '';

        for (const [param, governanceValue] of Object.entries(aggregateState)) {
            const paramElement = document.createElement('div');
            const individualValue = this.audioEngine.effects[param];
            paramElement.textContent = `${param}: Individual ${individualValue.toFixed(2)} | Governance ${governanceValue.toFixed(2)}`;
            aggregateDisplay.appendChild(paramElement);
        }
    }

    visualizeGovernance(parameter, individualValue, governanceValue) {
        let visualizationContainer = document.getElementById('governance-visualization');
        if (!visualizationContainer) {
            visualizationContainer = document.createElement('div');
            visualizationContainer.id = 'governance-visualization';
            document.body.appendChild(visualizationContainer);
        }

        let paramVisualization = visualizationContainer.querySelector(`.param-visualization[data-param="${parameter}"]`);
        if (!paramVisualization) {
            paramVisualization = document.createElement('div');
            paramVisualization.className = 'param-visualization';
            paramVisualization.setAttribute('data-param', parameter);

            const header = document.createElement('h3');
            header.textContent = this.getParameterDisplayName(parameter);
            paramVisualization.appendChild(header);

            visualizationContainer.appendChild(paramVisualization);
        }

        const updateOrCreateBar = (className, value, label) => {
            let barContainer = paramVisualization.querySelector(`.value-bar-container.${className}`);
            if (!barContainer) {
                barContainer = document.createElement('div');
                barContainer.className = `value-bar-container ${className}`;

                const barLabel = document.createElement('div');
                barLabel.className = 'value-bar-label';
                barLabel.textContent = label;

                const barWrapper = document.createElement('div');
                barWrapper.className = 'value-bar-wrapper';

                const bar = document.createElement('div');
                bar.className = 'value-bar';

                barWrapper.appendChild(bar);
                barContainer.appendChild(barLabel);
                barContainer.appendChild(barWrapper);
                paramVisualization.appendChild(barContainer);
            }

            const bar = barContainer.querySelector('.value-bar');
            bar.style.width = `${this.normalizeValue(parameter, value) * 100}%`;
            bar.setAttribute('data-value', value.toFixed(2));
        };

        updateOrCreateBar('individual', individualValue, 'Individual');
        updateOrCreateBar('governance', governanceValue, 'Governance');
    }

    getParameterDisplayName(parameter) {
        const displayNames = {
            playbackRate: 'Tempo',
            pitchShift: 'Pitch',
            eqLow: 'EQ Low',
            eqMid: 'EQ Mid',
            eqHigh: 'EQ High',
            reverb: 'Reverb'
        };
        return displayNames[parameter] || parameter;
    }

    normalizeValue(parameter, value) {
        const ranges = {
            playbackRate: [0.1, 2],
            pitchShift: [-12, 12],
            eqLow: [0, 12],
            eqMid: [0, 12],
            eqHigh: [0, 12],
            reverb: [0, 1]
        };

        const [min, max] = ranges[parameter];
        return (value - min) / (max - min);
    }

    updatePlaybackProgress(currentTime, duration) {
        const progress = (currentTime / duration) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.scrubber.style.left = `${progress}%`;

        const adjustedDuration = duration / this.audioEngine.effects.playbackRate;

        this.currentTimeDisplay.textContent = this.formatTime(currentTime);
        this.durationDisplay.textContent = this.formatTime(adjustedDuration);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateAllDisplays() {
        const visualizationContainer = document.getElementById('governance-visualization');
        if (visualizationContainer) {
            visualizationContainer.innerHTML = ''; // Clear existing visualizations
        }

        const aggregateState = this.governanceModel.getAggregateState();
        for (const [param, value] of Object.entries(aggregateState)) {
            const individualValue = this.audioEngine.effects[param];
            this.visualizeGovernance(param, individualValue, value);
        }
        this.updateAggregateDisplay();
    }
}