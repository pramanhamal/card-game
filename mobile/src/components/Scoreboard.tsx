import React from "react";
import { View, Text } from "react-native";
import type { PlayerId } from "../types/spades";

interface Props {
  bids: Record<PlayerId, number>;
  tricksWon: Record<PlayerId, number>;
  nameMap?: Record<PlayerId, string>;
  yourSeat?: PlayerId;
}

export const Scoreboard: React.FC<Props> = ({
  bids,
  tricksWon,
  nameMap,
  yourSeat,
}) => {
  const order: PlayerId[] = ["north", "east", "south", "west"];

  const statusColor = (p: PlayerId) => {
    const bid = bids[p];
    const won = tricksWon[p];
    if (won >= bid) return "#4ade80";
    if (won >= bid - 1) return "#facc15";
    return "#f87171";
  };

  return (
    <View
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        gap: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      {order.map((p) => {
        const isYou = p === yourSeat;
        const bid = bids[p];
        const won = tricksWon[p];
        const color = statusColor(p);
        const displayName = nameMap?.[p] || p.toUpperCase();

        return (
          <View key={p} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                color: isYou ? "#ffd700" : "rgba(255,255,255,0.7)",
                fontSize: 10,
                fontWeight: "700",
              }}
              numberOfLines={1}
            >
              {isYou ? "You" : displayName}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text
                style={{
                  color,
                  fontSize: 18,
                  fontWeight: "900",
                }}
              >
                {won}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 10,
                  fontWeight: "600",
                  marginLeft: 2,
                }}
              >
                /{bid}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
