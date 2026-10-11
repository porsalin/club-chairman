'use strict';
const $=s=>document.querySelector(s);
const fmt=n=>{const a=Math.abs(n),s=n<0?'-':'';return a>=1e6?s+'£'+(a/1e6).toFixed(a>=1e8?0:1)+'m':a>=1e3?s+'£'+Math.round(a/1e3)+'k':s+'£'+Math.round(a)};
const R=(a,b)=>a+Math.random()*(b-a), RI=(a,b)=>Math.floor(R(a,b+1)), pick=a=>a[RI(0,a.length-1)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SAVE='clubchairman_v1';
const CLUBS=[["Ashford Rovers","#c0392b",120e6,82],["Kingsbridge City","#2563eb",95e6,79],["Northgate United","#dc2626",80e6,77],["Harrowby Athletic","#7c3aed",62e6,74],["Westmere Wanderers","#f59e0b",50e6,72],["Bramley Town","#059669",40e6,70],["Calder Vale","#0891b2",33e6,68],["Dunmore Albion","#be185d",27e6,66],["Elmsworth FC","#4f46e5",22e6,65],["Fenwick Park","#16a34a",18e6,64],["Greyhaven Port","#64748b",15e6,62],["Holloway Saints","#e11d48",13e6,61],["Ironbridge Forge","#ea580c",11e6,60],["Larkspur Villa","#9333ea",9e6,58],["Millbrook County","#0d9488",8e6,57],["Oakfield Rangers","#1d4ed8",7e6,56],["Pendle Borough","#b91c1c",6e6,54],["Redcliffe Harbour","#0369a1",5e6,53],["Stonehurst","#57534e",4e6,51],["Thornbury Dynamos","#ca8a04",3e6,50]];
const FIRST=["Marco","Steve","Luis","Erik","Jonas","Pete","Rafa","Gareth","Thomas","Andre","Kevin","Mikel","Sean","Diego","Hans","Paulo","Dean","Arne"];
const LAST=["Silva","Hughes","Moretti","Kovac","Larsen","Bright","Duval","Okafor","Mendes","Novak","Walsh","Brennan","Ferreira","Holt","Ivanov","Castro","Reid","Keller"];
const ROLES={manager:{n:"Manager",max:1,attrs:["Tactics","Motivation","Youth"]},coach:{n:"Coach",max:4,attrs:["Coaching","Fitness"]},scout:{n:"Scout",max:3,attrs:["Judgement","Network"]},physio:{n:"Physio",max:3,attrs:["Physiotherapy","Prevention"]}};
const FAC={training:{n:"Training Ground",icon:"🏋️",d:"Boosts squad development each week"},youth:{n:"Youth Academy",icon:"🌱",d:"Produces young talent, raises squad rating"},medical:{n:"Medical Centre",icon:"🏥",d:"Fewer injuries, better form"}};
const facCost=l=>Math.round(1.5e6*Math.pow(1.9,l)), facWeeks=l=>3+l*2;

// ---------- STADIUM MODEL ----------
const SIDES=['N','S','E','W'], CORNERS=['NE','NW','SE','SW'];
const SIDE_NAME={N:'North Stand',S:'South Stand',E:'East Stand',W:'West Stand (Main)',NE:'NE Corner',NW:'NW Corner',SE:'SE Corner',SW:'SW Corner'};
function blankStand(t){return{tiers:t,seat:'seated',roof:t?'partial':'none',boxes:0,concourse:t?1:0,kiosks:t?2:0,build:null}}
function newStadium(scale){const t=scale>0.6?2:1;const s={stands:{},global:{lights:1,screens:0,pitch:'grass',heating:0,parking:1,transport:1,shop:1,museum:0},queue:[]};
 SIDES.forEach(k=>s.stands[k]=blankStand(k==='W'||scale>0.75?t:1));CORNERS.forEach(k=>s.stands[k]=blankStand(scale>0.85?1:0));return s}
const SIDE_LEN={N:1,S:1,E:0.65,W:0.65,NE:.25,NW:.25,SE:.25,SW:.25};
function standCap(st,k){if(!st.tiers)return 0;let per=st.seat==='seated'?4200:5600;let c=0;for(let i=0;i<st.tiers;i++)c+=per*(1-i*0.12);return Math.round(c*SIDE_LEN[k]*1.6)}
function stadiumStats(S){let cap=0,atm=40,hosp=0,food=0,comfort=0;
 for(const k in S.stands){const st=S.stands[k];if(!st.tiers)continue;const c=standCap(st,k);cap+=c;
  atm+=(st.seat==='standing'?6:2)*st.tiers*SIDE_LEN[k]+(st.roof==='full'?5:st.roof==='partial'?2:0)*SIDE_LEN[k];
  hosp+=st.boxes;food+=st.kiosks*(1+st.concourse*0.5);comfort+=(st.roof==='full'?3:st.roof==='partial'?1.5:0)+st.concourse*1.5+(st.seat==='seated'?1:0)}
 const g=S.global;atm+=g.screens*3+g.lights*1.5+(g.pitch==='hybrid'?2:g.pitch==='artificial'?-4:0);
 comfort+=g.parking*2+g.transport*2.5+g.screens;
 return{cap,atm:clamp(Math.round(atm),0,100),hosp,food:Math.round(food),comfort:Math.round(comfort),
  pitchQ:{grass:60,hybrid:85,artificial:70}[g.pitch]+g.heating*12, access:g.parking+g.transport}}
// option catalog: each returns {cost,weeks}
function standChangeCost(k,from,to){let c=0,w=0;const L=SIDE_LEN[k];
 if(to.tiers>from.tiers){for(let i=from.tiers;i<to.tiers;i++){c+=(9e6+i*7e6)*L;w+=10+i*4}}
 if(to.tiers<from.tiers){c+=1e6*(from.tiers-to.tiers);w+=4}
 if(to.seat!==from.seat&&to.tiers){c+=1.2e6*to.tiers*L;w+=3}
 const rv={none:0,partial:1,full:2};if(rv[to.roof]>rv[from.roof]){c+=(rv[to.roof]-rv[from.roof])*3e6*L*Math.max(1,to.tiers);w+=5}
 if(to.boxes>from.boxes){c+=(to.boxes-from.boxes)*350e3;w+=2}
 if(to.concourse>from.concourse){c+=(to.concourse-from.concourse)*1.5e6*L;w+=3}
 if(to.kiosks>from.kiosks){c+=(to.kiosks-from.kiosks)*80e3;w+=1}
 return{cost:Math.round(c),weeks:Math.max(w?1:0,Math.round(w))}}
const GLOBAL_OPTS={
 lights:{n:"Floodlights",icon:"💡",levels:["Basic","Standard","LED","LED Show"],cost:l=>[0,1.2e6,3e6,6e6][l],weeks:3,eff:"Atmosphere, TV revenue"},
 screens:{n:"Big Screens",icon:"📺",levels:["None","1 Screen","2 Screens","4K Wraparound"],cost:l=>[0,1.5e6,3.5e6,9e6][l],weeks:3,eff:"Atmosphere, sponsor revenue"},
 heating:{n:"Undersoil Heating",icon:"🔥",levels:["None","Installed"],cost:l=>[0,2.5e6][l],weeks:4,eff:"Pitch quality, no postponements"},
 parking:{n:"Parking",icon:"🅿️",levels:["Street","Car Park","Multi-storey","Premium + EV"],cost:l=>[0,2e6,6e6,11e6][l],weeks:6,eff:"Attendance, comfort"},
 transport:{n:"Transport Access",icon:"🚆",levels:["Poor","Bus Link","Rail Halt","Metro Station"],cost:l=>[0,1.5e6,8e6,20e6][l],weeks:8,eff:"Attendance from wider area"},
 shop:{n:"Club Shop",icon:"🛍️",levels:["None","Kiosk","Store","Megastore"],cost:l=>[0,4e5,2e6,6e6][l],weeks:4,eff:"Merchandise revenue"},
 museum:{n:"Museum & Tours",icon:"🏛️",levels:["None","Trophy Room","Museum + Tours"],cost:l=>[0,8e5,4e6][l],weeks:5,eff:"Non-matchday income"}};
const PITCH={grass:{n:"Natural Grass",cost:0},hybrid:{n:"Hybrid (Stitched)",cost:3e6},artificial:{n:"Artificial 4G",cost:1.5e6}};

// ---------- GAME STATE ----------
let G=null;
function staffMember(role,q){const a={};ROLES[role].attrs.forEach(x=>a[x]=clamp(Math.round(q+R(-12,12)),20,99));const avg=Object.values(a).reduce((x,y)=>x+y,0)/ROLES[role].attrs.length;
 return{id:Math.random().toString(36).slice(2,8),name:pick(FIRST)+' '+pick(LAST),role,attrs:a,age:RI(30,64),wage:Math.round(Math.pow(avg/50,3)*(role==='manager'?40e3:8e3)/100)*100,q:Math.round(avg)}}
function newGame(idx){const teams=CLUBS.map((c,i)=>({name:c[0],col:c[1],price:c[2],rating:c[3],p:0,w:0,d:0,l:0,gf:0,ga:0,form:[]}));
 const c=CLUBS[idx],scale=1-idx/CLUBS.length;
 G={club:idx,week:1,season:1,cash:c[2]*0.35+5e6,ticket:Math.round(25+scale*30),sponsor:null,squadWages:Math.round(c[2]*0.0016/100)*100,
  teams,fixtures:makeFixtures(20),results:[],
  staff:[staffMember('manager',45+scale*35),staffMember('coach',40+scale*30),staffMember('scout',40+scale*25),staffMember('physio',40+scale*25)],
  fac:{training:{lvl:1+Math.round(scale*2),build:0},youth:{lvl:1+Math.round(scale*1.5),build:0},medical:{lvl:1+Math.round(scale*2),build:0}},
  stad:newStadium(scale),board:65,fans:65,ledger:[],market:null,log:["Welcome, Chairman. You now own "+c[0]+"."]};
 G.sponsor={name:"Local Motors",perWeek:Math.round(c[2]*0.0012/1000)*1000,weeks:38};
 refreshMarket();save();}
function makeFixtures(n){const ids=[...Array(n).keys()],rounds=[];for(let r=0;r<n-1;r++){const m=[];for(let i=0;i<n/2;i++){const a=ids[i],b=ids[n-1-i];m.push(r%2?[b,a]:[a,b])}rounds.push(m);ids.splice(1,0,ids.pop())}
 return rounds.concat(rounds.map(r=>r.map(([a,b])=>[b,a])))}
function refreshMarket(){G.market=[];Object.keys(ROLES).forEach(r=>{for(let i=0;i<3;i++)G.market.push(staffMember(r,RI(35,90)))})}
function save(){try{localStorage.setItem(SAVE,JSON.stringify(G))}catch(e){}}
function load(){try{G=JSON.parse(localStorage.getItem(SAVE))}catch(e){G=null}}
const me=()=>G.teams[G.club];
function staffOf(r){return G.staff.filter(s=>s.role===r)}
function staffWages(){return G.staff.reduce((a,s)=>a+s.wage,0)}
function teamStrength(i){const t=G.teams[i];if(i!==G.club)return t.rating;
 const m=staffOf('manager')[0],co=staffOf('coach'),ph=staffOf('physio');
 let s=t.rating+(m?(m.attrs.Tactics+m.attrs.Motivation-100)/12:-6)+co.reduce((a,c)=>a+(c.q-50)/40,0)+ph.reduce((a,p)=>a+(p.q-50)/60,0)+G.fac.medical.lvl*0.4;
 return s}
function simMatch(h,a){const sh=teamStrength(h)+3+(h===G.club?(stadiumStats(G.stad).atm-50)/12:0),sa=teamStrength(a);
 const pois=l=>{let L=Math.exp(-l),k=0,p=1;do{k++;p*=Math.random()}while(p>L);return k-1};
 const d=(sh-sa)/10;return[pois(clamp(1.35+d*0.55,0.2,4)),pois(clamp(1.1-d*0.5,0.2,4))]}
function apply(i,gf,ga){const t=G.teams[i];t.p++;t.gf+=gf;t.ga+=ga;const r=gf>ga?'W':gf<ga?'L':'D';t[r.toLowerCase()]++;t.form.push(r);if(t.form.length>5)t.form.shift();return r}
function table(){return G.teams.map((t,i)=>({...t,i,pts:t.w*3+t.d,gd:t.gf-t.ga})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf)}
function position(){return table().findIndex(t=>t.i===G.club)+1}
function expectedPos(){return 1+[...G.teams].sort((a,b)=>b.rating-a.rating).findIndex(t=>t.name===me().name)}

function attendance(){const s=stadiumStats(G.stad),t=me();const pop=0.55+(t.rating-50)/70+G.fans/250+s.access*0.04+s.comfort/200;
 const priceF=clamp(1.35-G.ticket/(45+(t.rating-50)*0.8),0.3,1.2);return Math.round(Math.min(s.cap,s.cap*pop*priceF))}
function matchIncome(att){const s=stadiumStats(G.stad),g=G.stad.global;return{tickets:att*G.ticket,food:att*(1.5+s.food*0.06),hosp:s.hosp*4500,shop:att*[0,0.6,1.8,3.5][g.shop]}}

function advance(){if(G.week>38){newSeason();return}
 const wk=G.week,round=G.fixtures[wk-1],res=[];let my=null,inc={tickets:0,food:0,hosp:0,shop:0},att=0,home=false;
 for(const [h,a] of round){const [x,y]=simMatch(h,a);apply(h,x,y);apply(a,y,x);res.push([h,a,x,y]);if(h===G.club||a===G.club){my=[h,a,x,y];if(h===G.club){home=true;att=attendance();inc=matchIncome(att)}}}
 G.results.push(res);
 // finance
 const tv=Math.round(250e3+me().rating*12e3),g=G.stad.global;
 const spons=G.sponsor&&G.sponsor.weeks>0?G.sponsor.perWeek:0;if(G.sponsor)G.sponsor.weeks--;
 const extra=g.screens*25e3+g.museum*15e3+g.lights*8e3;
 const maint=stadiumStats(G.stad).cap*1.2+Object.values(G.fac).reduce((a,f)=>a+f.lvl*12e3,0);
 const income=inc.tickets+inc.food+inc.hosp+inc.shop+tv+spons+extra,out=G.squadWages+staffWages()+maint;
 G.cash+=income-out;G.ledger.unshift({wk,season:G.season,income:Math.round(income),out:Math.round(out),att,home,parts:{...inc,tv,spons,extra,wages:G.squadWages,staff:staffWages(),maint}});G.ledger.length=Math.min(G.ledger.length,40);
 // construction
 for(const k in G.fac){const f=G.fac[k];if(f.build>0){f.build--;if(!f.build){f.lvl++;G.log.unshift(FAC[k].n+" upgraded to level "+f.lvl+"!")}}}
 G.stad.queue=G.stad.queue.filter(q=>{q.left--;if(q.left<=0){q.done();return false}return true});
 // development
 const t=me();const co=staffOf('coach').reduce((a,c)=>a+c.attrs.Coaching,0)/100;
 t.rating=clamp(t.rating+(G.fac.training.lvl*0.012+G.fac.youth.lvl*0.01+co*0.02-0.03),35,95);
 // mood
 const r=my[0]===G.club?(my[2]>my[3]?'W':my[2]<my[3]?'L':'D'):(my[3]>my[2]?'W':my[3]<my[2]?'L':'D');
 G.fans=clamp(G.fans+({W:3,D:0,L:-3})[r]-(G.ticket>me().rating*0.75?1:0)+(stadiumStats(G.stad).atm-55)/40,0,100);
 const gap=expectedPos()-position();G.board=clamp(G.board+gap*0.3+(G.cash<0?-3:0.2)+({W:1,D:0,L:-1})[r],0,100);
 const opp=G.teams[my[0]===G.club?my[1]:my[0]].name;
 G.log.unshift(`Wk ${wk}: ${G.teams[my[0]].name} ${my[2]}-${my[3]} ${G.teams[my[1]].name}`+(home?` · ${att.toLocaleString()} fans`:''));
 G.log.length=Math.min(G.log.length,30);
 if(G.board<15){toast("The board has lost patience… but grants one last chance.");G.board=30}
 G.week++;if(G.week%8===0)refreshMarket();save();toast(`${r==='W'?'✅ Win':r==='D'?'➖ Draw':'❌ Loss'} vs ${opp}`);render()}
function newSeason(){const pos=position(),prize=Math.round((21-pos)*1.5e6);G.cash+=prize;G.log.unshift(`Season ${G.season} finished ${pos}${ord(pos)}. Prize money ${fmt(prize)}.`);
 G.season++;G.week=1;G.results=[];G.teams.forEach(t=>{Object.assign(t,{p:0,w:0,d:0,l:0,gf:0,ga:0,form:[]});if(t!==me())t.rating=clamp(t.rating+R(-2,2),45,90)});
 G.fixtures=makeFixtures(20);if(!G.sponsor||G.sponsor.weeks<=0)G.sponsor=null;save();render();toast("New season begins!")}
const ord=n=>['th','st','nd','rd'][(n%100-20)%10<4&&(n%100<10||n%100>20)?n%10:0]||'th';

// ---------- UI ----------
let tab='home',stadSel='W',stadMode='stands';
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2200)}
const TABS=[['home','🏠','Club'],['stadium','🏟️','Stadium'],['staff','👔','Staff'],['fac','🏗️','Facilities'],['league','🏆','League'],['money','💷','Finance']];
function render(){if(!G){renderPicker();return}
 $('#clubname').innerHTML=`<span style="color:${me().col}">●</span> ${me().name}`;$('#cash').textContent=fmt(G.cash);$('#cash').className=G.cash<0?'bad':'';
 $('#tabs').innerHTML=TABS.map(([k,i,n])=>`<button class="${tab===k?'on':''}" onclick="go('${k}')"><span>${i}</span>${n}</button>`).join('');
 ({home:vHome,stadium:vStadium,staff:vStaff,fac:vFac,league:vLeague,money:vMoney,hist:window.vHist||vHome})[tab]()}
