# Spades - React Native Mobile App

A multiplayer Spades card game for iOS and Android built with React Native and Expo.

## Setup

```bash
cd mobile
npm install
```

## Running

```bash
# Start Expo dev server
npm start

# Run on iOS (requires Xcode)
npm run ios

# Run on Android (requires Android Studio/ADB)
npm run android
```

## Architecture

- **App.tsx** - Root component with socket.io connection
- **src/components/** - React Native UI components
  - **Table.tsx** - Main game board with hand fan and trick pile
  - **TrickPile.tsx** - Animated trick cards (react-native-reanimated)
  - **Opponent.tsx** - Opponent card displays with turn indicator
  - **Card.tsx** - Individual card component
  - **BetPopup.tsx** - Bid selection modal
  - **Lobby.tsx** - Room list and creation
  - **NameInputPopup.tsx** - Player name input screen
  - **Dashboard.tsx** - Round leaderboard
  - **Scoreboard.tsx** - Current round bids/tricks
  - **GameOverPopup.tsx** - Game end screen

- **src/hooks/** - Custom hooks
  - **useGameState.ts** - Game state management (identical to web version)

- **src/utils/** - Utility functions
  - **gameLogic.ts** - Pure game logic (hand dealing, trick evaluation, scoring)
  - **cardImages.ts** - Card image mappings

- **src/services/** - External services
  - **socket.ts** - Socket.io client

- **src/types/** - TypeScript types
  - **spades.ts** - Game types (Card, GameState, etc.)

## Features

- **Multiplayer**: Real-time 4-player online games via socket.io
- **Smooth Animations**: react-native-reanimated for card animations
- **Responsive Layout**: Optimized for portrait and landscape
- **iOS & Android**: Single codebase runs on both platforms
- **Felt Table**: Authentic card game appearance with gradients

## Game Rules

- Standard Spades rules with 4 players
- Bidding phase before each round
- Trick evaluation with trump (spades)
- Spades can only be led after being "broken" (played off-suit)
- Scoring: 10 × bid (or -10 × bid if missed) + overtricks

## Card Assets

All 53 card images (4 suits × 13 ranks + 1 back) are included in `src/assets/cards/`

## Dependencies

- **expo**: Framework for React Native development
- **react-native-reanimated**: GPU-accelerated animations
- **socket.io-client**: Real-time multiplayer communication
- **expo-linear-gradient**: Gradient backgrounds
- **react-native-gesture-handler**: Touch gesture support
- **react-native-safe-area-context**: Safe area handling for notches/home indicators
