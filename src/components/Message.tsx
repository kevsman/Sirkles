import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MessageProps {
    visible: boolean;
}

export const Message: React.FC<MessageProps> = ({ visible }) => {
    if (!visible) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.text}>HOLD TO GROW • RELEASE TO SHRINK</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    text: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 15,
        fontWeight: '400',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
});
