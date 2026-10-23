const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const state = { game: null, score: 0, best: 0, running: false, timer: null, time: 30, moves: 0, matched: 0, sound: true, tapTarget: null, combo: 0, lockBoard: false, mismatchTimer: null };
const gameMeta = {
  catcher: { title: 'Coin Catcher', desc: 'Tap as many falling coins as you can before time runs out.', duration: 30, hint: 'Tap the coins! Each coin is one point.' },
  memory: { title: 'Memory Match', desc: 'Flip cards and find all six matching pairs with as few moves as possible.', duration: 0, hint: 'Flip two cards at a time and remember where they are.' },
  tap: { title: 'Quick Tap', desc: 'Tap the target as fast as possible in 10 seconds.', duration: 10, hint: 'Ready, set, tap!' }
};
const scoreKey = 'pengu-scores-v2';
const rewardsKey = 'pengu-reward-date';
let scores = JSON.parse(localStorage.getItem(scoreKey) || '{"catcher":0,"memory":0,"tap":0,"points":0}');
function saveScores(){ localStorage.setItem(scoreKey, JSON.stringify(scores)); renderScores(); window.dispatchEvent(new CustomEvent('pengu-scores-updated',{detail:{scores:{...scores}}})); }
function renderScores(){ ['catcher','memory','tap'].forEach(k=>{ const el=$('#best-'+(k==='catcher'?'catcher':k)); if(el) el.textContent=scores[k]||0; }); $('#totalPoints').textContent=scores.points||0; renderLeaderboard(); }
function renderLeaderboard(){ const list=$('#leaderboardList'); if(!list)return; const rows=[{name:window.penguPlayerName||'You',score:scores.points||0,me:true},{name:'Coin Collector',score:(scores.catcher||0)*10},{name:'Memory Master',score:(scores.memory||0)*5},{name:'Tap Legend',score:(scores.tap||0)*3}].sort((a,b)=>b.score-a.score); list.innerHTML=rows.map((r,i)=>`<li><span class="rank">${i+1}</span><span class="leader-avatar">${r.me?'🐧':['🪙','🧠','⚡'][i%3]}</span><span class="leader-name">${r.name}${r.me?' (you)':''}</span><b>${r.score.toLocaleString()} pts</b></li>`).join(''); }
function updatePoints(points){ scores.points=(scores.points||0)+points; saveScores(); const toast=$('#toast'); toast.textContent=`+${points} points earned!`; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2200); }
function claimDaily(){ const today=new Date().toLocaleDateString('en-CA'); const btn=$('#dailyReward'); if(localStorage.getItem(rewardsKey)===today){btn.disabled=true;btn.innerHTML='✓ Claimed today';$('#rewardStatus').textContent='Come back tomorrow for another reward.';return;} btn.disabled=false; btn.innerHTML='Claim +50 points ✨'; }
$('#dailyReward')?.addEventListener('click',()=>{const today=new Date().toLocaleDateString('en-CA');if(localStorage.getItem(rewardsKey)===today)return;localStorage.setItem(rewardsKey,today);window.dispatchEvent(new CustomEvent('pengu-daily-reward',{detail:{date:today}}));updatePoints(50);claimDaily();$('#rewardStatus').textContent='Nice! Your daily bonus is ready.';});
function setGameStatus(text){$('#gameHint').textContent=text;}
function setScore(n){state.score=n;$('#currentScore').textContent=n;}
function stopTimer(){if(state.timer){clearInterval(state.timer);state.timer=null;}if(state.mismatchTimer){clearTimeout(state.mismatchTimer);state.mismatchTimer=null;}state.running=false;state.lockBoard=false;}
function closeGame(){stopTimer();$('#gameModal').hidden=true;}
function shuffle(items){for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
function moveCoin(coin){coin.style.left=(3+Math.random()*86)+'%';coin.style.top=(10+Math.random()*76)+'%';}
function openGame(key){stopTimer();state.game=key;state.time=gameMeta[key].duration;state.moves=0;state.matched=0;setScore(0);$('#modalTitle').textContent=gameMeta[key].title;$('#modalDescription').textContent=gameMeta[key].desc;$('#gameTime').textContent=key==='memory'?'0 moves':state.time+'s';$('#modalBest').textContent=scores[key]||0;$('#startGame').hidden=false;$('#restartGame').hidden=true;setGameStatus(gameMeta[key].hint);$('#gameStage').innerHTML='';$('#gameModal').hidden=false;}
function finishGame(){if(!state.running)return;stopTimer();$('#startGame').hidden=false;$('#startGame').textContent='Play again ↻';$('#restartGame').hidden=true;const key=state.game;const old=scores[key]||0;if(state.score>old){scores[key]=state.score;saveScores();$('#modalBest').textContent=state.score;}let earned=key==='memory'?Math.max(5,Math.round((12-state.moves)*2+state.matched*2)):state.score;earned=Math.max(0,earned);if(earned)updatePoints(earned);setGameStatus(`Round complete! Score: ${state.score}. ${earned?`+${earned} points earned.`:''} Play again to beat your best!`);}
function tick(){state.time--;$('#gameTime').textContent=state.time+'s';if(state.time<=0)finishGame();}
function startGame(){const key=state.game;stopTimer();setScore(0);state.time=gameMeta[key].duration;state.moves=0;state.matched=0;state.combo=0;state.lockBoard=false;$('#startGame').hidden=true;$('#restartGame').hidden=false;
 if(key==='catcher'){const stage=$('#gameStage');stage.innerHTML='<div class="catcher-field" aria-label="Tap coins to collect"><div class="game-instructions">Tap every coin you see!</div></div>';const field=$('.catcher-field');for(let i=0;i<9;i++){const coin=document.createElement('button');coin.className='falling-coin';coin.textContent='🪙';coin.style.left=(4+Math.random()*84)+'%';coin.style.top=(14+Math.random()*68)+'%';coin.style.animationDelay=(-Math.random()*3)+'s';coin.setAttribute('aria-label','Collect coin');coin.addEventListener('click',()=>{if(!state.running)return;state.combo++;const bonus=state.combo%5===0?2:1;setScore(state.score+bonus);coin.classList.remove('coin-pop');void coin.offsetWidth;coin.classList.add('coin-pop');moveCoin(coin);setGameStatus(bonus===2?'Combo bonus! +2 coins ✨':'Nice catch! Keep going!');if(state.sound)playBeep();});field.append(coin);} }
 if(key==='memory'){const cards=shuffle(['🐧','⭐','🍓','🐟','🍉','🧊','🐧','⭐','🍓','🐟','🍉','🧊']);$('#gameStage').innerHTML='<div class="memory-board">'+cards.map((v,i)=>`<button class="memory-card" data-value="${v}" aria-label="Card ${i+1}">?</button>`).join('')+'</div>';let flipped=[];$$('.memory-card').forEach(card=>card.addEventListener('click',()=>{if(!state.running||state.lockBoard||card.classList.contains('flipped')||card.classList.contains('matched')||flipped.length===2)return;card.classList.add('flipped');card.textContent=card.dataset.value;flipped.push(card);if(flipped.length===2){state.moves++;$('#gameTime').textContent=state.moves+' moves';if(flipped[0].dataset.value===flipped[1].dataset.value){flipped.forEach(c=>c.classList.add('matched'));state.matched+=2;setScore(state.matched/2);flipped=[];if(state.matched===12)finishGame();}else{state.lockBoard=true;const pair=[...flipped];state.mismatchTimer=setTimeout(()=>{pair.forEach(c=>{c.classList.remove('flipped');c.textContent='?';});state.mismatchTimer=null;state.lockBoard=false;},700);flipped=[];}}}));}
 if(key==='tap'){$('#gameStage').innerHTML='<div class="tap-field"><p>Tap the penguin!</p><button class="tap-game-target" aria-label="Tap target">🐧</button></div>';const target=$('.tap-game-target');target.addEventListener('click',()=>{if(!state.running)return;setScore(state.score+1);target.classList.remove('tap-pop');void target.offsetWidth;target.classList.add('tap-pop');target.style.left=(5+Math.random()*72)+'%';target.style.top=(22+Math.random()*55)+'%';target.style.transform=`rotate(${Math.random()*24-12}deg) scale(${.85+Math.random()*.3})`;if(state.sound)playBeep();});}
 state.running=true;if(key!=='memory'){state.timer=setInterval(tick,1000);$('#gameTime').textContent=state.time+'s';}setGameStatus(key==='memory'?'Find all 6 pairs!':gameMeta[key].hint);}
function playBeep(){try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=660;gain.gain.value=.04;osc.start();osc.stop(ctx.currentTime+.06);}catch(e){}}
$$('[data-game]').forEach(btn=>btn.addEventListener('click',()=>openGame(btn.dataset.game)));$('#closeModal').addEventListener('click',closeGame);$('#gameModal').addEventListener('click',e=>{if(e.target===$('#gameModal'))closeGame();});$('#startGame').addEventListener('click',startGame);$('#restartGame').addEventListener('click',startGame);
$('#soundToggle').addEventListener('click',()=>{state.sound=!state.sound;$('#soundToggle').textContent=state.sound?'🔊 Sound':'🔇 Muted';$('#soundToggle').setAttribute('aria-pressed',String(!state.sound));});
window.addEventListener('pengu-auth-changed',e=>{const u=e.detail?.user;if(u){window.penguPlayerName=u.displayName||u.email?.split('@')[0]||'Player';$('#profileName').textContent=window.penguPlayerName;$('#profileEmail').textContent=u.email||'Google account connected';$('#profileAvatar').innerHTML=u.photoURL?`<img src="${u.photoURL}" alt="">`:'🐧';}else if(e.detail?.guest){window.penguPlayerName='Guest Player';$('#profileName').textContent='Guest Player';$('#profileEmail').textContent='Playing as guest';}renderLeaderboard();});
renderScores();claimDaily();window.dispatchEvent(new CustomEvent('pengu-scores-updated',{detail:{scores:{...scores}}}));window.dispatchEvent(new CustomEvent('pengu-daily-reward-state',{detail:{date:localStorage.getItem(rewardsKey)||null}}));


window.addEventListener('pengu-cloud-profile-loaded',event=>{
  const cloud=event.detail?.scores;
  if(!cloud)return;
  scores={...scores,
    catcher:Math.max(Number(scores.catcher)||0,Number(cloud.catcher)||0),
    memory:Math.max(Number(scores.memory)||0,Number(cloud.memory)||0),
    tap:Math.max(Number(scores.tap)||0,Number(cloud.tap)||0),
    points:Math.max(Number(scores.points)||0,Number(cloud.points)||0)
  };
  localStorage.setItem(scoreKey,JSON.stringify(scores));
  renderScores();
  claimDaily();
});
