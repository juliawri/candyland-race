// ─────────────────────────────────────────────────────────────────────────
// Leaderboard module.
//
// Tries to use Firebase Firestore for a GLOBAL, shared leaderboard. If
// firebase-config.js still has placeholder values (or the Firebase SDK
// fails to load / init for any reason), it transparently falls back to a
// LOCAL leaderboard stored in this browser's localStorage so the game
// always works out of the box.
//
// Ranking: fewer turns to reach Candy Castle = better score.
// ─────────────────────────────────────────────────────────────────────────

import { firebaseConfig } from "./firebase-config.js";

const LOCAL_KEY = "candyland_race_leaderboard_v1";
const COLLECTION_NAME = "candyland_scores";

let db = null;
let firebaseReady = false;
let firestoreApi = null;

function isConfigured(cfg){
  return !!(cfg && cfg.apiKey && cfg.apiKey !== "YOUR_API_KEY" && cfg.projectId && cfg.projectId !== "YOUR_PROJECT_ID");
}

async function initFirebase(){
  if(!isConfigured(firebaseConfig)) return false;
  try{
    const [{ initializeApp }, firestore] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
    ]);
    const app = initializeApp(firebaseConfig);
    db = firestore.getFirestore(app);
    firestoreApi = firestore;
    firebaseReady = true;
    return true;
  }catch(err){
    console.warn("[leaderboard] Firebase init failed, using local leaderboard instead.", err);
    firebaseReady = false;
    return false;
  }
}

const readyPromise = initFirebase();

function getLocalScores(){
  try{
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(err){
    console.warn("[leaderboard] could not read local scores", err);
    return [];
  }
}

function saveLocalScores(scores){
  try{
    localStorage.setItem(LOCAL_KEY, JSON.stringify(scores));
  }catch(err){
    console.warn("[leaderboard] could not save local scores", err);
  }
}

/**
 * Submit a finished game's score.
 * @param {string} name - player display name
 * @param {number} turns - number of turns taken to win (lower is better)
 * @param {number} opponents - number of AI opponents in that race
 * @returns {Promise<{ok:boolean, mode:'global'|'local'}>}
 */
export async function submitScore(name, turns, opponents){
  await readyPromise;
  const entry = {
    name: String(name || "Player").slice(0, 18),
    turns: Math.max(1, Math.round(turns)),
    opponents: Math.max(1, Math.round(opponents)),
    date: new Date().toISOString()
  };

  if(firebaseReady && db && firestoreApi){
    try{
      const { collection, addDoc, serverTimestamp } = firestoreApi;
      await addDoc(collection(db, COLLECTION_NAME), { ...entry, createdAt: serverTimestamp() });
      return { ok:true, mode:"global" };
    }catch(err){
      console.warn("[leaderboard] Firebase write failed, saving locally instead.", err);
    }
  }

  const scores = getLocalScores();
  scores.push(entry);
  saveLocalScores(scores);
  return { ok:true, mode:"local" };
}

/**
 * Fetch the top N scores, sorted by fewest turns first.
 * @param {number} n
 * @returns {Promise<{mode:'global'|'local', scores:Array}>}
 */
export async function fetchTopScores(n = 10){
  await readyPromise;

  if(firebaseReady && db && firestoreApi){
    try{
      const { collection, query, orderBy, limit, getDocs } = firestoreApi;
      const q = query(collection(db, COLLECTION_NAME), orderBy("turns", "asc"), limit(n));
      const snap = await getDocs(q);
      const scores = [];
      snap.forEach(doc => scores.push(doc.data()));
      return { mode:"global", scores };
    }catch(err){
      console.warn("[leaderboard] Firebase read failed, showing local scores instead.", err);
    }
  }

  const scores = getLocalScores()
    .slice()
    .sort((a,b) => a.turns - b.turns)
    .slice(0, n);
  return { mode:"local", scores };
}

export function isGlobalLeaderboardConfigured(){
  return isConfigured(firebaseConfig);
}
