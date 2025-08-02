// src/components/Table.tsx
import React, { useMemo } from "react";
import { PlayerId, Card } from "../types/spades";
import { legalMoves } from "../utils/gameLogic";

export interface TableState {
  hands?: Record<PlayerId, Card[]>;
  trick?: Record<PlayerId, Card | null>;
  turn?: PlayerId; // changed: no null, only optional
  bids?: Record<PlayerId, number | null>;
  tricksWon?: Record<PlayerId, number>;
  round?: number;
  spadesBroken?: boolean; // optional, used by legalMoves
}

export interface TableProps {
  state: TableState;
  playCard: (player: PlayerId, card: Card) => void;
  you: PlayerId; // in local view this is always "south"
  onEvaluateTrick: () => void;
  nameMap?: Record<PlayerId, string>;
}

const defaultNameMap: Record<PlayerId, string> = {
  north: "North",
  east: "East",
  south: "You",
  west: "West",
};

const suitEmoji: Record<string, string> = {
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
};

const rankOrder: string[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

/**
 * Simple comparator: sort by suit (clubs, diamonds, hearts, spades) then rank.
 */
function sortHand(cards: Card[]): Card[] {
  const suitOrder = ["clubs", "diamonds", "hearts", "spades"];
  return [...cards].sort((a, b) => {
    const suitDiff =
      suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    if (suitDiff !== 0) return suitDiff;
    return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
  });
}

export function Table({
  state,
  playCard,
  you,
  onEvaluateTrick,
  nameMap = defaultNameMap,
}: TableProps) {
  const hands = state.hands ?? {
    north: [],
    east: [],
    south: [],
    west: [],
  };
  const trick = state.trick ?? {
    north: null,
    east: null,
    south: null,
    west: null,
  };
  const turn = state.turn ?? undefined;
  const bids = state.bids ?? {
    north: null,
    east: null,
    south: null,
    west: null,
  };
  const tricksWon = state.tricksWon ?? {
    north: 0,
    east: 0,
    south: 0,
    west: 0,
  };

  // Legal cards for the current viewer (only if it's their turn)
  const legalForYou = useMemo(
    () => (turn === you ? legalMoves(state as any, you) : []),
    [state, you, turn]
  );

  // Helpers to display current played card
  const getPlayedCard = (seat: PlayerId) => trick[seat];
  const isYourTurn = turn === you;

  const handleCardClick = (card: Card) => {
    if (!isYourTurn) return;
    const isLegal = legalForYou.some(
      (c) => c.suit === card.suit && c.rank === card.rank
    );
    if (!isLegal) return;
    playCard(you, card);
  };

  // Render hand (only full visible for 'you')
  const renderHand = (cards: Card[]) => {
    if (!cards) return null;
    const sorted = sortHand(cards);
    return (
      <div className="flex gap-1 overflow-x-auto py-2">
        {sorted.map((c, i) => {
          const legal =
            isYourTurn &&
            legalForYou.some(
              (lm) => lm.suit === c.suit && lm.rank === c.rank
            );
          return (
            <div
              key={`${c.suit}-${c.rank}-${i}`}
              onClick={() => handleCardClick(c)}
              className={`relative cursor-pointer select-none border rounded-md px-2 py-1 min-w-[48px] flex flex-col items-center justify-center text-xs font-medium
                ${
                  legal
                    ? "ring-2 ring-yellow-400"
                    : isYourTurn
                    ? "opacity-80"
                    : "opacity-60"
                } bg-white shadow`}
              aria-label={`${c.rank} of ${c.suit}`}
              title={
                legal
                  ? `${c.rank}${suitEmoji[c.suit]} (legal)`
                  : `${c.rank}${suitEmoji[c.suit]}`
              }
            >
              <div className="flex flex-col items-center">
                <div>{c.rank}</div>
                <div>{suitEmoji[c.suit]}</div>
              </div>
              {isYourTurn && legal && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] rounded-full px-1">
                  ✔
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Opponent / seat info card
  const Opponent = ({
    position,
    name,
  }: {
    position: PlayerId;
    name: string;
  }) => {
    const played = getPlayedCard(position);
    return (
      <div className="flex flex-col items-center text-center">
        <div className="text-[10px] font-semibold">{name}</div>
        <div className="text-[9px]">Bid: {bids[position] ?? "-"}</div>
        <div className="text-[9px]">Won: {tricksWon[position]}</div>
        <div className="mt-1">
          {played ? (
            <div className="inline-block border rounded px-2 py-1 text-xs bg-white">
              <div>{played.rank}</div>
              <div>{suitEmoji[played.suit]}</div>
            </div>
          ) : (
            <div className="inline-block border rounded px-3 py-2 bg-gray-200 text-[10px]">
              {position !== you ? (
                <div>{hands[position]?.length ?? 0} cards</div>
              ) : (
                <div>Your hand</div>
              )}
            </div>
          )}
        </div>
        {turn === position && (
          <div className="mt-1 text-[10px] font-bold text-green-400">
            ▶️ turn
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center text-white">
      {/* North */}
      <div className="absolute top-4 flex flex-col items-center gap-1">
        <Opponent position="north" name={nameMap.north} />
      </div>

      {/* West */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center gap-1">
        <Opponent position="west" name={nameMap.west} />
      </div>

      {/* East */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center gap-1">
        <Opponent position="east" name={nameMap.east} />
      </div>

      {/* Center trick display */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm mb-1">
          {state.round !== undefined && <>Round {state.round}</>}
        </div>
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="invisible">.</div>
          <div className="flex flex-col items-center">
            <div className="text-[10px] mb-1">Current Trick</div>
            <div className="flex gap-2">
              {(["north", "east", "south", "west"] as PlayerId[]).map(
                (seat) => {
                  const card = trick[seat];
                  return (
                    <div
                      key={`trick-${seat}`}
                      className="flex flex-col items-center text-center"
                    >
                      <div className="text-[9px]">{nameMap[seat]}</div>
                      {card ? (
                        <div className="border rounded px-2 py-1 bg-white text-black text-xs min-w-[40px]">
                          <div>{card.rank}</div>
                          <div>{suitEmoji[card.suit]}</div>
                        </div>
                      ) : (
                        <div className="border rounded px-3 py-2 bg-gray-700 text-[10px] min-w-[40px]">
                          —
                        </div>
                      )}
                      {turn === seat && (
                        <div className="text-[10px] text-green-300 mt-1">
                          {seat === you ? "Your turn" : "Turn"}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
          <div className="invisible">.</div>
        </div>
      </div>

      {/* South (you) */}
      <div className="absolute bottom-4 w-full flex flex-col items-center">
        <div className="mb-2 flex gap-4">
          <Opponent position="south" name={nameMap.south} />
        </div>
        <div className="w-full max-w-3xl">
          {renderHand(hands[you] || [])}
          {!isYourTurn && (
            <div className="mt-1 text-[12px] text-gray-200">
              Waiting for turn...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
