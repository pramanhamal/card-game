import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import type { PlayerId } from "../types/spades";

const SEAT_ORDER: PlayerId[] = ["north", "east", "south", "west"];
const MEDALS = ["🥇", "🥈", "🥉", "🎖️"];

interface Props {
  totalScores: Record<PlayerId, number>;
  onPlayAgain: () => void;
  visible?: boolean;
}

export const GameOverPopup: React.FC<Props> = ({
  totalScores,
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
  }, [visible, trophyScale]);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

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
          colors={["#1c1c2e", "#12121c"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: "100%",
            maxWidth: 320,
            borderRadius: 16,
            padding: 28,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            alignItems: "center",
          }}
        >
          <Animated.View style={trophyStyle}>
            <Text style={{ fontSize: 60, marginBottom: 12 }}>🏆</Text>
          </Animated.View>

          <Text
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: "bold",
              marginBottom: 4,
            }}
          >
            Game Over!
          </Text>
          <Text
            style={{
              color: "rgba(200,200,200,0.7)",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {winners.map((w) => w.toUpperCase()).join(" & ")} wins!
          </Text>

          {sorted.map((p, idx) => (
            <View
              key={p}
              style={{
                width: "100%",
                backgroundColor:
                  idx === 0
                    ? "rgba(255,215,0,0.14)"
                    : "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor:
                  idx === 0
                    ? "rgba(255,215,0,0.3)"
                    : "rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: 12,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>
                  {MEDALS[idx]}
                </Text>
                <Text
                  style={{
                    color:
                      idx === 0 ? "#ffd700" : "rgba(255,255,255,0.8)",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {p.toUpperCase()}
                </Text>
              </View>
              <Text
                style={{
                  color: idx === 0 ? "#ffd700" : "rgba(255,255,255,0.7)",
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                {totalScores[p]}
              </Text>
            </View>
          ))}

          <Pressable
            onPress={onPlayAgain}
            style={({ pressed }) => ({
              width: "100%",
              marginTop: 20,
              paddingVertical: 12,
              backgroundColor: pressed ? "#0d5a1e" : "#16a34a",
              borderRadius: 10,
              alignItems: "center",
            })}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              Play Again
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
};
