import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { POWERUP_TYPES } from '../config/powerups';

interface PowerupIndicatorProps {
    activePowerups: Record<string, number>;
    hasShield: boolean;
}

export const PowerupIndicator: React.FC<PowerupIndicatorProps> = ({ activePowerups, hasShield }) => {
    const now = Date.now();
    const items: Array<{ type: string; remaining: string; color: string; name: string }> = [];

    for (const [type, endTime] of Object.entries(activePowerups)) {
        if (endTime > now) {
            const info = POWERUP_TYPES[type];
            if (!info) continue;

            if (endTime === Infinity) {
                items.push({
                    type,
                    remaining: '∞',
                    color: info.color,
                    name: info.name,
                });
            } else {
                const remaining = Math.ceil((endTime - now) / 1000);
                items.push({
                    type,
                    remaining: `${remaining}s`,
                    color: info.color,
                    name: info.name,
                });
            }
        }
    }

    if (hasShield) {
        const info = POWERUP_TYPES.shield;
        items.push({
            type: 'shield',
            remaining: 'READY',
            color: info.color,
            name: info.name,
        });
    }

    if (items.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.powerupList}>
                {items.map((item) => (
                    <View
                        key={item.type}
                        style={[
                            styles.powerupItem,
                            {
                                backgroundColor: item.color + '22',
                                borderColor: item.color,
                            },
                        ]}
                    >
                        <Text style={[styles.powerupText, { color: item.color }]}>
                            {item.name} {item.remaining}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 150,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    powerupList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    powerupItem: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        marginHorizontal: 5,
        borderRadius: 25,
        borderWidth: 1,
    },
    powerupText: {
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 1,
    },
});
