'use strict';
/* ===== Club Chairman v2 core: world, players, leagues, cups, match engine, transfers, season ===== */
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const DIVS=['Premier Division','Division One','Division Two','Division Three'],DSHORT=['PD','D1','D2','D3'],DSIZE=[20,24,24,24];
const TOWNS=["Ashcombe","Barrowdale","Beckhampton","Blackwater","Bramwell","Brockhurst","Caldmoor","Carrowfield","Chesterby","Coldharbour","Crowmere","Dalesford","Deepdale","Draycott","Eastwick","Edgeley","Fairhaven","Farleigh","Foxmoor","Glenmarsh","Grantley","Hadleigh","Halbury","Hartsford","Hawkridge","Highcliffe","Holmwood","Kelmscott","Kingsmoor","Langford","Lockwood","Lowestby","Marbury","Marshfield","Merriton","Netherby","Newholm","Northam","Oakhurst","Orchardleigh","Otterburn","Penmore","Quarrydale","Ravensby","Redmarsh","Ridgeway","Rookwood","Rushden Vale","Saltmere","Sandbury","Seacombe","Shelford","Silverdale","Southmoor","Stanbridge","Stockley","Summerfield","Tanfield","Thistleby","Torbridge","Upwell","Wakehurst","Waldron","Wellsby","Westcombe","Whitmoor","Wickford","Willowmere","Winterbourne","Wolverby","Woodhaven","Yarrowby","Yewbridge","Ambridge","Coalbrook","Elderfield","Greystoke","Harlowe","Morwick","Pellbury"];
const SUFF=["United","City","Town","Athletic","Rovers","Wanderers","Albion","County","FC","Rangers","Borough","Villa","Orient","Harriers","Swifts","Dynamo"];
const PAL=["#c0392b","#2563eb","#dc2626","#7c3aed","#f59e0b","#059669","#0891b2","#be185d","#4f46e5","#16a34a","#64748b","#e11d48","#ea580c","#9333ea","#0d9488","#1d4ed8","#b91c1c","#0369a1","#57534e","#ca8a04","#15803d","#a21caf","#0f766e","#b45309"];
const ALL92=(()=>{const r=mulberry(9241),out=[];CLUBS.forEach(c=>out.push({name:c[0],col:c[1],price:c[2]+8e6,rep:Math.round(64+(c[3]-50)*18/32),div:0}));
 const usedT=new Set();
 for(let d=1;d<4;d++)for(let k=0;k<24;k++){let t;do{t=TOWNS[Math.floor(r()*TOWNS.length)]}while(usedT.has(t));usedT.add(t);
  const top=[0,67,60,53][d],rep=Math.round(top-k*(8/23)+(r()-.5)*2);
  out.push({name:t+' '+SUFF[Math.floor(r()*SUFF.length)],col:PAL[Math.floor(r()*PAL.length)],price:Math.round([0,9e6,3e6,1e6][d]*Math.pow(1.12,rep-top+4)/1e5)*1e5,rep,div:d})}
 return out})();
// ---------- players ----------
const AN=['Pace','Shooting','Passing','Tackling','Physical','Goalkeeping'],AS=['PAC','SHO','PAS','TAC','PHY','GK'];
const PW={GK:[.04,0,.08,.04,.09,.75],DF:[.15,.02,.13,.45,.25,0],MF:[.14,.16,.4,.15,.15,0],FW:[.25,.45,.12,0,.18,0]};
const ovrAt=(p,pos)=>{const w=PW[pos],a=p.at;return a[0]*w[0]+a[1]*w[1]+a[2]*w[2]+a[3]*w[3]+a[4]*w[4]+a[5]*w[5]};
const ovr=p=>Math.round(ovrAt(p,p.pos));
const FN=["Jack","Harry","Leo","Oscar","Charlie","Alfie","Theo","Noah","Ethan","Mason","Kai","Luca","Mateo","Jonas","Rafa","Diego","Tomas","Ivan","Sami","Yusuf","Kofi","Emeka","Andre","Bruno","Felix","Hugo","Max","Ollie","Ryan","Callum","Declan","Kieran","Liam","Owen","Reece","Tyler","Zak","Arlo","Nico","Milan"];
const LN=["Silva","Hughes","Moretti","Kovac","Larsen","Bright","Duval","Okafor","Mendes","Novak","Walsh","Brennan","Ferreira","Holt","Ivanov","Castro","Reid","Keller","Carter","Doyle","Evans","Fletcher","Grant","Hale","Ingram","Jansen","Kane","Lowe","Murray","Nolan","Owusu","Price","Quinn","Rossi","Sandoval","Turner","Uribe","Vidal","Webb","Young","Zielinski","Bakare","Costa","Diallo","Eriksen","Fofana","Garcia","Haddad"];
const wageFor=o=>Math.round(Math.pow(1.1,o-50)*1500/100)*100;
function value(p){const o=ovrAt(p,p.pos);let v=Math.pow(1.13,o-50)*300e3;const a=p.age;v*=a<21?1.3+(p.pot-o)/30:a<25?1.15+(p.pot-o)/45:a<29?1:a<32?.6:.3;v*=.7+.1*Math.min(p.con,3);return Math.max(1e4,Math.round(v/1e4)*1e4)}
function mkPlayer(pos,t,age,club){const w=PW[pos];let at=[];for(let i=0;i<6;i++)at.push(t+R(-7,7)+(w[i]>=.25?5:w[i]===0?-28:w[i]<.1?-12:-3));
 const sh=t-ovrAt({at},pos);at=at.map(v=>clamp(v+sh,3,99));
 const p={id:G.nid++,n:pick(FN)+' '+pick(LN),age,pos,at,pot:age<=23?clamp(Math.round(t+RI(0,Math.round((24-age)*2.6+4))),Math.round(t),97):Math.round(t),club,wage:Math.round(wageFor(t)*R(.85,1.2)/100)*100,con:RI(1,5),mor:70,fit:100,inj:0,ban:0,yc:0,st:newStats(),car:{ap:0,g:0},loan:null,list:false};
 G.pl[p.id]=p;dirty();return p}
const newStats=()=>({ap:0,g:0,as:0,lg:0,yc:0,rc:0,rs:0});
let SQ=null;function dirty(){SQ=null}
function sq(c){if(!SQ){SQ={};for(const id in G.pl){const p=G.pl[id];(SQ[p.club]||(SQ[p.club]=[])).push(p)}}return SQ[c]||[]}
function movePlayer(p,to){p.club=to;p.list=false;p.st=p.st||newStats();dirty()}
// ---------- formations ----------
const FORMS={'4-4-2':'GK DF DF DF DF MF MF MF MF FW FW','4-3-3':'GK DF DF DF DF MF MF MF FW FW FW','4-5-1':'GK DF DF DF DF MF MF MF MF MF FW','3-5-2':'GK DF DF DF MF MF MF MF MF FW FW','5-3-2':'GK DF DF DF DF DF MF MF MF FW FW','4-2-4':'GK DF DF DF DF MF MF FW FW FW FW'};
for(const k in FORMS)FORMS[k]=FORMS[k].split(' ');
function slotXY(fm,i){const sl=FORMS[fm],pos=sl[i];if(pos==='GK')return[.5,.05];const same=sl.map((x,j)=>[x,j]).filter(x=>x[0]===pos),n=same.length,j=same.findIndex(x=>x[1]===i);
 return[.1+.8*(j+1)/(n+1),{DF:.22,MF:.45,FW:.68}[pos]]}
