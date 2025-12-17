import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ThemeUnlockProps {
    visible: boolean;
    themeName: string;
}

export const ThemeUnlock: React.FC<ThemeUnlockProps> = ({ visible, themeName }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.5)).current;
    const rotation = useRef(new Animated.Value(-10)).current;

    useEffect(() => {
        if (visible) {
            opacity.setValue(0);
            scale.setValue(0.5);
            rotation.setValue(-10);

            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }),
                Animated.spring(rotation, {
                    toValue: 0,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();

            // Hide after 2 seconds
            setTimeout(() => {
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            }, 1700);
        }
    }, [visible, themeName]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [
                        { scale },
                        {
                            rotate: rotation.interpolate({
                                inputRange: [-10, 0],
                                outputRange: ['-10deg', '0deg'],
                            }),
                        },
                    ],
                },
            ]}
        >
            <Text style={styles.title}>🎨 THEME UNLOCKED</Text>
            <Text style={styles.themeName}>{themeName}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        alignItems: 'center',
        marginTop: -50,
        zIndex: 25,
    },
    title: {
        fontSize: 26,
        fontWeight: '600',
        letterSpacing: 2,
        color: '#ffd93d',
        marginBottom: 12,
    },
    themeName: {
        fontSize: 18,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.9)',
    },
});
