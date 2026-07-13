# 🍬 Candy Land Race

A browser trivia game inspired by Candy Land: answer trivia questions solo to hop along the trail to
Candy Castle. Right answers move you forward a spot, wrong answers send you back a spot. Winning games
are ranked on a leaderboard by **score**, a combination of speed and how many questions it took (higher
is better). Run out of trivia questions before reaching the castle and your score is 0. Pure HTML/CSS/JS
— no build step, ready for GitHub Pages.

## Play it locally

Because the game uses ES module `import`s, opening `index.html` directly by double-clicking it won't
work (browsers block module imports over `file://`). Serve the folder instead:

```bash
cd candyland-race
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Any other static server works too (`npx serve`, VS Code's "Live Server" extension, etc).

## How the game works

- Pick your name and an emoji icon, then answer trivia questions one at a time.
- Answer **correctly** and you hop 1 space forward. Answer **incorrectly** and you slide 1 space back.
- It's solo — there are no computer opponents.
- First (and only) racer to reach **🏰 Candy Castle** wins. Your **score** combines your total time and
  the number of questions it took — faster and fewer questions means a higher score.
- If you run out of trivia questions before reaching the castle, your score is **0**.

## Leaderboard: local vs. global

Out of the box, the leaderboard works with **zero setup** — scores are saved in `localStorage`, so
each visitor only sees scores from their own browser/device.

To make the leaderboard **shared across every visitor of your GitHub Pages site**, wire up a free
Firebase project (Firestore). This takes about 5 minutes.

### 1. Create a Firebase project

1. Go to <https://console.firebase.google.com/> and sign in with a Google account.
2. Click **Add project**, give it any name (e.g. `candyland-race`), and finish the setup wizard.
   You can decline Google Analytics — it isn't needed.

### 2. Create a Firestore database

1. In the left sidebar, go to **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Start in test mode** for now (we'll tighten the rules in step 4), pick a location close
   to your players, and click **Enable**.

### 3. Register a web app and get your config

1. In the project overview page, click the **`</>`** (web) icon to add a web app.
2. Give it a nickname (e.g. `candyland-web`) — you don't need Firebase Hosting.
3. Firebase will show you a `firebaseConfig` object that looks like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "candyland-race.firebaseapp.com",
     projectId: "candyland-race",
     storageBucket: "candyland-race.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```

4. Copy those values into **`firebase-config.js`** in this project, replacing the placeholder
   `"YOUR_API_KEY"` etc. Save the file.

That's it — reload the game (served over `http://`, not `file://`) and the leaderboard will
automatically start reading/writing to Firestore instead of `localStorage`. The `lbMode` badge next
to "Fastest Trails" will switch from **💻 This device** to **🌐 Global**.

### 4. Lock down the security rules (recommended)

Test mode allows anyone to read/write anything, which is fine briefly but should be tightened before
sharing your link widely. In **Firestore Database → Rules**, replace the rules with something like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /candyland_scores/{scoreId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['name','score','turns','timeSeconds','date'])
                    && request.resource.data.name is string
                    && request.resource.data.name.size() <= 18
                    && request.resource.data.score is number
                    && request.resource.data.score >= 0
                    && request.resource.data.score < 100000;
      allow update, delete: if false;
    }
  }
}
```

This lets anyone read the leaderboard and submit a new score (with sane values), but nobody can edit
or delete existing entries. Because this is a client-side game, a determined visitor could still submit
a fake low score by editing the page's code — that's an inherent limitation of any pure static-site
leaderboard without a real backend/auth system, but the rules above stop the easy/accidental cases.

## Deploy to GitHub Pages

1. Create a new repository on GitHub (don't initialize it with a README, since this folder already
   has one).
2. From inside this folder:

   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git branch -M main
   git push -u origin main
   ```

3. On GitHub, go to your repo's **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**, branch **main**,
   folder **/ (root)**, then click **Save**.
5. After a minute or two, GitHub will show your live URL, something like:
   `https://<your-username>.github.io/<your-repo>/`

Every time you `git push` new changes to `main`, GitHub Pages redeploys automatically.

## File overview

| File                | Purpose |
|---------------------|---------|
| `index.html`        | Page structure: board, controls, modals, leaderboard panel |
| `style.css`         | Candy Land visual theme |
| `game.js`           | Game engine: board, trivia questions, scoring, win/lose flow |
| `leaderboard.js`    | Score read/write, with automatic Firebase → localStorage fallback |
| `firebase-config.js`| Your Firebase project keys (edit this to enable the global leaderboard) |