function assignSlots(ids,fm){const sl=FORMS[fm],xi=Array(11).fill(null),pool=ids.filter(x=>x!=null);const order=[...sl.keys()].sort((a,b)=>'GKFWDFMF'.indexOf(sl[a])-'GKFWDFMF'.indexOf(sl[b]));
 for(const pass of[0,1])for(const i of order){if(xi[i]!=null)continue;let best=-1,bv=-1;pool.forEach((id,k)=>{const p=G.pl[id];if(pass===0&&p.pos!==sl[i])return;const v=ovrAt(p,sl[i]);if(v>bv){bv=v;best=k}});if(best>=0){xi[i]=pool[best];pool.splice(best,1)}}
 return xi}
function avail(p){return!p.inj&&!p.ban}
function pickXI(c,fm){const sl=FORMS[fm],av=sq(c).filter(avail),used=new Set(),xi=Array(11).fill(null);
 const order=[...sl.keys()].sort((a,b)=>'GKFWDFMF'.indexOf(sl[a])-'GKFWDFMF'.indexOf(sl[b]));
 for(const pass of[0,1])for(const i of order){if(xi[i]!=null)continue;let best=null,bv=-1;for(const p of av){if(used.has(p.id)||(pass===0&&p.pos!==sl[i]))continue;const v=ovrAt(p,sl[i])*(.8+.2*p.fit/100);if(v>bv){bv=v;best=p}}if(best){xi[i]=best.id;used.add(best.id)}}
 const rest=av.filter(p=>!used.has(p.id)).sort((a,b)=>ovr(b)-ovr(a)),bench=[];const gk=rest.find(p=>p.pos==='GK');if(gk)bench.push(gk.id);
 for(const p of rest){if(bench.length>=7)break;if(!bench.includes(p.id))bench.push(p.id)}return{xi,bench}}
function xiRating(c,fm){const{xi}=pickXI(c,fm),sl=FORMS[fm];let s=0,n=0;xi.forEach((id,i)=>{if(id!=null){s+=ovrAt(G.pl[id],sl[i]);n++}});return n?s/11:40}
function ensureXI(){const all=new Set(sq(G.club).map(p=>p.id));
 if(G.autoXI||!G.xi||G.xi.length!==11){const r=pickXI(G.club,G.fm);G.xi=r.xi;G.bench=r.bench;return}
 const used=new Set();G.xi=G.xi.map(id=>id!=null&&all.has(id)&&avail(G.pl[id])&&!used.has(id)?(used.add(id),id):null);
 G.bench=(G.bench||[]).filter(id=>all.has(id)&&avail(G.pl[id])&&!used.has(id));G.bench.forEach(id=>used.add(id));
 const sl=FORMS[G.fm];G.xi.forEach((id,i)=>{if(id==null){let best=null,bv=-1;sq(G.club).forEach(p=>{if(used.has(p.id)||!avail(p))return;const v=ovrAt(p,sl[i])*(p.pos===sl[i]?1:.8);if(v>bv){bv=v;best=p}});if(best){G.xi[i]=best.id;used.add(best.id);G.bench=G.bench.filter(x=>x!==best.id)}}});
 const rest=sq(G.club).filter(p=>avail(p)&&!used.has(p.id)).sort((a,b)=>ovr(b)-ovr(a));while(G.bench.length<7&&rest.length)G.bench.push(rest.shift().id)}
// ---------- world ----------
function genWorld(){G.pl={};G.nid=1;dirty();
 G.teams=ALL92.map((c,i)=>({id:i,name:c.name,col:c.col,price:c.price,rep:c.rep,div:c.div,fm:pick(Object.keys(FORMS).slice(0,5)),rating:c.rep,p:0,w:0,d:0,l:0,gf:0,ga:0,form:[]}));
 const comp={GK:2,DF:7,MF:7,FW:4};
 G.teams.forEach(t=>{for(const pos in comp)for(let k=0;k<comp[pos];k++){const age=RI(17,34);mkPlayer(pos,clamp(t.rep+(k===0?4:k===1?2:0)+R(-7,4)-(age<20?6:0),30,95),age,t.id)}});
 for(let k=0;k<80;k++)mkPlayer(pick(['GK','DF','DF','MF','MF','FW']),RI(40,66),RI(19,33),-1);
 G.fm='4-4-2';G.ment=1;G.shouts={};G.autoXI=true;G.xi=null;G.sc={};G.scq=[];G.neg={};G.inbox=[];G.mid=1;G.season=G.season||1;
 updateRatings()}
function updateRatings(){G.teams.forEach(t=>t.rating=xiRating(t.id,t.id===G.club?G.fm:t.fm))}
function divTeams(d){return G.teams.filter(t=>t.div===d)}
const r0=d=>Math.floor(d*38/46);
function buildSeason(){G.fx=[0,1,2,3].map(d=>{const ts=shuffle(divTeams(d).map(t=>t.id));return makeFixtures(ts.length).map(r=>r.map(([a,b])=>[ts[a],ts[b]]))});
 const cal=[],c0=[3,9,15,21,27,33,39],c1=[6,12,18,24,30,36,42];
 for(let d=0;d<46;d++){cal.push({t:'L',r:d});if(c0.includes(d))cal.push({t:'C',c:0});if(c1.includes(d))cal.push({t:'C',c:1})}
 cal.push({t:'PO',st:0},{t:'PO',st:1});G.cal=cal;G.day=0;G.week=1;
 G.cups=[{n:'National Cup',alive:G.teams.map(t=>t.id),rd:0,ties:null,win:null,log:[]},{n:'League Cup',alive:G.teams.map(t=>t.id),rd:0,ties:null,win:null,log:[]}];
 G.po={};G.results=[];G.teams.forEach(t=>Object.assign(t,{p:0,w:0,d:0,l:0,gf:0,ga:0,form:[]}));G.cupRun=[0,0];setObjectives()}
const CUPRD=['Round 1','Round 2','Round 3','Round 4','Quarter-final','Semi-final','Final'];
function drawCup(C){const al=shuffle(C.alive.slice());C.ties=[];C.bye=[];
 if(al.length>64){const s=al.sort((a,b)=>G.teams[b].div-G.teams[a].div||Math.random()-.5),n=(al.length-64)*2,pl=shuffle(s.slice(0,n));C.bye=s.slice(n);for(let i=0;i<pl.length;i+=2)C.ties.push([pl[i],pl[i+1]])}
 else for(let i=0;i+1<al.length;i+=2)C.ties.push([al[i],al[i+1]])}
