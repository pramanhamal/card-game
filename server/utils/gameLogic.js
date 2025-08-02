// server/utils/gameLogic.js

const SEAT_ORDER = ["north", "east", "south", "west"];
const SUITS = ["spades", "hearts", "diamonds", "clubs"];
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rankValue(rank) {
  if (typeof rank === "number") return rank;
  switch (rank) {
    case "J":
      return 11;
    case "Q":
      return 12;
    case "K":
      return 13;
    case "A":
      return 14;
    default:
      return 0;
  }
}

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return shuffle(deck);
}

function dealHands(deck) {
  return {
    north: deck.slice(0, 13),
    east: deck.slice(13, 26),
    south: deck.slice(26, 39),
    west: deck.slice(39, 52),
  };
}

function initializeGame() {
  const deck = createDeck();
  const hands = dealHands(deck);
  const turn = SEAT_ORDER[Math.floor(Math.random() * 4)];
  return {
    deck,
    hands,
    trick: { north: null, east: null, south: null, west: null },
    scores: { north: 0, east: 0, south: 0, west: 0 },
    tricksWon: { north: 0, east: 0, south: 0, west: 0 },
    turn,
    round: 1,
    bids: { north: 0, east: 0, south: 0, west: 0 },
  };
}

function evaluateTrick(state) {
  const trickEntries = Object.entries(state.trick);
  if (trickEntries.some(([, c]) => c === null)) {
    throw new Error("Incomplete trick");
  }
  const leadEntry = trickEntries.find(([, c]) => c !== null);
  const leadSuit = leadEntry && leadEntry[1] ? leadEntry[1].suit : null;

  const trumpPlays = trickEntries
    .filter(([, c]) => c && c.suit === "spades")
    .map(([p, c]) => [p, c]);

  let contenders;
  if (trumpPlays.length > 0) {
    contenders = trumpPlays;
  } else {
    contenders = trickEntries
      .filter(([, c]) => c && c.suit === leadSuit)
      .map(([p, c]) => [p, c]);
  }

  const winner = contenders.reduce((best, current) => {
    const bestCard = best[1];
    const currCard = current[1];
    return rankValue(currCard.rank) > rankValue(bestCard.rank) ? current : best;
  })[0];

  state.tricksWon[winner] = (state.tricksWon[winner] || 0) + 1;
  state.trick = { north: null, east: null, south: null, west: null };
  state.turn = winner;
  return winner;
}

function playCard(state, player, card) {
  if (state.turn !== player) return;
  const hand = state.hands[player];
  const index = hand.findIndex(
    (c) => c.suit === card.suit && c.rank === card.rank
  );
  if (index === -1) return;
  hand.splice(index, 1);
  state.trick[player] = card;

  const trickFilled = Object.values(state.trick).every((c) => c !== null);
  if (trickFilled) {
    evaluateTrick(state);
  } else {
    const currentIdx = SEAT_ORDER.indexOf(player);
    const nextIdx = (currentIdx + 1) % SEAT_ORDER.length;
    state.turn = SEAT_ORDER[nextIdx];
  }
}

function calculateScores(bids, tricksWon) {
  const result = { north: 0, east: 0, south: 0, west: 0 };
  for (const p of SEAT_ORDER) {
    const bid = bids[p];
    const won = tricksWon[p];
    result[p] = won < bid ? -bid : bid + (won - bid);
  }
  return result;
}

export {
  initializeGame,
  playCard,
  evaluateTrick,
  calculateScores,
};
