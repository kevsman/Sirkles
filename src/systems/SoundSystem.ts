import { Audio } from 'expo-av';
import { File, Paths } from 'expo-file-system/next';

// Base64 encoding for React Native (btoa is not available)
const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let result = '';
    const len = bytes.length;
    
    for (let i = 0; i < len; i += 3) {
        const b1 = bytes[i];
        const b2 = i + 1 < len ? bytes[i + 1] : 0;
        const b3 = i + 2 < len ? bytes[i + 2] : 0;
        
        result += base64Chars[b1 >> 2];
        result += base64Chars[((b1 & 3) << 4) | (b2 >> 4)];
        result += i + 1 < len ? base64Chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
        result += i + 2 < len ? base64Chars[b3 & 63] : '=';
    }
    
    return result;
}

// WAV file generator for synthesized sounds
function generateWavBuffer(samples: number[], sampleRate: number = 44100): Uint8Array {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const fileSize = 36 + dataSize;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        const sample = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
    }

    return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

// Generate tone samples
function generateTone(frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth', volume: number, sampleRate: number = 44100): number[] {
    const samples: number[] = [];
    const numSamples = Math.floor(sampleRate * duration);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let sample = 0;

        switch (type) {
            case 'sine':
                sample = Math.sin(2 * Math.PI * frequency * t);
                break;
            case 'square':
                sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
                break;
            case 'triangle':
                sample = 2 * Math.abs(2 * ((frequency * t) % 1) - 1) - 1;
                break;
            case 'sawtooth':
                sample = 2 * ((frequency * t) % 1) - 1;
                break;
        }

        // Apply envelope (attack and decay)
        const attackTime = 0.01;
        const envelope = t < attackTime
            ? t / attackTime
            : Math.exp(-3 * (t - attackTime) / duration);

        samples.push(sample * volume * envelope);
    }

    return samples;
}

// Generate noise samples
function generateNoise(duration: number, volume: number, sampleRate: number = 44100): number[] {
    const samples: number[] = [];
    const numSamples = Math.floor(sampleRate * duration);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-5 * t / duration);
        samples.push((Math.random() * 2 - 1) * volume * envelope);
    }

    return samples;
}

// Mix multiple sample arrays with delays
function mixSamples(sounds: { samples: number[], delay: number }[], sampleRate: number = 44100): number[] {
    let maxLength = 0;
    for (const sound of sounds) {
        const length = Math.floor(sound.delay * sampleRate) + sound.samples.length;
        if (length > maxLength) maxLength = length;
    }

    const mixed = new Array(maxLength).fill(0);
    for (const sound of sounds) {
        const startSample = Math.floor(sound.delay * sampleRate);
        for (let i = 0; i < sound.samples.length; i++) {
            mixed[startSample + i] += sound.samples[i];
        }
    }

    // Normalize to prevent clipping
    let maxAmp = 0;
    for (const sample of mixed) {
        if (Math.abs(sample) > maxAmp) maxAmp = Math.abs(sample);
    }
    if (maxAmp > 1) {
        for (let i = 0; i < mixed.length; i++) {
            mixed[i] /= maxAmp;
        }
    }

    return mixed;
}

// Sound System - Audio for React Native
export class SoundSystem {
    enabled: boolean = true;
    initialized: boolean = false;
    soundFiles: Map<string, string> = new Map(); // Maps sound type to file URI
    loadedSounds: Map<string, Audio.Sound> = new Map(); // Pre-loaded sound objects
    activeSounds: Audio.Sound[] = [];

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

            // Generate and save all sounds to files
            await this.generateAllSounds();
            
            // Pre-load all sounds
            await this.preloadSounds();
            
