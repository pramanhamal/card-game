# Auto-Play Card Feature Documentation

## Overview

The auto-play card feature automatically plays the lowest valued legal card for a player if they don't manually select a card within 5 seconds of their turn. This feature applies to all game modes and works for both human players and AI bot transitions.

## Implementation Details

### Client-Side (React - src/App.tsx)

**Feature Location:** Lines 215-233

```typescript
// Auto-play card after 5 seconds if player doesn't select
useEffect(() => {
  if (!state || !yourSeat || state.turn !== yourSeat) return;

  const legalMovesForPlayer = legalMoves(state, yourSeat);
  if (legalMovesForPlayer.length === 0) return;

  const timer = setTimeout(() => {
    console.log("Auto-playing card for:", yourSeat);
    const cardValues: Record<string, number> = { 
      A: 14, K: 13, Q: 12, J: 11, "10": 10, "9": 9, "8": 8, 
      "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2 
    };
    const sortedCards = [...legalMovesForPlayer].sort(
      (a, b) => (cardValues[a.rank as string] || 0) - (cardValues[b.rank as string] || 0)
    );
    const cardToPlay = sortedCards[0];
    handlePlayCard(yourSeat, cardToPlay);
  }, 5000);

  return () => clearTimeout(timer);
}, [state, yourSeat, currentRoom]);
```

**How it works:**
1. Effect runs when state, yourSeat, or currentRoom changes
2. Checks if it's the current player's turn
3. Gets all legal moves for the current player
4. Sets a 5-second timer
5. When timer fires:
   - Sorts legal cards by value (lowest first)
   - Plays the lowest card by calling handlePlayCard
   - Emits play_card event to server

### Server-Side (Node.js - server/index.js)

**Feature Location:** Lines 500-517

```javascript
socket.on("play_card", ({ roomId, card }) => {
  const room = rooms.get(roomId);
  if (!room || !room.gameState) return;
  const player = room.players.get(socket.id);
  if (!player || !player.seat) return;

  // Validate the move is legal
  const allowed = legalMoves(room.gameState, player.seat);
  const isLegal = allowed.some((c) => c.suit === card.suit && c.rank === card.rank);
  if (!isLegal) return;

  // Play the card
  playCard(room.gameState, player.seat, card);
  
  // Broadcast to all players
  io.to(roomId).emit("game_state_update", room.gameState);

  // Schedule next AI action if AI players exist
  if (room.aiPlayers.size > 0) {
    scheduleNextAIAction(room, io, roomId, "play");
  }
});
```

**How it works:**
1. Server receives play_card event with room ID and card
2. Validates the card is legal for the current player's seat
3. Plays the card in the game state
4. Broadcasts updated game state to all players
5. Schedules next AI action if needed

### Game State Update (React - src/App.tsx)

**Feature Location:** Lines 184-186

```typescript
sock.on("game_state_update", (newState: GameState) => {
  applyServerState(newState);
});
```

When the server broadcasts the game state update, all clients (including the one who auto-played) receive and apply the update.

## Features & Behavior

### Auto-Play Triggers When:
✓ Player's turn has arrived (state.turn === yourSeat)  
✓ Game state exists  
✓ Player hasn't manually selected a card within 5 seconds  

### Auto-Play Does NOT Trigger When:
✗ It's not the player's turn  
✗ Game hasn't started (state is null)  
✗ No legal moves available  

### Card Selection Strategy
- **Strategy:** Play the lowest valued legal card
- **Card Values:** A=14, K=13, Q=12, J=11, 10=10, 9=9, 8=8, 7=7, 6=6, 5=5, 4=4, 3=3, 2=2
- **Rationale:** Conservative approach preserves high cards for later tricks

### Race Condition Protection
- If player manually selects a card before auto-play timer (within 5 seconds):
  1. Manual card is played immediately
  2. Server broadcasts game state update
  3. Player's turn ends (state.turn changes)
  4. Auto-play timer fires but effect early-returns (not their turn anymore)
  5. No conflict occurs

## Testing Procedures

### Test 1: Auto-Play Basic Functionality

**Setup:**
1. Start servers: `npm run dev:all`
2. Open game in browser at http://localhost:5173
3. Select Singleplayer mode (easiest to test - just you and 3 AI bots)

**Test Steps:**
1. Game starts, betting phase begins
2. When it's your turn to play a card, just wait (don't click)
3. Watch the cards for 5 seconds
4. After 5 seconds, one card should automatically be played

**Expected Result:**
- ✓ One of your cards is automatically played
- ✓ The played card disappears from your hand
- ✓ The card appears in the trick pile (center of table)
- ✓ Game continues to next player
- ✓ Console shows: "Auto-playing card for: [your-seat]"

### Test 2: Manual Play Prevents Auto-Play

**Setup:**
1. Start game in Singleplayer mode
2. Wait for your turn to play a card

**Test Steps:**
1. When it's your turn, wait 2 seconds
2. Then manually click a card (before 5 seconds)
3. Observe the behavior

**Expected Result:**
- ✓ Manual card is played immediately when clicked
- ✓ No "auto-play" log appears in console
- ✓ Game continues normally
- ✓ No duplicate cards played

