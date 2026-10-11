'use strict';
/* ===== Live 2D match view ===== */
let MV=null;
const short=n=>n.length>13?n.split(' ').map((w,i)=>i?w.slice(0,3):w).join(' ').slice(0,13):n;
const pname=id=>{const p=G.pl[id];return p?p.n[0]+'. '+p.n.split(' ').slice(-1)[0]:'?'};
function colDist(a,b){const x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);return Math.abs((x>>16)-(y>>16))+Math.abs((x>>8&255)-(y>>8&255))+Math.abs((x&255)-(y&255))}
function startMatch(f,mode){mode=mode||G.mm||'hl';const M=newMatch(f,true);
 const hc=G.teams[f.h].col;let ac=G.teams[f.a].col;if(colDist(hc,ac)<160)ac=colDist(hc,'#f8fafc')>200?'#f8fafc':'#111827';
 MV={M,f,mode,speed:1,paused:false,acc:0,last:0,com:[],cols:[hc,ac],pos:{},ball:{x:.5,y:.5,tx:.5,ty:.5},passQ:[],flash:null,tSel:null,raf:0};
 const el=document.createElement('div');el.id='matchov';el.innerHTML=`<div class="mv-top"><div class="mv-team"><i style="background:${hc}"></i>${short(G.teams[f.h].name)}</div><div class="mv-score"><b id="mvS">0 - 0</b><small id="mvC">0'</small></div><div class="mv-team r">${short(G.teams[f.a].name)}<i style="background:${ac}"></i></div></div>
 <div class="mv-comp">${compName(f)}</div><div id="mvWrap"><canvas id="mvc"></canvas><div id="mvFlash"></div></div>
 <div id="mvCom"></div>
 <div class="mv-ctl"><button class="btn sec" id="mvP" onclick="mvPause()">⏸</button><div class="seg" id="mvSp">${[1,2,4].map(s=>`<button class="${s===1?'on':''}" onclick="mvSpeed(${s})">${s}x</button>`).join('')}</div>
 <button class="btn sec" id="mvM" onclick="mvMode()">${mode==='hl'?'Highlights':'Full'}</button><button class="btn sec" onclick="mvTactics()">Tactics</button><button class="btn sec" onclick="mvSkip()">Skip ⏭</button></div>
 <div id="mvSheet"></div>`;
 document.body.appendChild(el);document.body.style.overflow='hidden';mvLayout();mvCom(`Kick-off! ${G.teams[f.h].name} v ${G.teams[f.a].name}.`,'k');MV.last=performance.now();MV.raf=requestAnimationFrame(mvLoop)}
function mvLayout(){const c=$('#mvc'),w=Math.min(innerWidth-16,460),h=Math.min(innerHeight-300,w*1.45);const d=devicePixelRatio||1;c.width=w*d;c.height=h*d;c.style.width=w+'px';c.style.height=h+'px';MV.W=w;MV.H=h;MV.ctx=c.getContext('2d');MV.ctx.setTransform(d,0,0,d,0,0)}
function msPerMin(){if(MV.mode==='hl'){const nxt=MV.hot?1400:45;return nxt/MV.speed}return 900/MV.speed}
function mvLoop(t){if(!MV)return;const dt=Math.min(100,t-MV.last);MV.last=t;
 if(!MV.paused&&!MV.M.done){MV.acc+=dt;if(MV.acc>=msPerMin()){MV.acc=0;mvTick()}}
 mvDraw(t);MV.raf=requestAnimationFrame(mvLoop)}
