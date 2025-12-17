# Sirkles

A React Native port of the Pulse/Gaddict game. This is an addictive mobile game where you control the size of a circle by holding the screen. Navigate through incoming rings by matching your size to the gap in each ring.

## Features

-   **Simple Controls**: Hold to grow, release to shrink
-   **Powerups**: 30+ unique powerups including shields, slow-time, ghost mode, and more
-   **Themes**: 6 unlockable color themes
-   **Combo System**: Build combos for multiplied scores
-   **Haptic Feedback**: Immersive vibration feedback
-   **Particle Effects**: Beautiful visual effects using React Native Skia

## Getting Started

### Prerequisites

-   Node.js 18+
-   npm or yarn
-   Expo CLI (`npm install -g expo-cli`)
-   iOS Simulator (Mac) or Android Studio (for emulator)

### Installation

1. Clone the repository
2. Navigate to the Sirkles folder
3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npx expo start
```

5. Press `i` for iOS simulator or `a` for Android emulator

### Building for Production

#### iOS

```bash
npx expo build:ios
```

#### Android

```bash
npx expo build:android
```

Or use EAS Build:

```bash
npx eas build --platform all
```

## Project Structure

```
Sirkles/
├── App.tsx                 # Main entry point
├── src/
│   ├── components/         # React components
│   │   ├── Game.tsx       # Main game component
│   │   ├── GameCanvas.tsx # Skia canvas rendering
│   │   ├── ScoreDisplay.tsx
│   │   ├── GameOver.tsx
│   │   ├── PowerupIndicator.tsx
│   │   ├── ComboPopup.tsx
│   │   ├── ThemeUnlock.tsx
│   │   └── Message.tsx
│   ├── config/            # Game configuration
│   │   ├── constants.ts   # Game constants
│   │   ├── powerups.ts    # Powerup definitions
│   │   └── themes.ts      # Theme definitions
│   ├── core/              # Core game logic
│   │   └── GameState.ts   # Game state management
│   ├── entities/          # Game entities
│   │   ├── Ring.ts        # Ring entity
│   │   └── Powerup.ts     # Powerup entity
│   └── systems/           # Game systems
│       ├── ParticleSystem.ts
│       ├── SoundSystem.ts
│       └── HapticSystem.ts
├── assets/                # App assets (icons, splash)
├── package.json
├── app.json              # Expo configuration
└── tsconfig.json         # TypeScript configuration
```

## Gameplay

-   **Objective**: Pass through as many rings as possible without hitting the edges
-   **Controls**: Touch and hold anywhere on the screen to grow your circle, release to shrink
-   **Perfect Pass**: Get your size as close to the center of the gap as possible
-   **Combos**: Consecutive perfect passes build your combo multiplier
-   **Powerups**: Collect powerups to gain special abilities
-   **Themes**: Unlock new themes by reaching score milestones

## Technologies

-   React Native with Expo
-   @shopify/react-native-skia for high-performance 2D rendering
-   expo-haptics for haptic feedback
-   expo-av for audio
-   @react-native-async-storage/async-storage for persistence
-   TypeScript for type safety

## License

MIT