function divTable(d){return G.teams.filter(t=>t.div===d).map(t=>({...t,i:t.id,pts:t.w*3+t.d,gd:t.gf-t.ga})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf)}
table=function(d){return divTable(d==null?me().div:d)};
position=function(){return table().findIndex(t=>t.i===G.club)+1};
expectedPos=function(){const d=me().div;return 1+divTeams(d).sort((a,b)=>b.rating-a.rating).findIndex(t=>t.id===G.club)};
const POSPOTS=[0,2,2,3],POSPO=[[0,0],[3,6],[3,6],[4,7]],RELEG=[3,3,4,0];
function setupPO(){for(const d of[1,2,3]){if(G.po[d])continue;const t=divTable(d),[a,b]=POSPO[d];const s=t.slice(a-1,b).map(x=>x.i);G.po[d]={semi:[[s[0],s[3]],[s[1],s[2]]],fin:null,win:null}}}
function dayFixtures(day){const out=[];if(!day)return out;
 if(day.t==='L'){for(let d=0;d<4;d++){let r=day.r;if(d===0){if(!(r===0||r0(r)!==r0(r-1)))continue;r=r0(r)}(G.fx[d][r]||[]).forEach(([h,a])=>out.push({h,a,comp:'L',div:d}))}}
 else if(day.t==='C'){const C=G.cups[day.c];if(C.win==null){if(!C.ties)drawCup(C);C.ties.forEach(([h,a])=>out.push({h,a,comp:'C',c:day.c,neutral:C.rd===6}))}}
 else{setupPO();for(const d of[1,2,3]){const P=G.po[d];if(day.st===0)P.semi.forEach(([h,a])=>out.push({h,a,comp:'PO',div:d}));else if(P.fin)out.push({h:P.fin[0],a:P.fin[1],comp:'POF',div:d,neutral:true})}}
 return out}
function userFixture(){return dayFixtures(G.cal[G.day]).find(f=>f.h===G.club||f.a===G.club)||null}
function nextFx(){const f=userFixture();return f?[f.h,f.a]:null}
function compName(f){return f.comp==='L'?DIVS[f.div]:f.comp==='C'?G.cups[f.c].n+' · '+CUPRD[G.cups[f.c].rd]:f.comp==='PO'?DIVS[f.div]+' Play-off semi':DIVS[f.div]+' Play-off FINAL'}
// ---------- match engine ----------
const CK=0.127;
function teamState(c){let fm,xi,bench;if(c===G.club){ensureXI();fm=G.fm;xi=G.xi.slice();bench=G.bench.slice()}else{fm=G.teams[c].fm;({xi,bench}=pickXI(c,fm))}
 const fit={};[...xi,...bench].forEach(id=>{if(id!=null)fit[id]=G.pl[id].fit});const user=c===G.club;
 return{c,fm,xi,bench,ment:user?G.ment:1,sh:user?{...G.shouts}:{},subs:0,maxSubs:5,fit,yc:{},red:[],inj:{},played:xi.filter(x=>x!=null),g:0,shots:0,sot:0,poss:0,corners:0,fouls:0,user}}
function newMatch(f,live){return{f,h:f.h,a:f.a,min:0,end:90+RI(1,5),t:[teamState(f.h),teamState(f.a)],ev:[],done:false,neutral:!!f.neutral,dirty:true,live:!!live,ball:{s:0,z:.5}}}
function power(M,s){const T=M.t[s],sl=FORMS[T.fm];let gk=25;const L={DF:[],MF:[],FW:[]};
 T.xi.forEach((id,i)=>{if(id==null)return;const p=G.pl[id],pos=sl[i];const e=ovrAt(p,pos)*(p.pos===pos?1:.85)*(.6+.4*T.fit[id]/100)*(.94+p.mor/800);if(pos==='GK')gk=e;else L[pos].push(e)});
 const av=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:20,n=k=>L[k].length;
 let att=av(L.FW)*(.55+.12*n('FW'))*.65+av(L.MF)*(.5+.07*n('MF'))*.35,mid=av(L.MF)*(.45+.09*n('MF'))+av(L.DF)*.08+av(L.FW)*.06*n('FW'),def=av(L.DF)*(.4+.12*n('DF'))*.8+gk*.2+av(L.MF)*.05*n('MF');
 const mf=[[.88,1.1],[1,1],[1.12,.9]][T.ment];att*=mf[0];def*=mf[1];let rate=1,qual=1;
 if(T.sh.press){mid*=1.06;def*=.98}if(T.sh.wide){rate*=1.06;qual*=.97}if(T.sh.shoot){rate*=1.18;qual*=.85}if(T.sh.calm){rate*=.8;def*=1.07;mid*=1.02}
 if(T.user){const m=staffOf('manager')[0],b=m?1+(m.attrs.Tactics+m.attrs.Motivation-110)/900:.96;att*=b;mid*=b;def*=b}
 if(!M.neutral&&s===0){att*=1.04;mid*=1.03;def*=1.03}return{att,mid,def,gk,rate,qual}}
function pickW(T,ai,excl){const sl=FORMS[T.fm],ws=T.xi.map((id,i)=>{if(id==null||id===excl)return 0;const p=G.pl[id];return({FW:4,MF:1.6,DF:.35,GK:.01})[sl[i]]*Math.pow(p.at[ai]/50,2)});
 let s=ws.reduce((a,b)=>a+b,0)*Math.random();for(let i=0;i<11;i++){s-=ws[i];if(s<=0&&ws[i])return T.xi[i]}return T.xi.find(x=>x!=null&&x!==excl)}
function pickOut(T){const ids=T.xi.filter((id,i)=>id!=null&&FORMS[T.fm][i]!=='GK');return ids.length?pick(ids):null}
function removeFromXI(T,id){const i=T.xi.indexOf(id);if(i>=0)T.xi[i]=null}
function doSub(M,k,outId,inId){const T=M.t[k];if(T.subs>=T.maxSubs)return null;const i=T.xi.indexOf(outId);if(i<0||!T.bench.includes(inId))return null;
 T.xi[i]=inId;T.bench=T.bench.filter(x=>x!==inId);T.subs++;if(!T.played.includes(inId))T.played.push(inId);if(T.fit[inId]==null)T.fit[inId]=G.pl[inId].fit;M.dirty=true;return{t:'sub',s:k,p:inId,o:outId}}
function autoSub(M,k,outId){const T=M.t[k],i=T.xi.indexOf(outId);if(i<0||T.subs>=T.maxSubs||!T.bench.length)return null;const pos=FORMS[T.fm][i];
 const b=T.bench.slice().sort((x,y)=>ovrAt(G.pl[y],pos)*(G.pl[y].pos===pos?1:.8)-ovrAt(G.pl[x],pos)*(G.pl[x].pos===pos?1:.8))[0];return doSub(M,k,outId,b)}