            this.initialized = true;
            console.log('SoundSystem initialized successfully');
        } catch (e) {
            console.log('Audio init error:', e);
            this.enabled = false;
        }
    }

    async generateAllSounds() {
        const sampleRate = 44100;
        const soundsDir = Paths.cache;

        const soundDefinitions: { [key: string]: number[] } = {
            // Pass sound - two ascending tones
            'pass': mixSamples([
                { samples: generateTone(440, 0.1, 'sine', 0.3, sampleRate), delay: 0 },
                { samples: generateTone(554, 0.1, 'sine', 0.3, sampleRate), delay: 0.05 },
            ], sampleRate),

            // Perfect sound - three ascending tones
            'perfect': mixSamples([
                { samples: generateTone(523, 0.15, 'sine', 0.4, sampleRate), delay: 0 },
                { samples: generateTone(659, 0.15, 'sine', 0.4, sampleRate), delay: 0.08 },
                { samples: generateTone(784, 0.15, 'sine', 0.4, sampleRate), delay: 0.16 },
            ], sampleRate),

            // Combo sound
            'combo': mixSamples([
                { samples: generateTone(698, 0.2, 'sine', 0.5, sampleRate), delay: 0 },
                { samples: generateTone(880, 0.2, 'sine', 0.5, sampleRate), delay: 0.1 },
            ], sampleRate),

            // Powerup sound
            'powerup': mixSamples([
                { samples: generateTone(392, 0.15, 'square', 0.2, sampleRate), delay: 0 },
                { samples: generateTone(523, 0.15, 'square', 0.2, sampleRate), delay: 0.1 },
                { samples: generateTone(659, 0.15, 'square', 0.2, sampleRate), delay: 0.2 },
                { samples: generateTone(784, 0.2, 'square', 0.3, sampleRate), delay: 0.3 },
            ], sampleRate),

            // Death sound
            'death': mixSamples([
                { samples: generateTone(200, 0.3, 'sawtooth', 0.4, sampleRate), delay: 0 },
                { samples: generateTone(150, 0.3, 'sawtooth', 0.3, sampleRate), delay: 0.1 },
                { samples: generateTone(100, 0.4, 'sawtooth', 0.2, sampleRate), delay: 0.2 },
            ], sampleRate),

            // Whoosh sound (noise)
            'whoosh': generateNoise(0.15, 0.15, sampleRate),

            // Unlock sound
            'unlock': mixSamples([
                { samples: generateTone(523, 0.2, 'sine', 0.4, sampleRate), delay: 0 },
                { samples: generateTone(659, 0.2, 'sine', 0.4, sampleRate), delay: 0.15 },
                { samples: generateTone(784, 0.2, 'sine', 0.4, sampleRate), delay: 0.3 },
                { samples: generateTone(1047, 0.3, 'sine', 0.5, sampleRate), delay: 0.45 },
            ], sampleRate),

            // Shield sound
            'shield': generateTone(300, 0.2, 'triangle', 0.3, sampleRate),

            // Near miss sound
            'nearMiss': mixSamples([
                { samples: generateNoise(0.08, 0.25, sampleRate), delay: 0 },
                { samples: generateTone(180, 0.15, 'sawtooth', 0.2, sampleRate), delay: 0 },
                { samples: generateTone(220, 0.1, 'sawtooth', 0.15, sampleRate), delay: 0.05 },
            ], sampleRate),
        };

        // Generate and save each sound file
        for (const [name, samples] of Object.entries(soundDefinitions)) {
            const wavBuffer = generateWavBuffer(samples, sampleRate);
            const base64Data = uint8ArrayToBase64(wavBuffer);
            const file = new File(soundsDir, `${name}.wav`);
            
            // Write base64 data to file
            file.write(base64Data, { encoding: 'base64' });
            
            this.soundFiles.set(name, file.uri);
        }

        console.log('Generated all sound files');
    }

    async preloadSounds() {
        for (const [name, uri] of this.soundFiles.entries()) {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: false, volume: 1.0 }
                );
                this.loadedSounds.set(name, sound);
            } catch (e) {
                console.log(`Failed to preload sound ${name}:`, e);
            }
        }
        console.log('Preloaded all sounds');
    }

    startMusic() {
        if (!this.enabled) return;
        this.musicPlaying = true;
        // Music system would require a more complex implementation
        // For now, we focus on sound effects
    }

    stopMusic() {
        this.musicPlaying = false;
    }

    updateMusic(combo: number) {
        this.currentCombo = combo;
    }

    async play(type: string, pitchScale: number = 1.0) {
        if (!this.enabled || !this.initialized) return;

        try {
            const uri = this.soundFiles.get(type);
            if (!uri) {
                console.log(`Sound not found: ${type}`);
                return;
            }

            // Create a new sound instance for each play to allow overlapping
            const { sound: soundObject } = await Audio.Sound.createAsync(
                { uri },
                { 
                    shouldPlay: true, 
                    volume: 1.0,
                    rate: Math.min(Math.max(pitchScale, 0.5), 2.0),
                    shouldCorrectPitch: true,
                }
            );

            // Track active sounds for cleanup
            this.activeSounds.push(soundObject);

            // Cleanup after playback
            soundObject.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    soundObject.unloadAsync();
                    const index = this.activeSounds.indexOf(soundObject);
                    if (index > -1) {
                        this.activeSounds.splice(index, 1);
                    }
                }
            });
        } catch (e) {
            console.log(`Error playing sound ${type}:`, e);
        }
    }

    async cleanup() {
        for (const soundObj of this.activeSounds) {
            try {
                await soundObj.unloadAsync();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
        this.activeSounds = [];
        
        for (const soundObj of this.loadedSounds.values()) {
            try {
                await soundObj.unloadAsync();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
        this.loadedSounds.clear();
    }
}

// Singleton instance
export const sound = new SoundSystem();
