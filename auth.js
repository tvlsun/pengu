// Firebase Google sign-in. Configure firebase-config.js with your own Firebase Web app values.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
const $ = id => document.getElementById(id);
const authScreen=$('authScreen'), googleButton=$('googleSignIn'), guestButton=$('guestContinue'), authStatus=$('authStatus'), loginOpen=$('loginOpen'), navLoginText=$('navLoginText'), navAvatar=$('navAvatar');
let auth=null,currentUser=null,guestMode=sessionStorage.getItem('pengu-guest')==='true';
let walletSessionAddress=sessionStorage.getItem('pengu-wallet-signed-in')||null;
function dispatchWalletUser(address){
  const user={uid:`wallet:${address.toLowerCase()}`,displayName:`Wallet ${address.slice(0,6)}…${address.slice(-4)}`,email:null,photoURL:null,walletAddress:address,authProvider:'metamask'};
  currentUser=user;
  if(navLoginText)navLoginText.textContent=user.displayName;
  if(navAvatar)navAvatar.textContent='🦊';
  if(loginOpen)loginOpen.title='Wallet sign-in active in this browser';
  if(authScreen)authScreen.hidden=true;
  window.dispatchEvent(new CustomEvent('pengu-auth-changed',{detail:{user,guest:false,signedIn:true,provider:'metamask'}}));
}
function setStatus(message,type=''){if(!authStatus)return;authStatus.textContent=message;authStatus.className=`auth-status ${type}`.trim();}
function dispatchUser(user,guest=false){currentUser=user;window.dispatchEvent(new CustomEvent('pengu-auth-changed',{detail:{user,guest,signedIn:Boolean(user)||guest}}));if(user){if(navLoginText)navLoginText.textContent=user.displayName||user.email||'Player';if(navAvatar)navAvatar.innerHTML=user.photoURL?`<img src="${user.photoURL}" alt="">`:'🐧';if(loginOpen)loginOpen.title='Click to sign out';if(authScreen)authScreen.hidden=true;}else if(guest){if(navLoginText)navLoginText.textContent='Guest player';if(navAvatar)navAvatar.textContent='🐧';if(loginOpen)loginOpen.title='Sign in with Google';if(authScreen)authScreen.hidden=true;}else{if(navLoginText)navLoginText.textContent='Sign in';if(navAvatar)navAvatar.textContent='🐧';if(loginOpen)loginOpen.title='Sign in with Google';if(authScreen)authScreen.hidden=false;}}
if(isFirebaseConfigured){try{const app=initializeApp(firebaseConfig);auth=getAuth(app);onAuthStateChanged(auth,user=>{if(user?.isAnonymous && walletSessionAddress){dispatchWalletUser(walletSessionAddress);return;}if(user){guestMode=false;sessionStorage.removeItem('pengu-guest');dispatchUser(user);setStatus(`Signed in as ${user.email||user.displayName}`,'success');}else if(walletSessionAddress){dispatchWalletUser(walletSessionAddress);}else if(guestMode){dispatchUser(null,true);}else{dispatchUser(null,false);}});}catch(error){console.error('Firebase initialization failed:',error);setStatus('Firebase setup error. Check firebase-config.js and reload.','error');dispatchUser(null,false);}}else{if(walletSessionAddress)dispatchWalletUser(walletSessionAddress);else dispatchUser(null,guestMode);setStatus('Google sign-in needs Firebase configuration. You can also sign in with MetaMask.','error');}
googleButton?.addEventListener('click',async()=>{if(!isFirebaseConfigured||!auth){setStatus('Google login is not connected yet. Check firebase-config.js values and redeploy.','error');return;}googleButton.disabled=true;setStatus('Opening Google sign-in…');try{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});const result=await signInWithPopup(auth,provider);guestMode=false;sessionStorage.removeItem('pengu-guest');dispatchUser(result.user);setStatus(`Welcome, ${result.user.displayName||'player'}!`,'success');}catch(error){console.error('Google sign-in failed:',error);const messages={'auth/popup-closed-by-user':'Sign-in window was closed. Try again when ready.','auth/unauthorized-domain':'Add this Vercel domain to Firebase Authentication → Settings → Authorized domains.','auth/popup-blocked':'Your browser blocked the popup. Allow popups and try again.','auth/operation-not-allowed':'Enable Google in Firebase Authentication → Sign-in method.'};setStatus(messages[error.code]||`Sign-in failed: ${error.code||error.message}`,'error');}finally{googleButton.disabled=false;}});
guestButton?.addEventListener('click',()=>{guestMode=true;sessionStorage.setItem('pengu-guest','true');setStatus('You are exploring as a guest. Sign in later to use your Google profile.');dispatchUser(null,true);});
window.addEventListener('pengu-wallet-signin', event => {
  walletSessionAddress=event.detail?.address||null;
  if(walletSessionAddress)dispatchWalletUser(walletSessionAddress);
});
const accountMenu=$('accountMenu');
const menuSignOut=$('menuSignOut');
function closeAccountMenu(){
  if(accountMenu) accountMenu.hidden=true;
  loginOpen?.setAttribute('aria-expanded','false');
}
function refreshAccountMenu(user=currentUser,guest=guestMode){
  const name=$('accountMenuName'), email=$('accountMenuEmail'), avatar=$('accountMenuAvatar');
  if(name) name.textContent=user?.displayName||user?.email?.split('@')[0]||(guest?'Guest player':'Player');
  if(email) email.textContent=user?.email||(user?.authProvider==='metamask'?'MetaMask wallet connected':guest?'Guest session':'Pengu Playground');
  if(avatar) avatar.textContent=user?.authProvider==='metamask'?'🦊':'🐧';
}
loginOpen?.addEventListener('click',()=>{
  if(!currentUser&&!guestMode){
    if(authScreen)authScreen.hidden=false;
    setStatus(isFirebaseConfigured?'Choose your Google account to continue.':'Add Firebase config to enable Google sign-in.','');
    return;
  }
  refreshAccountMenu();
  if(accountMenu){
    accountMenu.hidden=!accountMenu.hidden;
    loginOpen.setAttribute('aria-expanded',String(!accountMenu.hidden));
  }
});
$('accountProfileLink')?.addEventListener('click',closeAccountMenu);
document.addEventListener('click',event=>{
  const wrap=document.querySelector('.account-menu-wrap');
  if(wrap&&!wrap.contains(event.target))closeAccountMenu();
});
menuSignOut?.addEventListener('click',async()=>{
  closeAccountMenu();
  try {
    if(auth && currentUser) await signOut(auth);
    guestMode=false;
    walletSessionAddress=null;
    currentUser=null;
    sessionStorage.removeItem('pengu-guest');
    sessionStorage.removeItem('pengu-wallet-signed-in');
    dispatchUser(null,false);
    setStatus('You have signed out successfully.','success');
    if(authScreen)authScreen.hidden=false;
  } catch(error) {
    console.error('Sign out failed:',error);
    setStatus('Could not sign out. Please try again.','error');
  }
});
