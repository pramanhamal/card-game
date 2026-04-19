# Testing Guide: Multiplayer Game Mode

## Issue Fixed
**Problem:** After 4 players joined the multiplayer lobby, the game wasn't displaying. Instead, the lobby kept showing even after the `start_game` event was received.

**Root Cause:** The render condition checking for MultiplayerLobby was executing before the Table render condition. Since both were true when the game started, the lobby would always render first.

**Solution:** Reordered render conditions so the game Table checks execute BEFORE the lobby checks.

---

## Testing Procedure

### Setup
1. Start both servers (if not already running):
   ```bash
   cd /Users/pramanhamal/Desktop/card-game
   npm run dev:all
   ```

2. Wait for both to be ready:
   - Frontend: Vite running on `http://localhost:5173`
   - Backend: Node server on `http://localhost:3000`

### Test Scenario: 4-Player Multiplayer Game

Open **4 separate browser tabs** (or use 2 devices + 2 tabs):

#### Tab 1 (Player 1)
1. Go to `http://localhost:5173`
2. Enter name: `Player 1`
3. Click "Multiplayer" mode
4. **Expected:** See "Looking for players..." message
5. **Check console:** Should see logs like:
   ```
   === ROOM_UPDATE RECEIVED ===
   Setting currentRoom with: ...
   ```

#### Tab 2 (Player 2)
1. Go to `http://localhost:5173`
2. Enter name: `Player 2`
3. Click "Multiplayer" mode
4. **Expected:** 
   - Player 2 should see Player 1 in a visual seat
   - Seat count shows "2/4"
   - Player 1 should see Player 2 appear in real-time

#### Tab 3 (Player 3)
1. Go to `http://localhost:5173`
2. Enter name: `Player 3`
3. Click "Multiplayer" mode
4. **Expected:** 
   - All 3 players see each other in visual seats
   - Seat count shows "3/4"

#### Tab 4 (Player 4)
1. Go to `http://localhost:5173`
2. Enter name: `Player 4`
3. Click "Multiplayer" mode
4. **Expected:** 
   - All 4 players see "Starting game..." message
   - After ~1.5 seconds, message disappears
   - Game shows a "Game Starting" popup with spade icon
   - After another ~1.5 seconds, **TABLE WITH CARDS SHOULD APPEAR**

### What Should Happen at Game Start

After 4 players join, you should see:

1. **Countdown**: 
   ```
   ♠ All players are in!
   Starting the game…
   ```
   (Shows for 1.5 seconds)

2. **Game Table** (NEW - this was the bug):
   - Top-left: "You are: NORTH" (or your assigned seat)
   - Top-right: All 4 player names and seats
   - Center: The actual card table with:
     - Card deck in the middle
     - 4 empty card piles (for tricks)
     - Your hand at the bottom
   - Betting popup or cards visible
   - Scoreboard at bottom-right

### Debugging Checklist

If the game table doesn't appear after "Starting the game..." popup:

**Check 1: Backend Server Logs**
```bash
# In the terminal running the server, look for:
# Should see these in order:
"Emitting start_game to room: match-1"
"start_game emitted successfully"
```

**Check 2: Browser Console Logs**
Look for these patterns in the console:
```
=== START_GAME EVENT RECEIVED ===
Setting game state with seat: north
Showing game start popup
Closing game start popup, showing bet popup
=== RENDER CHECK ===
  hasState: true          ← Should be TRUE
  hasCurrentRoom: match-1 ← Should have room ID
  hasYourSeat: north      ← Should have your seat
  isGameOver: false
✓✓✓ Rendering TABLE - all conditions met!
```

**Check 3: Network Tab**
- In DevTools Network tab, filter by "socket.io"
- Should see a `start_game` event being received after 4th player joins
- Check the payload contains: `room`, `initialGameState`, `seating`

**Check 4: Verify Servers Are Running**
```bash
# Check if ports are open:
lsof -i :5173  # Frontend
lsof -i :3000  # Backend
```

---

## Expected Console Logs

### Player 1-3 (While waiting):
```
ROOM_UPDATE RECEIVED {roomId: 'match-1', players: [{...}, {...}]}
```

### Player 4 (When joining, triggering start):
```
ROOM_UPDATE RECEIVED {roomId: 'match-1', players: [{...}, {...}, {...}, {...}]}
START_GAME EVENT RECEIVED {room: {...}, initialGameState: {...}, seating: {...}}
Showing game start popup
[after 1.5s]
Closing game start popup, showing bet popup
RENDER CHECK {hasState: true, hasCurrentRoom: 'match-1', hasYourSeat: 'north', ...}
✓✓✓ Rendering TABLE - all conditions met!
```

---

## Tests to Run

### ✅ Test 1: 4 Players Auto-Start (Primary)
**Objective:** Verify game displays when 4 players join
- **Pass Criteria:** 
  - All 4 players see the Table with cards
  - No console errors
  - Lobby is gone, table is visible
  - Each player can see their hand at their position

### ✅ Test 2: Join Order Doesn't Matter
**Objective:** Verify players can join in any order
- **Pass Criteria:**
  - Players joining 1st, 2nd, 3rd see each other updating
  - 4th player triggers auto-start for all simultaneously
  - All see the same game state

### ✅ Test 3: Player Names Display Correctly
**Objective:** Verify entered names appear in seats
- **Pass Criteria:**
  - Top-right corner shows: "NORTH: Player1", "EAST: Player2", etc.
  - Matches what players entered in the name input

### ✅ Test 4: Seat Assignment Correct
**Objective:** Verify each player knows their seat
- **Pass Criteria:**
  - Top-left shows correct seat for each player
  - Your name in top-right has "(You)" label

---

## Known Limitations (v1)

1. **AI Bot Bidding**: AI bots bid conservatively (60% of hand value)
2. **Mobile Testing**: Not yet tested on actual mobile devices
3. **Connection Issues**: If server crashes, clients don't auto-reconnect
4. **Difficulty Levels**: AI has only one difficulty level

---

## Quick Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| "Looking for players..." forever | Server not running | `npm run dev:all` |
| Players in different rooms | Server bug | Restart server |
| Lobby shows after 4 join | Render order bug (FIXED) | See commit f20141a |
| Cards not visible | Game state not applied | Check console for errors |
| Can't see other players | WebSocket not connected | Check Network tab in DevTools |

---

## File Changes Summary

- **src/App.tsx**: Reordered render conditions (lines 328-487)
  - Moved Table render check before Lobby checks
  - Added `!state` guards to Lobby renders
  - Added comments for clarity

**Affected Render Order:**
```
1. NameInputPopup
2. GameModeScreen
3. PrivateTableModal
4. ShowGameStartPopup
5. WaitingRoom (non-multiplayer, no seat)
6. ★ GAME TABLE ← Moved here (was after Lobby)
7. WaitingRoom (non-multiplayer, waiting for game)
8. MultiplayerLobby (only if !state)
9. MultiplayerLobby (initial view)
10. Fallback GameModeScreen
```

---

## Next Steps After Testing

Once you confirm the game displays correctly:

1. **Test Bidding Phase**: Can all 4 players place bids?
2. **Test Card Play**: Can players play cards and see trick evaluation?
3. **Test Scoring**: Does the final score calculation work?
4. **Test AI Moves**: Do AI players bid and play automatically?
5. **Test Multiple Games**: Can players play "New Game" and start over?

