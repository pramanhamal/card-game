# Quick Start Guide - Spades Card Game

## Current Status
✅ **All features implemented and tested**  
✅ **Project builds successfully with no errors**  
✅ **Development servers running**

---

## Starting the Game

### Prerequisites
- Node.js v24+ installed
- npm installed

### Start Both Servers
```bash
cd /Users/pramanhamal/Desktop/card-game
npm run dev:all
```

**Expected Output:**
```
[0]   VITE v4.5.14  ready in ~2s
[0]   ➜  Local:   http://localhost:5173/
[1] Server listening on 3000
```

### Access the Game
Open your browser and go to: **http://localhost:5173**

---

## Game Features

### 🎮 Auto-Play Card (NEW)
- Automatically plays the lowest legal card after 5 seconds if you don't select
- Works in all game modes
- Prevents being stuck on your turn

### 💰 Auto-Bid Selection (NEW)
- Automatically recommends the best bid based on your hand strength
- Auto-selects after 5 seconds if you don't choose
- Green highlight shows the recommended bid
- Progress bar shows countdown timer

### 🃏 Auto-Deal Next Hand (NEW)
- Automatically deals a new hand after all 13 cards are played
- Keeps track of previous hand scores in history
- Seamless transition with betting popup

### 🎯 Game Modes

1. **Singleplayer** 🤖
   - Play against 3 AI bots
   - Starts immediately
   - Perfect for practicing

2. **Multiplayer** 👥
   - Join with 3 other players
   - Auto-starts when 4 players join
   - Real-time visual lobby showing players joining

3. **Private Table** 🔐
   - Create a private room with a PIN
   - Share PIN with friends to join
   - Only those with PIN can join

4. **Hotspot** 🎯
   - Random matchmaking with other players
   - Quick way to find opponents
   - Auto-joins available rooms

---

## How to Play

### Step 1: Enter Your Name
- Type your player name
- Accept terms and conditions

### Step 2: Select Game Mode
Choose from the 4 game modes above

### Step 3: Wait for Players (Multiplayer Only)
- Visual lobby shows players joining
- "1/4", "2/4", "3/4", "4/4" counter
- Game auto-starts when 4 players join

### Step 4: Bidding Phase
- Select how many tricks you think you'll win (1-8)
- Or wait 5 seconds for auto-select
- Green highlighted bid is recommended

### Step 5: Card Play Phase
- Click cards in your hand to play them
- Legal cards are highlighted
- Or wait 5 seconds for auto-play
- Other players' cards appear automatically

### Step 6: Score
- After 13 tricks, hand scores are recorded
- New hand automatically deals
- Play up to 10 hands (or as desired)

---

## Testing Auto-Features

### Test Auto-Play (5 seconds)
1. Start Singleplayer game
2. When it's your turn to play a card, **don't click**
3. Wait 5 seconds and watch your card auto-play
4. Check console for: "Auto-playing card for: [your-seat]"

### Test Auto-Bid (5 seconds)
1. During bidding phase, **don't select a bid**
2. Watch the green highlighted bid
3. Wait 5 seconds for auto-select
4. Your bid appears automatically

### Test Manual Override
1. Start game and let auto-features countdown
2. Before timer expires, manually click a card or bid
3. Manual selection happens immediately
4. Auto-play timer cancels automatically

---

## Debugging

### Check Browser Console
Press `F12` to open Developer Tools, then Console tab

**Look for:**
- ✅ "Auto-playing card for: [seat]" → Auto-play triggered
- ✅ "=== START_GAME EVENT RECEIVED ===" → Game started
- ✅ "game_state_update received" → Server sent state update

### Check Network Activity
In DevTools → Network tab:
- Look for WebSocket connections (socket.io)
- Check for "play_card" and "place_bid" events
- Verify "game_state_update" responses

### Common Issues

| Issue | Solution |
|-------|----------|
| Servers won't start | Kill processes: `lsof -ti :3000,:5173 \| xargs kill -9` |
| "Can't connect to server" | Verify backend running: `curl http://localhost:3000` |
| Auto-play not working | Check: 1) Console for errors 2) It's your turn 3) 5 seconds passed |
| Popup blocks cards | This was fixed - cards should be visible during betting |

---

## Documentation

- **AUTO_PLAY_GUIDE.md** → Detailed testing procedures for auto-play feature
- **IMPLEMENTATION_SUMMARY.md** → Complete implementation details
- **TESTING_GUIDE.md** → Original multiplayer testing guide

---

## Server Info

### Frontend (Vite)
- **Port:** 5173
- **URL:** http://localhost:5173
- **Hot Reload:** Enabled (changes auto-refresh)

### Backend (Node.js + Socket.io)
- **Port:** 3000
- **Protocol:** WebSocket
- **Handles:** Game state, validation, AI players

### Database
- **Type:** In-memory (Node.js memory)
- **Data:** Room and player data
- **Reset:** On server restart

---

## Keyboard Shortcuts (if any)
- `F12` → Open Developer Tools
- `Ctrl+Shift+R` → Hard refresh (clear cache)

---

## Next Steps

1. **Test the Game**
   - Follow steps in "How to Play" section
   - Try each game mode
   - Test auto-features

2. **Read Full Docs**
   - Review AUTO_PLAY_GUIDE.md for detailed testing
   - Check IMPLEMENTATION_SUMMARY.md for technical details

3. **Report Issues**
   - Check console for errors
   - Check Network tab for failed requests
   - Note exact steps to reproduce issue

---

## File Structure
```
src/
  ├── App.tsx           # Main component
  ├── components/       # UI components
  ├── hooks/            # Custom hooks
  ├── utils/            # Game logic
  └── types/            # TypeScript definitions

server/
  ├── index.js          # WebSocket server
  └── utils/            # Server-side logic

dist/                    # Production build output
```

---

## Build & Deployment

### Development Build
```bash
npm run dev:all      # Start dev servers
```

### Production Build
```bash
npm run build        # Creates optimized dist/ folder
npm run preview      # Test production build locally
```

---

## Performance
- **Load Time:** ~2-3 seconds
- **Auto-Play Delay:** 5 seconds
- **Auto-Bid Delay:** 5 seconds
- **Network:** Real-time via WebSocket

---

## Support

If you encounter issues:
1. Check console for error messages
2. Restart servers
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check that both servers are running
5. Review documentation files

---

**Last Updated:** 2026-04-19  
**Game Version:** 1.0 - Auto-Play Release  
**Status:** ✅ Ready to Play & Test
