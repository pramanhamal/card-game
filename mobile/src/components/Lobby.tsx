import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export interface Player {
  id: string;
  name: string;
  seat?: string;
  isAI?: boolean;
}

export interface Room {
  id: string;
  players: Player[];
  started?: boolean;
}

interface Props {
  rooms: Record<string, Room>;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export const Lobby: React.FC<Props> = ({ rooms, onCreateRoom, onJoinRoom }) => {
  const [joinId, setJoinId] = useState("");

  const roomList = Object.entries(rooms);

  const renderRoom = ({ item: [id, room] }: { item: [string, Room] }) => (
    <View
      key={id}
      style={{
        backgroundColor: "rgba(0,0,0,0.38)",
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "white",
              fontSize: 12,
              fontWeight: "700",
              fontFamily: "monospace",
              marginBottom: 4,
            }}
          >
            {id}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {room.players.map((p) => (
              <View
                key={p.id}
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  paddingVertical: 3,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 10,
                  }}
                >
                  {p.name || "?"}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Pressable
          onPress={() => onJoinRoom(id)}
          disabled={room.started || room.players.length >= 4}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor:
              room.started || room.players.length >= 4
                ? "rgba(255,255,255,0.08)"
                : "#16a34a",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              color: "white",
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            {room.players.length >= 4 ? "Full" : "Join"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={["#1e7a42", "#0d4222", "#060f08"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ alignItems: "center" }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 32,
            fontWeight: "900",
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          ♠ SPADES
        </Text>
        <Text
          style={{
            color: "rgba(150,150,150,0.7)",
            fontSize: 12,
            marginBottom: 24,
          }}
        >
          Find or create a room
        </Text>

        <View style={{ width: "100%", maxWidth: 400, marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <TextInput
              value={joinId}
              onChangeText={setJoinId}
              placeholder="Room ID…"
              placeholderTextColor="rgba(128,128,128,0.5)"
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: "rgba(255,255,255,0.07)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "white",
                fontSize: 12,
              }}
            />
            <Pressable
              onPress={() => joinId.trim() && onJoinRoom(joinId.trim())}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: pressed ? "#2d5fa3" : "#4f46e5",
                borderRadius: 10,
                justifyContent: "center",
              })}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
                Join
              </Text>
            </Pressable>
            <Pressable
              onPress={onCreateRoom}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: pressed ? "#0d5a1e" : "#16a34a",
                borderRadius: 10,
              })}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
                + New
              </Text>
            </Pressable>
          </View>

          {roomList.length === 0 ? (
            <Text
              style={{
                color: "rgba(150,150,150,0.6)",
                fontSize: 12,
                textAlign: "center",
                marginTop: 32,
              }}
            >
              No rooms yet — create one to start!
            </Text>
          ) : (
            <FlatList
              data={roomList}
              renderItem={renderRoom}
              keyExtractor={([id]) => id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};