### Test 3: Multiplayer Auto-Play Synchronization

**Setup:**
1. Start servers
2. Open 4 browser tabs (simulate 4 players)
3. Each tab: Enter name, select Multiplayer mode

**Test Steps:**
1. Wait for all 4 players to join lobby
2. Game auto-starts and shows betting popup
3. All players place bids
4. First card play phase begins
5. One player waits without clicking (let auto-play happen)
6. Other 3 players manually play cards

**Expected Result:**
- ✓ All 4 players see the same game state
- ✓ Auto-played card appears on all screens simultaneously
- ✓ Manually played cards appear immediately
- ✓ All cards are valid and in correct positions
- ✓ Game flow is uninterrupted

### Test 4: Multiple Auto-Plays in One Trick

**Setup:**
1. Start Multiplayer game with 4 players

**Test Steps:**
1. When trick play begins:
   - Player 1: Don't click (let auto-play after 5 sec)
   - Player 2: Don't click (let auto-play after 5 sec)
   - Player 3: Manually click a card
   - Player 4: Manually click a card
2. Observe trick completion

**Expected Result:**
- ✓ Players 1 & 2 auto-play after 5 seconds (with ~1-2 sec delay between plays)
- ✓ Players 3 & 4 play manually
- ✓ All cards appear in correct order
- ✓ Trick winner is determined correctly
- ✓ No card duplication or conflicts

### Test 5: Auto-Play Across Multiple Hands

**Setup:**
1. Start Singleplayer game

**Test Steps:**
1. Hand 1: Let at least one card auto-play
2. Complete Hand 1
3. Hand 2 deals automatically
4. Let another card auto-play in Hand 2
5. Verify hand history records properly

**Expected Result:**
- ✓ Auto-play works consistently across multiple hands
- ✓ Hand 1 scores recorded correctly
- ✓ Hand 2 starts fresh with new cards
- ✓ Auto-play timing consistent (5 seconds each time)

### Test 6: Extreme Cases

**Test 6A: Player has only one legal move**
- When you have one legal card, auto-play should immediately play it after 5 seconds
- Expected: ✓ Single legal card is played after 5 sec

**Test 6B: All players don't play manually (all auto-play)**
- Set up 4 human players but none manually select cards
- Expected: ✓ All cards auto-play in sequence, game completes

**Test 6C: Auto-play with AI players**
- Play Singleplayer with 3 AI bots
- Wait and let auto-play happen during your turns
- Expected: ✓ Human auto-play and AI plays all work together seamlessly

## Console Logs for Debugging

### Expected Console Logs When Auto-Play Occurs

```
// When player's turn begins
=== Game state updated, turn is: north

// 5 seconds later, auto-play fires
Auto-playing card for: north

// Server validates and broadcasts
game_state_update received with new state...
```

### Debug Checklist

If auto-play doesn't work:

1. **Check Console Logs:**
   - Look for "Auto-playing card for:" message
   - If missing: effect might not be running
   - Check if state.turn === yourSeat

2. **Check Network Tab:**
   - Look for "play_card" event being sent
   - If missing: handlePlayCard might not be called
   - Verify socket connection is active

3. **Check Game State:**
   - Use console to verify yourSeat is set
   - Verify state.turn matches your seat
   - Verify legalMoves() returns cards

4. **Verify Server:**
   - Check server logs for play_card event handling
   - Verify game_state_update is broadcast
   - Check for any validation errors

## Dependencies & Compatibility

### Client Dependencies (React)
- `state`: Game state from useGameState hook
- `yourSeat`: Your seat assignment  
- `currentRoom`: Current room information
- `legalMoves()`: From game logic utilities
- `handlePlayCard()`: Event emitter to server

### Server Dependencies (Node.js)
- `legalMoves()`: Game logic utility
- `playCard()`: Game logic utility
- Socket.io for event broadcasting

### Browser Compatibility
- Works with all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires WebSocket support
- Tested on desktop browsers

## Known Limitations

1. **Simple Strategy:** Only plays lowest card, doesn't consider trick winning strategy
2. **No Difficulty Levels:** All auto-plays use same strategy
3. **Timer is Fixed:** Always 5 seconds, not adjustable
4. **No Bypass Option:** Players must wait 5 seconds or manually click

## Future Improvements

1. **Smarter Strategy:** Consider trick patterns, current lead, etc.
2. **Adjustable Timeout:** Let players set their own timeout duration
3. **Manual Override:** Let players disable auto-play
4. **Difficulty Levels:** Different strategies for different AI/player combinations
5. **Analytics:** Track auto-play usage and success rates

## Code Changes Summary

- **Modified Files:**
  - `src/App.tsx`: Added auto-play useEffect hook (lines 215-233)
  - `server/index.js`: No changes needed (play_card handler already supports it)
  
- **Dependencies Added:**
  - `currentRoom` to auto-play effect dependency array

- **No Breaking Changes:**
  - All existing game modes supported
  - Backward compatible with manual play
  - Works with AI and human players

---

**Last Updated:** 2026-04-19  
**Status:** ✓ Complete and tested  
**Git Commit:** 7ae6661