function mvTick(){const M=MV.M,ev=step(M);MV.hot=false;const s=M.ball.s;
 // passing sequence toward zone
 const T=M.t[s],ids=T.xi.filter(x=>x!=null);MV.passQ=[];for(let k=0;k<3;k++){const id=pick(ids);MV.passQ.push(id)}
 MV.attS=s;MV.zone=M.ball.z;
 for(const e of ev){const tn=G.teams[M.t[e.s??0].c]?.name;switch(e.t){
  case'goal':MV.hot=true;MV.passQ=[];MV.goalAt={s:e.s};mvCom(`⚽ GOAL! ${pname(e.p)} scores for ${tn}!`+(e.as?` Assist: ${pname(e.as)}.`:''),'g');mvFlash('GOAL!',MV.cols[e.s]);sfxSafe(M.t[e.s].user?'win':'loss');break;
  case'save':MV.hot=true;MV.shotAt={s:e.s};mvCom(`🧤 ${pname(e.p)} shoots… saved by ${pname(e.gk)}!`,'c');break;
  case'miss':MV.hot=true;MV.shotAt={s:e.s};mvCom(`${pname(e.p)} fires wide for ${tn}.`,'c');break;
  case'corner':MV.hot=true;MV.shotAt={s:e.s};mvCom(`${pname(e.p)}'s effort is deflected for a corner.`,'c');break;
  case'attack':if(MV.mode==='full'||Math.random()<.4)mvCom(`${tn} build down the ${pick(['left','right','middle'])} through ${pname(e.p)}.`,'n');break;
  case'yellow':MV.hot=true;mvCom(`🟨 Booking for ${pname(e.p)} (${tn}).`,'y');break;
  case'red':MV.hot=true;mvCom(`🟥 ${e.second?'Second yellow! ':''}${pname(e.p)} is sent off!`,'r');mvFlash('RED CARD','#dc2626');break;
  case'inj':MV.hot=true;mvCom(`🚑 ${pname(e.p)} is injured.`,'r');if(M.t[e.s].user&&!M.ev.some(x=>x.t==='sub'&&x.o===e.p&&x.m===e.m))mvCom('⚠️ No subs left — down to 10.','r');break;
  case'sub':mvCom(`🔁 ${tn}: ${pname(e.p)} on for ${pname(e.o)}.`,'n');break;
  case'ht':mvCom(`Half-time: ${M.t[0].g}-${M.t[1].g}.`,'k');MV.hot=true;break;
  case'ft':mvCom(`Full-time: ${M.t[0].g}-${M.t[1].g}.`,'k');setTimeout(mvEnd,900);break}}
 $('#mvS').textContent=`${M.t[0].g} - ${M.t[1].g}`;$('#mvC').textContent=Math.min(M.min,90)+(M.min>90?'+'+(M.min-90):'')+"'"}
function mvCom(txt,c){MV.com.unshift({txt,c,m:MV.M.min});MV.com.length=30;const el=$('#mvCom');if(el)el.innerHTML=MV.com.slice(0,5).map(x=>`<div class="mc-${x.c}"><b>${x.m}'</b> ${x.txt}</div>`).join('')}
function mvFlash(t,c){const f=$('#mvFlash');f.textContent=t;f.style.color=c;f.className='on';setTimeout(()=>f.className='',1500)}
function tgtPos(s,i,fm,poss){let[x,y]=slotXY(fm,i);const z=MV.zone||.5;const push=poss?(z-.4)*.45:-(z-.4)*.25;if(FORMS[fm][i]!=='GK')y=clamp(y+push+.08*(poss?1:-.2),.04,.92);
 const bx=s===0?MV.ball.x:1-MV.ball.x;x+=(bx-x)*.18;return s===0?[x,1-y]:[1-x,y]}
