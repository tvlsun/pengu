# Pengu Playground — upgraded mini-game portal

A responsive cartoon arcade with Firebase Google sign-in support, guest mode, player profile display, three mini-games, local best scores, points, daily bonus, and a browser-local leaderboard.

## Included
- Coin Catcher, Memory Match, Quick Tap
- Google sign-in/sign-out using Firebase Authentication
- Guest mode
- Player profile display and avatar
- Best scores and points saved in the current browser
- Daily +50 point reward (once per local calendar day)
- Local leaderboard derived from saved scores
- Responsive mobile layout and optional sound effects

## Important limits
Scores, points, daily rewards, and the leaderboard are local to each browser/device. They are **not** synced to a cloud database and are not a real global leaderboard. To sync profiles/scores across devices, a Firestore database and appropriate security rules must be added separately.

## Configure Firebase Google login
1. Open https://console.firebase.google.com/ and select your Firebase project.
2. In Authentication → Sign-in method, enable **Google**.
3. In Project settings → General → Your apps, select your Web app and copy its config.
4. Replace the `REPLACE_...` values in `firebase-config.js` with the exact config values. Keep `isFirebaseConfigured` logic intact.
5. In Authentication → Settings → Authorized domains, add your exact Vercel domain without `https://`.
6. Commit all files and redeploy on Vercel. Test sign-in from the deployed HTTPS domain.

Never place service-account JSON, admin credentials, or private keys in this frontend project. Firebase web config is designed for client use.

## Deploy to Vercel
Upload all files at this folder's root to your separate GitHub repository, then import that repository in https://vercel.com/new. Framework preset: **Other**; build command empty; output directory `.`. If your project is already connected, commit/push the changed files and wait for the new deployment to become Ready.

## Run locally
From this directory run `python -m http.server 8000`, then visit http://localhost:8000. Firebase modules should be tested via a local server, not `file://`.


## Existing game improvements
- Coin Catcher adds a combo bonus every fifth coin and animated repositioning.
- Memory Match uses Fisher–Yates shuffle and blocks extra input while mismatched cards flip back.
- Quick Tap has smoother target movement and hit feedback.
- Added touch-friendly mobile gameplay styling.


## MetaMask wallet connection
- Uses the browser-injected MetaMask provider (`window.ethereum`).
- Connects by requesting the public account address only; it never asks for seed phrases or private keys and does not submit transactions.
- The Disconnect button clears the website UI state; users can revoke extension permissions from MetaMask settings.
- Requires MetaMask installed in a supported browser.


## Owner-only wallet profile display
- MetaMask address is shown only in the currently signed-in profile and is not shown in the leaderboard or shared wallet banner.
- Wallet association is stored locally per Firebase UID (or guest profile) in this browser. It is not synced across devices and does not prove wallet ownership cryptographically.
- For server-enforced privacy and cross-device profile sync, connect Firestore with security rules and verify wallet signatures server-side.

## MetaMask sign-in
The login screen includes a MetaMask sign-in button. It requests the wallet account and a `personal_sign` signature proving control of that address; it does not send a transaction and never asks for a seed phrase/private key. The current implementation stores a short-lived browser-session marker for the UI only. For production authentication, implement server-side signature verification (e.g. SIWE/EIP-4361), nonce validation, and a secure server-issued session before treating the wallet as authenticated for protected data.

## Visual direction
Updated to an original dark-fantasy strategy-arena look inspired by the broad feel of modern spell-chess games: deep navy panels, subtle grid texture, chess-piece motifs, gold accents, trial cards, and a player hall. This is not a copy of Anichess branding or assets; existing Pengu mini-games and sign-in code are retained.

## Firestore cloud sync
1. Firebase Console → Build → Firestore Database → create database if needed.
2. Open Firestore Database → Rules. Publish the rules from `firestore.rules`.
3. The site now loads `firestore-sync.js` to sync Google-authenticated profiles, linked wallet address, points, best scores, daily reward date, and the shared leaderboard.
4. Keep `firebase-config.js` unchanged. Firebase Auth Google sign-in must be enabled.
5. MetaMask-only sign-in is not server-verified, so for now sign in with Google and then connect MetaMask to associate the wallet securely with that Google profile.
6. This starter writes points from the browser and is not cheat-proof. Do not use it for token payouts or valuable rewards without server-side validation.
