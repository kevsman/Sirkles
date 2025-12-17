import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptic Feedback System - React Native Haptics
export class HapticSystem {
    enabled: boolean;

    constructor() {
        // Haptics work on iOS and Android
        this.enabled = Platform.OS === 'ios' || Platform.OS === 'android';
    }

    light() {
        if (this.enabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }

    medium() {
        if (this.enabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }

    heavy() {
        if (this.enabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
    }

    success() {
        if (this.enabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }

    death() {
        if (this.enabled) {
            // Multiple vibrations for death effect
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 100);
            setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 250);
        }
    }

    warning() {
        if (this.enabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    }

    error() {
        if (this.enabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }

    selection() {
        if (this.enabled) {
            Haptics.selectionAsync();
        }
    }
}

// Singleton instance
export const haptic = new HapticSystem();