function mvDraw(t){const{ctx:c,W,H,M}=MV;
 const st=['#2f8f46','#2a8040'];for(let i=0;i<10;i++){c.fillStyle=st[i%2];c.fillRect(0,i*H/10,W,H/10+1)}
 c.strokeStyle='#ffffffcc';c.lineWidth=1.5;const m=8;c.strokeRect(m,m,W-2*m,H-2*m);c.beginPath();c.moveTo(m,H/2);c.lineTo(W-m,H/2);c.stroke();c.beginPath();c.arc(W/2,H/2,W*.13,0,7);c.stroke();
 const bw=W*.55,bh=H*.13,gw=W*.25,gh=H*.05;[0,1].forEach(e=>{const y=e?H-m-bh:m;c.strokeRect((W-bw)/2,y,bw,bh);c.strokeRect((W-gw)/2,e?H-m-gh:m,gw,gh);c.fillStyle='#ffffff';c.fillRect(W/2-W*.07,e?H-m:m-4,W*.14,4)});
 const X=x=>m+x*(W-2*m),Y=y=>m+y*(H-2*m);
 // ball targeting
 const s=MV.attS??0,T=M.t[s];if(MV.passQ.length&&Math.random()<.04){const id=MV.passQ.shift(),i=T.xi.indexOf(id),p=MV.pos[s+':'+id];if(p){MV.ball.tx=p[0];MV.ball.ty=p[1]}}
 if(MV.goalAt){MV.ball.tx=.5;MV.ball.ty=MV.goalAt.s===0?-.01:1.01;if(Math.abs(MV.ball.ty-MV.ball.y)<.03)MV.goalAt=null}
 if(MV.shotAt){MV.ball.tx=.5+R(-.12,.12);MV.ball.ty=MV.shotAt.s===0?.03:.97;MV.shotAt=null}
 MV.ball.x+=(MV.ball.tx-MV.ball.x)*.09;MV.ball.y+=(MV.ball.ty-MV.ball.y)*.09;
 for(const k of[0,1]){const Tm=M.t[k];Tm.xi.forEach((id,i)=>{if(id==null)return;const key=k+':'+id;let[tx,ty]=tgtPos(k,i,Tm.fm,k===s);tx+=Math.sin(t/900+id)*.012;ty+=Math.cos(t/1100+id*1.7)*.012;
  const p=MV.pos[key]||(MV.pos[key]=[tx,ty]);p[0]+=(tx-p[0])*.04;p[1]+=(ty-p[1])*.04;const gk=FORMS[Tm.fm][i]==='GK';
  c.beginPath();c.arc(X(p[0]),Y(p[1]),7.5,0,7);c.fillStyle=gk?(k?'#facc15':'#22d3ee'):MV.cols[k];c.fill();c.lineWidth=1.5;c.strokeStyle=k&&MV.cols[1]==='#f8fafc'?'#111':'#fff';c.stroke();
  c.fillStyle=MV.cols[k]==='#f8fafc'&&!gk?'#111':'#fff';c.font='bold 8px sans-serif';c.textAlign='center';c.fillText(i+1,X(p[0]),Y(p[1])+3)})}
 // chase ball with nearest when idle
 c.beginPath();c.arc(X(MV.ball.x),Y(MV.ball.y)+2,4,0,7);c.fillStyle='#0005';c.fill();c.beginPath();c.arc(X(MV.ball.x),Y(MV.ball.y),3.6,0,7);c.fillStyle='#fff';c.fill();c.strokeStyle='#111';c.lineWidth=1;c.stroke();
 if(MV.paused){c.fillStyle='#0008';c.fillRect(0,0,W,H);c.fillStyle='#fff';c.font='bold 22px sans-serif';c.textAlign='center';c.fillText('PAUSED',W/2,H/2)}}
function mvPause(){MV.paused=!MV.paused;$('#mvP').textContent=MV.paused?'▶':'⏸'}
function mvSpeed(s){MV.speed=s;document.querySelectorAll('#mvSp button').forEach(b=>b.classList.toggle('on',b.textContent===s+'x'))}
function mvMode(){MV.mode=MV.mode==='hl'?'full':'hl';G.mm=MV.mode;$('#mvM').textContent=MV.mode==='hl'?'Highlights':'Full'}
function mvSkip(){const M=MV.M;M.live=false;while(!M.done){const ev=step(M);ev.forEach(e=>{if(e.t==='goal')mvCom(`⚽ ${pname(e.p)} (${G.teams[M.t[e.s].c].name})`,'g');if(e.t==='red')mvCom(`🟥 ${pname(e.p)} sent off`,'r')})}
 $('#mvS').textContent=`${M.t[0].g} - ${M.t[1].g}`;$('#mvC').textContent='FT';mvEnd()}
function uT(){return MV.M.t[MV.M.t[0].user?0:1]}
function mvTactics(){MV.paused=true;$('#mvP').textContent='▶';const T=uT(),k=MV.M.t.indexOf(T),sl=FORMS[T.fm];
 $('#mvSheet').innerHTML=`<div class="sheet"><div class="row"><b>Tactics & Subs</b><button class="btn" onclick="mvCloseT()">Resume ▶</button></div>
 <h3>Formation</h3><div class="seg">${Object.keys(FORMS).map(f=>`<button class="${T.fm===f?'on':''}" onclick="mvForm('${f}')">${f}</button>`).join('')}</div>
 <h3 style="margin-top:10px">Mentality</h3><div class="seg">${['Defensive','Balanced','Attacking'].map((n,i)=>`<button class="${T.ment===i?'on':''}" onclick="mvMent(${i})">${n}</button>`).join('')}</div>
 <h3 style="margin-top:10px">Shouts</h3><div class="legend" style="flex-wrap:wrap">${[['press','Press high'],['wide','Play wide'],['shoot','Shoot on sight'],['calm','Calm it down']].map(([s,n])=>`<div class="chip ${T.sh[s]?'on':''}" onclick="mvShout('${s}')">${n}</div>`).join('')}</div>
 <h3 style="margin-top:10px">Substitutions (${T.subs}/${T.maxSubs}) <span class="mut">tap a player on, then one off</span></h3>
 <div class="grid2"><div>${T.xi.map((id,i)=>id==null?`<div class="sp mut">${sl[i]} — empty</div>`:`<div class="sp ${MV.tSel==='o'+id?'sel':''}" onclick="mvPick('o',${id})"><b>${sl[i]}</b> ${pname(id)} <span class="fitb" style="--f:${T.fit[id]}%"></span>${T.yc[id]?'🟨':''}</div>`).join('')}</div>
 <div>${T.bench.map(id=>`<div class="sp ${MV.tSel==='i'+id?'sel':''}" onclick="mvPick('i',${id})"><b>${G.pl[id].pos}</b> ${pname(id)} ${ovr(G.pl[id])}</div>`).join('')||'<div class="mut">No bench</div>'}</div></div></div>`}
