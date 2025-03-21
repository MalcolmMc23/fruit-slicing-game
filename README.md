# Fruit Slicing Game

An interactive, camera-based game where players slice virtual fruits using hand and arm movements. The game uses computer vision and machine learning to track player movements in real-time.

## Features

- Real-time hand and arm tracking using MediaPipe
- Two tracking modes: Hand Tracking and Arm Tracking
- Visual overlay showing detected hand/arm positions
- Responsive design with clean UI

## Technologies

- Next.js
- TypeScript
- TensorFlow.js
- MediaPipe (for hand and pose detection)
- Tailwind CSS

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Current Status

This is a preview version with working hand and arm tracking. The actual fruit slicing gameplay will be implemented in the next phase.

## Requirements

- A modern browser with WebRTC support
- Camera access (webcam)
- JavaScript enabled
