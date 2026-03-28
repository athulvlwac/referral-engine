# Frontend Specification — Obsidian Pulse Dashboard

## Overview
React-based dark-themed dashboard for the referral engine. 5 pages matching the "Obsidian Pulse" design system.

---

## Tech Stack
- **React 18** + **Vite** (build tool)
- **Tailwind CSS** (utility-first styling)
- **Recharts** (charts/graphs)
- **React Router v6** (navigation)
- **Axios** (API client)

---

## Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| bg-primary | `#0a0a0f` | Page background |
| bg-card | `#12121a` / `#1a1a2e` | Card backgrounds |
| bg-sidebar | `#0d0d14` | Sidebar background |
| accent | `#7c3aed` / `#8b5cf6` | Purple accent, active states |
| accent-glow | `rgba(124, 58, 237, 0.2)` | Glow effects |
| text-primary | `#ffffff` | Main text |
| text-secondary | `#94a3b8` | Muted text |
| success | `#22c55e` | Valid/success states |
| danger | `#ef4444` | Error/block states |
| warning | `#f59e0b` | Warning/pending states |

### Typography
- Font: Inter or system sans-serif
- Headings: Bold, white
- Body: Regular, slate-300/400

### Components
- **Cards**: Rounded corners (lg), subtle border (slate-800), dark bg
- **Tables**: Dark themed, hover highlights, no visible borders
- **Badges**: Pill-shaped, colored backgrounds
- **Buttons**: Rounded, accent color primary actions

---

## Pages

### 1. Dashboard (`/`)
**Header**: "Obsidian Pulse" with LIVE badge, navigation tabs

**Metrics Bar** (6 cards):
- Total Users (with +% change indicator)
- Total Referrals
- Cycles Prevented
- Avg Depth
- Fraud Watch count
- Total Rewards (₹)

**Intelligence Network** (main panel):
- Visual graph showing referral relationships
- Toggle buttons: Network, Tree View, Force Map, Identify Clusters
- User avatars as nodes, lines as edges

**Fraud Monitoring** (bottom-left table):
- Columns: Case ID, Violation Type, Risk Level, Timestamp
- Color-coded risk levels (progress bars)

**Live Activity Feed** (bottom-right):
- Event cards with icons, titles, descriptions, timestamps
- Types: Referral Success (green), Cycle Blocked (red), Reward Distributed (purple)

### 2. Referrals (`/referrals`)
**Header**: "Referral Intelligence" with growth rate badge, active referrers count

**Controls**: Search bar, Active/Pending toggle, Export button

**Referral Table**:
- Columns: User (avatar + name + email), Invitations count, Conversion Rate (progress bar), Tree action
- Pagination

**Network Growth Projection** (bottom-left):
- Stats: growth percentage, average depth

**Automated Rewards** (bottom-right):
- Notification card about reward distributions

### 3. Fraud Watch (`/fraud-watch`)
**Header**: "Fraud Analysis" with Active Alerts badge

**Risk Density Map**: Bar chart showing fraud attempts over time

**Engine Performance** (side card):
- Velocity Check accuracy
- Pattern Match status
- Geo-Fencing zones count

**Priority Alerts Table**:
- Columns: User Identity (avatar + name + ID), Risk Score (bar), Detection Engine (badge), Action (Review/Block/Dismiss buttons)

**Bottom Stats**: Engine Status, Daily Log Size, Mean Detection time, Admin Watching

### 4. Rewards (`/rewards`)
**Header**: "Rewards Management"

**Summary Cards** (3):
- Total Paid Out (with +% indicator)
- Pending Payouts (with "Urgent" badge)
- Average Reward (with "Global" badge)

**Payout Queue Table**:
- Columns: Transaction ID, Recipient (avatar + name + role), Amount, Date Initiated, Status (badge), Actions (Pay/Review buttons)
- Filter and Process All buttons

**Payout Velocity** (bottom-left): Bar chart by day of week

**Security Intelligence** (bottom-right): Event feed

### 5. Logs (`/logs`)
**Header**: "Logs Intelligence" with Live Stream toggle

**Filters**: Level dropdown, Scope dropdown, Search input

**Log Table**:
- Columns: Timestamp, Level (badge), Module (badge), Event Type, User/Resource ID
- Expand action per row
- Pagination

**Bottom Stats**: Error Density chart, Data Latency, Memory Pressure

---

## Sidebar (persistent)
- **Header**: "Obsidian Pulse" logo, "Command Center" label, "SENTINEL ACTIVE" status
- **Nav Items**: Referrals, Fraud Watch, Rewards, Logs (with icons)
- **Active state**: Purple highlight with rounded background
- **Bottom**: Export Intelligence button, Support link, Documentation link

---

## API Integration

| Page | Endpoints Used |
|------|---------------|
| Dashboard | `GET /dashboard/metrics`, `GET /activity/feed`, `GET /fraud/flags`, `GET /user/1/graph` |
| Referrals | `GET /users`, `GET /referrals`, `POST /referral/claim` |
| Fraud Watch | `GET /fraud/flags`, `GET /dashboard/metrics` |
| Rewards | `GET /users`, `GET /user/{id}/rewards`, `GET /dashboard/metrics` |
| Logs | `GET /activity/feed`, `GET /fraud/flags` |

**Base URL**: `http://127.0.0.1:8000`

---

## File Structure
```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── api/
│   │   └── client.js
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   └── MetricCard.jsx
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Referrals.jsx
│       ├── FraudWatch.jsx
│       ├── Rewards.jsx
│       └── Logs.jsx
```

---

## Running
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```
