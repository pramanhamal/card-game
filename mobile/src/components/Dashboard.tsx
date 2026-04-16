import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { GameResult, PlayerId } from "../types/spades";

const SEAT_ORDER: PlayerId[] = ["north", "east", "south", "west"];
const MEDALS = ["🥇", "🥈", "🥉", "🎖️"];

interface Props {
  history: GameResult[];
  onClose: () => void;
  playerNames: Record<PlayerId, string>;
  yourSeat?: PlayerId;
  visible?: boolean;
}

export const Dashboard: React.FC<Props> = ({
  history,
  onClose,
  playerNames,
  yourSeat,
  visible = true,
}) => {
  if (history.length === 0 || !visible) return null;

  const lastRound = history[history.length - 1]!;
  const scores: Record<PlayerId, number> =
    lastRound.totalScores || lastRound.scores;

  const sorted = [...SEAT_ORDER].sort((a, b) => scores[b] - scores[a]);

  const renderPlayer = ({ item: p, index: idx }: { item: PlayerId; index: number }) => {
    const roundScore = lastRound.scores[p];
    const totalScore = scores[p];
    const isYou = p === yourSeat;

    return (
      <View
        style={{
          backgroundColor:
            idx === 0
              ? "rgba(255,215,0,0.1)"
              : isYou
              ? "rgba(99,102,241,0.12)"
              : "rgba(255,255,255,0.04)",
          borderWidth: 1,
          borderColor:
            idx === 0
              ? "rgba(255,215,0,0.25)"
              : isYou
              ? "rgba(99,102,241,0.25)"
              : "rgba(255,255,255,0.06)",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>
            {MEDALS[idx] || ""}
          </Text>
          <View>
            <Text
              style={{
                color: idx === 0 ? "#ffd700" : "rgba(255,255,255,0.9)",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {playerNames[p] || p.toUpperCase()}{isYou ? " (You)" : ""}
            </Text>
            <Text style={{ color: "rgba(150,150,150,0.7)", fontSize: 10 }}>
              Bid {lastRound.bids[p]} · Won {lastRound.tricksWon[p]}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              color: idx === 0 ? "#ffd700" : "rgba(255,255,255,0.8)",
              fontSize: 16,
              fontWeight: "900",
            }}
          >
            {totalScore}
          </Text>
          <Text
            style={{
              color: roundScore >= 0 ? "#4ade80" : "#f87171",
              fontSize: 10,
              fontWeight: "700",
            }}
          >
            {roundScore >= 0 ? "+" : ""}
            {roundScore}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.72)",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <LinearGradient
          colors={["#1c1c2e", "#0e0e1a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: "100%",
            maxWidth: 360,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.07)",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
              Leaderboard
            </Text>
            <Text
              style={{
                color: "rgba(150,150,150,0.7)",
                fontSize: 11,
              }}
            >
              Round {lastRound.gameId}
            </Text>
          </View>

          <FlatList
            data={sorted}
            renderItem={renderPlayer}
            keyExtractor={(item) => item}
            scrollEnabled={false}
            style={{ padding: 16 }}
          />

          <View style={{ padding: 16 }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                width: "100%",
                paddingVertical: 12,
                backgroundColor: pressed ? "#0d5a1e" : "#16a34a",
                borderRadius: 10,
                alignItems: "center",
              })}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Continue →
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};
