console.log('main.js is loading');

const socket = io();

socket.on('update', (event) => {
    if (event.type === 'newCrowdInput' && window.userInterface) {
        window.userInterface.handleInput(event.data.parameter, event.data.value);
    }
});

// Example of sending crowd input
function sendCrowdInput(parameter, value) {
    socket.emit('crowd-input', { parameter, value });
}

// Make sendCrowdInput available globally
window.sendCrowdInput = sendCrowdInput;