function changeForm(T,fm){const sl=assignSlots(T.xi,fm);T.fm=fm;T.xi=sl}
function step(M){if(M.done)return[];M.min++;const ev=[];if(M.dirty||M.min%8===0){M.pw=[power(M,0),power(M,1)];M.dirty=false}
 const[A,B]=M.pw,s=Math.random()<A.mid/(A.mid+B.mid)?0:1,T=M.t[s],O=M.t[1-s],at=M.pw[s],df=M.pw[1-s];T.poss++;M.ball={s,z:R(.3,.75)};
 const ch=CK*Math.pow(at.att/df.def,1.7)*at.rate*(O.sh.calm?.95:1);
 if(Math.random()<ch){T.shots++;const sh=pickW(T,1);if(sh!=null){const p=G.pl[sh],q=(p.at[1]*.8+p.at[0]*.1+p.at[4]*.1)*(.7+.3*T.fit[sh]/100)*at.qual,pg=clamp(.3*Math.pow(q/Math.max(df.gk,20),1.2),.06,.6),r=Math.random();
  if(r<pg){T.g++;T.sot++;ev.push({t:'goal',s,p:sh,as:Math.random()<.72?pickW(T,2,sh):null});M.ball.z=1}
  else if(r<pg+.33){T.sot++;ev.push({t:'save',s,p:sh,gk:O.xi[0]});M.ball.z=.95}else if(Math.random()<.35){T.corners++;ev.push({t:'corner',s,p:sh});M.ball.z=.97}else{ev.push({t:'miss',s,p:sh});M.ball.z=.93}}}
 else if(Math.random()<.07)ev.push({t:'attack',s,p:pickW(T,2)});
 for(const k of[0,1]){const X=M.t[k];
  if(Math.random()<.0185*(X.sh.press?1.25:1)){const id=pickOut(X);if(id!=null){X.fouls++;X.yc[id]=(X.yc[id]||0)+1;if(X.yc[id]>=2){X.red.push(id);removeFromXI(X,id);M.dirty=true;ev.push({t:'red',s:k,p:id,second:1})}else ev.push({t:'yellow',s:k,p:id})}}
  if(Math.random()<.0005){const id=pickOut(X);if(id!=null){X.red.push(id);removeFromXI(X,id);M.dirty=true;ev.push({t:'red',s:k,p:id})}}
  if(Math.random()<.0013){const id=pickOut(X);if(id!=null){X.inj[id]=RI(1,6);ev.push({t:'inj',s:k,p:id});const e=autoSub(M,k,id);if(e)ev.push(e);else{removeFromXI(X,id);M.dirty=true}}}}
 for(const X of M.t){const dr=.2*(X.sh.press?1.35:1);X.xi.forEach(id=>{if(id!=null)X.fit[id]=Math.max(20,X.fit[id]-dr*(1.25-G.pl[id].at[4]/200))})}
 for(const k of[0,1]){const X=M.t[k];if(X.user&&M.live)continue;
  if([60,68,76,84].includes(M.min)){const tired=X.xi.filter((id,i)=>id!=null&&FORMS[X.fm][i]!=='GK').sort((a,b)=>X.fit[a]-X.fit[b])[0];if(tired!=null&&X.fit[tired]<78){const e=autoSub(M,k,tired);if(e)ev.push(e)}}
  if(M.min===65&&!X.user){const d=X.g-M.t[1-k].g;X.ment=d<0?2:d>0?0:1;M.dirty=true}}
 if(M.min===45)ev.push({t:'ht'});if(M.min>=M.end){M.done=true;ev.push({t:'ft'})}
 ev.forEach(e=>{e.m=M.min;M.ev.push(e)});return ev}
function shootout(){let h=0,a=0;for(let i=0;i<5;i++){if(Math.random()<.76)h++;if(Math.random()<.76)a++}while(h===a){const x=Math.random()<.76,y=Math.random()<.76;h+=x;a+=y}return{w:h>a?0:1,hs:h,as:a}}
function finishMatch(M){const[H,A]=M.t;let pen=null;const ko=M.f.comp!=='L';if(ko&&H.g===A.g)pen=shootout();
 M.rt={};const L=M.f.comp==='L';
 M.t.forEach((X,k)=>{const gf=X.g,ga=M.t[1-k].g,won=gf>ga||(pen&&pen.w===k),lost=gf<ga||(pen&&pen.w!==k);
  sq(X.c).forEach(p=>{if(p.ban>0&&!X.played.includes(p.id))p.ban--;if(X.user&&!X.played.includes(p.id))p.mor=clamp(p.mor-1,0,100)});
  X.played.forEach(id=>{const p=G.pl[id];if(!p)return;const st=p.st;st.ap++;let r=6.4+(won?.4:lost?-.3:0)+R(-.6,.7);
   let g=0,as=0;for(const e of M.ev)if(e.t==='goal'){if(e.p===id)g++;if(e.as===id)as++}
   st.g+=g;st.as+=as;if(L)st.lg+=g;r+=g*.9+as*.5;if(ga===0&&(p.pos==='GK'||p.pos==='DF'))r+=.5;
   if(X.yc[id]){st.yc++;p.yc++;r-=.3;if(p.yc>=5){p.ban=1;p.yc=0}}if(X.red.includes(id)){st.rc++;p.ban=2;r-=1.5}
   if(X.inj[id]){let w=X.inj[id];if(X.user)w=Math.max(1,Math.round(w*(1-G.fac.medical.lvl*.05-staffOf('physio').reduce((a,s)=>a+s.q,0)/1500)));p.inj=w}
   p.fit=X.fit[id]??p.fit;r=clamp(r,3,10);st.rs+=r;M.rt[id]=Math.round(r*10)/10;if(X.user)p.mor=clamp(p.mor+(won?3:lost?-2:0)+1,0,100)})});
 M.res={h:M.h,a:M.a,hg:H.g,ag:A.g,pen};return M.res}