function go(t){tab=t;window.scrollTo(0,0);render()}
function renderPicker(){$('#tabs').innerHTML='';$('#cash').textContent='';
 $('#view').innerHTML=`<div class="hero"><div style="font-size:54px">⚽🏟️</div><h1>Club Chairman</h1><div class="mut">Buy a club. Build a stadium. Build a legacy.</div></div>
 <div class="card"><h3>Choose a club to buy</h3>${CLUBS.map((c,i)=>`<div class="row clubc"><div class="crest" style="background:${c[1]}">${c[0].split(' ').map(w=>w[0]).join('')}</div>
 <div style="flex:1"><b>${c[0]}</b><div class="mut">Rating ${c[3]} · Price ${fmt(c[2])}</div></div><button class="btn" onclick="buy(${i})">Buy</button></div>`).join('')}</div>`}
function buy(i){newGame(i);tab='home';render();toast("Deal done! Welcome to "+CLUBS[i][0])}
function moodBar(n,v){return`<div class="stat"><small>${n}</small><b class="${v<35?'bad':v<60?'warn':'good'}">${Math.round(v)}%</b><div class="bar"><i style="width:${v}%"></i></div></div>`}
function vHome(){const s=stadiumStats(G.stad),wk=G.week,fx=wk<=38?G.fixtures[wk-1].find(m=>m.includes(G.club)):null;
 $('#view').innerHTML=`<div class="card"><h3>Season ${G.season} · Week ${Math.min(wk,38)} of 38</h3>
 ${fx?`<div style="display:flex;align-items:center;justify-content:space-around;padding:8px 0;text-align:center">
 <div><div class="crest" style="background:${G.teams[fx[0]].col};margin:auto">${G.teams[fx[0]].name[0]}</div><small>${G.teams[fx[0]].name}</small></div><b style="font-size:20px">vs</b>
 <div><div class="crest" style="background:${G.teams[fx[1]].col};margin:auto">${G.teams[fx[1]].name[0]}</div><small>${G.teams[fx[1]].name}</small></div></div>
 <div class="mut" style="text-align:center">${fx[0]===G.club?`Home · Expected crowd ~${attendance().toLocaleString()} / ${s.cap.toLocaleString()}`:'Away fixture'}</div>`:'<div>Season complete!</div>'}
 <button class="btn big" onclick="advance()">${wk>38?'Start Next Season ▶':'Play Week ▶'}</button></div>
 <div class="grid2" style="margin-bottom:12px">${moodBar('Board confidence',G.board)}${moodBar('Fan happiness',G.fans)}
 <div class="stat"><small>League position</small><b>${G.results.length?position()+ord(position()):'-'}</b><small>Expected ${expectedPos()}${ord(expectedPos())}</small></div>
 <div class="stat"><small>Squad rating</small><b>${me().rating.toFixed(1)}</b><small>Strength ${teamStrength(G.club).toFixed(1)}</small></div></div>
 <div class="card"><h3>Squad</h3><div class="row"><span>Squad wage bill</span><b>${fmt(G.squadWages)}/wk</b></div>
 <div class="row"><span>Invest in players (+1 rating)</span><button class="btn" onclick="invest()">${fmt(investCost())}</button></div>
 <div class="row"><span>Sell a player (-1 rating)</span><button class="btn sec" onclick="sellPl()">+${fmt(investCost()*0.6)}</button></div></div>
 <div class="card"><h3>News</h3>${G.log.slice(0,8).map(l=>`<div class="row mut">${l}</div>`).join('')}</div>
 <button class="btn red big" onclick="if(confirm('Sell the club and start over?')){localStorage.removeItem(SAVE);G=null;render()}">Sell club / New game</button>`}
