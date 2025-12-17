import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ComboPopupProps {
    visible: boolean;
    title: string;
    subtitle?: string | null;
}

export const ComboPopup: React.FC<ComboPopupProps> = ({ visible, title, subtitle }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible && title) {
            // Reset and animate
            opacity.setValue(1);
            scale.setValue(1.2);

            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, title]);

    if (!visible || !title) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ scale }],
                },
            ]}
        >
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: '45%',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 15,
    },
    title: {
        fontSize: 38,
        fontWeight: '600',
        letterSpacing: 3,
        color: '#ffd93d',
        textShadowColor: 'rgba(255, 217, 61, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        letterSpacing: 1,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 8,
    },
});