function quickSim(f){const M=newMatch(f,false);while(!M.done)step(M);finishMatch(M);return M}
// ---------- day processing ----------
function winnerOf(r){return r.hg>r.ag?r.h:r.ag>r.hg?r.a:(r.pen?(r.pen.w===0?r.h:r.a):r.h)}
function scoreStr(r){return`${r.hg}-${r.ag}`+(r.pen?` (p ${r.pen.hs}-${r.pen.as})`:'')}
function completeDay(userM){const day=G.cal[G.day];const fxs=dayFixtures(day),res=[];let um=null;
 for(const f of fxs){let M;if(userM&&f.h===userM.h&&f.a===userM.a){M=userM}else M=quickSim(f);const r=M.res;r.comp=f.comp;r.c=f.c;r.div=f.div;res.push(r);
  if(f.comp==='L'){apply(f.h,r.hg,r.ag);apply(f.a,r.ag,r.hg)}if(f.h===G.club||f.a===G.club)um={M,f,r}}
 G.results.push(res);
 if(day.t==='C'){const C=G.cups[day.c];const winners=res.map(winnerOf);if(um){const w=winnerOf(um.r)===G.club;if(w)G.cupRun[day.c]=C.rd+1;
   const prize=[[60e3,120e3,250e3,500e3,1e6,2e6,4e6],[30e3,60e3,120e3,250e3,500e3,1e6,2e6]][day.c][C.rd];if(w){G.cash+=prize;G.log.unshift(`${C.n}: through! ${fmt(prize)} prize`)}else G.log.unshift(`Knocked out of the ${C.n} (${CUPRD[C.rd]})`)}
  C.log.push({rd:C.rd,res});C.alive=[...winners,...(C.bye||[])];C.rd++;C.ties=null;
  if(C.alive.length===1){C.win=C.alive[0];G.log.unshift(`🏆 ${G.teams[C.win].name} win the ${C.n}!`);if(C.win===G.club){G.trophies=(G.trophies||[]);G.trophies.push(C.n+' S'+G.season);inbox('Board','🏆 '+C.n+' winners!','A historic day. The board is delighted.');G.board=clamp(G.board+15,0,100);G.fans=clamp(G.fans+15,0,100)}}else drawCup(C)}
 if(day.t==='PO'){for(const d of[1,2,3]){const P=G.po[d];if(day.st===0){P.fin=P.semi.map(([h,a])=>winnerOf(res.find(r=>r.h===h&&r.a===a)))}else{const r=res.find(r=>r.div===d);if(r){P.win=winnerOf(r);G.log.unshift(`${G.teams[P.win].name} win the ${DIVS[d]} play-off final`)}}}}
 // user finances & mood
 const fin=weeklyFinance(um);
 if(um){const home=um.f.h===G.club,gf=home?um.r.hg:um.r.ag,ga=home?um.r.ag:um.r.hg,w=winnerOf(um.r)===G.club,res=gf>ga||(um.r.pen&&w)?'W':gf<ga||(um.r.pen&&!w)?'L':'D';
  um.res=res;G.lastMatch={...um.r,ev:um.M.ev,rt:um.M.rt,comp:compName(um.f),stats:um.M.t.map(X=>({g:X.g,shots:X.shots,sot:X.sot,poss:X.poss,corners:X.corners,fouls:X.fouls})),day:G.day,season:G.season};
  G.fans=clamp(G.fans+({W:3,D:0,L:-3})[res]-(G.ticket>me().rating*.75?1:0)+(stadiumStats(G.stad).atm-55)/40,0,100);
  let bd=(expectedPos()-position())*.3+(G.cash<0?-3:.2)+({W:1,D:0,L:-1})[res];if(window.diffBoard)bd=diffBoard(bd);G.board=clamp(G.board+bd,0,100);
  G.mgrSec=clamp((G.mgrSec??60)+({W:4,D:0,L:-5})[res]+(expectedPos()-position())*.4,0,100);
  G.log.unshift(`${compName(um.f)}: ${G.teams[um.r.h].name} ${scoreStr(um.r)} ${G.teams[um.r.a].name}`+(home&&fin.att?` · ${fin.att.toLocaleString()} fans`:''));
  if(window.onMatchDone)onMatchDone({r:um.r,res,home,f:um.f,att:fin.att})}
 if(G.board<15){inbox('Board','⚠️ Final warning','Results and finances have pushed the board to the brink. Turn it around.');G.board=30}
 // construction (stadium queue + facilities)
 for(const k in G.fac){const f=G.fac[k];if(f.build>0){f.build--;if(!f.build){f.lvl++;G.log.unshift(FAC[k].n+' upgraded to level '+f.lvl+'!')}}}
 G.stad.queue=G.stad.queue.filter(q=>{q.left--;if(q.left<=0){finishJob(q);return false}return true});
 develop();if(windowOpen())aiTransfers();processScouting();ownerEvents();
 G.day++;G.week=G.day+1;G.log.length=Math.min(G.log.length,40);updateRatings();
 if(window.onDayDone)onDayDone();
 if(G.day>=G.cal.length)seasonEnd();
 save();}
function weeklyFinance(um){const home=um&&um.f.h===G.club&&!um.f.neutral;let att=0,inc={tickets:0,food:0,hosp:0,shop:0};if(home){att=attendance();inc=matchIncome(att);if(um.f.comp!=='L'){inc.tickets*=1.1}}
 const d=me().div,g=G.stad.global,tv=[1.1e6,280e3,90e3,40e3][d]+me().rating*[8e3,2e3,600,300][d];
 let spons=0;for(const k in G.spons){const s=G.spons[k];if(s&&s.weeks>0){spons+=s.perWeek;s.weeks--;if(!s.weeks){inbox('Commercial',`${SLOTS[k].n} deal expired`,`${s.name} deal has ended. Find a new partner in the Owner screen.`);G.spons[k]=null}}}
 let naming=0;if(G.naming&&G.naming.weeks>0){naming=G.naming.perWeek;G.naming.weeks--;if(!G.naming.weeks){inbox('Commercial','Naming rights expired',`The ${G.naming.name} deal has ended.`);G.naming=null}}
 const merch=merchWeekly(),extra=g.screens*25e3+g.museum*15e3+g.lights*8e3;
 const wages=sq(G.club).reduce((a,p)=>a+p.wage,0),staff=staffWages(),maint=stadiumStats(G.stad).cap*1.2+Object.values(G.fac).reduce((a,f)=>a+f.lvl*12e3,0);
 let loanPay=0;(G.loans||[]).forEach(l=>{const pay=Math.min(l.bal,l.weekly);const int=l.bal*l.rate/52;loanPay+=pay+int;l.bal-=pay});G.loans=(G.loans||[]).filter(l=>l.bal>1);
 const income=inc.tickets+inc.food+inc.hosp+inc.shop+tv+spons+naming+merch+extra,out=wages+staff+maint+loanPay;G.cash+=income-out;
 G.ledger.unshift({wk:G.day+1,season:G.season,income:Math.round(income),out:Math.round(out),att,home,parts:{...inc,tv,spons,naming,merch,extra,wages,staff,maint,loans:loanPay}});G.ledger.length=Math.min(G.ledger.length,40);
 return{att,income,out}}
function develop(){const uf=.75+G.fac.training.lvl*.07+staffOf('coach').reduce((a,c)=>a+c.attrs.Coaching,0)/400;
 for(const id in G.pl){const p=G.pl[id];const tf=p.club===G.club?uf:p.club>=0?.75+G.teams[p.club].rep/200:.6,o=ovrAt(p,p.pos);let d=0;
  if(p.age<=24&&o<p.pot)d=(p.pot-o)*.0075*tf*(p.st.ap>0?1.15:.9);else if(p.age>=30)d=-.012*(p.age-29);
  if(d){const w=PW[p.pos];for(let i=0;i<6;i++)if(w[i]>.05)p.at[i]=clamp(p.at[i]+d*(1+R(-.5,.5)),1,99)}
  if(p.inj>0)p.inj--;p.fit=Math.min(100,p.fit+(p.club===G.club?13+G.fac.medical.lvl:14))}}
// ---------- transfers ----------
const windowOpen=()=>G.day<=5||(G.day>=28&&G.day<=33);
function windowText(){return windowOpen()?`🟢 Transfer window open · closes in ${G.day<=5?6-G.day:34-G.day} wk`:`🔴 Window closed · opens in ${G.day<28?28-G.day:G.cal.length-G.day} wk`}
function aiTransfers(){const all=Object.values(G.pl);
 for(let k=0;k<4;k++){const buyer=pick(G.teams);if(buyer.id===G.club)continue;const bsq=sq(buyer.id);if(bsq.length>=26)continue;const pos=pick(['GK','DF','MF','FW','MF','DF','FW']);
  const weak=bsq.filter(p=>p.pos===pos).sort((a,b)=>ovr(a)-ovr(b))[0],lo=weak?ovr(weak)+2:buyer.rep-6,hi=buyer.rep+6;
  const c=all.filter(p=>p.club>=0&&p.club!==G.club&&p.club!==buyer.id&&p.pos===pos&&!p.loan&&G.teams[p.club].div>=buyer.div&&ovr(p)>=lo&&ovr(p)<=hi&&sq(p.club).length>18);if(!c.length)continue;
  const p=pick(c),fee=Math.round(value(p)*R(.9,1.3)/1e4)*1e4,from=G.teams[p.club];movePlayer(p,buyer.id);p.con=RI(2,5);p.wage=Math.round(Math.max(p.wage,wageFor(ovr(p))*R(.9,1.2))/100)*100;
  G.log.unshift(`💼 ${p.n} joins ${buyer.name} from ${from.name} (${fmt(fee)})`);if(weak&&bsq.length>22)movePlayer(weak,-1)}
 G.teams.forEach(t=>{if(t.id===G.club)return;const s=sq(t.id);if(s.length<19){const fa=all.filter(p=>p.club===-1).sort((a,b)=>ovr(b)-ovr(a))[0];if(fa){movePlayer(fa,t.id);fa.con=RI(1,3)}}});
 // AI bids for user's players
 if(Math.random()<.4){const mine=sq(G.club).filter(p=>!p.loan);if(mine.length>16){const w=mine.map(p=>(p.list?5:1)*Math.pow(1.05,ovr(p)-me().rep));let s=w.reduce((a,b)=>a+b,0)*Math.random(),p=mine[0];for(let i=0;i<mine.length;i++){s-=w[i];if(s<=0){p=mine[i];break}}
  const bidders=G.teams.filter(t=>t.id!==G.club&&t.rep>=ovr(p)-4&&t.div<=me().div+1);if(bidders.length){const b=pick(bidders),fee=Math.round(value(p)*(p.list?R(.75,1.05):R(.9,1.3))/1e4)*1e4;
   inbox(b.name,`Bid for ${p.n}`,`${b.name} offer ${fmt(fee)} for ${p.pos} ${p.n} (OVR ${ovr(p)}, value ${fmt(value(p))}).`,[['Accept','acceptBid',{pid:p.id,club:b.id,fee}],['Counter +25%','counterBid',{pid:p.id,club:b.id,fee}],['Reject','rejectBid',{pid:p.id}]])}}}}