function mvCloseT(){$('#mvSheet').innerHTML='';MV.paused=false;$('#mvP').textContent='⏸'}
function mvForm(f){changeForm(uT(),f);MV.M.dirty=true;G.fm=f;mvCom(`📋 Switch to ${f}.`,'n');mvTactics()}
function mvMent(i){uT().ment=i;G.ment=i;MV.M.dirty=true;mvCom(`📋 Mentality: ${['Defensive','Balanced','Attacking'][i]}.`,'n');mvTactics()}
function mvShout(s){const T=uT();T.sh[s]=!T.sh[s];G.shouts=G.shouts||{};G.shouts[s]=T.sh[s];MV.M.dirty=true;mvTactics()}
function mvPick(type,id){const T=uT(),k=MV.M.t.indexOf(T);if(!MV.tSel||MV.tSel[0]===type){MV.tSel=type+id;return mvTactics()}
 const a=+MV.tSel.slice(1),o=type==='o'?id:a,i=type==='i'?id:a;MV.tSel=null;const e=doSub(MV.M,k,o,i);if(e){e.m=MV.M.min;MV.M.ev.push(e);mvCom(`🔁 ${pname(i)} replaces ${pname(o)}.`,'n')}else toast('Sub not possible');mvTactics()}
function mvEnd(){if(!MV||MV.ended)return;MV.ended=true;const M=MV.M;finishMatch(M);const[H,A]=M.t,r=M.res;
 const sc=k=>M.ev.filter(e=>e.t==='goal'&&e.s===k).map(e=>`${pname(e.p)} ${e.m}'`).join(', ')||'—';
 const motm=Object.entries(M.rt).sort((a,b)=>b[1]-a[1])[0];const tot=H.poss+A.poss||1;
 const stat=(n,a,b)=>`<div class="row"><b>${a}</b><span class="mut">${n}</span><b>${b}</b></div>`;
 const rts=k=>M.t[k].played.map(id=>[id,M.rt[id]]).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,r])=>`<div class="row"><span>${pname(id)}</span><b>${r}</b></div>`).join('');
 $('#mvSheet').innerHTML=`<div class="sheet"><h2 style="text-align:center">Full-time</h2><div style="text-align:center;font-size:30px;font-weight:800">${H.g} - ${A.g}</div>${r.pen?`<div class="mut" style="text-align:center">${G.teams[r.pen.w?r.a:r.h].name} win ${r.pen.hs}-${r.pen.as} on penalties</div>`:''}
 <div class="row"><small>${sc(0)}</small><small style="text-align:right">${sc(1)}</small></div>
 ${stat('Possession',Math.round(H.poss/tot*100)+'%',Math.round(A.poss/tot*100)+'%')}${stat('Shots',H.shots,A.shots)}${stat('On target',H.sot,A.sot)}${stat('Corners',H.corners,A.corners)}${stat('Fouls',H.fouls,A.fouls)}
 ${stat('Cards',Object.keys(H.yc).length+'🟨 '+H.red.length+'🟥',Object.keys(A.yc).length+'🟨 '+A.red.length+'🟥')}
 <div class="mut" style="text-align:center;margin:6px">⭐ Player of the match: <b>${motm?G.pl[motm[0]].n+' ('+motm[1]+')':'-'}</b></div>
 <div class="grid2"><div>${rts(0)}</div><div>${rts(1)}</div></div><button class="btn big" onclick="mvClose()">Continue ▶</button></div>`}
function mvClose(){const M=MV.M;cancelAnimationFrame(MV.raf);MV=null;$('#matchov').remove();document.body.style.overflow='';completeDay(M);render()}
window.addEventListener('resize',()=>{if(MV)mvLayout()});