const investCost=()=>Math.round(Math.pow(me().rating/50,4)*3e6*(1-staffOf('scout').reduce((a,s)=>a+s.q,0)/1000));
function invest(){const c=investCost();if(G.cash<c)return toast("Not enough funds");G.cash-=c;me().rating+=1;G.squadWages=Math.round(G.squadWages*1.04);G.fans=clamp(G.fans+3,0,100);save();render();toast("New signing arrives!")}
function sellPl(){const c=investCost()*0.6;G.cash+=c;me().rating-=1;G.squadWages=Math.round(G.squadWages*0.97);G.fans=clamp(G.fans-4,0,100);save();render()}
function vStaff(){let h='';for(const r in ROLES){const cur=staffOf(r);h+=`<div class="card"><h3>${ROLES[r].n}${ROLES[r].max>1?'s':''} (${cur.length}/${ROLES[r].max})</h3>`+
 (cur.map(s=>staffRow(s,true)).join('')||'<div class="mut">Vacant!</div>')+`</div>`}
 h+=`<div class="card"><h3>Available to hire</h3>${G.market.map(s=>staffRow(s,false)).join('')}<div class="mut" style="margin-top:6px">Market refreshes every 8 weeks. Firing costs 8 weeks' wages.</div></div>`;$('#view').innerHTML=h}
