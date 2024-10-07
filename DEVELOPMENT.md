# Crowd-Controlled Cacophony: MVP Developer Guide

## Overview
Crowd-Controlled Cacophony is a web-based interactive audio experience where users collectively influence music parameters across different sets, each with unique governance models. The DJ streams tracks, and users control various audio parameters in real-time.

## Core Components

1. Audio Engine (Tone.js)
2. User Interface
3. DJ Control Panel
4. Governance Models
5. Backend Server

## Detailed Specifications

### 1. Audio Engine (Tone.js)

The Audio Engine manages all audio-related functionality, including streaming tracks from the DJ. We use Tone.js version 15.0.4 for enhanced audio capabilities and easier manipulation of audio parameters.

Key features:
- Four adjustable parameters: Tempo/Speed, Pitch, EQ (Low, Mid, High), and Effects (e.g., Reverb)
- Smooth transitions between parameter states
- Track streaming capabilities

```javascript:src/audioEngine.js
class AudioEngine {
    constructor() {
        this.player = new Tone.Player().toDestination();
        this.pitchShift = new Tone.PitchShift().connect(this.player);
        this.eq = new Tone.EQ3().connect(this.pitchShift);
        this.reverb = new Tone.Reverb().connect(this.eq);
        
        // Initialize effects
        this.effects = {
            tempo: 1,
            pitch: 0,
            eq: {low: 0, mid: 0, high: 0},
            reverb: 0
        };
    }

    async connectToStream(streamUrl) {
        // Connect to the DJ's audio stream
        await Tone.start();
        this.player.load(streamUrl);
        this.player.start();
    }

    applyEffect(type, value) {
        switch(type) {
            case 'tempo':
                this.player.playbackRate = value;
                break;
            case 'pitch':
                this.pitchShift.pitch = value;
                break;
            case 'eq':
                this.eq.low.value = value.low;
                this.eq.mid.value = value.mid;
                this.eq.high.value = value.high;
                break;
            case 'reverb':
                this.reverb.wet.value = value;
                break;
        }
        this.effects[type] = value;
    }

    // Additional methods for parameter adjustments can be added here
}
```

### 2. User Interface

The User Interface provides an intuitive way for users to interact with the system.

Key features:
- Responsive design for mobile and desktop
- Intuitive controls for each parameter
- An incremental user interface for increasing and decressing the value of each parameter
- Visual display of 
  1. individual parameter states, and
  2. aggregate crowd input

```html:src/index.html
<div id="user-controls">
    <div class="parameter" id="playbackRate">
        <button class="decrease">-</button>
        <span class="value">0</span>
        <button class="increase">+</button>
    </div>
    <div class="parameter" id="pitchShift">
        <button class="decrease">-</button>
        <span class="value">0</span>
        <button class="increase">+</button>
    </div>
    <div class="parameter" id="eq">
        <button class="decrease">-</button>
        <span class="value">Low: 0, Mid: 0, High: 0</span>
        <button class="increase">+</button>
    </div>
    <div class="parameter" id="reverb">
        <button class="decrease">-</button>
        <span class="value">0</span>
        <button class="increase">+</button>
    </div>
</div>
```

