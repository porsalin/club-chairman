'use strict';
/* ===== v2 UI ===== */
const NAV=[['home','🏠','Club'],['squad','👕','Squad'],['market','🔁','Transfers'],['stadium','🏟️','Stadium'],['league','🏆','League'],['more','☰','More']];
const MORE=[['inbox','📥','Inbox'],['owner','💼','Owner'],['money','💷','Finance'],['staff','👔','Staff'],['fac','🏗️','Facilities'],['hist','📜','Records']];
let lgDiv=null,lgSeg='table',mkF={pos:'All',div:'All',seg:'search',q:'',max:0},sqSel=null;
const unread=()=>(G.inbox||[]).filter(m=>!m.read).length;
render=function(){if(!G){renderPicker();return}if(G.v!==2)migrateV1();
 $('#clubname').innerHTML=`<span style="color:${me().col}">●</span> ${me().name}`;$('#cash').textContent=fmt(G.cash);$('#cash').className=G.cash<0?'bad':'';
 const u=unread();$('#tabs').innerHTML=NAV.map(([k,i,n])=>`<button class="${tab===k||(k==='more'&&MORE.some(m=>m[0]===tab))?'on':''}" onclick="go('${k}')"><span>${i}</span>${n}${k==='more'&&u?`<em class="badge">${u}</em>`:''}</button>`).join('');
 const V={home:vHome,squad:vSquad,market:vMarket,stadium:vStadium,league:vLeague2,more:vMore,inbox:vInbox,owner:vOwner,money:vMoney2,staff:vStaff,fac:vFac,hist:window.vHist||vMore}[tab]||vHome;V()};
function vMore(){$('#view').innerHTML=`<div class="grid2">${MORE.map(([k,i,n])=>`<div class="card tile" onclick="go('${k}')"><div style="font-size:30px">${i}</div><b>${n}</b>${k==='inbox'&&unread()?`<em class="badge">${unread()}</em>`:''}</div>`).join('')}</div>`}
// ---------- picker ----------
renderPicker=function(){$('#tabs').innerHTML='';$('#cash').textContent='';$('#clubname').textContent='Club Chairman';
 $('#view').innerHTML=`<div class="hero"><div style="font-size:54px">⚽🏟️</div><h1>Club Chairman</h1><div class="mut">Buy a club. Build a stadium. Build a legacy.</div></div>
 ${[0,1,2,3].map(d=>`<div class="card"><h3>${DIVS[d]}</h3>${ALL92.map((c,i)=>[c,i]).filter(([c])=>c.div===d).map(([c,i])=>`<div class="row clubc"><div class="crest" style="background:${c.col}">${c.name.split(' ').map(w=>w[0]).join('').slice(0,3)}</div>
 <div style="flex:1"><b>${c.name}</b><div class="mut">Reputation ${c.rep} · ${fmt(c.price)}</div></div><button class="btn" onclick="buy(${i})">Buy</button></div>`).join('')}</div>`).join('')}`};
buy=function(i){newGame(i);tab='home';render();toast('Deal done! Welcome to '+ALL92[i].name)};
// ---------- home ----------
vHome=function(){const f=userFixture(),s=stadiumStats(G.stad),day=G.cal[G.day],u=(G.inbox||[]).filter(m=>!m.read).slice(0,3);
 const sec=G.mgrSec??60,mg=staffOf('manager')[0];
 $('#view').innerHTML=`<div class="card"><h3>Season ${G.season} · Week ${Math.min(G.day+1,G.cal.length)} of ${G.cal.length} · ${DIVS[me().div]}</h3>
 ${f?`<div class="mut" style="text-align:center">${compName(f)}</div><div style="display:flex;align-items:center;justify-content:space-around;padding:8px 0;text-align:center">
 <div><div class="crest" style="background:${G.teams[f.h].col};margin:auto">${G.teams[f.h].name[0]}</div><small>${G.teams[f.h].name}</small></div><b style="font-size:20px">vs</b>
 <div><div class="crest" style="background:${G.teams[f.a].col};margin:auto">${G.teams[f.a].name[0]}</div><small>${G.teams[f.a].name}</small></div></div>
 <div class="mut" style="text-align:center">${f.neutral?'Neutral venue':f.h===G.club?`Home · Expected crowd ~${attendance().toLocaleString()} / ${s.cap.toLocaleString()}`:'Away'}</div>
 <div class="grid3"><button class="btn" onclick="G.mm='hl';startMatch(userFixture(),'hl')">▶ Highlights</button><button class="btn sec" onclick="G.mm='full';startMatch(userFixture(),'full')">▶ Full match</button><button class="btn sec" onclick="simUserMatch();render()">⏩ Result</button></div>`
 :G.day>=G.cal.length?`<button class="btn big" onclick="advance()">Start next season ▶</button>`:`<div class="mut" style="text-align:center;padding:10px">${day.t==='C'?'Not involved in this cup round':day.t==='PO'?'Play-offs week — you are not involved':'No fixture this week'}</div><button class="btn big" onclick="advance()">Continue ▶</button>`}
 <div class="mut" style="text-align:center;margin-top:8px">${windowText()}</div></div>
 <div class="grid2" style="margin-bottom:12px">${moodBar('Board confidence',G.board)}${moodBar('Fan happiness',G.fans)}
 <div class="stat"><small>League position</small><b>${G.results.some(r=>r.some(x=>x.comp==='L'))?position()+ord(position()):'-'}</b><small>Target ${G.obj?G.obj.pos+ord(G.obj.pos):'-'}</small></div>
 <div class="stat"><small>Manager security</small><b class="${sec<30?'bad':sec<55?'warn':'good'}">${Math.round(sec)}%</b><small>${mg?mg.name:'No manager!'}</small></div></div>
 ${u.length?`<div class="card"><h3>Inbox (${unread()} unread)</h3>${u.map(m=>`<div class="row" onclick="go('inbox')"><span>📩 <b>${m.t}</b><br><small class="mut">${m.from}</small></span></div>`).join('')}</div>`:''}
 ${G.lastMatch?`<div class="card" onclick="showReport()"><h3>Last match · tap for report</h3><div class="row"><span>${G.teams[G.lastMatch.h].name}</span><b>${scoreStr(G.lastMatch)}</b><span>${G.teams[G.lastMatch.a].name}</span></div></div>`:''}
 <div class="card"><h3>News</h3>${G.log.slice(0,8).map(l=>`<div class="row mut">${l}</div>`).join('')}</div>
 <button class="btn red big" onclick="if(confirm('Sell the club and start over?')){localStorage.removeItem(SAVE);G=null;render()}">Sell club / New game</button>`};