function staffRow(s,mine){return`<div class="row"><div style="flex:1"><b>${s.name}</b> <span class="mut">${mine?'':ROLES[s.role].n+' · '}${s.age}y · ${fmt(s.wage)}/wk</span>
 <div class="mut">${Object.entries(s.attrs).map(([k,v])=>`${k} <b style="color:${v>75?'#22d3a6':v>55?'#e6edf7':'#f87171'}">${v}</b>`).join(' · ')}</div></div>
 ${mine?`<button class="btn red" onclick="fire('${s.id}')">Fire</button>`:`<button class="btn" onclick="hire('${s.id}')">Hire</button>`}</div>`}
function fire(id){const s=G.staff.find(x=>x.id===id);G.cash-=s.wage*8;G.staff=G.staff.filter(x=>x!==s);G.log.unshift(s.name+" was dismissed.");save();render()}
function hire(id){const s=G.market.find(x=>x.id===id);if(staffOf(s.role).length>=ROLES[s.role].max)return toast("No vacancy — fire someone first");
 const fee=s.wage*4;if(G.cash<fee)return toast("Can't afford signing fee");G.cash-=fee;G.staff.push(s);G.market=G.market.filter(x=>x!==s);G.log.unshift(s.name+" joins as "+ROLES[s.role].n+".");save();render();toast("Hired "+s.name)}
function vFac(){$('#view').innerHTML=Object.entries(FAC).map(([k,f])=>{const x=G.fac[k];return`<div class="card"><div class="clubc"><div style="font-size:30px">${f.icon}</div><div style="flex:1"><b>${f.n}</b> — Level ${x.lvl}/10<div class="mut">${f.d}</div></div></div>
 <div class="bar" style="margin:10px 0"><i style="width:${x.lvl*10}%"></i></div>
 ${x.build?`<div class="warn">🚧 Upgrading — ${x.build} week(s) left</div>`:x.lvl>=10?'<div class="good">Max level</div>':`<button class="btn big" onclick="upFac('${k}')">Upgrade to L${x.lvl+1} · ${fmt(facCost(x.lvl))} · ${facWeeks(x.lvl)} wks</button>`}</div>`}).join('')}