```javascript:src/userInterface.js
class UserInterface {
    constructor(audioEngine, governanceModel) {
        this.audioEngine = audioEngine;
        this.governanceModel = governanceModel;
        this.parameters = ['playbackRate', 'pitchShift', 'eq', 'reverb'];
        this.initializeUIElements();
    }

    initializeUIElements() {
        this.parameters.forEach(param => {
            const element = document.getElementById(param);
            const increaseBtn = element.querySelector('.increase');
            const decreaseBtn = element.querySelector('.decrease');
            const valueDisplay = element.querySelector('.value');

            increaseBtn.addEventListener('click', () => this.handleInput(param, 0.1));
            decreaseBtn.addEventListener('click', () => this.handleInput(param, -0.1));
            
            // Initialize value displays
            valueDisplay.textContent = param === 'eq' ? 'Low: 0, Mid: 0, High: 0' : '0';
        });
    }

    handleInput(parameter, value) {
        // Pass the input to the governance model for processing
        const processedValue = this.governanceModel.processInput(parameter, value);
        
        // Apply the processed value to the audio engine
        switch(parameter) {
            case 'playbackRate':
                Tone.Transport.bpm.value = processedValue * 120; // Assuming 120 BPM as base
                break;
            case 'pitchShift':
                this.audioEngine.pitchShift.pitch = processedValue;
                break;
            case 'eq':
                this.audioEngine.eq.low.value = processedValue.low;
                this.audioEngine.eq.mid.value = processedValue.mid;
                this.audioEngine.eq.high.value = processedValue.high;
                break;
            case 'reverb':
                this.audioEngine.reverb.wet.value = processedValue;
                break;
        }
        
        // Update the display
        this.updateDisplay(parameter, processedValue);
    }

    updateDisplay(parameter, value) {
        const element = document.getElementById(parameter);
        const valueDisplay = element.querySelector('.value');
        if (parameter === 'eq') {
            valueDisplay.textContent = `Low: ${value.low.toFixed(2)}, Mid: ${value.mid.toFixed(2)}, High: ${value.high.toFixed(2)}`;
        } else {
            valueDisplay.textContent = value.toFixed(2);
        }

        // Update aggregate display
        this.updateAggregateDisplay();
    }

    updateAggregateDisplay() {
        // Get current state from governance model
        const aggregateState = this.governanceModel.getAggregateState();
        
        // Update the aggregate display element
        const aggregateDisplay = document.getElementById('aggregate-display');
        aggregateDisplay.innerHTML = '';
        
        for (const [param, value] of Object.entries(aggregateState)) {
            const paramElement = document.createElement('div');
            if (param === 'eq') {
                paramElement.textContent = `EQ: Low: ${value.low.toFixed(2)}, Mid: ${value.mid.toFixed(2)}, High: ${value.high.toFixed(2)}`;
            } else {
                paramElement.textContent = `${param}: ${value.toFixed(2)}`;
            }
            aggregateDisplay.appendChild(paramElement);
        }
    }
}
```

### 3. DJ Control Panel

The DJ Control Panel allows for fine-tuning of the experience and streaming tracks.

Key features:
- Track selection and streaming
- Setting of parameter ranges
- Governance model selection
- Real-time monitoring of crowd inputs

```javascript:src/djPanel.js
class DJPanel {
    constructor(toneTransport, governanceModel) {
        this.toneTransport = toneTransport;
        this.governanceModel = governanceModel;
        this.initializeControls();
    }

    initializeControls() {
        this.createTrackSelector();
        this.createParameterLimitControls();
        this.createGovernanceModelSelector();
        this.createMonitoringDisplay();
    }

    createTrackSelector() {
        const trackSelector = document.createElement('select');
        trackSelector.id = 'track-selector';
        
        const tracks = ['Track 1', 'Track 2', 'Track 3']; // Example tracks
        tracks.forEach((track, index) => {
            const option = document.createElement('option');
            option.value = `track${index + 1}`;
            option.textContent = track;
            trackSelector.appendChild(option);
        });

        trackSelector.addEventListener('change', (e) => {
            this.selectAndStreamTrack(e.target.value);
        });

        document.getElementById('dj-panel').appendChild(trackSelector);
    }

    createParameterLimitControls() {
        const parameters = ['volume', 'lowpass', 'highpass']; // Example parameters
        const limitControls = document.createElement('div');
        limitControls.id = 'parameter-limits';

        parameters.forEach(param => {
            const paramControl = document.createElement('div');
            paramControl.innerHTML = `
                <label>${param}:</label>
                <input type="number" id="${param}-min" min="0" max="100" value="0">
                <input type="number" id="${param}-max" min="0" max="100" value="100">
            `;
            limitControls.appendChild(paramControl);

            const minInput = paramControl.querySelector(`#${param}-min`);
            const maxInput = paramControl.querySelector(`#${param}-max`);

            [minInput, maxInput].forEach(input => {
                input.addEventListener('change', () => {
                    this.setParameterLimits(param, minInput.value, maxInput.value);
                });
            });
        });

        document.getElementById('dj-panel').appendChild(limitControls);
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

        modelSelector.addEventListener('change', (e) => {
            this.selectGovernanceModel(e.target.value);
        });

        document.getElementById('dj-panel').appendChild(modelSelector);
    }

    createMonitoringDisplay() {
        const monitoringDisplay = document.createElement('div');
        monitoringDisplay.id = 'monitoring-display';
        document.getElementById('dj-panel').appendChild(monitoringDisplay);
    }

    selectAndStreamTrack(trackUrl) {
        // Stop the current track if it's playing
        Tone.Transport.stop();
        
        // Create a new Player with the selected track
        const player = new Tone.Player(trackUrl).toDestination();
        
        // When the player is loaded, start the transport
        player.buffer.onload = () => {
            Tone.Transport.start();
        };
        
        document.getElementById('track-selector').value = trackUrl;
    }

    setParameterLimits(parameter, min, max) {
        this.governanceModel.setParameterLimits(parameter, parseFloat(min), parseFloat(max));
        document.getElementById(`${parameter}-min`).value = min;
        document.getElementById(`${parameter}-max`).value = max;
    }

    selectGovernanceModel(model) {
        this.governanceModel = new GovernanceModel(model);
        document.getElementById('governance-model-selector').value = model;
    }

    updateMonitoringDisplay(inputs) {
        const monitoringDisplay = document.getElementById('monitoring-display');
        monitoringDisplay.innerHTML = '';
        
        for (const [parameter, value] of Object.entries(inputs)) {
            const inputElement = document.createElement('div');
            inputElement.textContent = `${parameter}: ${value.toFixed(2)}`;
            monitoringDisplay.appendChild(inputElement);
        }
    }
}
```

### 4. Governance Models

The Governance Models determine how individual user inputs are aggregated to control the audio parameters.

1. Anarchy: Process all inputs immediately
2. Democracy: Aggregate inputs and apply majority decision
3. Liquid Democracy: Implement decision/input delegation and revocation system
4. Sociocracy: Let users form groups and make decisions within their groups. Groups are assigned to handle different parameters. They use consent-based decision making.

```javascript:src/governanceModels.js
class GovernanceModel {
    constructor(type) {
        this.type = type;
        this.inputs = {};
        this.delegations = new Map();
        this.groups = new Map();
        this.parameterLimits = {};
    }

