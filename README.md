# Crowd-Controlled Cacophony

Crowd-Controlled Cacophony is an interactive web-based audio experience where users collectively influence music parameters across different sets, each with unique governance models. The DJ curates or streams tracks, and multiple users control various audio parameters in real-time.

## Features

- Real-time audio parameter control
- Multiple governance models (Anarchy, Democracy, Liquid Democracy, Sociocracy)
  - Anarchy and Democracy have been tested
  - Liquid Democracy and Sociocracy are still in development
- DJ track curation capabilities
- Visual representation of individual and collective inputs

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/crowd-controlled-cacophony.git
   cd crowd-controlled-cacophony
   ```

2. Install dependencies:
   ```
   npm install
   ```
   npm will install the dependencies listed in package.json

3. Add test tracks:
   - Add up to three MP3 files to the public/tracks folder (label them: `track1.mp3`, `track2.mp3`, `track3.mp3`, etc)
   - If adding more than three tracks, update the `tracks` array in `src/djPanel.js` to include your new tracks
   - The tracks in this folder will be ignored by git and won't be committed
   - Note: only MP3s have been tested to date

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. As a DJ:
   - Select a track from the dropdown menu
   - Choose a governance model
   - Control playback using the play/stop button

2. As a User:
   - Adjust audio parameters using the + and - buttons
   - Observe how your inputs affect the collective output based on the current governance model

## Known Issues

- The pitch control is glitchy
- Play and stop buttons don't always behave as expected

## Contributing

Contribution to Crowd-Controlled Cacophony!

1. Report bugs and suggest features by opening issues
2. Submit pull requests with bug fixes or new features
3. Improve documentation
4. Share your experience and provide feedback

A Developer Guide is available in the `DEVELOPMENT.md` file.
