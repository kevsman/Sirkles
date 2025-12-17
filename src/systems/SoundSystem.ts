import { Audio } from 'expo-av';

// Sound System - Audio for React Native
export class SoundSystem {
    enabled: boolean = true;
    initialized: boolean = false;

    // Music System
    musicPlaying: boolean = false;
    currentCombo: number = 0;

    async init() {
        if (this.initialized) return;
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });
            this.initialized = true;
        } catch (e) {
            console.log('Audio not supported:', e);
            this.enabled = false;
        }
    }

    startMusic() {
        if (!this.enabled) return;
        this.musicPlaying = true;
        // In React Native, we would implement music using expo-av
        // For simplicity, we'll skip the complex music layering for now
    }

    stopMusic() {
        this.musicPlaying = false;
    }

    updateMusic(combo: number) {
        this.currentCombo = combo;
    }

    async play(type: string, _pitchScale: number = 1.0) {
        if (!this.enabled || !this.initialized) return;

        // In a full implementation, you would:
        // 1. Pre-load sound files
        // 2. Play them with Audio.Sound from expo-av
        // For now, we'll use haptics as feedback instead
        // Sounds can be added later by creating audio files and loading them

        // This is a placeholder - in production you'd do:
        // const { sound } = await Audio.Sound.createAsync(require('./sounds/pass.mp3'));
        // await sound.playAsync();

        console.log(`Sound: ${type}`);
    }
}

// Singleton instance
export const sound = new SoundSystem();
