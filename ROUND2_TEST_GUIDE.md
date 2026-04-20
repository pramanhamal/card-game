# Round 2 Testing Guide - Bug Fix Verification

## Executive Summary

A critical bug fix was applied to prevent the bidding popup from appearing prematurely during Round 2 gameplay. The issue was that the code was checking **stale state from closure** instead of the **actual server payload data**.

**The Fix:** Changed the round detection in `src/App.tsx` line 170 from:
```typescript
if (state && state.round > 0)  // ❌ WRONG: Uses old state from closure
```
to:
```typescript
if (payload.initialGameState.round > 1)  // ✅ CORRECT: Uses actual payload data
```

---

## Expected Round 2 Behavior

### Phase 1: Round 1 Completion
1. All 13 cards are played
2. Scores are calculated
3. Console logs: `✓ HAND COMPLETE! Setting isHandOver to true`
4. Game shows results for ~2 seconds

### Phase 2: Round 2 Trigger (start_game event)
1. Server sends `start_game` event with `initialGameState.round = 2`
2. Console logs: `[Round 2] ✓✓✓ NEW HAND DETECTED - closing previous popup and resetting isHandOver`
3. Previous betting popup is **closed**
4. `applyServerStateNewHand()` is called to reset `isHandOver` to false
5. Game start popup appears

### Phase 3: Round 2 Betting
1. 1.5 seconds after Round 2 starts
2. Console logs: `[Round 2] start_game handler: 1.5s timeout fired, closing popup and showing betting popup`
3. Betting popup appears
4. Players select bids (or auto-select after 5 seconds)

### Phase 4: Round 2 Card Play
1. **All 13 cards must be played** before betting popup appears again
2. Cards remain visible throughout play
3. No popup interruption during card play

---

## Step-by-Step Testing Procedure

### Prerequisites
- Both servers running: `npm run dev:all`
- Browser console open (F12 → Console tab)
- Playing in Singleplayer mode (AI opponents play automatically)

### Test Steps

#### Step 1: Start Game
1. Navigate to http://localhost:5173
2. Enter your name
3. Select **Singleplayer** mode
4. Game starts immediately

#### Step 2: Play Round 1
1. Watch console for logs starting with `[Round 1]`
2. Place your bid (or wait 5 seconds for auto-select)
3. Cards are dealt and play begins
4. **Play all 13 cards** (you may auto-play some)
5. Console should show: `[Round 1] ✓ HAND COMPLETE!`

#### Step 3: Verify Round 1 Complete
Expected console output:
```
[Round 1] Evaluating tricks: 13/13, completedRound: -1, isHandOver: false
[Round 1] ✓ HAND COMPLETE! Setting isHandOver to true
[Round 1] Auto-deal effect triggered! isHandOver=true, waiting 2 seconds...
[Round 1] Auto-deal 2-second timer fired, emitting deal_next_hand
```

#### Step 4: Verify Round 2 Starts Correctly
**Critical check:** After Round 1 completes, watch for:
```
[Round 2] ✓✓✓ NEW HAND DETECTED - closing previous popup and resetting isHandOver
[Round 2] start_game handler: Showing game start popup
[Round 2] start_game handler: 1.5s timeout fired, closing popup and showing betting popup
```

**If you see:**
```
Initial game start (Round 1)
```
This is **WRONG** — indicates the bug is still present.

#### Step 5: Play Round 2
1. Betting popup appears after 1.5 seconds
2. Select your bid
3. **Verify: Cards are visible and not blocked by popup**
4. Play all 13 cards without interruption
5. Console shows: `[Round 2] Evaluating tricks: X/13...` with increasing counts

#### Step 6: Verify Round 2 Completes
Expected: After all 13 cards played:
```
[Round 2] ✓ HAND COMPLETE! Setting isHandOver to true
[Round 2] Auto-deal effect triggered! isHandOver=true, waiting 2 seconds...
```

---

## Console Log Checklist

### ✅ Round 1 (Correct Behavior)
```
✓ Initial game start (Round 1)
✓ [Round 1] Evaluating tricks: 0/13...
✓ [Round 1] Evaluating tricks: 1/13...
✓ [Round 1] Evaluating tricks: 2/13...
... (continues for all 13 tricks)
✓ [Round 1] ✓ HAND COMPLETE! Setting isHandOver to true
✓ [Round 1] Auto-deal effect triggered! isHandOver=true, waiting 2 seconds...
✓ [Round 1] Auto-deal 2-second timer fired...
```

