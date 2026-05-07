import React, { useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

export type OpponentPosition = "north" | "west" | "east";

interface OpponentProps {
  name: string;
  cardsCount: number;
  tricks: number;
  bid: number;        // -1 = not yet bid, 0+ = bid placed
  position: OpponentPosition;
  isCurrentTurn?: boolean;
}

// Soft color per seat
const AVATAR_COLORS: Record<OpponentPosition, string[]> = {
  north: ["#1a6fd4", "#1452a8"],
  west:  ["#7c3aed", "#5b21b6"],
  east:  ["#0e7c5a", "#065f46"],
};

export const Opponent: React.FC<OpponentProps> = ({
  name,
  cardsCount,
  tricks,
  bid,
  position,
  isCurrentTurn = false,
}) => {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isCurrentTurn) {
      glowOpacity.value = withTiming(1, { duration: 200 });
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.07, { duration: 650, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.97, { duration: 650, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isCurrentTurn]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const isSide = position === "west" || position === "east";
  const initial = name ? name[0].toUpperCase() : "?";
  const [colorTop, colorBot] = AVATAR_COLORS[position];
  const hasBid = bid >= 0;

  const containerStyle: ViewStyle =
    position === "north"
      ? styles.northContainer
      : position === "west"
      ? styles.westContainer
      : styles.eastContainer;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Animated.View style={animStyle}>
        {/* Glow ring when active */}
        <Animated.View
          style={[
            styles.glowRing,
            { borderColor: isCurrentTurn ? "#ffd700" : "transparent" },
            glowStyle,
          ]}
        />

        {/* Main circle */}
        <View style={[styles.circle, { backgroundColor: colorBot }]}>
          {/* Inner gradient effect via layered views */}
          <View style={[styles.circleInner, { backgroundColor: colorTop }]}>
            {/* Initial */}
            <Text style={styles.initial}>{initial}</Text>

            {/* Bid badge inside circle */}
            {hasBid ? (
              <View style={styles.bidBadge}>
                <Text style={styles.bidLabel}>Call</Text>
                <Text style={styles.bidValue}>{bid === 0 ? "NIL" : bid}</Text>
              </View>
            ) : (
              /* Card count dots */
              <View style={styles.cardCountRow}>
                {Array.from({ length: Math.min(cardsCount, 6) }).map((_, i) => (
                  <View key={i} style={styles.cardDot} />
                ))}
                {cardsCount > 6 && (
                  <Text style={styles.cardCountExtra}>+{cardsCount - 6}</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Tricks won badge */}
        {tricks > 0 && (
          <View style={styles.tricksBadge}>
            <Text style={styles.tricksText}>{tricks}✦</Text>
          </View>
        )}
      </Animated.View>

      {/* Name banner */}
      <View
        style={[
          styles.nameBanner,
          isCurrentTurn ? styles.nameBannerActive : styles.nameBannerInactive,
        ]}
      >
        <Text style={styles.nameText} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
  );
};

const CIRCLE_SIZE = 72;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignItems: "center",
    zIndex: 5,
  } as ViewStyle,
  northContainer: {
    top: 12,
    left: 0,
    right: 0,
    alignSelf: "center",
    alignItems: "center",
  } as ViewStyle,
  westContainer: {
    left: 10,
    top: "30%" as any,
    alignItems: "center",
  } as ViewStyle,
  eastContainer: {
    right: 10,
    top: "30%" as any,
    alignItems: "center",
  } as ViewStyle,

  glowRing: {
    position: "absolute",
    top: -6,
    left: -6,
    width: CIRCLE_SIZE + 12,
    height: CIRCLE_SIZE + 12,
    borderRadius: (CIRCLE_SIZE + 12) / 2,
    borderWidth: 2.5,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  circleInner: {
    width: CIRCLE_SIZE - 6,
    height: CIRCLE_SIZE - 6,
    borderRadius: (CIRCLE_SIZE - 6) / 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  initial: {
    fontSize: 20,
    fontWeight: "900",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 1,
  },
  bidBadge: {
    alignItems: "center",
    marginTop: 1,
  },
  bidLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.5,
    lineHeight: 9,
  },
  bidValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ffd700",
    lineHeight: 14,
  },
  cardCountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    justifyContent: "center",
    marginTop: 3,
    maxWidth: 36,
  },
  cardDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  cardCountExtra: {
    fontSize: 8,
    color: "rgba(255,255,255,0.6)",
  },
  tricksBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "rgba(255,210,0,0.5)",
  },
  tricksText: {
    fontSize: 10,
    color: "#ffd700",
    fontWeight: "bold",
  },
  nameBanner: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    maxWidth: 90,
  },
  nameBannerActive: {
    backgroundColor: "rgba(255,210,40,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,210,40,0.5)",
  },
  nameBannerInactive: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  nameText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
});
