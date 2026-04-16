import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { PlayerId, Card as CardType } from "../types/spades";
import { Card } from "./Card";

interface TrickPileProps {
  trick: Record<PlayerId, CardType | null>;
  winner: PlayerId | null;
  seatOf: Record<PlayerId, "north" | "east" | "south" | "west">;
  onFlyOutEnd?: () => void;
  containerWidth: number;
  containerHeight: number;
}

type SeatPos = "north" | "east" | "south" | "west";

interface TrickCardProps {
  card: CardType;
  seat: SeatPos;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  endRotate: number;
  isFlyingOut: boolean;
  winnerX: number;
  winnerY: number;
  delay: number;
  zIndex: number;
  isWinner: boolean;
}

const TrickCard: React.FC<TrickCardProps> = ({
  card,
  startX,
  startY,
  endX,
  endY,
  endRotate,
  isFlyingOut,
  winnerX,
  winnerY,
  delay,
  zIndex,
  isWinner,
}) => {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const springConfig = { stiffness: 420, damping: 32 };
    // Animate in with delay
    const timeout = setTimeout(() => {
      translateX.value = withSpring(endX, springConfig);
      translateY.value = withSpring(endY, springConfig);
      rotate.value = withSpring(endRotate, springConfig);
      scale.value = withSpring(1, springConfig);
      opacity.value = withTiming(1, { duration: 200 });
    }, delay);
    return () => clearTimeout(timeout);
  }, [endX, endY, endRotate]);

  useEffect(() => {
    if (isFlyingOut) {
      translateX.value = withTiming(winnerX, {
        duration: 380,
        easing: Easing.in(Easing.ease),
      });
      translateY.value = withTiming(winnerY, {
        duration: 380,
        easing: Easing.in(Easing.ease),
      });
      scale.value = withTiming(0.4, { duration: 380 });
      opacity.value = withTiming(0, { duration: 380 });
    }
  }, [isFlyingOut, winnerX, winnerY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex,
    position: "absolute",
  }));

  return (
    <Animated.View style={animStyle}>
      <View
        style={
          isWinner
            ? {
                shadowColor: "#ffd700",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 10,
                elevation: 12,
              }
            : undefined
        }
      >
        <Card card={card} faceUp />
      </View>
    </Animated.View>
  );
};

export const TrickPile: React.FC<TrickPileProps> = ({
  trick,
  winner,
  seatOf,
  onFlyOutEnd,
  containerWidth,
  containerHeight,
}) => {
  const [isFlyingOut, setIsFlyingOut] = useState(false);

  // Seat start offsets (from center)
  const seatOffsets: Record<SeatPos, { x: number; y: number }> = {
    north: { x: 0, y: -containerHeight * 0.38 },
    south: { x: 0, y: containerHeight * 0.38 },
    east: { x: containerWidth * 0.42, y: 0 },
    west: { x: -containerWidth * 0.42, y: 0 },
  };

  // Center slot resting positions
  const centerSlots: Record<SeatPos, { x: number; y: number; rotate: number }> = {
    north: { x: 0, y: -44, rotate: -6 },
    south: { x: 0, y: 44, rotate: 4 },
    east: { x: 44, y: 0, rotate: 12 },
    west: { x: -44, y: 0, rotate: -9 },
  };

  useEffect(() => {
    if (winner) {
      const flyOutTimer = setTimeout(() => setIsFlyingOut(true), 820);
      const cleanupTimer = setTimeout(() => {
        onFlyOutEnd?.();
        setIsFlyingOut(false);
      }, 1480);
      return () => {
        clearTimeout(flyOutTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [winner, onFlyOutEnd]);

  const cardsToRender = (
    Object.entries(trick) as [PlayerId, CardType | null][]
  )
    .filter(([, card]) => card !== null)
    .map(([player, card]) => ({
      player,
      card: card!,
      key: `${player}-${card!.suit}-${card!.rank}`,
    }));

  const winnerSeat = winner ? seatOf[winner] : null;
  const winnerOffset = winnerSeat ? seatOffsets[winnerSeat] : { x: 0, y: 0 };

  return (
    <View style={styles.container} pointerEvents="none">
      {cardsToRender.map(({ key, player, card }, idx) => {
        const seat = seatOf[player];
        if (!seat) return null;

        const start = seatOffsets[seat];
        const end = centerSlots[seat];
        const isWin = !!(winner && seatOf[winner] === seat && cardsToRender.length === 4);

        return (
          <TrickCard
            key={key}
            card={card}
            seat={seat}
            startX={start.x}
            startY={start.y}
            endX={end.x}
            endY={end.y}
            endRotate={end.rotate}
            isFlyingOut={isFlyingOut}
            winnerX={winnerOffset.x}
            winnerY={winnerOffset.y}
            delay={idx * 60}
            zIndex={idx + 1}
            isWinner={isWin}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
