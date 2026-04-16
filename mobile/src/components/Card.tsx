import React from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
  Pressable,
} from "react-native";
import type { Card as CardType } from "../types/spades";
import cardImages from "../utils/cardImages";

const CARD_WIDTH = 56;
const CARD_HEIGHT = 84;

interface CardProps {
  card: CardType;
  faceUp?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  card,
  faceUp = true,
  style,
  onPress,
}) => {
  const imageKey = faceUp ? `${card.suit}-${card.rank}` : "back-maroon";
  const imageSource = cardImages[imageKey];

  const content = (
    <View style={[styles.card, style]}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>
            {faceUp ? `${card.rank[0] || card.rank}` : "?"}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 6,
    backgroundColor: "white",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});

export { CARD_WIDTH, CARD_HEIGHT };