    processInputs(inputs) {
        switch(this.type) {
            case 'anarchy':
                return this.anarchyProcess(inputs);
            case 'democracy':
                return this.democracyProcess(inputs);
            case 'liquidDemocracy':
                return this.liquidDemocracyProcess(inputs);
            case 'sociocracy':
                return this.sociocracyProcess(inputs);
            default:
                throw new Error(`Unknown governance model: ${this.type}`);
        }
    }

    anarchyProcess(inputs) {
        // Immediately apply all inputs
        return this.applyLimits(inputs);
    }

    democracyProcess(inputs) {
        // Aggregate inputs and apply majority decision
        let aggregatedInputs = {};
        for (let [param, value] of Object.entries(inputs)) {
            if (!this.inputs[param]) {
                this.inputs[param] = [];
            }
            this.inputs[param].push(value);
            
            // Calculate average (majority decision)
            aggregatedInputs[param] = this.inputs[param].reduce((a, b) => a + b, 0) / this.inputs[param].length;
        }
        return this.applyLimits(aggregatedInputs);
    }

    liquidDemocracyProcess(inputs) {
        // Implement decision/input delegation and revocation system
        let processedInputs = {};
        for (let [userId, userInputs] of Object.entries(inputs)) {
            let delegateTo = this.delegations.get(userId);
            if (delegateTo) {
                // User has delegated their vote
                if (!inputs[delegateTo]) {
                    inputs[delegateTo] = {};
                }
                Object.assign(inputs[delegateTo], userInputs);
            } else {
                // User votes for themselves
                for (let [param, value] of Object.entries(userInputs)) {
                    if (!processedInputs[param]) {
                        processedInputs[param] = [];
                    }
                    processedInputs[param].push(value);
                }
            }
        }
        
        // Calculate average for each parameter
        let finalInputs = {};
        for (let [param, values] of Object.entries(processedInputs)) {
            finalInputs[param] = values.reduce((a, b) => a + b, 0) / values.length;
        }
        
        return this.applyLimits(finalInputs);
    }

