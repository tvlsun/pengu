// Firebase web app configuration.
// Replace the placeholder strings with values from Firebase Console → Project settings → Your apps.
// Do not put any private service-account keys or admin credentials in this file.
export const firebaseConfig = {
  apiKey: "AIzaSyALQsNpm0HzGKL82qLtq-en6W9HPFbYaag",
  authDomain: "pengu-playground.firebaseapp.com",
  projectId: "pengu-playground",
  appId: "1:563907060410:web:3fc2da047267289f589883"
};
export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) &&
  !firebaseConfig.apiKey.includes("YOUR_") &&
  Boolean(firebaseConfig.authDomain) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);