function sellPlayer(p,club,fee){if(p.club!==G.club)return toast('Player no longer at the club');movePlayer(p,club);G.cash+=fee;G.log.unshift(`💰 ${p.n} sold to ${G.teams[club].name} for ${fmt(fee)}`);ensureXI();sfxSafe('build')}
function acceptBid(a){const p=G.pl[a.pid];if(!p||!windowOpen())return toast('Window closed — bid lapsed');sellPlayer(p,a.club,a.fee);toast('Sold for '+fmt(a.fee));return true}
function counterBid(a){const p=G.pl[a.pid];if(!p)return true;if(Math.random()<.5){const fee=Math.round(a.fee*1.25/1e4)*1e4;sellPlayer(p,a.club,fee);toast(G.teams[a.club].name+' accept '+fmt(fee)+'!')}else{toast(G.teams[a.club].name+' walk away');p.mor=clamp(p.mor-3,0,100)}return true}
function rejectBid(a){const p=G.pl[a.pid];if(p&&p.list===false&&Math.random()<.3){p.mor=clamp(p.mor-5,0,100);toast(p.n+' is unsettled')}return true}
const sfxSafe=k=>{try{window.sfx&&sfx[k]&&sfx[k]()}catch(e){}};
function known(p){return p.club===G.club||p.loan===G.club||G.sc[p.id]}
function scoutErr(){const s=staffOf('scout');return s.length?Math.max(2,12-s.reduce((a,x)=>a+x.attrs.Judgement,0)/s.length/10):12}
function estOvr(p){if(known(p))return ovr(p);const e=scoutErr(),off=(((p.id*7919)%21)-10)/10*e;return Math.round(ovr(p)+off)}
function processScouting(){const n=staffOf('scout').length+1;const done=G.scq.splice(0,n);done.forEach(id=>{const p=G.pl[id];if(!p)return;G.sc[id]=1;inbox('Scouting','Report: '+p.n,`${p.pos}, ${p.age}y, ${p.club>=0?G.teams[p.club].name:'Free agent'}. OVR ${ovr(p)}, potential ${p.pot}. Value ${fmt(value(p))}.`,[['View','showPlayer',id]])})}
function demandWage(p,toClub){const o=ovr(p);let w=wageFor(o)*(p.age<24&&p.pot>o+8?1.15:1)*(p.age>31?.9:1);if(p.club>=0&&toClub!=null){const dd=G.teams[toClub].div-G.teams[p.club].div;if(dd>0)w*=1+dd*.25}if(p.mor<40&&p.club===G.club)w*=1.3;return Math.round(w/100)*100}
function clubAsk(p){const t=G.teams[p.club],{xi}=pickXI(p.club,t.fm),imp=xi.includes(p.id)?1.35:1.05;return Math.round(value(p)*imp*(p.list?.9:1)*(t.div<me().div?1.15:1)/1e4)*1e4}
function canNegotiate(p){const n=G.neg[p.id];return!(n&&n.block>G.day+(G.season*100))}
function submitOffer(pid,fee,wage,yrs,loan){const p=G.pl[pid];if(!p)return'Player not found';const free=p.club===-1;
 if(!free&&!windowOpen())return'The transfer window is closed.';if(sq(G.club).length>=32)return'Squad is full (32). Sell or release first.';
 const key=G.season*100+G.day,n=G.neg[pid]||(G.neg[pid]={tries:0,block:0});if(n.block>key)return`${p.n}'s camp won't talk until later.`;
 if(!free){const t=G.teams[p.club];if(sq(p.club).length<=18)return`${t.name} won't sell: squad too small.`;
  if(loan){const{xi}=pickXI(p.club,t.fm);if(xi.includes(p.id))return`${t.name} won't loan a first-team regular.`;if(p.age>24&&ovr(p)>t.rating)return`${t.name} want to keep him.`}
  else{if(fee>G.cash)return"You can't afford that fee.";const ask=clubAsk(p);if(fee<ask){n.tries++;if(n.tries>=3){n.block=key+8;n.tries=0;return`${t.name} end talks. Try again in 8 weeks.`}return fee>=ask*.75?`${t.name} reject but would accept ${fmt(ask)}.`:`${t.name} laugh off the bid. They value him far higher.`}}}
 const dd=p.club>=0?me().div-G.teams[p.club].div:0;if(dd>=2&&!loan)return`${p.n} won't drop down ${dd} divisions.`;
 const dem=demandWage(p,G.club);if(!loan&&wage<dem*.97){n.tries++;if(n.tries>=3){n.block=key+8;n.tries=0;return`${p.n}'s agent walks out. Try later.`}return`${p.n}'s agent wants ${fmt(dem)}/wk.`}
 // success
 const from=p.club;if(!loan&&!free)G.cash-=fee;if(loan){p.loan=from}else{p.wage=wage;p.con=yrs}movePlayer(p,G.club);G.sc[p.id]=1;delete G.neg[pid];p.mor=80;G.fans=clamp(G.fans+(ovr(p)>me().rating?3:1),0,100);
 G.log.unshift(`✍️ ${p.n} ${loan?'joins on loan':'signs'} from ${free?'free agency':G.teams[from].name}${loan||free?'':' for '+fmt(fee)}`);ensureXI();sfxSafe('ach');return'OK'}
