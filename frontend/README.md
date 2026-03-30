# Obsidian Pulse - Frontend

This is the frontend dashboard for the Obsidian Pulse Referral & Fraud Command Center. Built with React and Vite, it provides a high-performance visual command center to monitor users, track referring connections, visualize the referrals via a "Intelligence Network" graph, and flag fraudulent activities in real-time.

## Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

## Installation and Setup

1. **Navigate to the frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment Setup (Optional):**
Ensure your backend is running locally on port `8000` as the frontend defaults to communicating with `http://localhost:8000`.

4. **Start the Development Server:**
```bash
npm run dev
```
The development server will typically start on `http://localhost:5173`. 

5. **Build for Production (Optional):**
```bash
npm run build
npm run preview
```

## Logging In
Start the backend server and ensure `seed.py` has been executed to generate the system Admin. You can then log into the frontend using:
- **Email:** `admin@example.com`
- **Password:** `password123`
