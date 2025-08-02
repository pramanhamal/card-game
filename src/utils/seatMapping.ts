// src/utils/seatMapping.ts
import { PlayerId, Card } from "../types/spades";

export const SEAT_ORDER: PlayerId[] = ["north", "east", "south", "west"];

/**
 * Rotate a canonical server seat so that viewerSeat appears as "south" locally.
 * e.g., if viewerSeat="north", then serverSeat="north" maps to local "south".
 */
export function mapSeatForView(serverSeat: PlayerId, viewerSeat: PlayerId): PlayerId {
  const viewerIndex = SEAT_ORDER.indexOf(viewerSeat);
  const targetIndex = SEAT_ORDER.indexOf("south"); // always 2
  const rotation = (targetIndex - viewerIndex + 4) % 4;
  const serverIndex = SEAT_ORDER.indexOf(serverSeat);
  return SEAT_ORDER[(serverIndex + rotation) % 4];
}

export function remapHands(
  canonical: Record<PlayerId, Card[]>,
  viewerSeat: PlayerId
): Record<PlayerId, Card[]> {
  const local: Record<PlayerId, Card[]> = {
    north: [],
    east: [],
    south: [],
    west: [],
  };
  SEAT_ORDER.forEach((serverSeat) => {
    const localSeat = mapSeatForView(serverSeat, viewerSeat);
    local[localSeat] = canonical[serverSeat];
  });
  return local;
}

export function remapTrick(
  trick: Record<PlayerId, Card | null>,
  viewerSeat: PlayerId
): Record<PlayerId, Card | null> {
  const local: Record<PlayerId, Card | null> = {
    north: null,
    east: null,
    south: null,
    west: null,
  };
  SEAT_ORDER.forEach((serverSeat) => {
    const localSeat = mapSeatForView(serverSeat, viewerSeat);
    local[localSeat] = trick[serverSeat];
  });
  return local;
}

export function remapAggregates<T>(
  aggregate: Record<PlayerId, T>,
  viewerSeat: PlayerId
): Record<PlayerId, T> {
  const local: Record<PlayerId, T> = {
    north: aggregate.north,
    east: aggregate.east,
    south: aggregate.south,
    west: aggregate.west,
  } as any;
  SEAT_ORDER.forEach((serverSeat) => {
    const localSeat = mapSeatForView(serverSeat, viewerSeat);
    local[localSeat] = aggregate[serverSeat];
  });
  return local;
}

export function remapTurn(
  canonicalTurn: PlayerId | null,
  viewerSeat: PlayerId
): PlayerId | null {
  if (!canonicalTurn) return null;
  return mapSeatForView(canonicalTurn, viewerSeat);
}

/**
 * Remap player names so viewer sees themselves as "You" at south.
 */
export function remapNames(
  canonicalNames: Record<PlayerId, string>,
  viewerSeat: PlayerId
): Record<PlayerId, string> {
  const local: Record<PlayerId, string> = {
    north: "",
    east: "",
    south: "",
    west: "",
  };
  SEAT_ORDER.forEach((serverSeat) => {
    const localSeat = mapSeatForView(serverSeat, viewerSeat);
    local[localSeat] = canonicalNames[serverSeat];
  });
  local.south = "You"; // override self-label
  return local;
}
