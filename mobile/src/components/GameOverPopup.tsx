import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import type { PlayerId, GameResult } from "../types/spades";

const SEAT_ORDER: PlayerId[] = ["north", "east", "south", "west"];
const MEDALS = ["🥇", "🥈", "🥉", "🎖️"];

interface Props {
  totalScores: Record<PlayerId, number>;
  seatingNames: Record<PlayerId, string>;
  gameHistory: GameResult[];
  onPlayAgain: () => void;
  visible?: boolean;
}

export const GameOverPopup: React.FC<Props> = ({
  totalScores,
  seatingNames,
  gameHistory,
  onPlayAgain,
  visible = true,
}) => {
  const sorted = [...SEAT_ORDER].sort((a, b) => totalScores[b] - totalScores[a]);
  const topScore = totalScores[sorted[0]];
  const winners = sorted.filter((p) => totalScores[p] === topScore);

  const trophyScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      trophyScale.value = withSpring(1, { damping: 12 });
    }
  }, [visible]);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient
          colors={["#1c1c2e", "#12121c"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Trophy */}
            <Animated.View style={[styles.trophyWrapper, trophyStyle]}>
              <Text style={styles.trophy}>🏆</Text>
            </Animated.View>

            <Text style={styles.title}>Game Complete!</Text>
            <Text style={styles.subtitle}>
              {winners.map((w) => seatingNames[w]).join(" & ")} wins!
            </Text>

            {/* Final Scores */}
            <Text style={styles.sectionTitle}>Final Scores</Text>
            {sorted.map((p, idx) => (
              <View
                key={p}
                style={[
                  styles.scoreRow,
                  idx === 0 ? styles.scoreRowFirst : styles.scoreRowOther,
                ]}
              >
                <View style={styles.scoreLeft}>
                  <Text style={styles.medal}>{MEDALS[idx]}</Text>
                  <View>
                    <Text
                      style={[
                        styles.playerName,
                        { color: idx === 0 ? "#ffd700" : "rgba(255,255,255,0.9)" },
                      ]}
                    >
                      {seatingNames[p]}
                    </Text>
                    <Text style={styles.seatLabel}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.scoreValue,
                    { color: idx === 0 ? "#ffd700" : "rgba(255,255,255,0.8)" },
                  ]}
                >
                  {totalScores[p]}
                </Text>
              </View>
            ))}

            {/* Round Breakdown */}
            {gameHistory.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                  Round Breakdown
                </Text>
                {gameHistory.map((round, roundIdx) => (
                  <View key={roundIdx} style={styles.roundCard}>
                    <Text style={styles.roundTitle}>Round {round.gameId}</Text>
                    <View style={styles.roundRow}>
                      {SEAT_ORDER.map((seat) => (
                        <View key={seat} style={styles.roundCell}>
                          <Text style={styles.roundCellName}>
                            {seatingNames[seat]}
                          </Text>
                          <Text style={styles.roundCellPts}>
                            {round.scores[seat]} pts
                          </Text>
                          <Text style={styles.roundCellDetail}>
                            {round.tricksWon[seat]}w / {round.bids[seat]}b
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Play Again */}
            <Pressable
              onPress={onPlayAgain}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: pressed ? "#0d5a1e" : "#16a34a" },
              ]}
            >
              <Text style={styles.buttonText}>Play Again</Text>
            </Pressable>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    maxHeight: "90%",
  },
  scrollContent: {
    padding: 24,
    alignItems: "center",
  },
  trophyWrapper: {
    marginBottom: 8,
  },
  trophy: {
    fontSize: 56,
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "rgba(200,200,200,0.7)",
    fontSize: 13,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  scoreRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  scoreRowFirst: {
    backgroundColor: "rgba(255,215,0,0.14)",
    borderColor: "rgba(255,215,0,0.3)",
  },
  scoreRowOther: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.06)",
  },
  scoreLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  medal: {
    fontSize: 20,
    marginRight: 6,
  },
  playerName: {
    fontSize: 13,
    fontWeight: "600",
  },
  seatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  roundCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  roundTitle: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  roundRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roundCell: {
    alignItems: "center",
    flex: 1,
  },
  roundCellName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    marginBottom: 2,
  },
  roundCellPts: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  roundCellDetail: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
  },
  button: {
    width: "100%",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
});
