import React, { useMemo } from "react";
import {
  Canvas,
  Circle,
  Paint,
  RadialGradient,
  vec,
  Group,
  BlendMode,
  Path,
  Skia,
  Text,
  useFont,
} from "@shopify/react-native-skia";
import { Ring } from "../entities/Ring";
import { Powerup } from "../entities/Powerup";
import { Particle } from "../systems/ParticleSystem";
import { GAME_CONFIG } from "../config/constants";
import { POWERUP_TYPES } from "../config/powerups";
import { Theme } from "../config/themes";

// Pre-generate background particle indices to avoid Array.from every frame
const BG_PARTICLE_INDICES = Array.from({ length: 12 }, (_, i) => i);
const BG_RING_INDICES = Array.from({ length: 4 }, (_, i) => i);

interface GameCanvasProps {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  playerSize: number;
  rings: Ring[];
  powerups: Powerup[];
  particles: Particle[];
  theme: Theme;
  hasShield: boolean;
  ghostActive: boolean;
  tinyModeActive: boolean;
  giantModeActive: boolean;
  magnetizeActive: boolean;
  freezeActive: boolean;
  rainbowActive: boolean;
  slowTimeActive: boolean;
  isHolding: boolean;
  isPlaying: boolean;
  pulseScale: number;
  backgroundPulse: number;
  powerupProgressPercent: number;
  nextPowerupType: string;
  powerupIconAngle: number;
  isPowerupReady: boolean;
  screenShake: number;
  cameraZoom: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  width,
  height,
  centerX,
  centerY,
  playerSize,
  rings,
  powerups,
  particles,
  theme,
  hasShield,
  ghostActive,
  tinyModeActive,
  giantModeActive,
  magnetizeActive,
  freezeActive,
  rainbowActive,
  slowTimeActive,
  isHolding,
  isPlaying,
  pulseScale,
  backgroundPulse,
  powerupProgressPercent,
  nextPowerupType,
  powerupIconAngle,
  isPowerupReady,
  screenShake,
  cameraZoom,
}) => {
  const pulsedSize = playerSize * pulseScale;
  const time = Date.now() * 0.003;

  // Calculate shake offset
  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;

  // Rainbow color calculation
  const rainbowHue = rainbowActive ? (Date.now() * 0.3) % 360 : 0;
  const playerColor = rainbowActive
    ? `hsl(${rainbowHue}, 80%, 60%)`
    : theme.player;

  // Find nearest ring for target zone
  const nearestRing = rings.find((r) => !r.passed && r.radius > playerSize);

  return (
    <Canvas style={{ width, height }}>
      {/* Background */}
      <Circle cx={centerX} cy={centerY} r={Math.max(width, height)}>
        <RadialGradient
          c={vec(centerX, centerY)}
          r={Math.max(width, height)}
          colors={[
            lightenColor(theme.background, 15),
            theme.background,
            darkenColor(theme.background, 10),
          ]}
        />
      </Circle>

      {/* Main game group with shake and zoom */}
      <Group
        transform={[
          { translateX: centerX + shakeX },
          { translateY: centerY + shakeY },
          { scale: cameraZoom },
          { translateX: -centerX },
          { translateY: -centerY },
        ]}
      >
        {/* Background floating particles - reduced count */}
        {BG_PARTICLE_INDICES.map((i) => {
          const x = (Math.sin(time * 0.3 + i * 1.5) * 0.4 + 0.5) * width;
          const y = ((time * 0.05 + i * 0.1) % 1) * height;
          const size = 2 + Math.sin(time + i) * 1;
          return (
            <Circle
              key={`bg-particle-${i}`}
              cx={x}
              cy={y}
              r={size}
              color={theme.accent}
              opacity={0.3}
            />
          );
        })}

        {/* Background rings - reduced count */}
        {BG_RING_INDICES.map((i) => {
          const r = 100 + i * 150;
          const alpha =
            (0.04 + backgroundPulse * 0.02) * (1 - r / Math.max(width, height));
          return (
            <Circle
              key={`bg-ring-${i}`}
              cx={centerX}
              cy={centerY}
              r={r + Math.sin(time + r * 0.01) * 5}
              style="stroke"
              strokeWidth={1}
              color={`rgba(255, 255, 255, ${alpha})`}
            />
          );
        })}

        {/* Powerups */}
        {powerups.map((powerup, index) => {
          if (powerup.collected || powerup.radius < 30) return null;
          const pulseSize = Math.sin(powerup.pulsePhase) * 6;

          return (
            <Group key={`powerup-${index}`}>
              {/* Outer glow */}
              <Circle
                cx={centerX}
                cy={centerY}
                r={powerup.radius}
                style="stroke"
                strokeWidth={10 + pulseSize}
                color={powerup.color}
                opacity={0.9}
              />
              {/* Spinning sparkles - reduced count */}
              {[0, 1, 2, 3].map((i) => {
                const angle = time * 2 + (i * Math.PI * 2) / 4;
                const x = centerX + Math.cos(angle) * powerup.radius;
                const y = centerY + Math.sin(angle) * powerup.radius;
                const sparkSize = 5 + Math.sin(time * 3 + i) * 2;
                return (
                  <Circle
                    key={`sparkle-${i}`}
                    cx={x}
                    cy={y}
                    r={sparkSize}
                    color="#ffffff"
                  />
                );
              })}
            </Group>
          );
        })}

        {/* Target zone for nearest ring */}
        {nearestRing && isPlaying && (
          <Group>
            {/* Safe zone fill */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={nearestRing.outerRadius}
              style="stroke"
              strokeWidth={nearestRing.outerRadius - nearestRing.innerRadius}
              color="rgba(0, 255, 170, 0.12)"
            />
            {/* Inner boundary */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={nearestRing.innerRadius}
              style="stroke"
              strokeWidth={2}
              color="rgba(0, 255, 170, 0.5)"
            />
            {/* Outer boundary */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={nearestRing.outerRadius}
              style="stroke"
              strokeWidth={2}
              color="rgba(0, 255, 170, 0.5)"
            />
            {/* Perfect zone */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={nearestRing.requiredSize}
              style="stroke"
              strokeWidth={2}
              color={`rgba(255, 220, 100, ${0.5 + Math.sin(time * 2) * 0.15})`}
            />
          </Group>
        )}

        {/* Rings */}
        {rings.map((ring, index) => {
          if (ring.radius < 0) return null;
          const pulse = ring.passed
            ? 0
            : Math.sin(time + ring.radius * 0.01) * 0.15;

          return (
            <Group key={`ring-${index}`}>
              {/* Outer glow - only for nearby rings to save performance */}
              {!ring.passed && ring.radius > 100 && ring.radius < 300 && (
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={ring.radius}
                  style="stroke"
                  strokeWidth={GAME_CONFIG.RING_THICKNESS + 12}
                  color={ring.color}
                  opacity={0.15}
                />
              )}
              {/* Main ring */}
              <Circle
                cx={centerX}
                cy={centerY}
                r={ring.radius}
                style="stroke"
                strokeWidth={
                  GAME_CONFIG.RING_THICKNESS + (ring.passed ? 0 : pulse * 4)
                }
                color={ring.color}
                opacity={0.85 + pulse}
              />
              {/* Double ring indicator */}
              {ring.isDouble && !ring.passed && (
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={ring.radius - 18}
                  style="stroke"
                  strokeWidth={4}
                  color={ring.color}
                  opacity={0.7}
                />
              )}
            </Group>
          );
        })}

        {/* Particles - limit rendered count for performance */}
        {particles.slice(0, 100).map((p, index) => (
          <Circle
            key={`particle-${index}`}
            cx={p.x}
            cy={p.y}
            r={p.size}
            color={p.color}
            opacity={p.life}
          />
        ))}

        {/* Player effects */}
        {/* Ghost effect */}
        {ghostActive && (
          <Group>
            {[3, 2, 1, 0].map((i) => (
              <Circle
                key={`ghost-trail-${i}`}
                cx={centerX}
                cy={centerY}
                r={pulsedSize + i * 8}
                color="rgba(136, 204, 255, 0.1)"
              />
            ))}
          </Group>
        )}

        {/* Magnetize effect */}
        {magnetizeActive && (
          <Group>
            {[0, 1, 2].map((i) => {
              const wavePulse = (Date.now() % 1000) / 1000;
              const waveOffset = (wavePulse + i * 0.33) % 1;
              const waveRadius = pulsedSize + 20 + waveOffset * 60;
              return (
                <Circle
                  key={`magnet-wave-${i}`}
                  cx={centerX}
                  cy={centerY}
                  r={waveRadius}
                  style="stroke"
                  strokeWidth={2}
                  color={`rgba(255, 105, 180, ${0.4 * (1 - waveOffset)})`}
                />
              );
            })}
          </Group>
        )}

        {/* Shield effect */}
        {hasShield && (
          <Group>
            {/* Shield glow layers */}
            {[3, 2, 1, 0].map((i) => {
              const radius = playerSize + 15 + i * 10;
              const alpha = 0.15 - i * 0.03;
              const shieldPulse = Math.sin(time * 2) * 0.3 + 0.7;
              return (
                <Circle
                  key={`shield-glow-${i}`}
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  color={`rgba(255, 215, 0, ${alpha * shieldPulse})`}
                />
              );
            })}
            {/* Shield ring */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={playerSize + 8}
              style="stroke"
              strokeWidth={4}
              color="#ffd700"
            />
          </Group>
        )}

        {/* Player glow */}
        <Circle cx={centerX} cy={centerY} r={pulsedSize + 25}>
          <RadialGradient
            c={vec(centerX, centerY)}
            r={pulsedSize + 25}
            colors={[theme.playerGlow, "transparent"]}
          />
        </Circle>

        {/* Main player */}
        <Circle cx={centerX} cy={centerY} r={pulsedSize} color={playerColor} />

        {/* Player edge highlight */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={pulsedSize}
          style="stroke"
          strokeWidth={2}
          color="rgba(255, 255, 255, 0.15)"
        />

        {/* Holding indicator */}
        {isHolding &&
          isPlaying &&
          !tinyModeActive &&
          !giantModeActive &&
          (() => {
            const expandPulse = (Date.now() % 500) / 500;
            return (
              <Circle
                cx={centerX}
                cy={centerY}
                r={pulsedSize + expandPulse * 15}
                style="stroke"
                strokeWidth={3 - expandPulse * 2}
                color={`rgba(255, 255, 255, ${0.6 - expandPulse * 0.6})`}
              />
            );
          })()}

        {/* Powerup progress ring */}
        {powerupProgressPercent > 0 && (
          <Group>
            {/* Background ring */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={playerSize + 35}
              style="stroke"
              strokeWidth={3}
              color="rgba(255, 255, 255, 0.08)"
            />
            {/* Progress arc - approximated with circles */}
            {powerupProgressPercent > 0 && (
              <Circle
                cx={centerX}
                cy={centerY}
                r={playerSize + 35}
                style="stroke"
                strokeWidth={3}
                color={POWERUP_TYPES[nextPowerupType]?.color || "#ffd700"}
                opacity={isPowerupReady ? 0.9 : 0.5}
              />
            )}
          </Group>
        )}

        {/* Slow time effect */}
        {slowTimeActive && (
          <Group opacity={0.1}>
            <Circle cx={centerX} cy={centerY} r={Math.max(width, height) * 0.8}>
              <RadialGradient
                c={vec(centerX, centerY)}
                r={Math.max(width, height) * 0.8}
                colors={["transparent", "rgba(78, 205, 196, 0.08)"]}
              />
            </Circle>
          </Group>
        )}

        {/* Freeze effect */}
        {freezeActive && (
          <Group opacity={0.15}>
            <Circle cx={centerX} cy={centerY} r={Math.max(width, height) * 0.9}>
              <RadialGradient
                c={vec(centerX, centerY)}
                r={Math.max(width, height) * 0.9}
                colors={["transparent", "rgba(0, 255, 255, 0.12)"]}
              />
            </Circle>
          </Group>
        )}

        {/* Rainbow effect border */}
        {rainbowActive && (
          <Circle
            cx={centerX}
            cy={centerY}
            r={Math.min(width, height) / 2 - 4}
            style="stroke"
            strokeWidth={8}
            color={`hsla(${(Date.now() * 0.2) % 360}, 100%, 60%, 0.3)`}
          />
        )}
      </Group>
    </Canvas>
  );
};

// Helper functions
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min((num >> 16) + amt, 255);
  const G = Math.min(((num >> 8) & 0x00ff) + amt, 255);
  const B = Math.min((num & 0x0000ff) + amt, 255);
  return `rgb(${R}, ${G}, ${B})`;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return `rgb(${R}, ${G}, ${B})`;
}
