import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import type { Card } from "../types/spades";

interface Props {
  onSelect: (bid: number) => void;
  hand?: Card[];
}

const SUIT_SYMBOLS = ["♠", "♥", "♦", "♣"];
const BIDS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const AUTO_SELECT_SECONDS = 30;

function estimateHandStrength(hand: Card[]): number {
  if (!hand || hand.length === 0) return 3;
  const cardValues: Record<string, number> = {
    A: 5, K: 4, Q: 3, J: 2, "10": 1, "9": 0.5, "8": 0.3,
  };
  let strength = 0;
  for (const card of hand) {
    strength += cardValues[String(card.rank)] || 0;
  }
  const maxStrength = 65;
  const estimated = Math.max(1, Math.round((strength / maxStrength) * 8));
  return Math.min(8, estimated);
}

interface BidButtonProps {
  bid: number;
  isRecommended: boolean;
  onPress: (bid: number) => void;
}

const BidButton: React.FC<BidButtonProps> = ({ bid, isRecommended, onPress }) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isNil = bid === 0;

  let bg = "rgba(255,255,255,0.08)";
  let borderColor = "rgba(255,255,255,0.1)";
  let color = "white";

  if (isNil) {
    bg = "rgba(180,60,60,0.25)";
    borderColor = "rgba(220,80,80,0.7)";
    color = "#f87171";
  } else if (isRecommended) {
    bg = "rgba(76,175,80,0.25)";
    borderColor = "rgba(76,175,80,0.8)";
    color = "#4caf50";
  }

  return (
    <Animated.View style={[styles.bidButtonWrapper, animStyle]}>
      <Pressable
        onPress={() => {
          scale.value = withSpring(0.92, { stiffness: 500, damping: 20 });
          setTimeout(() => {
            scale.value = withSpring(1, { stiffness: 500, damping: 20 });
            onPress(bid);
          }, 100);
        }}
        onPressIn={() => {
          scale.value = withSpring(1.08, { stiffness: 500, damping: 20 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { stiffness: 500, damping: 20 });
        }}
        style={[styles.bidButton, { backgroundColor: bg, borderColor }]}
      >
        <Text style={[styles.bidButtonText, { color }]}>
          {isNil ? "NIL" : `${bid}`}
        </Text>
        {isRecommended && (
          <Text style={styles.recommendedLabel}>★</Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

export const BetPopup: React.FC<Props> = ({ onSelect, hand = [] }) => {
  const [timeLeft, setTimeLeft] = useState(AUTO_SELECT_SECONDS);
  const recommendedBid = Math.min(8, Math.max(1, estimateHandStrength(hand)));

  // Auto-select countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onSelect(recommendedBid);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [recommendedBid, onSelect]);

  const progressPct = (timeLeft / AUTO_SELECT_SECONDS) * 100;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={["#1a3a1a", "#0d2410"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.suitRow}>
                {SUIT_SYMBOLS.map((s, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.suitSymbol,
                      { color: i < 2 ? "#e8e8e8" : "#d44444" },
                    ]}
                  >
                    {s}
                  </Text>
                ))}
              </View>
              <Text style={styles.title}>Place Your Bid</Text>
              <Text style={styles.subtitle}>How many tricks will you win?</Text>
            </View>

            {/* Bid grid */}
            <View style={styles.grid}>
              {BIDS.map((b) => (
                <BidButton
                  key={b}
                  bid={b}
                  isRecommended={b === recommendedBid}
                  onPress={onSelect}
                />
              ))}
            </View>

            {/* Countdown */}
            <View style={styles.countdownContainer}>
              <View style={styles.countdownRow}>
                <Text style={styles.countdownLabel}>Auto-select in</Text>
                <Text style={styles.countdownValue}>{timeLeft}s</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${progressPct}%` as any }]} />
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    width: 320,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  gradient: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  suitRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  suitSymbol: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    marginTop: 3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  bidButtonWrapper: {
    width: "20%",
  },
  bidButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  bidButtonText: {
    fontSize: 15,
    fontWeight: "bold",
  },
  recommendedLabel: {
    fontSize: 8,
    color: "#4caf50",
    marginTop: 1,
  },
  countdownContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  countdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  countdownLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  countdownValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 3,
  },
});
