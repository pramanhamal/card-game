import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  onNameSubmit: (name: string) => void;
}

export const NameInputPopup: React.FC<Props> = ({ onNameSubmit }) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={["#1e7a42", "#0d4222", "#050f08"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 300,
            backgroundColor: "rgba(10,30,15,0.9)",
            borderRadius: 16,
            padding: 32,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 12 }}>♠</Text>
          <Text
            style={{
              color: "white",
              fontSize: 28,
              fontWeight: "900",
              letterSpacing: 4,
              marginBottom: 4,
            }}
          >
            SPADES
          </Text>
          <Text
            style={{
              color: "rgba(128,128,128,0.7)",
              fontSize: 10,
              letterSpacing: 2,
              marginBottom: 24,
            }}
          >
            MULTIPLAYER CARD GAME
          </Text>

          <Text
            style={{
              color: "rgba(200,200,200,0.7)",
              fontSize: 12,
              letterSpacing: 1,
              marginBottom: 8,
              alignSelf: "flex-start",
            }}
          >
            YOUR NAME
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleSubmit}
            placeholder="Enter your name…"
            placeholderTextColor="rgba(128,128,128,0.5)"
            style={{
              width: "100%",
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              borderRadius: 10,
              color: "white",
              fontSize: 14,
              fontWeight: "500",
              marginBottom: 16,
            }}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={!name.trim()}
            style={({ pressed }) => ({
              width: "100%",
              paddingVertical: 12,
              backgroundColor:
                name.trim() && !pressed
                  ? "#16a34a"
                  : name.trim() && pressed
                  ? "#0d5a1e"
                  : "rgba(255,255,255,0.08)",
              borderRadius: 10,
              alignItems: "center",
              opacity: name.trim() ? 1 : 0.4,
            })}
          >
            <Text
              style={{
                color: "white",
                fontSize: 14,
                fontWeight: "bold",
                letterSpacing: 0.5,
              }}
            >
              Enter the Table →
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};
