# Rocket Crash Gambling Game - Product Requirements Document

## Original Problem Statement
Build a beautiful UI page that any dApp game would have - specifically a rocket gambling game (crash game style) with no wallet connection and no blockchain integration.

## Project Overview
A web-based rocket crash gambling game where players bet on a rocket's flight and must cash out before it crashes. The multiplier increases as the rocket flies, creating an exciting risk/reward dynamic.

## User Personas
- **Casual Gamers**: Looking for quick, exciting gambling entertainment
- **Risk-Takers**: Players who enjoy high-stakes, fast-paced betting games
- **Social Gamblers**: Users who want to see other players' bets and compete on leaderboards

## Core Requirements

### Functional Requirements
1. **Game Mechanics**
   - Rocket launches with increasing multiplier (1.00x → 20.00x+)
   - Random crash point generation with weighted probabilities
   - 5-second countdown between rounds
   - Real-time multiplier updates (50ms intervals)
   - Auto-cashout functionality

2. **Betting System**
   - Adjustable bet amounts with +/- buttons
   - Quick bet presets ($10, $50, $100, $500, $1000)
   - Balance tracking and validation
   - Manual and automatic cash-out options
   - Bet placement only during waiting period

3. **Visual Components**
   - Animated rocket with flight trajectory
   - Canvas-based game board with grid background
   - Dynamic multiplier display with color transitions
   - Game state indicators (Waiting, Flying, Crashed)
   - Rocket flame effects during flight

4. **Social Features**
   - Live bets feed showing active players
   - Game history with crash points
   - Leaderboard with top 8 players
   - Player statistics dashboard
   - **Live chat with message types and auto-messages on wins** ✨ NEW

### Technical Requirements
- React 19 with hooks for state management
- Shadcn UI component library
- Tailwind CSS for styling
- Canvas API for game visualization
- Mock data for demonstration

## What's Been Implemented ✅
**Date**: December 2025

### Frontend (Complete with Mock Data)
1. **Main Game Component** (`/frontend/src/components/RocketGame.jsx`)
   - Canvas-based rocket animation
   - Grid background with trajectory line
   - Dynamic multiplier display with color coding
   - Rocket position updates based on multiplier
   - Glow effects and flame animations

2. **Betting Panel** (`/frontend/src/components/BettingPanel.jsx`)
   - Balance display
   - Bet amount input with +/- controls
   - Quick bet amount buttons
   - Auto-cashout toggle with multiplier input
   - Place Bet / Cash Out action buttons
   - Potential win calculator
   - Toast notifications for actions

3. **Live Bets Component** (`/frontend/src/components/LiveBets.jsx`)
   - Real-time active bets display
   - Player avatars and usernames
   - Bet amounts and current multipliers
   - Potential win calculations
   - Active/Cashed status indicators

4. **Game History** (`/frontend/src/components/GameHistory.jsx`)
   - Previous 20 rounds display
   - Crash multipliers with color coding
   - Timestamps and round numbers
   - Visual indicators for crash events

5. **Leaderboard** (`/frontend/src/components/Leaderboard.jsx`)
   - Top 8 players ranking
   - Trophy icons for top 3
   - Total wins, win rates, biggest wins
   - Rank-based visual styling

6. **User Statistics** (`/frontend/src/components/UserStats.jsx`)
   - Total bets, wins, losses
   - Win rate percentage
   - Biggest win display
   - Total wagered amount
   - Live status indicator

7. **Main Page** (`/frontend/src/pages/RocketGamePage.jsx`)
   - Complete game loop logic
   - State management for game phases
   - Countdown timer between rounds
   - Bet placement and cash-out handlers
   - Responsive grid layout
   - Header and footer sections

8. **Live Chat** (`/frontend/src/components/Chat.jsx`) ✨ NEW
   - Real-time message display
   - Message input with character counter (200 max)
   - User avatars with color coding
   - Timestamp for each message
   - Message type indicators (win/loss/system/chat)
   - Auto-scroll to latest messages
   - Send button with validation
   - Toast notifications for sent messages
   - Automatic chat messages on cash-out events

9. **Mock Data** (`/frontend/src/mock/gameData.js`)
   - Game history (8 previous rounds)
   - Live bets (5 active players)
   - Leaderboard data (8 top players)
   - User statistics
   - Random multiplier generator

### Design Implementation
- **Color Scheme**: Dark theme (gray-950/900) with cyan/teal accents
- **Accent Colors**: Orange/rose for CTAs and rocket flames
- **Typography**: Clear hierarchy with proper font weights
- **Spacing**: Consistent padding and margins
- **Animations**: Smooth transitions, pulse effects, color changes
- **Responsive**: Grid-based layout for different screen sizes

## Architecture

### Frontend Structure
```
/frontend/src/
├── components/
│   ├── RocketGame.jsx (Main game canvas)
│   ├── BettingPanel.jsx (Betting controls)
│   ├── LiveBets.jsx (Active bets feed)
│   ├── GameHistory.jsx (Previous rounds)
│   ├── Leaderboard.jsx (Top players)
│   ├── UserStats.jsx (Player statistics)
│   └── Chat.jsx (Live chat) ✨ NEW
├── pages/
│   └── RocketGamePage.jsx (Main container)
└── mock/
    └── gameData.js (Mock data & utilities)
```

### Game State Flow
```
WAITING (5s countdown) → FLYING (rocket active) → CRASHED → WAITING
```

## Prioritized Backlog

### P0 Features (Future Backend Integration)
- [ ] Backend API for game state management
- [ ] MongoDB models for games, bets, users
- [ ] Real-time WebSocket connections for live updates
- [ ] User authentication and session management
- [ ] Persistent balance and bet history

### P1 Features (Enhancements)
- [ ] Sound effects (rocket launch, cash out, crash)
- [x] **Chat functionality for players** ✅ COMPLETED
- [ ] Betting history for individual users
- [ ] Provably fair algorithm display
- [ ] Mobile-optimized responsive design
- [ ] Animation improvements (particle effects)
- [ ] Chat moderation and filter for inappropriate messages
- [ ] Emoji picker for chat messages

### P2 Features (Advanced)
- [ ] Multi-bet functionality (place multiple bets per round)
- [ ] Tournament modes with prizes
- [ ] VIP levels and rewards
- [ ] Referral system
- [ ] Admin dashboard for game management

## Next Action Items
1. **User Testing**: Gather feedback on game feel and UI/UX
2. **Backend Development**: Design API contracts and database schema
3. **WebSocket Implementation**: Enable real-time multiplayer experience
4. **Authentication**: Implement user registration and login
5. **Testing**: Comprehensive testing of game logic and edge cases

## Technical Decisions
- **No Blockchain**: Game runs entirely on traditional backend
- **No Wallet Connection**: Uses standard authentication instead
- **Canvas vs SVG**: Canvas chosen for smooth 60fps animations
- **Mock First**: Frontend built with mock data for rapid prototyping
- **Component Library**: Shadcn UI for consistent, accessible components

## Success Metrics (Future)
- Average game round duration: ~10-15 seconds
- Player retention rate: Track daily active users
- Average bet amount and win rate
- Crash point distribution matching expected probabilities
- Page load time < 2 seconds
- Smooth 60fps animations on all devices
