'use strict';
// ===== Extras: difficulty, weather, derbies, achievements, records/history, sound & haptics =====
const DIFFS={easy:{n:'Easy',cash:1.6,board:1.5},normal:{n:'Normal',cash:1,board:1},hard:{n:'Hard',cash:0.55,board:0.6}};
let pickDiff='normal';
const WEATHER=[['☀️','Sunny',1.04,0],['⛅','Cloudy',1,0],['🌧️','Rain',0.88,1],['🌬️','Windy',0.95,0],['❄️','Snow',0.75,2],['🌫️','Fog',0.93,0]];
function rollWeather(){const wk=G.day||0,winter=wk>14&&wk<42;const w=[0,1,1,2,2,3,5];if(winter)w.push(2,2,4,4);else w.push(0,0,1);return pick(w)}
function rivalOf(i){const me=G.teams[i];let best=-1,bd=1e18;G.teams.forEach(t=>{if(t.id===i)return;const d=Math.abs(t.rep-me.rep)+(t.div===me.div?0:50)+Math.abs(t.id-i)*.01;if(d<bd){bd=d;best=t.id}});return best}
function roofCover(){let c=0,n=0;for(const k in G.stad.stands){const s=G.stad.stands[k];if(s.tiers){n+=SIDE_LEN[k];c+=SIDE_LEN[k]*({none:0,partial:.5,full:1})[s.roof]}}return n?c/n:0}
function isDerby(fx){return fx&&fx.includes(G.rival)}
// sound + haptics
let AC=null;function beep(f=880,d=.15,type='triangle',t0=0){if(G&&G.muted)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.12,AC.currentTime+t0);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+t0+d);o.connect(g).connect(AC.destination);o.start(AC.currentTime+t0);o.stop(AC.currentTime+t0+d)}catch(e){}}
function buzz(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}
const sfx={win:()=>{beep(660,.12);beep(880,.12,'triangle',.12);beep(1320,.25,'triangle',.24);buzz([30,40,30])},loss:()=>{beep(300,.25,'sawtooth');beep(220,.35,'sawtooth',.2);buzz(80)},draw:()=>{beep(520,.2);buzz(20)},ach:()=>{[784,988,1175,1568].forEach((f,i)=>beep(f,.15,'square',i*.09));buzz([20,30,20,30,60])},build:()=>{beep(200,.08,'square');beep(260,.08,'square',.1);buzz(15)}};
// achievements
const ACH=[['first_win','First Blood','Win your first match',()=>me().w>=1||G.hist.length],['derby','Local Hero','Win a derby',()=>G.rec.derbyWins>0],
['cap25','Big Ground','Reach 25,000 capacity',()=>stadiumStats(G.stad).cap>=25000],['cap50','Cathedral','Reach 50,000 capacity',()=>stadiumStats(G.stad).cap>=50000],
['atm80','Wall of Noise','Atmosphere 80+',()=>stadiumStats(G.stad).atm>=80],['sellout','Sold Out','Fill the stadium to capacity',()=>G.rec.sellout],
['fac10','World Class','Any facility at level 10',()=>Object.values(G.fac).some(f=>f.lvl>=10)],['rich','Deep Pockets','Bank balance over £250m',()=>G.cash>=250e6],
['thrash','Thrashing','Win by 5+ goals',()=>G.rec.bigWin&&G.rec.bigWin.m>=5],['streak5','On Fire','Win 5 in a row',()=>G.rec.bestStreak>=5],
['top4','Elite','Top 4 in the Premier Division',()=>G.hist.some(h=>h.pos<=4&&!h.div)],['champ','Champions!','Win the Premier Division',()=>G.hist.some(h=>h.pos===1&&!h.div)],['promo','Going Up','Win promotion',()=>G.hist.some(h=>h.promoted)],['cup','Silverware','Win a cup',()=>(G.trophies||[]).length>0],['scorer','Goal Machine','A player scores 20+ in a season',()=>sq(G.club).some(p=>p.st.g>=20)],['academy','Academy Graduate','A 17-or-under plays for the first team',()=>sq(G.club).some(p=>p.age<=17&&p.st.ap>0)],['signing','Statement Signing','Sign a player rated 80+',()=>sq(G.club).some(p=>ovr(p)>=80&&p.mor>=79)],
['heat','Winter Ready','Install undersoil heating',()=>G.stad.global.heating>0],['metro','Connected','Build a metro station',()=>G.stad.global.transport>=3],
['loyal','Long Haul','Complete 3 seasons',()=>G.hist.length>=3]];
function initExtras(){if(!G||G.v!==2||!G.teams)return;G.diff=G.diff||'normal';G.rival=G.rival??rivalOf(G.club);G.hist=G.hist||[];G.ach=G.ach||{};
 G.rec=G.rec||{bigWin:null,bigLoss:null,topAtt:0,derbyWins:0,streak:0,bestStreak:0,sellout:false,seasonRev:0,seasonGoals:0};if(G.weather==null)G.weather=rollWeather()}
