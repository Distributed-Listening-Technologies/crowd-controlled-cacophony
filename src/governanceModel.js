class GovernanceModel {
    constructor() {
        this.model = 'anarchy';
        this.inputs = {};
        this.defaultState = {
            playbackRate: 1,
            pitchShift: 0,
            eqLow: 0,
            eqMid: 0,
            eqHigh: 0,
            reverb: 0
        };
        this.aggregateState = { ...this.defaultState };
    }

    setModel(model) {
        this.model = model;
    }

    processInput(parameter, value) {
        if (!this.inputs[parameter]) {
            this.inputs[parameter] = [];
        }
        this.inputs[parameter].push(value);

        switch (this.model) {
            case 'anarchy':
                this.aggregateState[parameter] = value;
                break;
            case 'democracy':
            case 'liquidDemocracy':
            case 'sociocracy':
                // For non-anarchy modes, we'll use a more responsive average
                const recentInputs = this.inputs[parameter].slice(-5); // Consider only the last 5 inputs
                const sum = recentInputs.reduce((a, b) => a + b, 0);
                this.aggregateState[parameter] = sum / recentInputs.length;
                break;
        }

        // Apply limits
        if (parameter === 'playbackRate') {
            this.aggregateState[parameter] = Math.max(0.1, Math.min(2, this.aggregateState[parameter]));
        } else if (parameter === 'reverb') {
            this.aggregateState[parameter] = Math.max(0, Math.min(1, this.aggregateState[parameter]));
        } else if (['eqLow', 'eqMid', 'eqHigh'].includes(parameter)) {
            this.aggregateState[parameter] = Math.max(0, Math.min(12, this.aggregateState[parameter]));
        }

        return this.aggregateState[parameter];
    }

    getCurrentValue(parameter) {
        return this.aggregateState[parameter];
    }

    getAggregateState() {
        return this.aggregateState;
    }

    resetState() {
        this.aggregateState = { ...this.defaultState };
        this.inputs = {};
    }
}