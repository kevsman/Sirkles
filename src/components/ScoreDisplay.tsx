import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ScoreDisplayProps {
    score: number;
    highScore: number;
    multiplier: number;
    multiplierActive: boolean;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, highScore, multiplier, multiplierActive }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.score}>{score}</Text>
            {multiplierActive && multiplier > 1 && (
                <Text style={[styles.multiplier, multiplier >= 50 && styles.multiplierOnFire, { fontSize: Math.min(20 + multiplier * 0.5, 40) }]}>
                    x{multiplier.toFixed(1)}
                </Text>
            )}
            <Text style={styles.highScore}>BEST: {highScore}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    score: {
        fontSize: 56,
        fontWeight: '600',
        color: '#ff6b9d',
        textShadowColor: 'rgba(255, 107, 157, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 30,
    },
    multiplier: {
        fontSize: 20,
        fontWeight: '500',
        color: '#ffd93d',
        marginTop: 5,
        textShadowColor: 'rgba(255, 217, 61, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    multiplierOnFire: {
        color: '#ff4444',
        textShadowColor: '#ff0000',
        textShadowRadius: 20,
    },
    highScore: {
        fontSize: 14,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 8,
    },
});