function checkAch(){ACH.forEach(([id,n])=>{if(!G.ach[id]&&ACH.find(a=>a[0]===id)[3]()){G.ach[id]=G.season+'·'+G.week;setTimeout(()=>{toast('🏅 Achievement: '+n);sfx.ach()},900)}})}
// wrap newGame for difficulty
const _ng=newGame;newGame=function(i){_ng(i);G.diff=pickDiff;G.cash*=DIFFS[pickDiff].cash;G.rival=null;initExtras();save()};
// attendance with weather + derby
const _att=attendance;attendance=function(){let a=_att();if(!G)return a;const w=WEATHER[G.weather]||WEATHER[1];const cov=roofCover();let f=w[2]+(1-w[2])*cov*0.8;if(isDerby(nextFx()))f*=1.15;return Math.round(Math.min(stadiumStats(G.stad).cap,a*f))};
// hooks from core engine
window.diffBoard=d=>{const f=DIFFS[G.diff||'normal'];return d<0?d/f.board-(G.diff==='hard'?.5:0):d+(G.diff==='easy'?.3:0)};
window.onMatchDone=function(i){initExtras();const r=i.r,home=i.home,gf=home?r.hg:r.ag,ga=home?r.ag:r.hg,res=i.res,derby=(r.h===G.rival||r.a===G.rival),cap=stadiumStats(G.stad).cap;
 if(derby){G.fans=clamp(G.fans+({W:5,D:0,L:-5})[res],0,100);if(res==='W')G.rec.derbyWins++;G.log.unshift((res==='W'?'🔥 Derby glory over ':res==='L'?'😡 Derby defeat to ':'Derby stalemate with ')+G.teams[G.rival].name)}
 const opp=G.teams[home?r.a:r.h].name,margin=gf-ga;if(margin>0&&(!G.rec.bigWin||margin>G.rec.bigWin.m))G.rec.bigWin={m:margin,s:`${gf}-${ga} vs ${opp} (S${G.season})`};
 if(margin<0&&(!G.rec.bigLoss||-margin>G.rec.bigLoss.m))G.rec.bigLoss={m:-margin,s:`${gf}-${ga} vs ${opp} (S${G.season})`};
 G.rec.streak=res==='W'?G.rec.streak+1:0;G.rec.bestStreak=Math.max(G.rec.bestStreak,G.rec.streak);
 if(home&&i.att){if(i.att>G.rec.topAtt)G.rec.topAtt=i.att;if(i.att>=cap&&cap>0)G.rec.sellout=true}
 if(!MV)(res==='W'?sfx.win:res==='L'?sfx.loss:sfx.draw)();toast(`${res==='W'?'✅ Win':res==='D'?'➖ Draw':'❌ Loss'} vs ${opp}`)};
