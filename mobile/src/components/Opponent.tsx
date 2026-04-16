import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import cardImages from "../utils/cardImages";

export type OpponentPosition = "north" | "west" | "east";

interface OpponentProps {
  name: string;
  cardsCount: number;
  tricks: number;
  position: OpponentPosition;
  isAI?: boolean;
  isCurrentTurn?: boolean;
}

export const Opponent: React.FC<OpponentProps> = ({
  name,
  cardsCount,
  tricks,
  position,
  isAI = false,
  isCurrentTurn = false,
}) => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (isCurrentTurn) {
      pulseOpacity.value = 0.6;
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.96, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isCurrentTurn]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const displayCount = Math.min(cardsCount, 13);
  const isSide = position === "west" || position === "east";
  const initial = name ? name[0].toUpperCase() : "?";

  // Build card fan
  const renderFan = () => {
    return Array.from({ length: displayCount }).map((_, i) => {
      const offset = (i - (displayCount - 1) / 2) * 6;
      return (
        <Image
          key={i}
          source={cardImages["back-maroon"]}
          style={[
            styles.fanCard,
            {
              transform: [
                { rotate: `${offset}deg` },
                { translateY: -8 },
              ],
            },
          ]}
        />
      );
    });
  };

  const containerStyle: ViewStyle =
    position === "north"
      ? styles.northContainer
      : position === "west"
      ? styles.westContainer
      : styles.eastContainer;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Pulsing turn ring */}
      {isCurrentTurn && (
        <Animated.View
          style={[
            styles.turnRing,
            isSide ? styles.turnRingSide : styles.turnRingNorth,
            pulseStyle,
          ]}
        />
      )}

      {/* Card fan */}
      <View
        style={[
          styles.fanContainer,
          isSide ? styles.fanContainerSide : styles.fanContainerNorth,
          isSide && { transform: [{ rotate: "90deg" }] },
        ]}
      >
        {renderFan()}
      </View>

      {/* Player info pill */}
      <View
        style={[
          styles.pill,
          isCurrentTurn ? styles.pillActive : styles.pillInactive,
          { marginTop: isSide ? 0 : 6 },
        ]}
      >
        {/* Avatar circle */}
        <View
          style={[
            styles.avatar,
            isCurrentTurn ? styles.avatarActive : styles.avatarInactive,
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: isCurrentTurn ? "#1a1a00" : "white" },
            ]}
          >
            {initial}
          </Text>
        </View>

        <Text
          style={[
            styles.nameText,
            { color: isCurrentTurn ? "#ffd700" : "rgba(255,255,255,0.9)" },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>

        {isAI && (
          <View style={styles.botBadge}>
            <Text style={styles.botText}>Bot</Text>
          </View>
        )}

        <Text style={styles.tricksText}>{tricks}✦</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignItems: "center",
    zIndex: 5,
    pointerEvents: "none",
  } as ViewStyle,
  northContainer: {
    top: 8,
    left: 0,
    right: 0,
    alignSelf: "center",
    alignItems: "center",
    flexDirection: "column",
  } as ViewStyle,
  westContainer: {
    left: 8,
    top: "35%" as any,
    alignItems: "center",
  } as ViewStyle,
  eastContainer: {
    right: 8,
    top: "35%" as any,
    alignItems: "center",
  } as ViewStyle,
  turnRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255, 220, 60, 0.85)",
    borderRadius: 16,
    zIndex: -1,
  },
  turnRingNorth: {
    top: -8,
    bottom: -8,
    left: -12,
    right: -12,
  },
  turnRingSide: {
    top: -6,
    bottom: -6,
    left: -10,
    right: -10,
  },
  fanContainer: {
    position: "relative",
  },
  fanContainerNorth: {
    width: 90,
    height: 70,
  },
  fanContainerSide: {
    width: 70,
    height: 90,
  },
  fanCard: {
    position: "absolute",
    width: 44,
    height: 66,
    borderRadius: 5,
    left: 23,
    top: 2,
  },
  pill: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: "rgba(255,210,40,0.18)",
    borderColor: "rgba(255,210,40,0.5)",
  },
  pillInactive: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  avatarActive: {
    backgroundColor: "rgba(255,210,40,0.7)",
  },
  avatarInactive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  avatarText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  nameText: {
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 72,
  },
  botBadge: {
    backgroundColor: "rgba(250,200,0,0.3)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
  },
  botText: {
    color: "#ffd700",
    fontSize: 10,
  },
  tricksText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    marginLeft: 4,
  },
});