    sociocracyProcess(inputs) {
        // Let users form groups and make decisions within their groups
        let groupDecisions = {};
        for (let [groupId, group] of this.groups) {
            let groupInputs = {};
            for (let userId of group.members) {
                if (inputs[userId]) {
                    Object.assign(groupInputs, inputs[userId]);
                }
            }
            
            // Use consent-based decision making (here simplified as average)
            for (let [param, value] of Object.entries(groupInputs)) {
                if (group.parameters.includes(param)) {
                    if (!groupDecisions[param]) {
                        groupDecisions[param] = [];
                    }
                    groupDecisions[param].push(value);
                }
            }
        }
        
        // Calculate final decision for each parameter
        let finalDecisions = {};
        for (let [param, values] of Object.entries(groupDecisions)) {
            finalDecisions[param] = values.reduce((a, b) => a + b, 0) / values.length;
        }
        
        return this.applyLimits(finalDecisions);
    }

    setParameterLimits(parameter, min, max) {
        this.parameterLimits[parameter] = { min, max };
    }

    applyLimits(inputs) {
        let limitedInputs = {};
        for (let [param, value] of Object.entries(inputs)) {
            if (this.parameterLimits[param]) {
                const { min, max } = this.parameterLimits[param];
                limitedInputs[param] = Math.max(min, Math.min(max, value));
            } else {
                limitedInputs[param] = value;
            }
        }
        return limitedInputs;
    }
}
```

### 5. Backend Server

The Backend Server handles real-time communication between clients and manages the shared state of the application.

Key features:
- Simple event emitter for real-time updates
- API endpoints for user authentication, DJ streaming, and saving/loading sets
- Server-Sent Events (SSE) for pushing updates to clients
- In-memory data storage for users, sets, and crowd inputs

```javascript:src/server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const EventEmitter = require('events');
const Tone = require('tone');

// In-memory storage
const dataStore = {
    users: [],
    sets: [],
    crowdInputs: {}
};

// Simple event emitter for real-time updates
const eventEmitter = new EventEmitter();

app.use(express.json());

// Server-Sent Events setup
app.get('/events', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const listener = (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    eventEmitter.on('update', listener);

    req.on('close', () => {
        eventEmitter.removeListener('update', listener);
    });
});

app.post('/api/auth', (req, res) => {
    const { username, password } = req.body;
    const user = dataStore.users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ userId: user.id });
    } else {
        res.status(400).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/sets', (req, res) => {
    res.json(dataStore.sets);
});

app.post('/api/dj/stream', (req, res) => {
    const { streamUrl, trackName, setId, userId } = req.body;

    const setIndex = dataStore.sets.findIndex(set => set.id === setId);
    if (setIndex !== -1) {
        dataStore.sets[setIndex].tracks.push({ name: trackName, streamUrl });

        // Emit event for real-time updates
        eventEmitter.emit('update', { type: 'newTrackStream', data: { streamUrl, trackName } });
        res.status(200).json({ message: 'Stream started successfully', set: dataStore.sets[setIndex] });
    } else {
        res.status(404).json({ error: 'Set not found' });
    }
});

app.post('/api/sets', (req, res) => {
    const { name, userId } = req.body;
    const newSet = {
        id: dataStore.sets.length + 1,
        name,
        userId,
        tracks: []
    };

    dataStore.sets.push(newSet);
    res.status(201).json(newSet);
});

app.post('/api/users', (req, res) => {
    const { username, password } = req.body;
    const newUser = {
        id: dataStore.users.length + 1,
        username,
        password
    };
    dataStore.users.push(newUser);
    res.status(201).json({ message: 'User created successfully', userId: newUser.id });
});

app.post('/api/crowd-input', (req, res) => {
    const { userId, setId, parameter, value } = req.body;
    if (!dataStore.crowdInputs[setId]) {
        dataStore.crowdInputs[setId] = {};
    }
    if (!dataStore.crowdInputs[setId][parameter]) {
        dataStore.crowdInputs[setId][parameter] = [];
    }
    dataStore.crowdInputs[setId][parameter].push({ userId, value });
    
    // Emit event for real-time updates
    eventEmitter.emit('update', { type: 'newCrowdInput', data: { setId, parameter, value } });
    res.status(200).json({ message: 'Input received successfully' });
});

app.get('/api/crowd-input/:setId', (req, res) => {
    const { setId } = req.params;
    res.json(dataStore.crowdInputs[setId] || {});
});

