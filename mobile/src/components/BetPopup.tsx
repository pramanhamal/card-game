import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface Props {
  onSelect: (bid: number) => void;
}

const SUIT_SYMBOLS = ["♠", "♥", "♦", "♣"];
const BIDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

interface BidButtonProps {
  bid: number;
  onPress: (bid: number) => void;
}

const BidButton: React.FC<BidButtonProps> = ({ bid, onPress }) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isNil = bid === 0;

  return (
    <Animated.View style={[styles.bidButtonWrapper, animStyle]}>
      <Pressable
        onPress={() => {
          scale.value = withSpring(0.94, { stiffness: 500, damping: 20 });
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
        style={[styles.bidButton, isNil ? styles.bidButtonNil : styles.bidButtonNormal]}
      >
        <Text style={[styles.bidButtonText, isNil ? styles.bidButtonTextNil : null]}>
          {isNil ? "NIL" : `${bid}`}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export const BetPopup: React.FC<Props> = ({ onSelect }) => {
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

            {/* Bid grid - 4 columns */}
            <View style={styles.grid}>
              {BIDS.map((b) => (
                <BidButton key={b} bid={b} onPress={onSelect} />
              ))}
            </View>

            <Text style={styles.footer}>Nil bid = 0 tricks scored</Text>
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
    width: 280,
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
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  suitRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  suitSymbol: {
    fontSize: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  bidButtonWrapper: {
    width: "22%",
  },
  bidButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  bidButtonNormal: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  bidButtonNil: {
    backgroundColor: "rgba(239,68,68,0.18)",
    borderColor: "rgba(239,68,68,0.4)",
  },
  bidButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
  },
  bidButtonTextNil: {
    color: "#fca5a5",
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    marginTop: 16,
  },
});