function upFac(k){const x=G.fac[k],c=facCost(x.lvl);if(G.cash<c)return toast("Not enough funds");G.cash-=c;x.build=facWeeks(x.lvl);save();render();toast("Construction started")}
function vLeague(){const t=table(),last=G.results[G.results.length-1];
 $('#view').innerHTML=`<div class="card"><h3>League table</h3><table><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
 ${t.map((r,i)=>`<tr class="${r.i===G.club?'me':''}"><td>${i+1}</td><td><span style="color:${r.col}">●</span> ${r.name}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table></div>
 ${last?`<div class="card"><h3>Week ${G.results.length} results</h3>${last.map(([h,a,x,y])=>`<div class="row res"><span style="flex:1">${G.teams[h].name}</span><b>${x} - ${y}</b><span style="flex:1;text-align:right">${G.teams[a].name}</span></div>`).join('')}</div>`:''}
 <div class="card"><h3>Your fixtures</h3>${G.fixtures.map((r,i)=>{const m=r.find(x=>x.includes(G.club));const res=G.results[i]&&G.results[i].find(x=>x[0]===m[0]);const h=m[0]===G.club;const o=G.teams[h?m[1]:m[0]].name;
 let p='';if(res){const gf=h?res[2]:res[3],ga=h?res[3]:res[2];p=`<span class="pill ${gf>ga?'W':gf<ga?'L':'D'}">${gf}-${ga}</span>`}
 return`<div class="row res"><span class="mut">Wk ${i+1}</span><span style="flex:1">${h?'vs':'@'} ${o}</span>${p}</div>`}).join('')}</div>`}
function vMoney(){const l=G.ledger[0],s=stadiumStats(G.stad),att=attendance(),mi=matchIncome(att);
 $('#view').innerHTML=`<div class="card"><h3>Balance</h3><div style="font-size:30px;font-weight:800" class="${G.cash<0?'bad':'good'}">${fmt(G.cash)}</div>
 ${l?`<div class="mut">Last week: +${fmt(l.income)} in / -${fmt(l.out)} out = <b class="${l.income-l.out<0?'bad':'good'}">${fmt(l.income-l.out)}</b></div>`:''}</div>
 <div class="card"><h3>Ticket price</h3><div class="row"><span>Average ticket</span><b id="tp">£${G.ticket}</b></div>
 <input type="range" min="5" max="120" value="${G.ticket}" oninput="G.ticket=+this.value;$('#tp').textContent='£'+this.value;$('#tpa').textContent=attendance().toLocaleString()+' fans · '+fmt(attendance()*G.ticket)" onchange="save()">
 <div class="mut" id="tpa">${att.toLocaleString()} fans · ${fmt(att*G.ticket)}</div><div class="mut">Higher prices reduce crowds and annoy fans.</div></div>
 <div class="card"><h3>Projected home matchday</h3>
 ${[['Tickets',mi.tickets],['Food & drink',mi.food],['Hospitality boxes',mi.hosp],['Club shop',mi.shop]].map(([a,b])=>`<div class="row"><span>${a}</span><b>${fmt(b)}</b></div>`).join('')}</div>
 <div class="card"><h3>Sponsorship</h3>${G.sponsor?`<div class="row"><span>${G.sponsor.name}</span><b>${fmt(G.sponsor.perWeek)}/wk · ${G.sponsor.weeks} wks left</b></div>`:`<div class="mut">No shirt sponsor!</div>`}
 <div class="mut" style="margin:6px 0">Offers scale with league position, fans and stadium screens.</div>${sponsorOffers().map((o,i)=>`<div class="row"><span>${o.name}<br><small class="mut">${o.weeks} weeks</small></span><button class="btn sec" onclick="takeSp(${i})">${fmt(o.perWeek)}/wk</button></div>`).join('')}</div>
 <div class="card"><h3>Weekly cash flow</h3>${G.ledger.slice(0,12).map(x=>`<div class="row"><span class="mut">S${x.season} W${x.wk} ${x.home?'🏠':'✈️'}</span><span>+${fmt(x.income)} / -${fmt(x.out)}</span><b class="${x.income-x.out<0?'bad':'good'}">${fmt(x.income-x.out)}</b></div>`).join('')||'<div class="mut">Play a week to see cash flow.</div>'}</div>`}
let _sp=null;function sponsorOffers(){const key=G.season+'-'+Math.floor(G.week/6);if(_sp&&_sp.key===key)return _sp.o;
 const base=(me().rating*me().rating*90+G.fans*2e3+G.stad.global.screens*10e3);const names=["Apex Bet","Northwind Air","Voltra Energy","Quanta Bank","Hexa Mobile","Brewster Lager"];
 _sp={key,o:[0,1,2].map(i=>({name:pick(names),perWeek:Math.round(base*R(0.7,1.3)/1000)*1000,weeks:[38,76,114][i]}))};return _sp.o}
function takeSp(i){G.sponsor={..._sp.o[i]};_sp.o.splice(i,1);save();render();toast("Sponsorship signed")}

// ---------- STADIUM BUILDER VIEW ----------
let cam={z:1,x:0,y:0};
function pendingFor(k){return G.stad.queue.find(q=>q.key===k)}
function vStadium(){const s=stadiumStats(G.stad);
 $('#view').innerHTML=`<div class="grid2" style="grid-template-columns:repeat(3,1fr);margin-bottom:10px">
 <div class="stat"><small>Capacity</small><b>${s.cap.toLocaleString()}</b></div><div class="stat"><small>Atmosphere</small><b>${s.atm}</b></div><div class="stat"><small>Pitch</small><b>${s.pitchQ}</b></div></div>
 <div id="stadwrap"><canvas id="cv"></canvas></div>
 <div class="mut" style="text-align:center;margin:4px 0">Tap a stand to edit · pinch / drag to zoom & pan · double-tap to reset</div>
 <div class="seg" style="margin:8px 0"><button class="${stadMode==='stands'?'on':''}" onclick="stadMode='stands';render()">Stands</button><button class="${stadMode==='site'?'on':''}" onclick="stadMode='site';render()">Site & Tech</button><button class="${stadMode==='works'?'on':''}" onclick="stadMode='works';render()">Works (${G.stad.queue.length})</button></div>
 <div id="spanel"></div>`;
 drawStadium();bindCanvas();stadPanel()}
let draft=null;
function stadPanel(){const p=$('#spanel');if(stadMode==='works'){p.innerHTML=`<div class="card"><h3>Construction queue</h3>${G.stad.queue.map(q=>`<div class="row"><span>🚧 ${q.label}</span><b>${q.left} wks</b></div>`).join('')||'<div class="mut">No active works.</div>'}</div>`;return}
 if(stadMode==='site'){const g=G.stad.global;p.innerHTML=`<div class="card"><h3>Pitch surface</h3><div class="seg">${Object.entries(PITCH).map(([k,v])=>`<button class="${g.pitch===k?'on':''}" onclick="setPitch('${k}')">${v.n}<br><small>${v.cost?fmt(v.cost):'—'}</small></button>`).join('')}</div></div>`+
  Object.entries(GLOBAL_OPTS).map(([k,o])=>{const l=g[k],pend=pendingFor(k);return`<div class="card"><div class="row"><span>${o.icon} <b>${o.n}</b><br><small class="mut">${o.eff}</small></span><b>${o.levels[l]}</b></div>
  ${pend?`<div class="warn">🚧 ${pend.label} — ${pend.left} wks</div>`:l<o.levels.length-1?`<button class="btn big sec" onclick="upGlobal('${k}')">Upgrade → ${o.levels[l+1]} · ${fmt(o.cost(l+1))} · ${o.weeks+l} wks</button>`:'<div class="good">Top spec</div>'}</div>`}).join('');return}
 const k=stadSel,cur=G.stad.stands[k],pend=pendingFor(k);if(!draft||draft.k!==k)draft={k,...JSON.parse(JSON.stringify(cur))};
 const isC=k.length===2,maxT=isC?2:4,c=standChangeCost(k,cur,draft),changed=c.cost>0||JSON.stringify({...draft,k:0,build:0})!==JSON.stringify({...cur,k:0,build:0});
 const seg=(f,vals,labels)=>`<div class="seg">${vals.map((v,i)=>`<button class="${draft[f]===v?'on':''}" onclick="draft.${f}=${JSON.stringify(v).replace(/"/g,"'")};stadPanel();drawStadium()">${labels[i]}</button>`).join('')}</div>`;
 const step=(f,max,lbl)=>`<div class="row"><span>${lbl}</span><span><button class="btn sec" onclick="draft.${f}=Math.max(0,draft.${f}-1);stadPanel();drawStadium()">−</button> <b style="display:inline-block;width:28px;text-align:center">${draft[f]}</b> <button class="btn sec" onclick="draft.${f}=Math.min(${max},draft.${f}+1);stadPanel();drawStadium()">+</button></span></div>`;
 p.innerHTML=`<div class="legend">${[...SIDES,...CORNERS].map(x=>`<div class="chip ${x===k?'on':''}" onclick="selStand('${x}')">${SIDE_NAME[x]}</div>`).join('')}</div>
 <div class="card"><h2>${SIDE_NAME[k]}</h2><div class="mut">Current: ${cur.tiers?cur.tiers+' tier · '+cur.seat+' · roof '+cur.roof+' · '+standCap(cur,k).toLocaleString()+' cap':'Empty plot'}</div>
 ${pend?`<div class="warn" style="margin-top:8px">🚧 ${pend.label} — ${pend.left} weeks left</div>`:`
 <h3 style="margin-top:12px">Tiers</h3>${seg('tiers',[...Array(maxT+1).keys()],[...Array(maxT+1).keys()].map(i=>i?i+' tier':'None'))}
 <h3 style="margin-top:12px">Type</h3>${seg('seat',['seated','standing'],['💺 All-seater','🧍 Safe standing'])}
 <h3 style="margin-top:12px">Roof</h3>${seg('roof',['none','partial','full'],['Open','Cantilever part','Full cover'])}
 <div style="margin-top:8px">${step('boxes',isC?4:30,'🥂 Hospitality boxes')}${step('concourse',3,'🚶 Concourse level')}${step('kiosks',isC?6:20,'🌭 Food kiosks')}</div>
 <div class="row"><span>New capacity</span><b>${standCap(draft,k).toLocaleString()}</b></div>
 <button class="btn big" ${changed&&c.cost>0?'':'disabled'} onclick="commitStand()">${c.cost>0?`Build · ${fmt(c.cost)} · ${c.weeks} wks`:'No changes'}</button>
 ${changed?`<button class="btn sec big" onclick="draft=null;stadPanel();drawStadium()">Reset</button>`:''}<div class="mut" style="margin-top:6px">Stand is closed during works (no capacity).</div>`}</div>`}
function selStand(k){stadSel=k;draft=null;stadPanel();drawStadium()}
function commitStand(){const k=stadSel,cur=G.stad.stands[k],c=standChangeCost(k,cur,draft);if(G.cash<c.cost)return toast("Not enough funds");G.cash-=c.cost;
 const target={tiers:draft.tiers,seat:draft.seat,roof:draft.roof,boxes:draft.boxes,concourse:draft.concourse,kiosks:draft.kiosks};
 cur.build={prev:{...cur,build:null},target};const prevT=cur.tiers;cur.tiers=0;
 G.stad.queue.push({key:k,label:SIDE_NAME[k]+' redevelopment',left:c.weeks,target});draft=null;save();render();toast("Works begin on "+SIDE_NAME[k])}
function upGlobal(k){const o=GLOBAL_OPTS[k],l=G.stad.global[k],c=o.cost(l+1);if(G.cash<c)return toast("Not enough funds");G.cash-=c;G.stad.queue.push({key:k,label:o.n+' → '+o.levels[l+1],left:o.weeks+l,glob:k});save();render()}
function setPitch(k){if(G.stad.global.pitch===k)return;const c=PITCH[k].cost;if(G.cash<c)return toast("Not enough funds");G.cash-=c;G.stad.queue.push({key:'pitch',label:'Relay pitch: '+PITCH[k].n,left:3,pitch:k});save();render()}
// queue completion (functions not serialisable -> resolve by data)
function finishJob(q){if(q.glob){G.stad.global[q.glob]++;G.log.unshift(GLOBAL_OPTS[q.glob].n+' upgrade complete!')}else if(q.pitch){G.stad.global.pitch=q.pitch;G.log.unshift('New pitch laid.')}
 else if(q.target){const st=G.stad.stands[q.key];Object.assign(st,q.target);st.build=null;G.log.unshift(SIDE_NAME[q.key]+' reopened! Capacity '+standCap(st,q.key).toLocaleString())}}

// drawing
function geom(W,H){const pw=W*0.46,ph=pw*0.66,cx=W/2,cy=H/2,d=W*0.085;return{pw,ph,cx,cy,d}}
function standRect(k,g,tiers){const{pw,ph,cx,cy,d}=g,gap=8,depth=d*Math.max(tiers,0.5)*0.75;
 const L=cx-pw/2-gap,Rr=cx+pw/2+gap,T=cy-ph/2-gap,B=cy+ph/2+gap;
 switch(k){case'N':return[L,T-depth,Rr-L,depth];case'S':return[L,B,Rr-L,depth];case'W':return[L-depth,T,depth,B-T];case'E':return[Rr,T,depth,B-T];
 case'NW':return[L-depth,T-depth,depth,depth];case'NE':return[Rr,T-depth,depth,depth];case'SW':return[L-depth,B,depth,depth];case'SE':return[Rr,B,depth,depth]}}
function drawStadium(){const cv=$('#cv');if(!cv)return;const dpr=window.devicePixelRatio||1,W=cv.parentElement.clientWidth,H=Math.round(W*0.95);
 cv.width=W*dpr;cv.height=H*dpr;cv.style.height=H+'px';const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);
 x.fillStyle='#0d1f17';x.fillRect(0,0,W,H);x.save();x.translate(W/2+cam.x,H/2+cam.y);x.scale(cam.z,cam.z);x.translate(-W/2,-H/2);
 const g=geom(W,H),gl=G.stad.global;
 // surroundings: parking & transport
 x.fillStyle='#1a2b22';x.fillRect(-W,-H,W*3,H*3);
 for(let i=0;i<gl.parking;i++){x.fillStyle='#2a3340';const px=W*0.03,py=H*0.04+i*H*0.11;x.fillRect(px,py,W*0.2,H*0.09);x.strokeStyle='#ffffff30';for(let j=0;j<8;j++){x.beginPath();x.moveTo(px+j*W*0.025,py);x.lineTo(px+j*W*0.025,py+H*0.04);x.stroke()}
  x.fillStyle='#93c5fd';x.font='bold 10px sans-serif';x.fillText('P',px+3,py+H*0.08)}
 if(gl.transport){x.strokeStyle='#64748b';x.lineWidth=5;x.beginPath();x.moveTo(0,H*0.93);x.lineTo(W,H*0.93);x.stroke();x.setLineDash([4,6]);x.strokeStyle='#cbd5e1';x.lineWidth=1.5;x.stroke();x.setLineDash([]);
  x.fillStyle=['','#f59e0b','#3b82f6','#a855f7'][gl.transport];x.fillRect(W*0.7,H*0.895,W*0.18,H*0.07);x.fillStyle='#fff';x.font='bold 10px sans-serif';x.fillText(['','BUS','RAIL','METRO'][gl.transport],W*0.72,H*0.94)}
 if(gl.shop){x.fillStyle='#be185d';const s=8+gl.shop*6;x.fillRect(W*0.82,H*0.05,s*1.6,s);x.fillStyle='#fff';x.font='9px sans-serif';x.fillText('SHOP',W*0.82+2,H*0.05+s-3)}
 if(gl.museum){x.fillStyle='#a16207';x.fillRect(W*0.82,H*0.16,22,16);x.fillStyle='#fff';x.font='8px sans-serif';x.fillText('MUS',W*0.82+2,H*0.16+11)}
 // concourse ring
 x.fillStyle='#2b3546';const outer=g.d*3.3;x.beginPath();x.roundRect(g.cx-g.pw/2-outer,g.cy-g.ph/2-outer,g.pw+outer*2,g.ph+outer*2,26);x.fill();
 // pitch
 const pc={grass:['#2f8f46','#2a8040'],hybrid:['#34a853','#2d9649'],artificial:['#22a06b','#1e9061']}[gl.pitch];
 const n=12;for(let i=0;i<n;i++){x.fillStyle=pc[i%2];x.fillRect(g.cx-g.pw/2+i*g.pw/n,g.cy-g.ph/2,g.pw/n+0.5,g.ph)}
 if(gl.heating){x.strokeStyle='#ff6b3555';x.lineWidth=1;for(let i=1;i<8;i++){x.beginPath();x.moveTo(g.cx-g.pw/2,g.cy-g.ph/2+i*g.ph/8);x.lineTo(g.cx+g.pw/2,g.cy-g.ph/2+i*g.ph/8);x.stroke()}}
 x.strokeStyle='#ffffffd0';x.lineWidth=1.3;x.strokeRect(g.cx-g.pw/2+4,g.cy-g.ph/2+4,g.pw-8,g.ph-8);x.beginPath();x.moveTo(g.cx,g.cy-g.ph/2+4);x.lineTo(g.cx,g.cy+g.ph/2-4);x.stroke();
 x.beginPath();x.arc(g.cx,g.cy,g.ph*0.14,0,7);x.stroke();const bw=g.pw*0.13,bh=g.ph*0.5;x.strokeRect(g.cx-g.pw/2+4,g.cy-bh/2,bw,bh);x.strokeRect(g.cx+g.pw/2-4-bw,g.cy-bh/2,bw,bh);
 // stands
 for(const k of [...CORNERS,...SIDES]){const real=G.stad.stands[k],st=(draft&&draft.k===k)?draft:real,building=!!real.build,t=building?real.build.target.tiers:st.tiers;
  if(!t&&!building){x.setLineDash([4,4]);x.strokeStyle=k===stadSel?'#22d3a6':'#ffffff30';x.lineWidth=1.5;const r=standRect(k,g,1);x.strokeRect(...r);x.setLineDash([]);
   if(k===stadSel){x.fillStyle='#22d3a615';x.fillRect(...r)}continue}
  const r=standRect(k,g,t);const horiz=k==='N'||k==='S';const isC=k.length===2;
  const S=building?real.build.target:st;
  for(let i=0;i<t;i++){const f=i/t,f2=(i+1)/t;let rr;
   if(k==='N')rr=[r[0],r[1]+r[3]*(1-f2),r[2],r[3]/t];else if(k==='S')rr=[r[0],r[1]+r[3]*f,r[2],r[3]/t];else if(k==='W'||k==='NW'||k==='SW')rr=[r[0]+r[2]*(1-f2),r[1],r[2]/t,r[3]];else rr=[r[0]+r[2]*f,r[1],r[2]/t,r[3]];
   const base=S.seat==='seated'?[me().col,'#ffffff']:['#4b5563','#9ca3af'];
   x.fillStyle=shade(base[0],-i*18);x.fillRect(...rr);
   // seat rows
   x.strokeStyle='#00000040';x.lineWidth=1;const rows=5;for(let j=1;j<rows;j++){x.beginPath();if(horiz){const yy=rr[1]+rr[3]*j/rows;x.moveTo(rr[0],yy);x.lineTo(rr[0]+rr[2],yy)}else{const xx=rr[0]+rr[2]*j/rows;x.moveTo(xx,rr[1]);x.lineTo(xx,rr[1]+rr[3])}x.stroke()}
   if(S.seat==='seated'&&!isC){x.fillStyle='#ffffff22';for(let j=0;j<40;j++){if(horiz)x.fillRect(rr[0]+j*rr[2]/40,rr[1],1,rr[3]);else x.fillRect(rr[0],rr[1]+j*rr[3]/40,rr[2],1)}}
   if(i>0){x.fillStyle='#0f172a';if(horiz)x.fillRect(rr[0],k==='N'?rr[1]+rr[3]-2:rr[1],rr[2],2);else x.fillRect(k.includes('W')?rr[0]+rr[2]-2:rr[0],rr[1],2,rr[3])}}
  // boxes strip
  if(S.boxes){x.fillStyle='#fbbf24';const nb=S.boxes;for(let j=0;j<nb;j++){if(horiz){const w=r[2]/Math.max(nb,1);x.fillRect(r[0]+j*w+1,k==='N'?r[1]+r[3]*0.48:r[1]+r[3]*0.48,w-2,3)}else{const h=r[3]/nb;x.fillRect(r[0]+r[2]*0.48,r[1]+j*h+1,3,h-2)}}}
  // kiosks
  x.fillStyle='#f97316';for(let j=0;j<S.kiosks;j++){const fr=(j+0.5)/S.kiosks;let kx,ky;if(horiz){kx=r[0]+r[2]*fr;ky=k==='N'?r[1]-5:r[1]+r[3]+5}else{ky=r[1]+r[3]*fr;kx=k.includes('W')?r[0]-5:r[0]+r[2]+5}x.beginPath();x.arc(kx,ky,2.4,0,7);x.fill()}
  // roof
  if(S.roof!=='none'){const cover=S.roof==='full'?1:0.55;x.fillStyle='#e2e8f033';x.strokeStyle='#e2e8f0aa';x.lineWidth=1.2;let rf;
   if(k==='N')rf=[r[0],r[1],r[2],r[3]*cover];else if(k==='S')rf=[r[0],r[1]+r[3]*(1-cover),r[2],r[3]*cover];else if(k.includes('W'))rf=[r[0],r[1],r[2]*cover,r[3]];else rf=[r[0]+r[2]*(1-cover),r[1],r[2]*cover,r[3]];
   if(isC){rf=r}x.fillRect(...rf);x.strokeRect(...rf);x.strokeStyle='#e2e8f055';for(let j=1;j<10;j++){x.beginPath();if(horiz){x.moveTo(rf[0]+rf[2]*j/10,rf[1]);x.lineTo(rf[0]+rf[2]*j/10,rf[1]+rf[3])}else{x.moveTo(rf[0],rf[1]+rf[3]*j/10);x.lineTo(rf[0]+rf[2],rf[1]+rf[3]*j/10)}x.stroke()}}
  if(building){x.save();x.beginPath();x.rect(...r);x.clip();x.fillStyle='#00000088';x.fillRect(...r);x.strokeStyle='#fbbf24';x.lineWidth=3;for(let j=-20;j<40;j++){x.beginPath();x.moveTo(r[0]+j*10,r[1]);x.lineTo(r[0]+j*10-r[3],r[1]+r[3]);x.stroke()}x.restore();
   x.fillStyle='#fff';x.font='bold 11px sans-serif';x.textAlign='center';x.fillText('🚧 '+pendingFor(k).left+'w',r[0]+r[2]/2,r[1]+r[3]/2+4);x.textAlign='left'}
  if(k===stadSel&&stadMode==='stands'){x.strokeStyle='#22d3a6';x.lineWidth=2.5;x.shadowColor='#22d3a6';x.shadowBlur=10;x.strokeRect(...r);x.shadowBlur=0}
  if(!isC&&!building){x.fillStyle='#ffffffcc';x.font='bold 10px sans-serif';x.textAlign='center';const lab=standCap(st,k).toLocaleString();x.fillText(lab,r[0]+r[2]/2,r[1]+r[3]/2+3);x.textAlign='left'}}
 // floodlights
 const fl=gl.lights,o=g.d*3.0;[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const px=g.cx+a*(g.pw/2+o),py=g.cy+b*(g.ph/2+o*0.9);
  if(fl>=2){const gr=x.createRadialGradient(px,py,0,px,py,30+fl*14);gr.addColorStop(0,fl>=3?'#ffffffaa':'#fff7c288');gr.addColorStop(1,'#fff0');x.fillStyle=gr;x.beginPath();x.arc(px,py,30+fl*14,0,7);x.fill()}
  x.fillStyle='#94a3b8';x.fillRect(px-4,py-4,8,8);x.fillStyle=fl>=2?'#fffbe6':'#cbd5e1';x.fillRect(px-3,py-3,6,6)});
 // screens
 for(let i=0;i<gl.screens;i++){const pos=[[g.cx-g.pw/2-g.d*0.4,g.cy-g.ph/2-g.d*0.4],[g.cx+g.pw/2+g.d*0.4,g.cy+g.ph/2+g.d*0.4],[g.cx+g.pw/2+g.d*0.4,g.cy-g.ph/2-g.d*0.4]][Math.min(i,2)];
  x.fillStyle='#000';x.fillRect(pos[0]-10,pos[1]-6,20,12);x.fillStyle=i===2?'#a855f7':'#38bdf8';x.fillRect(pos[0]-8,pos[1]-4,16,8)}
 x.restore()}
function shade(hex,amt){let c=parseInt(hex.slice(1),16),r=clamp((c>>16)+amt,0,255),g=clamp((c>>8&255)+amt,0,255),b=clamp((c&255)+amt,0,255);return`rgb(${r},${g},${b})`}
function bindCanvas(){const cv=$('#cv');let pts=new Map(),start=null,moved=false,lastTap=0,pinch=null;
 cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;start={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y};
  if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:cam.z}}});
 cv.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size===2&&pinch){const [a,b]=[...pts.values()];cam.z=clamp(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d,0.7,3);moved=true;drawStadium()}
  else if(pts.size===1&&start){const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>6){moved=true;cam.x=start.cx+dx;cam.y=start.cy+dy;drawStadium()}}});
 const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!moved&&pts.size===0){const now=Date.now();if(now-lastTap<300){cam={z:1,x:0,y:0};drawStadium()}else tapAt(e);lastTap=now}};
 cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',e=>pts.delete(e.pointerId));
 cv.addEventListener('wheel',e=>{e.preventDefault();cam.z=clamp(cam.z*(e.deltaY<0?1.1:0.9),0.7,3);drawStadium()},{passive:false})}
function tapAt(e){const cv=$('#cv'),b=cv.getBoundingClientRect(),W=b.width,H=b.height;let px=e.clientX-b.left,py=e.clientY-b.top;
 px=(px-W/2-cam.x)/cam.z+W/2;py=(py-H/2-cam.y)/cam.z+H/2;const g=geom(W,H);
 for(const k of [...SIDES,...CORNERS]){const st=G.stad.stands[k],t=Math.max(st.build?st.build.target.tiers:st.tiers,1),r=standRect(k,g,t);
  if(px>=r[0]-6&&px<=r[0]+r[2]+6&&py>=r[1]-6&&py<=r[1]+r[3]+6){stadMode='stands';stadSel=k;draft=null;render();return}}}
// patch queue processing to data-driven finish
const _adv=advance;
advance=function(){G.stad.queue.forEach(q=>q.done=()=>finishJob(q));_adv()};
window.addEventListener('resize',()=>{if(tab==='stadium')drawStadium()});
load();if(G&&G.stad)G.stad.queue.forEach(q=>delete q.done);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