### ✅ Round 2 (With Fix)
```
✓ [Round 2] ✓✓✓ NEW HAND DETECTED - closing previous popup and resetting isHandOver
✓ [Round 2] start_game handler: Showing game start popup
✓ [Round 2] start_game handler: 1.5s timeout fired...
✓ [Round 2] Evaluating tricks: 0/13...
✓ [Round 2] Evaluating tricks: 1/13...
... (continues for all 13 tricks)
✓ [Round 2] ✓ HAND COMPLETE! Setting isHandOver to true
```

### ❌ Round 2 (Bug Still Present)
```
❌ Initial game start (Round 1)  ← WRONG! Should say "NEW HAND DETECTED"
❌ Betting popup appears before all 13 cards played
❌ Cards disappear mid-game
❌ [Round 2] logs missing
```

---

## What Was Broken

### Root Cause: State Closure Issue

In React, when you use state variables inside callbacks or event handlers, the callback captures the current state value. This creates a "closure" that can become stale if the callback isn't updated.

**The Bug:**
```typescript
// ❌ WRONG CODE (OLD VERSION)
socket.on("start_game", (payload) => {
  if (state && state.round > 0) {  // ← 'state' is from closure
    applyServerStateNewHand(payload.initialGameState);
  }
});

// When Round 2 event arrives:
// - 'state' still has round=1 (stale closure value)
// - payload.initialGameState has round=2 (new data from server)
// - Condition evaluates: true && round=1 > 0 → true
// - Calls applyServerStateNewHand() but doesn't close popup
```

**The Fix:**
```typescript
// ✅ CORRECT CODE (NEW VERSION)
socket.on("start_game", (payload) => {
  if (payload.initialGameState.round > 1) {  // ← Data from payload, not closure
    setBetPopupOpen(false);  // ← Close the previous popup
    applyServerStateNewHand(payload.initialGameState);
  }
});

// When Round 2 event arrives:
// - payload.initialGameState has round=2 (fresh from server)
// - Condition evaluates: round=2 > 1 → true
// - Closes popup AND resets hand state
```

---

## Technical Details

### Files Modified
- `src/App.tsx` (lines 170-180): Round detection logic
- `src/hooks/useGameState.ts` (lines 67-95): Hand completion detection

### Key Functions

#### applyServerStateNewHand()
```typescript
const applyServerStateNewHand = useCallback((serverState: GameState) => {
  setState(serverState);
  setIsHandOver(false);    // ← Reset for new hand
  setCompletedRound(-1);   // ← Allow next round to detect completion
}, []);
```

#### Hand Completion Detection
```typescript
const totalTricksPlayed = Object.values(state.tricksWon)
  .reduce((sum, tricks) => sum + tricks, 0);

if (totalTricksPlayed >= 13 && state.round !== completedRound) {
  // Only triggers once per unique round number
  setIsHandOver(true);
}
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Initial game start" on Round 2 | Old code still in use | Clear browser cache (Ctrl+Shift+Delete) |
| Betting popup blocks cards | Positioning issue | Not related to this fix; separate issue |
| Game skips Round 2 | Server issue | Check backend logs |
| Tricks counted wrong | State sync issue | Refresh page and restart |

---

## Success Criteria

✅ Round 1 completes after all 13 cards played  
✅ Round 2 starts with "NEW HAND DETECTED" log message  
✅ Previous betting popup closes before Round 2  
✅ All 13 cards play without popup interruption  
✅ Round 2 completes after all 13 cards played  
✅ Game history records both rounds correctly  

---

## Next Steps After Testing

If testing confirms the fix works:
1. ✅ Mark this issue as RESOLVED
2. ✅ Document in IMPLEMENTATION_SUMMARY.md
3. ✅ Create test suite for regression testing
4. ✅ Deploy to production

If issues persist:
1. Check browser console for error messages
2. Verify both servers running: `curl http://localhost:3000` and `curl http://localhost:5173`
3. Clear browser cache and refresh
4. Check `server/index.js` logs for game state issues
5. Report specific console error messages

---

**Last Updated:** 2026-04-19  
**Status:** 🔧 Ready for Testing