function renewOffer(pid,wage,yrs){const p=G.pl[pid],dem=demandWage(p);if(p.mor<20&&ovr(p)>me().rating)return`${p.n} wants to leave and refuses to talk.`;if(wage<dem*.95)return`${p.n} wants ${fmt(dem)}/wk.`;p.wage=wage;p.con=yrs;p.mor=clamp(p.mor+8,0,100);G.log.unshift(`📝 ${p.n} signs a ${yrs}-year deal`);return'OK'}
function loanOut(pid){const p=G.pl[pid];if(!windowOpen())return toast('Window closed');if(sq(G.club).length<=18)return toast('Squad too small');const c=pick(G.teams.filter(t=>t.div>=me().div&&t.id!==G.club&&sq(t.id).length<26&&t.rep<ovr(p)+6));if(!c)return toast('No takers');p.loan=G.club;movePlayer(p,c.id);G.log.unshift(`🔁 ${p.n} loaned to ${c.name}`);ensureXI();toast(p.n+' loaned to '+c.name);closeModal();render()}
function releasePl(pid){const p=G.pl[pid],cost=Math.round(p.wage*p.con*20);if(!confirm(`Release ${p.n}? Pay-off ${fmt(cost)}.`))return;G.cash-=cost;movePlayer(p,-1);ensureXI();closeModal();render()}
// ---------- owner layer ----------
const SLOTS={shirt:{n:'Shirt sponsor',m:1},sleeve:{n:'Sleeve sponsor',m:.22},kit:{n:'Kit supplier',m:.45},training:{n:'Training kit',m:.15}};
function sponsorBase(){return(me().rating*me().rating*90*[1,.35,.14,.06][me().div])+G.fans*2e3+G.stad.global.screens*10e3}
const MERCH=[{n:'Budget',m:.75,f:.05},{n:'Standard',m:1,f:0},{n:'Premium',m:1.3,f:-.08}];
function merchWeekly(){const top=sq(G.club).map(ovr).sort((a,b)=>b-a).slice(0,3).reduce((a,b)=>a+b,0)/3||50,m=MERCH[G.merch??1];G.fans=clamp(G.fans+m.f,0,100);
 return Math.round((G.fans/60)*Math.pow(1.08,top-50)*6e3*[1,.4,.18,.08][me().div]*(1+G.stad.global.shop*.25)*m.m)}
function clubValue(){return Math.round(ALL92[G.club].price*(.5+me().rating/140)*[1,.6,.35,.2][me().div]/[1,.6,.35,.2][ALL92[G.club].div]+stadiumStats(G.stad).cap*900+Object.values(G.fac).reduce((a,f)=>a+facCost(f.lvl)*.4,0)+sq(G.club).reduce((a,p)=>a+value(p),0)*.5)}
function debt(){return(G.loans||[]).reduce((a,l)=>a+l.bal,0)}
function setObjectives(){if(G.club==null||!G.teams)return;const e=expectedPos(),d=me().div;const tgt=d>0&&e<=6?Math.min(e,6):Math.min(DSIZE[d]-RELEG[d],e+2);
 G.obj={pos:tgt,cup:e<=4?4:e<=10?2:1,fin:true,d};G.mgrSec=G.mgrSec??60;
 inbox('Board',`Season ${G.season} objectives`,`League: finish ${tgt}${ord(tgt)} or better${d>0&&tgt<=POSPO[d][1]?' (promotion push)':''}. Cups: reach ${CUPRD[G.obj.cup]} in either cup. Finances: stay out of the red.`)}
function inbox(from,t,b,acts){G.inbox=G.inbox||[];G.inbox.unshift({id:G.mid=(G.mid||1)+1,from,t,b,acts:acts||null,read:false,done:false,s:G.season,w:(G.day||0)+1});G.inbox.length=Math.min(G.inbox.length,80)}
function ownerEvents(){const r=Math.random();
 if(G.day===27)sq(G.club).filter(p=>p.con<=1&&!p.loan).forEach(p=>inbox('Assistant',`Contract expiring: ${p.n}`,`${p.n} (${ovr(p)} OVR) is out of contract this summer.`,[['Open player','showPlayer',p.id]]));
 if((G.mgrSec??60)<25&&staffOf('manager').length&&Math.random()<.2){inbox('Board','Manager under pressure',`Fans are chanting for ${staffOf('manager')[0].name} to go. Job security is at ${Math.round(G.mgrSec)}%.`,[['Go to staff','go','staff']]);G.fans=clamp(G.fans-1,0,100)}
 if(G.board>55&&r<.012){const v=Math.round(clubValue()*R(1.05,1.5)/1e5)*1e5;inbox('Consortium','Takeover offer',`An investment group offers ${fmt(v)} to buy the club outright (club valuation ${fmt(clubValue())}).`,[['Accept & sell','acceptTakeover',v],['Decline','noop',0]])}
 if(r>.97){const t=pick(G.teams.filter(t=>t.id!==G.club));G.log.unshift(`📰 ${t.name} sack their manager after poor run`)}
 if(!G.naming&&r>.92&&r<.95){const o=namingOffer();inbox('Commercial','Naming rights offer',`${o.brand} want to rename the ground "${o.name}" for ${fmt(o.perWeek)}/wk over ${o.weeks/62|0} seasons.`,[['Accept','takeNaming',o],['Decline','noop',0]])}}
function namingOffer(){const b=pick(["Voltra","Apex","Northwind","Quanta","Hexa","Brewster","Orbit","Lumen"]),suf=pick(["Arena","Stadium","Park","Dome","Ground"]);return{brand:b,name:b+' '+suf,perWeek:Math.round(stadiumStats(G.stad).cap*[2.2,1,.5,.3][me().div]*R(.8,1.2)/500)*500,weeks:62*RI(2,4)}}
function takeNaming(o){G.naming=o;G.fans=clamp(G.fans-6,0,100);G.log.unshift(`🏷️ Ground renamed ${o.name}`);toast('Naming rights signed');return true}
function acceptTakeover(v){if(!confirm(`Sell the club for ${fmt(v)}? This ends your tenure.`))return false;const leg=JSON.parse(localStorage.getItem('cc_legacy')||'[]');leg.push({club:me().name,v,s:G.season});localStorage.setItem('cc_legacy',JSON.stringify(leg));localStorage.removeItem(SAVE);G=null;closeModal&&closeModal();render();toast('Club sold for '+fmt(v)+'. Pick your next project!');return true}
function noop(){return true}
function takeLoan(amt){const lim=clubValue()*.5-debt();if(amt>lim)return toast('Bank limit reached ('+fmt(Math.max(0,lim))+')');G.loans=G.loans||[];const rate=.05+debt()/clubValue()*.1;G.loans.push({amt,bal:amt,rate,weekly:amt/124});G.cash+=amt;G.log.unshift(`🏦 Took ${fmt(amt)} loan at ${(rate*100).toFixed(1)}%`);save();render()}
function repayLoans(){let d=debt();if(G.cash<d)return toast('Not enough cash to clear debt');G.cash-=d;G.loans=[];save();render();toast('Debt cleared!')}
// ---------- season end ----------
function seasonEnd(){const sum={season:G.season,div:me().div,pos:position()},moves=[];const tabs=[0,1,2,3].map(d=>divTable(d).map(t=>t.i));
 const up=[null,[],[],[]],down=[[],[],[],null];
 for(let d=1;d<4;d++){up[d]=tabs[d].slice(0,POSPOTS[d]);if(G.po[d]&&G.po[d].win!=null)up[d].push(G.po[d].win)}
 for(let d=0;d<3;d++)down[d]=tabs[d].slice(-RELEG[d]);
 for(let d=0;d<3;d++){down[d].forEach(id=>G.teams[id].div=d+1);up[d+1].forEach(id=>G.teams[id].div=d)}
 const t=table(sum.div)[sum.pos-1];Object.assign(sum,{pts:t.pts,w:t.w,d:t.d,l:t.l,gf:t.gf,ga:t.ga,promoted:sum.div>0&&up[sum.div].includes(G.club),relegated:sum.div<3&&down[sum.div].includes(G.club),champ:sum.pos===1});
 const prize=Math.round([[25e6,1.2e6],[6e6,.3e6],[2e6,.1e6],[8e5,4e4]][sum.div].reduce((a,b,i)=>i?a-b*(sum.pos-1):a,0));G.cash+=Math.max(prize,1e5);
 // objectives
 let ob=0;ob+=sum.pos<=G.obj.pos||sum.promoted?10:-12;ob+=Math.max(...G.cupRun)>=G.obj.cup?4:-3;ob+=G.cash>=0?3:-8;G.board=clamp(G.board+ob,0,100);
 const msg=`Finished ${sum.pos}${ord(sum.pos)} in the ${DIVS[sum.div]} (${t.pts} pts). Prize money ${fmt(prize)}. ${sum.promoted?'🎉 PROMOTED!':sum.relegated?'😞 Relegated.':''} Objectives ${ob>0?'met':'missed'}: board ${ob>0?'+':''}${ob}.`;
 inbox('Board',`Season ${G.season} review`,msg);G.log.unshift('🏁 '+msg);
 G.teams.forEach(x=>{});[0,1,2].forEach(d=>{up[d+1].forEach(id=>G.log.unshift(`⬆️ ${G.teams[id].name} promoted to ${DIVS[d]}`));down[d].forEach(id=>G.log.unshift(`⬇️ ${G.teams[id].name} relegated to ${DIVS[d+1]}`))});
 const champs=[0,1,2,3].map(d=>tabs[d][0]);G.honours=G.honours||[];G.honours.push({s:G.season,champs,cups:G.cups.map(c=>c.win),po:[1,2,3].map(d=>G.po[d]&&G.po[d].win)});
 if(window.onSeasonEnd)onSeasonEnd(sum);
 rollover();G.season++;buildSeason();updateRatings();toast(`Season ${G.season} begins!`)}
