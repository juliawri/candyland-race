// ─────────────────────────────────────────────────────────────────────────
// Firebase configuration for the GLOBAL leaderboard.
//
// The game works fine with NO setup — it just falls back to a leaderboard
// that only lives in each player's own browser (localStorage).
//
// To make the leaderboard SHARED across every visitor of your GitHub Pages
// site, create a free Firebase project and paste its config below.
// Full step-by-step instructions are in README.md.
//
// Until you replace "YOUR_API_KEY" below, the game automatically uses the
// local-only fallback — nothing will break.
// ─────────────────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
