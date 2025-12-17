import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface GameOverProps {
    visible: boolean;
    score: number;
    highScore: number;
    isNewHighScore: boolean;
    nextUnlock?: {
        name: string;
        pointsAway: number;
    } | null;
}

export const GameOver: React.FC<GameOverProps> = ({ visible, score, highScore, isNewHighScore, nextUnlock }) => {
    if (!visible) return null;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>GAME OVER</Text>
                {isNewHighScore && <Text style={styles.newHighScore}>⭐ NEW HIGH SCORE! ⭐</Text>}
                <Text style={styles.scoreLabel}>
                    SCORE: <Text style={styles.scoreValue}>{score}</Text>
                </Text>
                <Text style={styles.scoreLabel}>
                    BEST: <Text style={styles.scoreValue}>{highScore}</Text>
                </Text>
                {nextUnlock && (
                    <Text style={styles.nextUnlock}>
                        🎯 {nextUnlock.pointsAway} points away from {nextUnlock.name} theme!
                    </Text>
                )}
                <Text style={styles.restartHint}>TAP TO RESTART</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 20,
    },
    content: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 4,
        marginBottom: 25,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    newHighScore: {
        fontSize: 16,
        fontWeight: '500',
        color: '#ffd93d',
        letterSpacing: 2,
        marginBottom: 18,
        textShadowColor: 'rgba(255, 217, 61, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    scoreLabel: {
        fontSize: 20,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.85)',
        marginBottom: 12,
    },
    scoreValue: {
        fontWeight: '600',
    },
    nextUnlock: {
        fontSize: 16,
        color: '#ffd93d',
        marginTop: 10,
        marginBottom: 10,
        opacity: 0.9,
    },
    restartHint: {
        fontSize: 15,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 35,
    },
});
