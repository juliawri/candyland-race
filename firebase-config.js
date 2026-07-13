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
  apiKey: "AIzaSyAOwsV0KTFPcElw3_E9ZoWXalwpWuWcKMc",
  authDomain: "candy-land-race.firebaseapp.com",
  projectId: "candy-land-race",
  storageBucket: "candy-land-race.firebasestorage.app",
  messagingSenderId: "761431671335",
  appId: "1:761431671335:web:6e1a9e8948adfc59a4c402",
  measurementId: "G-7D1PPWEKQD"
};