window.onDayDone=function(){initExtras();const L=G.ledger[0];if(L)G.rec.seasonRev+=L.income;G.weather=rollWeather();checkAch()};
window.onSeasonEnd=function(sum){initExtras();G.hist.push({...sum,rev:G.rec.seasonRev,cap:stadiumStats(G.stad).cap,board:Math.round(G.board),fans:Math.round(G.fans)});G.rec.seasonRev=0;checkAch()};
// home banner
const _vh=vHome;vHome=function(){initExtras();_vh();const fx=nextFx(),w=WEATHER[G.weather]||WEATHER[1];const b=document.createElement('div');b.className='card';b.style.cssText='display:flex;gap:10px;align-items:center;padding:10px 14px';
 b.innerHTML=`<div style="font-size:28px">${w[0]}</div><div style="flex:1"><b>${w[1]}</b> forecast<div class="mut">${w[2]<1?`Crowds down unless covered (roof cover ${Math.round(roofCover()*100)}%)`:'Good conditions for a crowd'}${w[3]===2&&!G.stad.global.heating?' · Frozen pitch risk: no undersoil heating!':''}</div></div>
 ${isDerby(fx)?'<span class="pill L" style="font-size:12px">🔥 DERBY</span>':''}<span class="pill D">${DIFFS[G.diff].n}</span>`;$('#view').prepend(b)};
// picker with difficulty
const _rp=renderPicker;renderPicker=function(){_rp();const c=document.createElement('div');c.className='card';c.innerHTML=`<h3>Difficulty</h3><div class="seg">${Object.entries(DIFFS).map(([k,d])=>`<button class="${pickDiff===k?'on':''}" onclick="pickDiff='${k}';render()">${d.n}</button>`).join('')}</div><div class="mut" style="margin-top:6px">${{easy:'More money, patient board.',normal:'The intended challenge.',hard:'Tight budget, ruthless board.'}[pickDiff]}</div>`;
 const h=$('.hero');h.after(c)};
// records view
function vHist(){initExtras();const r=G.rec,got=ACH.filter(a=>G.ach[a[0]]).length;
 $('#view').innerHTML=`<div class="card"><h3>Rivalry</h3><div class="row"><span>Arch rival</span><b><span style="color:${G.teams[G.rival].col}">●</span> ${G.teams[G.rival].name}</b></div><div class="row"><span>Derby wins</span><b>${r.derbyWins}</b></div></div>
 <div class="card"><h3>Club records</h3>${[['Biggest win',r.bigWin?r.bigWin.s:'—'],['Heaviest defeat',r.bigLoss?r.bigLoss.s:'—'],['Record attendance',r.topAtt?r.topAtt.toLocaleString():'—'],['Longest win streak',r.bestStreak],['Current streak',r.streak+' W'],['Revenue this season',fmt(r.seasonRev)]].map(([a,b])=>`<div class="row"><span>${a}</span><b style="text-align:right">${b}</b></div>`).join('')}</div>
 <div class="card"><h3>Season history</h3>${G.hist.length?`<table><tr><th>S</th><th>Div</th><th>Pos</th><th>W-D-L</th><th>GD</th><th>Pts</th><th>Rev</th></tr>${G.hist.map(h=>`<tr><td>${h.season}</td><td>${DSHORT[h.div||0]}${h.promoted?'⬆️':h.relegated?'⬇️':''}</td><td><b>${h.pos}${ord(h.pos)}</b></td><td>${h.w}-${h.d}-${h.l}</td><td>${h.gf-h.ga}</td><td>${h.pts}</td><td>${fmt(h.rev)}</td></tr>`).join('')}</table>`:'<div class="mut">Finish a season to build your history.</div>'}</div>
 <div class="card"><h3>Achievements ${got}/${ACH.length}</h3>${ACH.map(([id,n,d])=>`<div class="row" style="opacity:${G.ach[id]?1:.45}"><span>${G.ach[id]?'🏅':'🔒'} <b>${n}</b><br><small class="mut">${d}</small></span><small class="mut">${G.ach[id]?'S'+G.ach[id]:''}</small></div>`).join('')}</div>
 <div class="card"><div class="row"><span>🔊 Sound effects</span><button class="btn sec" onclick="G.muted=!G.muted;save();render()">${G.muted?'Off':'On'}</button></div></div>`}
// build sfx on stand/facility commit
['commitStand','upFac','upGlobal'].forEach(n=>{const f=window[n];window[n]=function(...a){const c=G.cash;f(...a);if(G.cash<c)sfx.build()}});
initExtras();render();
