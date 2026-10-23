import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const scoresKey = "pengu-scores-v2";
const rewardKey = "pengu-reward-date";
let db, user = null, walletAddress = null, latestScores = null, rewardDate = null, saveTimer;

function scoresNow() {
  try { return latestScores || JSON.parse(localStorage.getItem(scoresKey) || '{"catcher":0,"memory":0,"tap":0,"points":0}'); }
  catch { return { catcher:0, memory:0, tap:0, points:0 }; }
}
function status(message) { const el=$("walletStatus"); if(el) el.textContent=message; }
async function saveCloudProfile() {
  if(!db || !user) return;
  const s=scoresNow();
  try {
    await setDoc(doc(db,"users",user.uid), {
      uid:user.uid, displayName:user.displayName || user.email?.split("@")[0] || "Player",
      email:user.email || null, photoURL:user.photoURL || null,
      walletAddress:walletAddress,
      points:Number(s.points)||0,
      bestScores:{catcher:Number(s.catcher)||0,memory:Number(s.memory)||0,tap:Number(s.tap)||0},
      dailyRewardDate:rewardDate ?? localStorage.getItem(rewardKey) ?? null,
      updatedAt:serverTimestamp()
    },{merge:true});
    await setDoc(doc(db,"leaderboard",user.uid),{
      uid:user.uid,displayName:user.displayName || user.email?.split("@")[0] || "Player",
      photoURL:user.photoURL || null,points:Number(s.points)||0,updatedAt:serverTimestamp()
    },{merge:true});
    status("Cloud sync active: profile, wallet, points and scores saved.");
  } catch(e) {
    console.error("Firestore save failed",e);
    status("Cloud sync failed. Publish firestore.rules and check Firestore is enabled.");
  }
}
function scheduleSave(){ if(!user || !db)return; clearTimeout(saveTimer); saveTimer=setTimeout(saveCloudProfile,500); }
function showLeaderboard(){
  const list=$("leaderboardList"); if(!list || !db)return;
  const q=query(collection(db,"leaderboard"),orderBy("points","desc"),limit(10));
  onSnapshot(q,snap=>{
    list.replaceChildren();
    if(snap.empty){const li=document.createElement("li");li.textContent="No scores yet — be the first!";list.append(li);return;}
    snap.docs.forEach((item,i)=>{
      const row=item.data(),li=document.createElement("li");
      const rank=document.createElement("span");rank.className="rank";rank.textContent=String(i+1);
      const avatar=document.createElement("span");avatar.className="leader-avatar";avatar.textContent="🐧";
      const name=document.createElement("span");name.className="leader-name";name.textContent=row.displayName||"Player";
      const points=document.createElement("b");points.textContent=(Number(row.points)||0).toLocaleString()+" pts";
      li.append(rank,avatar,name,points);list.append(li);
    });
  },e=>{console.error("Leaderboard read failed",e);status("Leaderboard unavailable; check Firestore rules.");});
}
if(isFirebaseConfigured){
  try{
    const app=getApps().length?getApp():initializeApp(firebaseConfig);
    const auth=getAuth(app);db=getFirestore(app);
    onAuthStateChanged(auth,async signedUser=>{
      user=signedUser||null;
      if(!user)return;
      try{
        const snap=await getDoc(doc(db,"users",user.uid));
        if(snap.exists()){
          const cloud=snap.data(),local=scoresNow(),best=cloud.bestScores||{};
          walletAddress=cloud.walletAddress||null;
          latestScores={
            catcher:Math.max(Number(local.catcher)||0,Number(best.catcher)||0),
            memory:Math.max(Number(local.memory)||0,Number(best.memory)||0),
            tap:Math.max(Number(local.tap)||0,Number(best.tap)||0),
            points:Math.max(Number(local.points)||0,Number(cloud.points)||0)
          };
          localStorage.setItem(scoresKey,JSON.stringify(latestScores));
          if(cloud.dailyRewardDate){rewardDate=cloud.dailyRewardDate;localStorage.setItem(rewardKey,cloud.dailyRewardDate);}
          window.dispatchEvent(new CustomEvent("pengu-cloud-profile-loaded",{detail:{scores:latestScores,walletAddress}}));
        }else latestScores=scoresNow();
        await saveCloudProfile();
      }catch(e){console.error("Firestore load failed",e);status("Could not load cloud profile. Check Firestore setup and rules.");}
    });
    window.addEventListener("pengu-scores-updated",e=>{latestScores=e.detail?.scores||scoresNow();scheduleSave();});
    window.addEventListener("pengu-daily-reward",e=>{rewardDate=e.detail?.date||localStorage.getItem(rewardKey);scheduleSave();});
    window.addEventListener("pengu-daily-reward-state",e=>{rewardDate=e.detail?.date||null;});
    window.addEventListener("pengu-wallet-changed",e=>{walletAddress=e.detail?.connected?e.detail?.address||null:null;scheduleSave();});
    window.addEventListener("pengu-auth-changed",e=>{
      if(e.detail?.user?.authProvider==="metamask")status("For secure cloud saving, sign in with Google first and then link your wallet.");
    });
    showLeaderboard();
  }catch(e){console.error("Firebase/Firestore initialization failed",e);status("Cloud sync setup error; local play remains available.");}
}else status("Cloud sync needs Firebase web configuration.");
