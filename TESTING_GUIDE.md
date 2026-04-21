# Testing Guide - Spades Card Game

## Quick Start

1. **Server Status:**
   - Backend: `http://localhost:3000`
   - Frontend: `http://localhost:5173`
   - Both should be running (check logs)

2. **Open Game:**
   - Navigate to `http://localhost:5173`
   - Enter your player name
   - Click "Continue"

---

## Feature Testing

### 1. Game Over Popup (After 2 Rounds)

**Expected Flow:**
```
Singleplayer Mode
  ↓
Round 1: Play 13 cards
  ↓
Auto-deal waits 2 seconds
  ↓
Round 2: Play 13 cards
  ↓
✅ Game Over Popup appears
   - Shows "Game Complete!"
   - Displays final scores with medals (🥇🥈🥉🎖️)
   - Shows round breakdown
   - Has "Play Again" and "Join Multiplayer" buttons
```

**Console Logs to Verify:**
```
✅ HAND COMPLETE! Round 1 - Adding to history
📊 History updated. New history length: 1

✅ HAND COMPLETE! Round 2 - Adding to history
📊 History updated. New history length: 2

✅✅✅ GAME OVER! 2 rounds completed. Final scores: {...}
🎮 RENDERING GAME OVER POPUP - isGameOver: true
```

### 2. Singleplayer Mode

**How to Test:**
1. Select "Singleplayer" from game mode screen
2. You play as **South**
3. AI bots play North, East, West

**What to Verify:**
- AI makes bids automatically
- AI plays cards automatically after you play
- Scoring is calculated correctly
- After 2 rounds, stats popup appears

### 3. Play Again Button

**Test Steps:**
1. Complete 2 rounds in Singleplayer
2. Stats popup appears
3. Click "Play Again" button

**Expected Behavior:**
- Popup disappears
- Betting popup appears for new game
- Game mode unchanged (still Singleplayer)
- New game starts with AI opponents

### 4. Join Multiplayer Button

**Test Steps:**
1. Complete 2 rounds in Singleplayer
2. Stats popup appears
3. Click "Join Multiplayer" button

**Expected Behavior:**
- Popup disappears
- Returns to game mode selection screen
- Game state is cleared
- User can select "Multiplayer" mode

---

## Debugging Tips

### If Popup Doesn't Appear:

1. **Check Browser Console (F12):**
   - Look for errors in Console tab
   - Should see logs: "✅ GAME OVER!"

2. **Verify Game History:**
   - Should show 2 rounds after game ends

3. **Check Component Rendering:**
   - Look for: "🎮 RENDERING GAME OVER POPUP"

---

## Testing Checklist

- [ ] Can enter player name
- [ ] Can select game mode
- [ ] Singleplayer starts immediately
- [ ] AI makes bids and plays cards
- [ ] Rounds complete after 13 tricks
- [ ] Auto-deal waits 2 seconds between rounds
- [ ] Popup appears after Round 2
- [ ] Popup shows correct final scores
- [ ] Popup shows both rounds in breakdown
- [ ] Play Again button works
- [ ] Join Multiplayer button works
- [ ] No console errors

---

**Last Updated:** April 20, 2026
