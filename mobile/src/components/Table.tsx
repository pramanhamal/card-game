// src/components/Table.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { GameState, PlayerId, Card as CardType } from "../types/spades";
import { Opponent } from "./Opponent";
import { Card, CARD_WIDTH, CARD_HEIGHT } from "./Card";
import { TrickPile } from "./TrickPile";
import { legalMoves, determineTrickWinner } from "../utils/gameLogic";

interface TableProps {
  state: GameState;
  playCard: (player: PlayerId, card: CardType) => void;
  you: PlayerId;
  onEvaluateTrick: () => void;
  nameMap?: Record<PlayerId, string>;
}

const defaultNameMap: Record<PlayerId, string> = {
  north: "North",
  west: "West",
  east: "East",
  south: "You",
};

const rankOrder: Array<number | "J" | "Q" | "K" | "A"> = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A",
];

function sortByRank(cards: CardType[]) {
  return [...cards].sort(
    (a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
  );
}

const SEAT_CLOCKWISE: PlayerId[] = ["north", "east", "south", "west"];

interface HandCardProps {
  card: CardType;
  angleDeg: number;
  cardX: number;
  cardY: number;
  canPlay: boolean;
  isActive: boolean;
  index: number;
  onPress: () => void;
}

const HandCard: React.FC<HandCardProps> = ({
  card,
  angleDeg,
  cardX,
  cardY,
  canPlay,
  isActive,
  index,
  onPress,
}) => {
  const translateY = useSharedValue(100);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withSpring(0, {
      stiffness: 380,
      damping: 30,
      delay: index * 25,
    } as any);
  }, []);

  useEffect(() => {
    if (canPlay) {
      scale.value = withSpring(1.08, { stiffness: 400, damping: 25 });
    } else {
      scale.value = withSpring(1, { stiffness: 400, damping: 25 });
    }
  }, [canPlay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.handCardWrapper,
        {
          left: cardX,
          top: cardY,
          transform: [{ rotate: `${angleDeg}deg` }],
          zIndex: index + 1,
        },
        animStyle,
      ]}
    >
      <Pressable
        onPress={canPlay ? onPress : undefined}
        style={({ pressed }) => [
          styles.cardPressable,
          pressed && canPlay ? { opacity: 0.85 } : undefined,
        ]}
      >
        <View
          style={[
            styles.cardInner,
            canPlay
              ? styles.cardCanPlay
              : isActive
              ? styles.cardCantPlay
              : null,
          ]}
        >
          <Card card={card} faceUp />
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const Table: React.FC<TableProps> = ({
  state: currentState,
  playCard,
  you,
  onEvaluateTrick,
  nameMap = defaultNameMap,
}) => {
  const { width, height } = useWindowDimensions();
  const { trick: serverTrick, round, turn, hands, tricksWon } = currentState;

  const [visualTrick, setVisualTrick] = useState(serverTrick);
  const [lastWinner, setLastWinner] = useState<PlayerId | null>(null);
  const prevStateRef = useRef<GameState>(currentState);

  // Detect trick transition: 3→0 cards means last card was just played server-side
  useEffect(() => {
    const prevState = prevStateRef.current;
    const prevTrick = prevState.trick;
    const currTrick = currentState.trick;

    const prevCount = Object.values(prevTrick).filter(Boolean).length;
    const currCount = Object.values(currTrick).filter(Boolean).length;

    if (prevCount === 3 && currCount === 0) {
      const lastPlayerToPlay = prevState.turn;
      if (lastPlayerToPlay) {
        const prevHand = prevState.hands[lastPlayerToPlay] || [];
        const currHand = currentState.hands[lastPlayerToPlay] || [];
        const playedCard = prevHand.find(
          (c) =>
            !currHand.some((sc) => sc.rank === c.rank && sc.suit === c.suit)
        );
        if (playedCard) {
          const fullTrick = { ...prevTrick, [lastPlayerToPlay]: playedCard };
          setVisualTrick(fullTrick);
        } else {
          setVisualTrick(currTrick);
        }
      }
    } else {
      setVisualTrick(currTrick);
    }

    prevStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    const visualTrickCount = Object.values(visualTrick).filter(Boolean).length;
    if (visualTrickCount === 4) {
      try {
        const winner = determineTrickWinner(visualTrick);
        setLastWinner(winner);
      } catch {
        // ignore invalid trick
      }
    } else {
      setLastWinner(null);
    }
  }, [visualTrick]);

  const handleFlyOutEnd = () => {
    setVisualTrick(currentState.trick);
    onEvaluateTrick();
  };

  // Map seats to UI positions based on who "you" are
  const youIdx = SEAT_CLOCKWISE.indexOf(you);
  const clockwiseFromYou = [
    ...SEAT_CLOCKWISE.slice(youIdx),
    ...SEAT_CLOCKWISE.slice(0, youIdx),
  ];

  const uiMapping: Record<string, PlayerId> = {
    south: clockwiseFromYou[0],
    west: clockwiseFromYou[1],
    north: clockwiseFromYou[2],
    east: clockwiseFromYou[3],
  };

  const seatOf: Record<PlayerId, "north" | "east" | "south" | "west"> =
    {} as any;
  Object.entries(uiMapping).forEach(([seat, pid]) => {
    seatOf[pid as PlayerId] = seat as "north" | "east" | "south" | "west";
  });

  const trickIsFull = Object.values(visualTrick).every((c) => c !== null);
  const isMyTurn = turn === you && !trickIsFull;

  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isMyTurn) {
      timer = setTimeout(() => setIsActive(true), 400);
    } else {
      setIsActive(false);
    }
    return () => clearTimeout(timer);
  }, [isMyTurn]);

  const legalSet = new Set(
    isActive
      ? legalMoves(currentState, you).map((c) => `${c.suit}-${c.rank}`)
      : []
  );

  // Sort hand: alternate red/black suits, then by rank within suit
  const yourHand = hands[you] || [];
  const firstCard = yourHand[0];
  const firstIsBlack = firstCard
    ? firstCard.suit === "spades" || firstCard.suit === "clubs"
    : false;

  const suitsInHand = Array.from(new Set(yourHand.map((c) => c.suit)));
  const redSuits = suitsInHand
    .filter((s) => s === "hearts" || s === "diamonds")
    .sort();
  const blackSuits = suitsInHand
    .filter((s) => s === "spades" || s === "clubs")
    .sort();
  const groupLists = firstIsBlack
    ? [blackSuits, redSuits]
    : [redSuits, blackSuits];
  const indices: [number, number] = [0, 0];
  const suitOrder: string[] = [];
  let g = 0;
  while (suitOrder.length < suitsInHand.length) {
    const list = groupLists[g];
    const idx = indices[g]++;
    if (idx < list.length) suitOrder.push(list[idx]);
    g = 1 - g;
  }
  const sortedHand = suitOrder.flatMap((suit) =>
    sortByRank(yourHand.filter((c) => c.suit === suit))
  );

  // Fan layout using polar coordinates
  const FAN_RADIUS = Math.min(width, height) * 0.75;
  const CENTER_X = width / 2;
  const CENTER_Y = height + FAN_RADIUS * 0.6;

  const totalCards = sortedHand.length;
  const totalArc = Math.min(80, totalCards * 5.5);
  const startAngle = -totalArc / 2;
  const angleStep = totalCards > 1 ? totalArc / (totalCards - 1) : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1e7a42", "#145c31", "#0d4222"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Table oval border */}
      <View style={styles.tableOval} pointerEvents="none" />

      {/* Round / Turn indicator */}
      <View style={styles.infoBar} pointerEvents="none">
        <Text style={styles.infoRoundLabel}>Round</Text>
        <Text style={styles.infoRound}>{round}</Text>
        <Text style={styles.infoDot}>·</Text>
        <Text
          style={[
            styles.infoTurn,
            turn === you ? styles.infoTurnYou : styles.infoTurnOther,
          ]}
        >
          {turn === you ? "Your turn" : `${nameMap[turn]}'s turn`}
        </Text>
      </View>

      {/* Trick pile */}
      <TrickPile
        trick={visualTrick}
        winner={lastWinner}
        seatOf={seatOf}
        onFlyOutEnd={handleFlyOutEnd}
        containerWidth={width}
        containerHeight={height}
      />

      {/* Opponents */}
      <Opponent
        position="north"
        name={nameMap[uiMapping.north as PlayerId]}
        cardsCount={hands[uiMapping.north as PlayerId]?.length ?? 0}
        tricks={tricksWon[uiMapping.north as PlayerId] ?? 0}
        isCurrentTurn={turn === uiMapping.north}
      />
      <Opponent
        position="west"
        name={nameMap[uiMapping.west as PlayerId]}
        cardsCount={hands[uiMapping.west as PlayerId]?.length ?? 0}
        tricks={tricksWon[uiMapping.west as PlayerId] ?? 0}
        isCurrentTurn={turn === uiMapping.west}
      />
      <Opponent
        position="east"
        name={nameMap[uiMapping.east as PlayerId]}
        cardsCount={hands[uiMapping.east as PlayerId]?.length ?? 0}
        tricks={tricksWon[uiMapping.east as PlayerId] ?? 0}
        isCurrentTurn={turn === uiMapping.east}
      />

      {/* Your hand — fan at bottom */}
      <View style={styles.handArea} pointerEvents="box-none">
        {/* Your name badge */}
        <View
          style={[
            styles.nameBadge,
            isActive ? styles.nameBadgeActive : styles.nameBadgeInactive,
          ]}
        >
          <Text
            style={[
              styles.nameBadgeText,
              isActive ? styles.nameBadgeTextActive : styles.nameBadgeTextInactive,
            ]}
          >
            {nameMap[you]}
            {isActive ? " — Your Turn" : ""}
          </Text>
        </View>

        {/* Fan cards */}
        {sortedHand.map((c, i) => {
          const angleDeg = totalCards > 1 ? startAngle + i * angleStep : 0;
          const angleRad = (angleDeg * Math.PI) / 180;
          const cardX =
            CENTER_X + FAN_RADIUS * Math.sin(angleRad) - CARD_WIDTH / 2;
          const cardY =
            CENTER_Y - FAN_RADIUS * Math.cos(angleRad) - CARD_HEIGHT / 2;
          const key = `${c.suit}-${c.rank}`;
          const canPlay = isActive && legalSet.has(key);

          return (
            <HandCard
              key={key}
              card={c}
              angleDeg={angleDeg}
              cardX={cardX}
              cardY={cardY}
              canPlay={canPlay}
              isActive={isActive}
              index={i}
              onPress={() => playCard(you, c)}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  tableOval: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 200,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.07)",
  },
  infoBar: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  infoRoundLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
  },
  infoRound: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },
  infoDot: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    marginHorizontal: 2,
  },
  infoTurn: {
    fontSize: 13,
  },
  infoTurnYou: {
    color: "#fde047",
    fontWeight: "bold",
  },
  infoTurnOther: {
    color: "rgba(255,255,255,0.8)",
  },
  handArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  handCardWrapper: {
    position: "absolute",
    transformOrigin: "center bottom",
  },
  cardPressable: {},
  cardInner: {
    borderRadius: 6,
    overflow: "hidden",
  },
  cardCanPlay: {
    borderWidth: 2,
    borderColor: "#fde047",
    shadowColor: "#ffd700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  cardCantPlay: {
    opacity: 0.55,
  },
  nameBadge: {
    position: "absolute",
    bottom: 4,
    left: "50%" as any,
    transform: [{ translateX: -60 }],
    zIndex: 20,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 3,
    alignItems: "center",
  },
  nameBadgeActive: {
    backgroundColor: "rgba(255,210,0,0.85)",
  },
  nameBadgeInactive: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  nameBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  nameBadgeTextActive: {
    color: "#1a1a00",
  },
  nameBadgeTextInactive: {
    color: "#ccc",
  },
});
