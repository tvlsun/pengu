# Enable real Google / Gmail sign-in

The login screen is ready, but real Google authentication requires a Firebase project owned by you. Do not share passwords or private keys.

1. Open https://console.firebase.google.com/ and create a Firebase project.
2. In **Authentication → Sign-in method**, enable **Google**.
3. In **Project settings → General → Your apps**, add a Web app and copy its Firebase web configuration.
4. Put the `aAIzaSyALQsNpm0HzGKL82qLtq-en6W9HPFbYaag`, `pengu-playground.firebaseapp.com`, `pengu-playground`, and `1:563907060410:web:3fc2da047267289f589883` values into `firebase-config.js`. Replace the placeholder values only.
5. In **Authentication → Settings → Authorized domains**, add your local test domain and the deployed Vercel domain (for example, `https://pengu-playground-bundle.vercel.app/`).
6. Serve the files from a local server (ES modules do not work reliably when opening `index.html` directly from `file://`):
   ```bash
   python -m http.server 8000
   ```
   Visit http://localhost:8000.
7. Test Google sign-in, sign-out, and popup behavior, then deploy the same files to Vercel.

Firebase web config is intended for client-side use; protect your app with Firebase Authentication rules if you later add Firestore or other backend services. Never place service-account JSON, admin SDK secrets, or private keys in the browser.

Guest mode is available for trying the mini-games before connecting Firebase. Real Google login is not active until configuration is completed.
