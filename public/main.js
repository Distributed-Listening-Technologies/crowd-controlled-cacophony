const socket = io();

socket.on('update', (event) => {
    if (event.type === 'newCrowdInput') {
        // Update UI or audio engine based on the new input
        userInterface.handleInput(event.data.parameter, event.data.value);
    }
});

// Initialize components
const audioEngine = new AudioEngine();
const governanceModel = new GovernanceModel();
const userInterface = new UserInterface(audioEngine, governanceModel);
const djPanel = new DJPanel(audioEngine, governanceModel);

// Example of sending crowd input
function sendCrowdInput(parameter, value) {
    socket.emit('crowd-input', { parameter, value });
}

document.body.addEventListener('click', async () => {
    await Tone.start();
    console.log('Audio is ready');
});