http.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

## Implementation Steps

1. Set up project structure and dependencies
2. Implement basic Audio Engine with Web Audio API, including streaming capabilities
3. Create simple User Interface for parameter control
4. Develop DJ Control Panel with track streaming functionality
5. Implement governance models one by one
7. Integrate all components for a basic working prototype
9. Refine UI/UX based on initial testing
10. Optimize performance and add error handling

## Testing

- Develop unit tests for each component
- Create integration tests for component interactions
- Conduct user testing for UI/UX refinement
- Perform load testing for concurrent users

## Future Considerations

- Implement hardware interface using Arduino or Raspberry Pi
- Enhance visualizations with Canvas or WebGL
- Develop mobile app version

## Conclusion

This developer guide provides a comprehensive overview of the Crowd-Controlled Cacophony MVP, featuring DJ-streamed tracks and user-controlled audio parameters. By following these specifications and implementation steps, developers can create a robust and engaging interactive audio experience.

## Project Setup

1. Create a new directory for your project:
   ```
   mkdir crowd-controlled-cacophony
   cd crowd-controlled-cacophony
   ```

2. Initialize a new Node.js project:
   ```
   npm init -y
   ```

3. Install the required dependencies:
   ```
   npm install express socket.io tone@15.0.4
   ```

4. Create the following directory structure:
   ```
   crowd-controlled-cacophony/
   ├── src/
   │   ├── audioEngine.js
   │   ├── userInterface.js
   │   ├── djPanel.js
   │   ├── governanceModel.js
   │   └── server.js
   ├── public/
   │   ├── index.html
   │   ├── styles.css
   │   └── main.js
   └── package.json
   ```

5. Copy the provided code for each component into its respective file in the `src/` directory.

6. Create a basic `index.html` file in the `public/` directory:

   ```html:public/index.html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Crowd-Controlled Cacophony</title>
       <link rel="stylesheet" href="styles.css">
   </head>
   <body>
       <div id="user-controls"></div>
       <div id="dj-panel"></div>
       <div id="aggregate-display"></div>

       <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/15.0.4/Tone.js"></script>
       <script src="/socket.io/socket.io.js"></script>
       <script src="audioEngine.js"></script>
       <script src="userInterface.js"></script>
       <script src="djPanel.js"></script>
       <script src="governanceModel.js"></script>
       <script src="main.js"></script>
   </body>
   </html>
   ```

7. Create a basic `styles.css` file in the `public/` directory for minimal styling.

## Running the Server and Client

1. Start the server:
   ```
   node src/server.js
   ```

2. Open a web browser and navigate to `http://localhost:3000` to access the application.

## Basic Testing Procedures

1. Manual Testing:
   - Open the application in multiple browser windows to simulate multiple users.
   - Test each control in the user interface and verify that the audio parameters change accordingly.
   - Switch between different governance models and observe how the collective input affects the audio.

2. Unit Testing:
   - Install a testing framework like Jest:
     ```
     npm install --save-dev jest
     ```
   - Create test files for each component (e.g., `audioEngine.test.js`, `governanceModel.test.js`).
   - Write basic unit tests for each component's core functionality.

3. Integration Testing:
   - Test the interaction between components, such as how user input is processed through the governance model and applied to the audio engine.
   - Verify that real-time updates are correctly propagated to all connected clients.

## Next Steps for Extending the MVP

1. Enhanced Audio Features:
   - Add more audio effects and parameters for users to control.
   - Implement more advanced audio processing using Web Audio API.

2. Improved Governance Models:
   - Develop more sophisticated algorithms for the existing governance models.
   - Implement additional governance models with unique decision-making processes.

3. User Authentication and Profiles:
   - Add user registration and login functionality.
   - Implement user profiles with voting history and preferences.

4. Advanced DJ Controls:
   - Create a more comprehensive DJ interface with track mixing capabilities.
   - Implement playlist management and scheduling features.

5. Visualization:
   - Add real-time visualizations of audio parameters and crowd inputs.
   - Implement interactive visual elements that respond to the music and user interactions.

By following this guide and implementing these components, you'll have a functional MVP of the Crowd-Controlled Cacophony system. This foundation can then be extended and refined based on user feedback and additional feature requirements.