import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Canvas, Rect, RadialGradient, vec } from "@shopify/react-native-skia";

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

export const GameOver: React.FC<GameOverProps> = ({
  visible,
  score,
  highScore,
  isNewHighScore,
  nextUnlock,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const highScoreScaleAnim = useRef(new Animated.Value(1)).current;
  const restartOpacityAnim = useRef(new Animated.Value(0.4)).current;

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const bgSize = Math.min(screenWidth, screenHeight) * 1.2; // Large enough to cover content

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);

      // Entry animation (pop)
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // New High Score Glow Animation
      if (isNewHighScore) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(highScoreScaleAnim, {
              toValue: 1.05,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(highScoreScaleAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Restart Hint Pulse Animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(restartOpacityAnim, {
            toValue: 0.7,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(restartOpacityAnim, {
            toValue: 0.4,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, isNewHighScore]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.wrapper,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Gradient Background using Skia */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Canvas style={{ width: bgSize, height: bgSize }}>
            <Rect x={0} y={0} width={bgSize} height={bgSize}>
              <RadialGradient
                c={vec(bgSize / 2, bgSize / 2)}
                r={bgSize / 2}
                colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.7)", "transparent"]}
                positions={[0, 0.5, 1]}
              />
            </Rect>
          </Canvas>
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            GAME OVER
          </Text>

          {isNewHighScore && (
            <Animated.Text
              style={[
                styles.newHighScore,
                { transform: [{ scale: highScoreScaleAnim }] },
              ]}
            >
              ⭐ NEW HIGH SCORE! ⭐
            </Animated.Text>
          )}

          <Text style={styles.scoreLabel}>
            SCORE: <Text style={styles.scoreValue}>{score}</Text>
          </Text>
          <Text style={styles.scoreLabel}>
            BEST: <Text style={styles.scoreValue}>{highScore}</Text>
          </Text>

          {nextUnlock && (
            <Text style={styles.nextUnlock}>
              🎯 {nextUnlock.pointsAway} points away from {nextUnlock.name}{" "}
              theme!
            </Text>
          )}

          <Animated.Text
            style={[styles.restartHint, { opacity: restartOpacityAnim }]}
          >
            TAP TO RESTART
          </Animated.Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 20,
  },
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 48,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 4,
    marginBottom: 25,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  newHighScore: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffd93d",
    letterSpacing: 2,
    marginBottom: 18,
    textShadowColor: "rgba(255, 217, 61, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 12,
  },
  scoreValue: {
    fontWeight: "600",
  },
  nextUnlock: {
    fontSize: 16,
    color: "#ffd93d",
    marginTop: 10,
    marginBottom: 10,
    opacity: 0.9,
    textAlign: "center",
  },
  restartHint: {
    fontSize: 15,
    fontWeight: "400",
    color: "#ffffff",
    marginTop: 35,
  },
});