function rollover(){const yi=[];
 for(const id in G.pl){const p=G.pl[id];p.car.ap+=p.st.ap;p.car.g+=p.st.g;p.st=newStats();p.age++;p.con--;p.ban=0;p.yc=0;p.mor=Math.round((p.mor+70)/2);
  if(p.loan!=null){p.club=p.loan;p.loan=null}
  if(p.age>=34&&Math.random()<(p.age-33)*.28||p.age>=39){if(p.club===G.club)G.log.unshift(`👋 ${p.n} retires`);delete G.pl[id];continue}
  if(p.con<=0&&p.club>=0){if(p.club===G.club){p.club=-1;G.log.unshift(`📤 ${p.n} leaves on a free`)}else if(Math.random()<.78){p.con=RI(1,4);p.wage=Math.round(wageFor(ovr(p))*R(.85,1.15)/100)*100}else p.club=-1}
  if(p.club===-1&&p.age>=33&&Math.random()<.5)delete G.pl[id]}
 dirty();
 G.teams.forEach(t=>{const user=t.id===G.club,n=user?2+Math.floor(G.fac.youth.lvl/3):RI(2,3);const yq=user?(staffOf('manager')[0]?.attrs.Youth||50):50;
  for(let k=0;k<n;k++){const p=mkPlayer(pick(['GK','DF','DF','MF','MF','FW','FW']),clamp(t.rep-16+R(-5,4)+(user?G.fac.youth.lvl:0),28,75),RI(16,17),t.id);p.pot=clamp(Math.round(ovr(p)+RI(8,24)+(user?G.fac.youth.lvl*1.5+(yq-50)/8:0)),ovr(p),97);p.con=3;p.wage=Math.round(wageFor(ovr(p))*.6/100)*100;if(user)yi.push(p)}
  let s=sq(t.id);if(!user)while(s.length>26){const w=s.slice().sort((a,b)=>ovr(a)-ovr(b)+(b.age<21?-20:0))[0];movePlayer(w,-1);s=sq(t.id)}
  if(!user)while(sq(t.id).length<19)mkPlayer(pick(['DF','MF','FW']),t.rep-4+R(-4,3),RI(20,30),t.id)});
 const fa=sq(-1);if(fa.length>140)fa.sort((a,b)=>ovr(a)-ovr(b)).slice(0,fa.length-140).forEach(p=>delete G.pl[p.id]);dirty();
 if(yi.length)inbox('Academy','Youth intake arrives',`${yi.length} youngsters join: `+yi.map(p=>`${p.n} (${p.pos}, OVR ${ovr(p)}, POT ${p.pot})`).join('; ')+'.',[['View squad','go','squad']]);
 G.autoXI=true;G.xi=null;G.neg={};ensureXI()}
// ---------- migrate / new game ----------
function migrateV1(){const old=G;const keep={club:old.club,cash:old.cash,ticket:old.ticket,staff:old.staff,fac:old.fac,stad:old.stad,board:old.board,fans:old.fans,ledger:[],market:old.market,log:old.log||[],season:old.season||1,diff:old.diff,hist:old.hist,ach:old.ach,rec:old.rec,rival:old.rival,weather:old.weather,muted:old.muted};
 G=keep;genWorld();G.spons={shirt:old.sponsor&&old.sponsor.weeks>0?{...old.sponsor,weeks:Math.round(old.sponsor.weeks*62/38)}:null,sleeve:null,kit:null,training:null};G.merch=1;G.loans=[];G.v=2;buildSeason();G.log.unshift('🆕 Your save was upgraded: 92-club pyramid, real players, cups and transfers! A fresh season starts.');
 inbox('Assistant','Welcome to the new era','The game world has expanded: four divisions, two cups, a full player database, transfers and live matches. Your stadium, staff, facilities and finances carried over.')}
newGame=function(i){const c=ALL92[i];G={v:2,club:i,season:1,cash:c.price*.35+5e6,ticket:Math.round([45,28,20,15][c.div]+(c.rep-60)*.6),staff:[],fac:{},board:65,fans:65,ledger:[],log:["Welcome, Chairman. You now own "+c.name+"."],spons:{},merch:1,loans:[]};
 const scale=clamp((c.rep-44)/40,0,1);G.staff=[staffMember('manager',45+scale*35),staffMember('coach',40+scale*30),staffMember('scout',40+scale*25),staffMember('physio',40+scale*25)];
 G.fac={training:{lvl:1+Math.round(scale*2),build:0},youth:{lvl:1+Math.round(scale*1.5),build:0},medical:{lvl:1+Math.round(scale*2),build:0}};G.stad=newStadium(scale);
 genWorld();G.spons={shirt:{name:'Local Motors',perWeek:Math.round(sponsorBase()*.8/1000)*1000,weeks:62},sleeve:null,kit:null,training:null};refreshMarket();buildSeason();save()};
advance=function(){if(!G)return;if(G.day>=G.cal.length){seasonEnd();save();render();return}const f=userFixture();if(f&&window.startMatch){startMatch(f);return}completeDay(null);render()};
function simUserMatch(){const f=userFixture();if(!f)return completeDay(null);const M=quickSim(f);completeDay(M)}