function showReport(){const L=G.lastMatch;if(!L)return;const sc=s=>L.ev.filter(e=>e.t==='goal'&&e.s===s).map(e=>`${pname(e.p)} ${e.m}'`).join(', ')||'—';
 modal(`<h2>${L.comp}</h2><div style="text-align:center;font-size:26px;font-weight:800">${G.teams[L.h].name} ${scoreStr(L)} ${G.teams[L.a].name}</div><div class="row"><small>${sc(0)}</small><small style="text-align:right">${sc(1)}</small></div>
 ${['poss','shots','sot','corners','fouls'].map(k=>{const a=L.stats[0][k],b=L.stats[1][k];return`<div class="row"><b>${k==='poss'?Math.round(a/(a+b||1)*100)+'%':a}</b><span class="mut">${{poss:'Possession',shots:'Shots',sot:'On target',corners:'Corners',fouls:'Fouls'}[k]}</span><b>${k==='poss'?Math.round(b/(a+b||1)*100)+'%':b}</b></div>`}).join('')}
 <h3 style="margin-top:10px">Timeline</h3>${L.ev.filter(e=>['goal','red','yellow','inj','sub'].includes(e.t)).map(e=>`<div class="row"><span class="mut">${e.m}'</span><span style="flex:1;margin-left:8px">${({goal:'⚽',red:'🟥',yellow:'🟨',inj:'🚑',sub:'🔁'})[e.t]} ${pname(e.p)}${e.t==='sub'?' for '+pname(e.o):''}</span><small>${G.teams[e.s?L.a:L.h].name}</small></div>`).join('')}`)}
// ---------- modal ----------
function modal(h){closeModal();const m=document.createElement('div');m.id='modal';m.innerHTML=`<div class="msheet"><button class="mclose" onclick="closeModal()">✕</button>${h}</div>`;m.onclick=e=>{if(e.target===m)closeModal()};document.body.appendChild(m)}
function closeModal(){const m=$('#modal');if(m)m.remove()}
// ---------- squad ----------
const posCol={GK:'#f59e0b',DF:'#3b82f6',MF:'#22c55e',FW:'#ef4444'};
const fitIco=p=>p.inj?`<span class="bad">🚑${p.inj}w</span>`:p.ban?`<span class="bad">⛔${p.ban}</span>`:`<span class="fitb" style="--f:${p.fit}%"></span>`;
const morIco=m=>m>75?'😀':m>55?'🙂':m>35?'😐':'😠';
function vSquad(){ensureXI();const sl=FORMS[G.fm],s=sq(G.club).slice().sort((a,b)=>'GKDFMFFW'.indexOf(a.pos)-'GKDFMFFW'.indexOf(b.pos)||ovr(b)-ovr(a));
 const inXI=new Set(G.xi),onB=new Set(G.bench);
 $('#view').innerHTML=`<div class="card"><div class="row"><h3 style="margin:0">Formation</h3><button class="btn sec" onclick="G.autoXI=true;ensureXI();render()">${G.autoXI?'✓ Auto-pick':'Auto-pick'}</button></div>
 <div class="seg">${Object.keys(FORMS).map(f=>`<button class="${G.fm===f?'on':''}" onclick="setForm('${f}')">${f}</button>`).join('')}</div>
 <h3 style="margin-top:10px">Mentality</h3><div class="seg">${['Defensive','Balanced','Attacking'].map((n,i)=>`<button class="${G.ment===i?'on':''}" onclick="G.ment=${i};save();render()">${n}</button>`).join('')}</div>
 <div class="minipitch">${G.xi.map((id,i)=>{const[x,y]=slotXY(G.fm,i);const p=G.pl[id];return`<div class="dot ${sqSel===id?'sel':''}" style="left:${x*100}%;top:${(1-y)*92+2}%" onclick="sqTap(${id})"><i style="background:${me().col}">${p?ovrAt(p,sl[i])|0:'-'}</i><span>${p?pname(id):'—'}</span></div>`}).join('')}</div>
 <div class="mut" style="text-align:center">Tap a player, then another, to swap. Squad: ${s.length} · Wages ${fmt(s.reduce((a,p)=>a+p.wage,0))}/wk</div></div>
 <div class="card"><h3>Squad</h3><table class="sqt"><tr><th></th><th>Name</th><th>Age</th><th>OVR</th><th>POT</th><th>Fit</th><th></th></tr>
 ${s.map(p=>`<tr class="${sqSel===p.id?'me':''}" onclick="sqTap(${p.id})"><td><span class="pos" style="background:${posCol[p.pos]}">${p.pos}</span></td><td>${p.n}${inXI.has(p.id)?' <small class="good">XI</small>':onB.has(p.id)?' <small class="mut">SUB</small>':''}${p.loan!=null?' <small class="warn">LOAN</small>':''}${p.list?' <small class="warn">£</small>':''}<br><small class="mut">${p.st.ap} apps · ${p.st.g} g · ${p.con}y · ${fmt(p.wage)}</small></td><td>${p.age}</td><td><b>${ovr(p)}</b></td><td>${p.pot}</td><td>${fitIco(p)}</td><td>${morIco(p.mor)}</td></tr>`).join('')}</table>
 <div class="mut">Tap a row twice to open the player.</div></div>`}
function setForm(f){G.fm=f;G.xi=assignSlots(G.xi,f);G.autoXI=false;ensureXI();save();render()}
function sqTap(id){if(sqSel===id){sqSel=null;return showPlayer(id)}if(sqSel==null){sqSel=id;return render()}
 const a=sqSel,b=id;sqSel=null;const ia=G.xi.indexOf(a),ib=G.xi.indexOf(b),ba=G.bench.indexOf(a),bb=G.bench.indexOf(b);
 const pa=G.pl[a],pb=G.pl[b];if((ia>=0||ib>=0)&&(!avail(pa)||!avail(pb))){toast('Player unavailable');return render()}
 G.autoXI=false;if(ia>=0&&ib>=0){G.xi[ia]=b;G.xi[ib]=a}else if(ia>=0){G.xi[ia]=b;if(bb>=0)G.bench[bb]=a;else G.bench=G.bench.filter(x=>x!==b)}else if(ib>=0){G.xi[ib]=a;if(ba>=0)G.bench[ba]=b;else G.bench=G.bench.filter(x=>x!==a)}
 else if(ba>=0&&bb<0)G.bench[ba]=b;else if(bb>=0&&ba<0)G.bench[bb]=a;ensureXI();save();render()}
// ---------- player modal ----------
function showPlayer(id){const p=G.pl[id];if(!p)return toast('Player retired');const k=known(p),mine=p.club===G.club,o=ovr(p);
 const bar=(n,v)=>`<div class="row" style="padding:3px 0"><span style="width:90px">${n}</span><div class="bar" style="flex:1"><i style="width:${v}%"></i></div><b style="width:30px;text-align:right">${k?Math.round(v):'??'}</b></div>`;
 const club=p.club>=0?G.teams[p.club].name:'Free agent',avg=p.st.ap?(p.st.rs/p.st.ap).toFixed(2):'-';
 modal(`<div class="clubc"><span class="pos big" style="background:${posCol[p.pos]}">${p.pos}</span><div><h2 style="margin:0">${p.n}</h2><div class="mut">${p.age}y · ${club}${p.loan!=null?' (on loan from '+G.teams[p.loan].name+')':''}</div></div></div>
 <div class="grid3" style="margin:10px 0"><div class="stat"><small>OVR</small><b>${k?o:'~'+estOvr(p)}</b></div><div class="stat"><small>Potential</small><b>${k?p.pot:'?'}</b></div><div class="stat"><small>Value</small><b>${k?fmt(value(p)):'~'+fmt(Math.round(value(p)/1e5)*1e5)}</b></div></div>
 ${AN.map((n,i)=>p.pos!=='GK'&&i===5?'':bar(n,p.at[i])).join('')}
 <div class="row"><span>Contract</span><b>${p.con} yr · ${fmt(p.wage)}/wk</b></div><div class="row"><span>Morale / Fitness</span><b>${morIco(p.mor)} ${Math.round(p.mor)} · ${Math.round(p.fit)}%${p.inj?' · injured '+p.inj+'w':''}${p.ban?' · banned '+p.ban:''}</b></div>
 <div class="row"><span>Season</span><b>${p.st.ap} apps · ${p.st.g} goals · ${p.st.as} assists · avg ${avg}</b></div><div class="row"><span>Career</span><b>${p.car.ap+p.st.ap} apps · ${p.car.g+p.st.g} goals</b></div>
 <div id="pact">${mine?`<div class="grid2"><button class="btn" onclick="openRenew(${id})">Renew contract</button><button class="btn sec" onclick="G.pl[${id}].list=!G.pl[${id}].list;showPlayer(${id})">${p.list?'Unlist':'Transfer list'}</button>
  ${p.loan==null?`<button class="btn sec" onclick="loanOut(${id})">Loan out</button>`:'<span></span>'}<button class="btn red" onclick="releasePl(${id})">Release</button></div>`
 :`<div class="grid2">${k?'':`<button class="btn sec" onclick="scout(${id})">${G.scq.includes(id)?'Scouting…':'🔍 Scout'}</button>`}<button class="btn" onclick="openBid(${id},false)">${p.club===-1?'Offer contract':'Make bid'}</button>${p.club>=0?`<button class="btn sec" onclick="openBid(${id},true)">Loan</button>`:''}</div>`}</div>`)}
function scout(id){if(!G.scq.includes(id))G.scq.push(id);toast('Added to scouting queue');showPlayer(id)}
function openBid(id,loan){const p=G.pl[id],free=p.club===-1,dem=demandWage(p,G.club),v=value(p);
 $('#pact').innerHTML=`<div class="card" style="margin-top:8px"><h3>${loan?'Loan offer':free?'Contract offer':'Transfer offer'}</h3>
 ${!loan&&!free?`<div class="row"><span>Fee</span><b id="bf">${fmt(v)}</b></div><input type="range" id="bfee" min="0" max="${Math.round(v*3)}" step="${Math.max(1e4,Math.round(v/100/1e4)*1e4)}" value="${v}" oninput="$('#bf').textContent=fmt(+this.value)">`:''}
 ${loan?`<div class="mut">You pay his full wage (${fmt(p.wage)}/wk) until season end.</div>`:`<div class="row"><span>Wage</span><b id="bw">${fmt(dem)}/wk</b></div><input type="range" id="bwage" min="${Math.round(dem*.5)}" max="${Math.round(dem*2)}" step="100" value="${Math.round(dem*.9/100)*100}" oninput="$('#bw').textContent=fmt(+this.value)+'/wk'">
 <div class="row"><span>Years</span><div class="seg" id="byrs">${[1,2,3,4,5].map(y=>`<button class="${y===3?'on':''}" onclick="document.querySelectorAll('#byrs button').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${y}</button>`).join('')}</div></div>`}
 <button class="btn big" onclick="doBid(${id},${loan})">Submit</button><div id="bres" class="warn" style="margin-top:6px"></div></div>`;if(!loan)$('#bw').textContent=fmt(Math.round(dem*.9/100)*100)+'/wk'}
function doBid(id,loan){const fee=$('#bfee')?+$('#bfee').value:0,wage=$('#bwage')?+$('#bwage').value:0,yrs=+(document.querySelector('#byrs .on')?.textContent||3);const r=submitOffer(id,fee,wage,yrs,loan);
 if(r==='OK'){closeModal();toast('✍️ Deal done!');save();render()}else{$('#bres').textContent=r;save()}}
function openRenew(id){const p=G.pl[id],dem=demandWage(p);$('#pact').innerHTML=`<div class="card" style="margin-top:8px"><h3>Renew contract</h3><div class="row"><span>Wage</span><b id="bw">${fmt(p.wage)}/wk</b></div><input type="range" id="bwage" min="${Math.round(dem*.5)}" max="${Math.round(dem*2)}" step="100" value="${Math.max(p.wage,Math.round(dem*.5))}" oninput="$('#bw').textContent=fmt(+this.value)+'/wk'">
 <div class="row"><span>Years</span><div class="seg" id="byrs">${[1,2,3,4,5].map(y=>`<button class="${y===3?'on':''}" onclick="document.querySelectorAll('#byrs button').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${y}</button>`).join('')}</div></div>
 <button class="btn big" onclick="const r=renewOffer(${id},+$('#bwage').value,+document.querySelector('#byrs .on').textContent);if(r==='OK'){closeModal();toast('Contract renewed');save();render()}else $('#bres').textContent=r">Offer</button><div id="bres" class="warn"></div></div>`}
// ---------- market ----------
function vMarket(){const F=mkF;let list=[];
 if(F.seg==='scout'){list=[...G.scq,...Object.keys(G.sc).map(Number)].map(id=>G.pl[id]).filter(p=>p&&p.club!==G.club)}
 else{list=Object.values(G.pl).filter(p=>p.club!==G.club&&(F.seg==='free'?p.club===-1:p.club>=0)&&(F.pos==='All'||p.pos===F.pos)&&(F.div==='All'||p.club<0||G.teams[p.club].div===+F.div)&&(!F.q||p.n.toLowerCase().includes(F.q.toLowerCase()))&&(!F.max||value(p)<=F.max))}
 list=list.map(p=>[p,estOvr(p)]).sort((a,b)=>b[1]-a[1]).slice(0,50);
 $('#view').innerHTML=`<div class="card"><div class="mut" style="margin-bottom:8px">${windowText()} · Budget ${fmt(G.cash)}</div>
 <div class="seg">${[['search','Search'],['free','Free agents'],['scout','Scouted']].map(([k,n])=>`<button class="${F.seg===k?'on':''}" onclick="mkF.seg='${k}';render()">${n}</button>`).join('')}</div>
 ${F.seg!=='scout'?`<div class="seg" style="margin-top:8px">${['All','GK','DF','MF','FW'].map(k=>`<button class="${F.pos===k?'on':''}" onclick="mkF.pos='${k}';render()">${k}</button>`).join('')}</div>
 ${F.seg==='search'?`<div class="seg" style="margin-top:8px">${['All',0,1,2,3].map(k=>`<button class="${F.div==k?'on':''}" onclick="mkF.div='${k}';render()">${k==='All'?'All':DSHORT[k]}</button>`).join('')}</div>`:''}
 <div style="display:flex;gap:8px;margin-top:8px"><input class="inp" placeholder="Search name" value="${F.q}" onchange="mkF.q=this.value;render()"><select class="inp" onchange="mkF.max=+this.value;render()">${[0,5e5,2e6,5e6,15e6,40e6].map(v=>`<option value="${v}" ${F.max==v?'selected':''}>${v?'≤ '+fmt(v):'Any value'}</option>`).join('')}</select></div>`:`<div class="mut" style="margin-top:6px">Scouts: ${staffOf('scout').length} · ${staffOf('scout').length+1} reports/week · queue ${G.scq.length}</div>`}</div>
 <div class="card">${list.map(([p,e])=>`<div class="row" onclick="showPlayer(${p.id})"><span class="pos" style="background:${posCol[p.pos]}">${p.pos}</span><span style="flex:1"><b>${p.n}</b> <small class="mut">${p.age}y</small>${known(p)?' 🔍':''}<br><small class="mut">${p.club>=0?G.teams[p.club].name+' · '+DSHORT[G.teams[p.club].div]:'Free agent'}${G.scq.includes(p.id)?' · scouting…':''}</small></span>
 <span style="text-align:right"><b>${known(p)?e:'~'+e}</b><br><small class="mut">${p.club>=0?fmt(value(p)):fmt(demandWage(p,G.club))+'/wk'}</small></span></div>`).join('')||'<div class="mut">Nothing found.</div>'}</div>
 <div class="card"><h3>Your transfer-listed players</h3>${sq(G.club).filter(p=>p.list).map(p=>`<div class="row" onclick="showPlayer(${p.id})"><span>${p.n}</span><b>${fmt(value(p))}</b></div>`).join('')||'<div class="mut">None. List players from their profile to attract bids.</div>'}</div>`}
// ---------- league ----------
function vLeague2(){if(lgDiv==null)lgDiv=me().div;const seg=lgSeg;let h=`<div class="seg" style="margin-bottom:10px">${[['table','Tables'],['fix','Fixtures'],['cups','Cups'],['stats','Stats']].map(([k,n])=>`<button class="${seg===k?'on':''}" onclick="lgSeg='${k}';render()">${n}</button>`).join('')}</div>`;
 const divSeg=`<div class="seg" style="margin-bottom:10px">${[0,1,2,3].map(d=>`<button class="${lgDiv===d?'on':''}" onclick="lgDiv=${d};render()">${DSHORT[d]}</button>`).join('')}</div>`;
 if(seg==='table'){const t=divTable(lgDiv),pp=POSPOTS[lgDiv],po=POSPO[lgDiv],rl=RELEG[lgDiv];
  h+=divSeg+`<div class="card"><h3>${DIVS[lgDiv]}</h3><table><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>${t.map((r,i)=>{const z=lgDiv>0&&i<pp?'zp':lgDiv>0&&i+1>=po[0]&&i+1<=po[1]?'zo':rl&&i>=t.length-rl?'zr':lgDiv===0&&i===0?'zp':'';
  return`<tr class="${r.i===G.club?'me':''} ${z}"><td>${i+1}</td><td><span style="color:${r.col}">●</span> ${r.name}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gd}</td><td><b>${r.pts}</b></td></tr>`}).join('')}</table>
  <div class="mut" style="margin-top:6px"><span class="key zp"></span>${lgDiv?'Promotion':'Champions'} ${lgDiv?'<span class="key zo"></span>Play-offs':''} ${rl?'<span class="key zr"></span>Relegation':''}</div></div>`;
  if(G.po[lgDiv]){const P=G.po[lgDiv];h+=`<div class="card"><h3>Play-offs</h3>${P.semi.map(([a,b])=>`<div class="row"><span>${G.teams[a].name}</span><span class="mut">v</span><span>${G.teams[b].name}</span></div>`).join('')}${P.fin?`<div class="row"><b>Final: ${G.teams[P.fin[0]].name} v ${G.teams[P.fin[1]].name}</b></div>`:''}${P.win!=null?`<div class="good">Winner: ${G.teams[P.win].name}</div>`:''}</div>`}}
 else if(seg==='fix'){const rows=[];G.cal.forEach((d,i)=>{let f=null,r=null;if(i<G.day){r=(G.results[i]||[]).find(x=>x.h===G.club||x.a===G.club)}else if(i===G.day)f=userFixture();else if(d.t==='L'){f=dayFixtures(d).find(x=>x.h===G.club||x.a===G.club)}
  const m=r||f;if(!m)return;const home=m.h===G.club,o=G.teams[home?m.a:m.h].name,lab=(r?r.comp:f.comp)==='L'?'':(r?r.comp:f.comp)==='C'?'🏆 ':'⭐ ';let p='';
  if(r){const gf=home?r.hg:r.ag,ga=home?r.ag:r.hg,w=winnerOf(r)===G.club;p=`<span class="pill ${gf>ga||(r.pen&&w)?'W':gf<ga||(r.pen&&!w)?'L':'D'}">${gf}-${ga}${r.pen?'p':''}</span>`}
  rows.push(`<div class="row res"><span class="mut">Wk ${i+1}</span><span style="flex:1;margin-left:6px">${lab}${home?'vs':'@'} ${o}</span>${p}</div>`)});h+=`<div class="card"><h3>Your fixtures & results</h3>${rows.join('')}</div>`}
 else if(seg==='cups'){h+=G.cups.map((C,ci)=>`<div class="card"><h3>${C.n}</h3>${C.win!=null?`<div class="good">🏆 Winner: ${G.teams[C.win].name}</div>`:`<div class="mut">Next: ${CUPRD[C.rd]} · ${C.alive.length} clubs left · You: ${C.alive.includes(G.club)?'<b class="good">still in</b>':'<b class="bad">out</b>'}</div>`}
  ${C.ties&&C.win==null?C.ties.filter(t=>t.includes(G.club)).map(([a,b])=>`<div class="row"><b>Your tie: ${G.teams[a].name} v ${G.teams[b].name}</b></div>`).join(''):''}
  ${C.log.slice(-1).map(l=>`<h3 style="margin-top:8px">${CUPRD[l.rd]} results</h3>`+l.res.filter(r=>r.res!==0).slice(0,l.rd>=4?8:6).map(r=>`<div class="row res"><span style="flex:1">${G.teams[r.h].name}</span><b>${scoreStr(r)}</b><span style="flex:1;text-align:right">${G.teams[r.a].name}</span></div>`).join('')).join('')}</div>`).join('')+
  (G.honours&&G.honours.length?`<div class="card"><h3>Roll of honour</h3>${G.honours.map(x=>`<div class="row"><span>S${x.s}</span><small>${G.teams[x.champs[0]].name} (PD) · ${x.cups.map((c,i)=>c!=null?G.cups[i].n+': '+G.teams[c].name:'').join(' · ')}</small></div>`).join('')}</div>`:'')}
 else{const ps=Object.values(G.pl).filter(p=>p.club>=0&&G.teams[p.club].div===lgDiv);const top=(k,n)=>ps.filter(p=>p.st[k]>0).sort((a,b)=>b.st[k]-a.st[k]).slice(0,n);
  const rated=ps.filter(p=>p.st.ap>=5).sort((a,b)=>b.st.rs/b.st.ap-a.st.rs/a.st.ap).slice(0,8);
  h+=divSeg+`<div class="card"><h3>Top scorers (league)</h3>${top('lg',10).map((p,i)=>`<div class="row ${p.club===G.club?'mine':''}" onclick="showPlayer(${p.id})"><span>${i+1}. ${p.n} <small class="mut">${G.teams[p.club].name}</small></span><b>${p.st.lg}</b></div>`).join('')||'<div class="mut">No goals yet.</div>'}</div>
  <div class="card"><h3>Assists (all comps)</h3>${top('as',8).map((p,i)=>`<div class="row" onclick="showPlayer(${p.id})"><span>${i+1}. ${p.n} <small class="mut">${G.teams[p.club].name}</small></span><b>${p.st.as}</b></div>`).join('')||'<div class="mut">—</div>'}</div>
  <div class="card"><h3>Best average rating (5+ apps)</h3>${rated.map((p,i)=>`<div class="row" onclick="showPlayer(${p.id})"><span>${i+1}. ${p.n} <small class="mut">${G.teams[p.club].name}</small></span><b>${(p.st.rs/p.st.ap).toFixed(2)}</b></div>`).join('')||'<div class="mut">—</div>'}</div>
  <div class="card"><h3>${me().name} scorers</h3>${sq(G.club).filter(p=>p.st.g).sort((a,b)=>b.st.g-a.st.g).map(p=>`<div class="row"><span>${p.n}</span><b>${p.st.g} g · ${p.st.as} a</b></div>`).join('')||'<div class="mut">—</div>'}</div>`}
 $('#view').innerHTML=h}
// ---------- inbox ----------
let openMsg=null;
function vInbox(){const ms=G.inbox||[];$('#view').innerHTML=`<div class="card"><div class="row"><h3 style="margin:0">Inbox</h3><button class="btn sec" onclick="G.inbox.forEach(m=>m.read=true);save();render()">Mark all read</button></div>
 ${ms.map(m=>`<div class="msg ${m.read?'':'unread'}" onclick="openMsg=openMsg===${m.id}?null:${m.id};G.inbox.find(x=>x.id===${m.id}).read=true;save();render()"><div class="row" style="border:0"><span><b>${m.t}</b><br><small class="mut">${m.from} · S${m.s} W${m.w}</small></span>${m.acts&&!m.done?'<span class="pill W">Action</span>':''}</div>
 ${openMsg===m.id?`<div class="mbody">${m.b}</div>${m.acts&&!m.done?`<div class="grid3" onclick="event.stopPropagation()">${m.acts.map((a,i)=>`<button class="btn ${i?'sec':''}" onclick="msgAct(${m.id},${i})">${a[0]}</button>`).join('')}</div>`:''}`:''}</div>`).join('')||'<div class="mut">No messages.</div>'}</div>`}
function msgAct(mid,i){const m=G.inbox.find(x=>x.id===mid),[,fn,arg]=m.acts[i];const keep=['showPlayer','go'].includes(fn);const r=window[fn](arg);if(!keep&&r!==false){m.done=true}save();if(!keep)render()}
// ---------- owner ----------
function vOwner(){const o=G.obj||{},sec=G.mgrSec??60,v=clubValue(),dbt=debt();const base=sponsorBase();
 $('#view').innerHTML=`<div class="card"><h3>Season objectives</h3><div class="row"><span>League</span><b>${o.pos}${ord(o.pos||0)} or better <span class="${position()<=o.pos?'good':'bad'}">(now ${position()}${ord(position())})</span></b></div>
 <div class="row"><span>Cups</span><b>Reach ${CUPRD[o.cup]||'-'} <span class="${Math.max(...G.cupRun)>=o.cup?'good':'mut'}">(best: ${CUPRD[Math.max(...G.cupRun)]||'R1'})</span></b></div><div class="row"><span>Finances</span><b class="${G.cash>=0?'good':'bad'}">Stay in the black</b></div></div>
 <div class="card"><h3>Manager</h3>${moodBar('Job security',sec)}<div class="mut" style="margin-top:6px">${sec<25?'The board and fans want change. Consider replacing him in Staff.':sec<50?'Pressure is building.':'Secure in his job.'}</div></div>
 <div class="card"><h3>Club value & ownership</h3><div class="row"><span>Valuation</span><b>${fmt(v)}</b></div><div class="row"><span>Debt</span><b class="${dbt?'bad':''}">${fmt(dbt)}</b></div>
 ${(G.loans||[]).map(l=>`<div class="row mut"><span>Loan ${fmt(l.amt)} @ ${(l.rate*100).toFixed(1)}%</span><span>${fmt(l.bal)} left · ${fmt(l.weekly+l.bal*l.rate/52)}/wk</span></div>`).join('')}
 <div class="grid3" style="margin-top:8px">${[5e6,25e6,100e6].map(a=>`<button class="btn sec" onclick="takeLoan(${a})">Borrow ${fmt(a)}</button>`).join('')}</div>${dbt?`<button class="btn big sec" onclick="repayLoans()">Repay all (${fmt(dbt)})</button>`:''}</div>
 <div class="card"><h3>Stadium naming rights</h3>${G.naming?`<div class="row"><span>${G.naming.name}</span><b>${fmt(G.naming.perWeek)}/wk · ${G.naming.weeks} wks</b></div>`:`<div class="mut">Unsold. Offers arrive in your inbox, or seek one now (fans dislike renaming).</div><button class="btn big sec" onclick="const o=namingOffer();inbox('Commercial','Naming rights offer','${''}'+o.brand+' offer '+fmt(o.perWeek)+'/wk for '+(o.weeks/62|0)+' seasons to rename the ground '+o.name+'.',[['Accept','takeNaming',o],['Decline','noop',0]]);save();go('inbox')">Seek a naming partner</button>`}</div>
 <div class="card"><h3>Sponsorship slots</h3>${Object.entries(SLOTS).map(([k,s])=>{const c=G.spons[k];return`<div class="row"><span><b>${s.n}</b><br><small class="mut">${c?c.name+' · '+c.weeks+' wks left':'Vacant'}</small></span>${c?`<b>${fmt(c.perWeek)}/wk</b>`:`<button class="btn" onclick="signSlot('${k}')">Find deal ~${fmt(base*s.m)}/wk</button>`}</div>`}).join('')}</div>
 <div class="card"><h3>Merchandise</h3><div class="seg">${MERCH.map((m,i)=>`<button class="${(G.merch??1)===i?'on':''}" onclick="G.merch=${i};save();render()">${m.n}</button>`).join('')}</div><div class="mut" style="margin-top:6px">Online & retail ≈ ${fmt(merchWeekly())}/wk. Star players, fans, division and your club shop drive sales. Premium pricing annoys fans; budget pricing wins them over.</div></div>
 <div class="card"><h3>Trophy cabinet</h3>${(G.trophies||[]).map(t=>`<div class="row">🏆 ${t}</div>`).join('')||'<div class="mut">Empty… for now.</div>'}</div>`}
function signSlot(k){const names=["Apex Bet","Northwind Air","Voltra Energy","Quanta Bank","Hexa Mobile","Brewster Lager","Strider Sports","Kinetik","Orbit Tech","Pulse Wear"];const pw=Math.round(sponsorBase()*SLOTS[k].m*R(.8,1.15)/500)*500;
 G.spons[k]={name:pick(names),perWeek:pw,weeks:62*RI(1,3)};G.log.unshift(`🤝 ${G.spons[k].name} signed as ${SLOTS[k].n}`);save();render();toast('Signed '+G.spons[k].name)}
// ---------- finance ----------
function vMoney2(){const L=G.ledger[0],att=attendance(),mi=matchIncome(att);const P=L&&L.parts;
 $('#view').innerHTML=`<div class="card"><h3>Balance</h3><div style="font-size:30px;font-weight:800" class="${G.cash<0?'bad':'good'}">${fmt(G.cash)}</div>${L?`<div class="mut">Last week: +${fmt(L.income)} / -${fmt(L.out)} = <b class="${L.income-L.out<0?'bad':'good'}">${fmt(L.income-L.out)}</b></div>`:''}</div>
 <div class="card"><h3>Ticket price</h3><div class="row"><span>Average ticket</span><b id="tp">£${G.ticket}</b></div><input type="range" min="5" max="120" value="${G.ticket}" oninput="G.ticket=+this.value;$('#tp').textContent='£'+this.value;$('#tpa').textContent=attendance().toLocaleString()+' fans · '+fmt(attendance()*G.ticket)" onchange="save()"><div class="mut" id="tpa">${att.toLocaleString()} fans · ${fmt(att*G.ticket)}</div></div>
 <div class="card"><h3>Projected home matchday</h3>${[['Tickets',mi.tickets],['Food & drink',mi.food],['Hospitality',mi.hosp],['Club shop',mi.shop]].map(([a,b])=>`<div class="row"><span>${a}</span><b>${fmt(b)}</b></div>`).join('')}</div>
 ${P?`<div class="card"><h3>Last week breakdown</h3>${[['TV',P.tv],['Sponsors',P.spons],['Naming rights',P.naming],['Merchandise',P.merch],['Matchday',(P.tickets||0)+(P.food||0)+(P.hosp||0)+(P.shop||0)],['Stadium extras',P.extra]].map(([a,b])=>`<div class="row"><span>${a}</span><b class="good">+${fmt(b||0)}</b></div>`).join('')}
 ${[['Player wages',P.wages],['Staff wages',P.staff],['Maintenance',P.maint],['Loan repayments',P.loans]].map(([a,b])=>`<div class="row"><span>${a}</span><b class="bad">-${fmt(b||0)}</b></div>`).join('')}</div>`:''}
 <div class="card"><h3>Weekly cash flow</h3>${G.ledger.slice(0,14).map(x=>`<div class="row"><span class="mut">S${x.season} W${x.wk} ${x.home?'🏠':''}</span><span>+${fmt(x.income)} / -${fmt(x.out)}</span><b class="${x.income-x.out<0?'bad':'good'}">${fmt(x.income-x.out)}</b></div>`).join('')||'<div class="mut">Play a week to see cash flow.</div>'}</div>`}
