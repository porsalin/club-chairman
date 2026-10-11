'use strict';
// ===== Club Chairman · Stadium Designer UI (replaces the Stadium tab) =====
(function(){
const SD=window.SD,$=s=>document.querySelector(s),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const U=window.SDU={cat:'templates',sel:'W',draft:null,undo:[],redo:[],mode:localStorage.getItem('cc_view')||'3d',night:false,crowd:false,lastPush:0,lastPath:'',full:false,planCam:{z:1,x:0,y:0}};
const old2D=window.vStadium;U.old2D=old2D;
const CATS=[['templates','📐','Templates'],['layout','🏟️','Layout'],['stands','🪑','Stands'],['corners','◢','Corners'],['roof','⛱️','Roof & lights'],['exterior','🧱','Exterior'],['site','🗺️','Site'],['pitch','🌱','Pitch'],['interior','🚻','Interior'],['brand','📺','Screens & brand'],['works','🚧','Works'],['designs','💾','Designs']];
const SWATCH=['club','alt','#c0392b','#7a1f24','#1d4ed8','#60a5fa','#047857','#facc15','#f97316','#7c3aed','#111827','#6b7280','#f8fafc'];
const club=()=>G.teams[G.club].col,cname=()=>G.teams[G.club].name;
const committed=()=>G.stad.design;
function closedFor(){return SD.closed()}
function getD(){if(!U.draft)U.draft=SD.clone(committed());return U.draft}
// ---- state changes ----
function snap(path){const now=Date.now();if(path!==U.lastPath||now-U.lastPush>900){U.undo.push(JSON.stringify(getD()));if(U.undo.length>60)U.undo.shift();U.redo=[]}U.lastPush=now;U.lastPath=path}
function setPath(o,path,v){const ks=path.split('.');let x=o;for(let i=0;i<ks.length-1;i++)x=x[ks[i]];x[ks[ks.length-1]]=v}
function getPath(o,path){return path.split('.').reduce((x,k)=>x==null?x:x[k],o)}
U.set=(path,v,live)=>{snap(path);const d=getD();setPath(d,path,v);fixups(d,path);changed(live)};
U.mut=(fn,label)=>{snap(label||'mut'+Math.random());const d=getD();fn(d);fixups(d,'');changed()};
function fixups(d,path){for(const k of SD.SIDES){const st=d.stands[k];st.boxes=Math.min(st.boxes,Math.max(0,st.tiers.length-1))}
 if(path.endsWith('.dugout')&&getPath(d,path)){SD.SIDES.forEach(k=>{if(!path.startsWith('stands.'+k))d.stands[k].dugout=0})}
 if(/layout|pitch\.(gap|size|track)|stands\.\w\.(tiers|len|curve|setback|overhang)|shape|corners/.test(path)||!path)SD.validateSite(d)}
let rT=0;function changed(live){clearTimeout(rT);rT=setTimeout(()=>{draw3D();if(!live)panel();stats();bar()},live?140:10);if(live){stats();bar()}}
U.undoF=()=>{if(!U.undo.length)return;U.redo.push(JSON.stringify(getD()));U.draft=JSON.parse(U.undo.pop());U.lastPath='';refreshAll()};
U.redoF=()=>{if(!U.redo.length)return;U.undo.push(JSON.stringify(getD()));U.draft=JSON.parse(U.redo.pop());U.lastPath='';refreshAll()};
U.discard=()=>{U.draft=null;U.undo=[];U.redo=[];refreshAll()};
function refreshAll(){draw3D();panel();stats();bar()}
// ---- commit / economics ----
function plan(){const d=getD(),df=SD.diff(committed(),d);return df}
U.build=()=>{const d=getD(),df=plan();if(!df.items.length)return toast('No changes to build');if(G.cash<df.cost)return toast('Not enough funds: need '+fmt(df.cost));
 if(!confirm(`Start works?\n\nCost: ${fmt(df.cost)}\nLongest phase: ${df.wk} weeks\n${df.items.length} work items`))return;
 G.cash-=df.cost;const S=G.stad;const prevD=SD.clone(SD.effective(S));
 // phasing: rebuild at most two stands at a time, corners last; roofs/seats follow their stand
 const structs=df.items.filter(it=>it.struct&&!it.demo&&it.key.startsWith('stand:')).sort((a,b)=>(a.key.length-b.key.length)||(b.wk-a.wk));const wait={},sw={};let t0=0,ph=[];
 structs.forEach((it,i)=>{ph.push(it);if(ph.length===2||i===structs.length-1||structs[i+1].key.length!==it.key.length){ph.forEach(x=>{wait[x.key.slice(6)]=t0;sw[x.key.slice(6)]=x.wk});t0+=Math.max(...ph.map(x=>x.wk));ph=[]}});
 const nPh=new Set(Object.values(wait)).size;
 df.items.forEach(it=>{if(it.demo&&!it.key.startsWith('stand:')&&!it.key.startsWith('site:'))return;S.jobs=S.jobs.filter(j=>j.key!==it.key);const k=it.key.split(':')[1];
  if(it.demo){if(it.key.startsWith('stand:'))S.jobs.push({key:'demo:'+k,label:it.label,left:it.wk,total:it.wk,phase:'Demolition'});return}
  const isS=it.struct&&it.key.startsWith('stand:');const follow=(it.key.startsWith('roof:')||it.key.startsWith('seat:')||it.key.startsWith('fit:'))&&sw[k]!=null;const w=isS||follow?wait[k]||0:0,pre=follow?sw[k]:0;
  const phase=isS?'Phase '+([...new Set(Object.values(wait))].sort((a,b)=>a-b).indexOf(w)+1)+' of '+nPh+' · structure':follow?'Follows the '+SD.NAMES[k]+' structure':'Fit-out';
  S.jobs.push({key:it.key,label:it.label,left:it.wk+pre,total:it.wk+pre,wait:w,phase})});
 if(S.jobs.some(j=>j.wait>0))S.prev=prevD;
 S.design=SD.clone(d);U.draft=null;U.undo=[];U.redo=[];SD.syncGlobal();G.log.unshift('🏗️ Stadium works started: '+fmt(df.cost));save();if(window.sfx&&sfx.build)sfx.build();toast('Works begin · '+df.wk+' weeks');render()};
U.relocate=()=>{const d=getD(),v=SD.value(d),cost=Math.round(v*0.85+25e6),wk=Math.max(40,Math.round(SD.stats(d).raw/900));if(G.stad.relocate)return toast('Relocation already under way');
 if(G.cash<cost)return toast('Need '+fmt(cost)+' to build on a new site');if(!confirm(`Build the current design on a new site?\n\nLand + build: ${fmt(cost)}\n${wk} weeks. You keep playing at the old ground until it opens, then the old site is sold.`))return;
 G.cash-=cost;G.stad.relocate={design:SD.clone(d),left:wk,total:wk,sale:Math.round(10e6+SD.stats(committed()).raw*400)};U.draft=null;save();toast('New stadium project launched');render()};
// ---- stats ----
function statsOf(d){return SD.stats(d,closedFor())}
function stats(){const el=$('#sd-stats');if(!el)return;const dirty=JSON.stringify(getD())!==JSON.stringify(committed());const a=SD.live(G.stad),b=dirty?statsOf(getD()):a;
 const it=(lbl,k,f=x=>x.toLocaleString(),inv)=>{const dv=b[k]-a[k];return`<div class="sd-st"><small>${lbl}</small><b>${f(b[k])}</b>${dirty&&Math.round(dv)?`<i class="${(dv>0)!==!!inv?'up':'dn'}">${dv>0?'+':''}${k==='revenue'||k==='maint'?fmt(dv):Math.round(dv).toLocaleString()}</i>`:''}</div>`};
 el.innerHTML=it('Capacity','cap')+it('Atmosphere','atm')+it('Comfort','comfort')+it('Safety','safety')+it('Prestige','prestige')+it('Rev / match','revenue',fmt)+it('Upkeep / wk','maint',fmt,1)+
 `<div class="sd-st wide"><small>Safety certificate</small><b style="font-size:13px">${b.cap<b.raw?`⚠️ Capped ${b.cap.toLocaleString()} of ${b.raw.toLocaleString()} (${b.limit==='exits'?'add exits: turnstiles, stair cores, plazas, stewards':'add toilets'})`:`✅ Full ${b.raw.toLocaleString()} licensed`}</b></div>`}
function bar(){const el=$('#sd-bar');if(!el)return;const df=plan();const has=df.items.length>0;
 el.innerHTML=`<button class="btn sec" ${U.undo.length?'':'disabled'} onclick="SDU.undoF()">↶</button><button class="btn sec" ${U.redo.length?'':'disabled'} onclick="SDU.redoF()">↷</button>
 <div class="sd-cost">${has?`<b>${df.cost<0?'Refund '+fmt(-df.cost):fmt(df.cost)}</b><small>${df.wk} wks · ${df.items.length} items</small>`:'<small>Preview mode<br>no changes</small>'}</div>
 ${has?`<button class="btn sec" onclick="SDU.discard()">✕</button>`:''}<button class="btn" ${has?'':'disabled'} onclick="SDU.build()">Build</button>`}
// ---- 3D / 2D stage ----
function dispD(){const d=getD();return JSON.stringify(d)===JSON.stringify(committed())?SD.effective(G.stad):d}
function draw3D(){const d=dispD();if(U.mode==='3d'&&window.SD3&&U.has3d){SD3.build(d,{club:club(),clubName:cname(),oppName:G.teams[G.rival!=null?G.rival:(G.club+1)%G.teams.length].name,signName:SD.signName(),crowd:U.crowd,fill:Math.min(1,0.55+G.fans/220),closed:closedFor()});if(U.pendingView){SD3.view(U.pendingView);U.pendingView=null}}else drawPlan()}
function mountStage(){const host=$('#sd-canvas');if(!host)return;if(U.mode==='3d'&&window.SD3){U.has3d=SD3.mount(host);if(!U.has3d){U.mode='2d';toast('3D not available, using 2D plan')}else{SD3.onPick(p=>{if(p.site){U.cat='site';U.siteSel=p.site;panel();return}if(p.key&&SD.SIDES.includes(p.key)){U.sel=p.key;if(U.cat!=='roof'&&U.cat!=='stands')U.cat='stands';SD3.highlight(p.key);cats();panel()}else if(p.key){U.cat='corners';cats();panel()}});
  draw3D();if(U.night!==SD3.isNight())SD3.setNight(U.night);if(!U.viewed){SD3.view('hero',true);U.viewed=1}return}}
 if(U.mode==='3d'&&!window.SD3){host.innerHTML='<div class="sd-load">Loading 3D engine…</div>';window.addEventListener('sd3ready',()=>{if(tab==='stadium')mountStage()},{once:true});setTimeout(()=>{if(!window.SD3&&tab==='stadium'){U.mode='2d';mountStage()}},6000);return}
 host.innerHTML='<canvas id="sd-plan"></canvas>';bindPlan();drawPlan()}
// 2D plan fallback, drawn from the same geometry
function drawPlan(){const cv=$('#sd-plan');if(!cv)return;const d=dispD(),geo=SD.geometry(d),I=geo.I,dpr=window.devicePixelRatio||1,W=cv.parentElement.clientWidth,H=cv.parentElement.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.height=H+'px';
 const g=cv.getContext('2d'),cam=U.planCam;const sc=Math.min(W,H)/(geo.ext*2+30)*cam.z;g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#4d6b3c';g.fillRect(0,0,W,H);g.translate(W/2+cam.x,H/2+cam.y);g.scale(sc,sc);
 const closed=closedFor();g.fillStyle='#9a9993';g.fillRect(-geo.ext-20,-geo.ext*0.86-20,geo.ext*2+40,geo.ext*1.72+40);
 d.site.forEach(it=>{const S=SD.SITE[it.t];if(!S)return;const w=(it.rot?S.h:S.w)*SD.CELL,h=(it.rot?S.w:S.h)*SD.CELL;g.fillStyle=closed.has('site:'+it.id)?'#777':'#cbd5e1';g.fillRect(it.x*SD.CELL+1,it.z*SD.CELL+1,w-2,h-2);g.font=`${Math.min(w,h)*0.5}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(S.i,it.x*SD.CELL+w/2,it.z*SD.CELL+h/2)});
 if(I.track){g.fillStyle='#b5452f';g.fillRect(-I.hx-I.g+1,-I.hz-I.g+1,(I.hx+I.g-1)*2,(I.hz+I.g-1)*2)}
 const P=SD.PSIZE[d.pitch.size];g.fillStyle='#3f8a3a';g.fillRect(-P.L/2-3,-P.W/2-3,P.L+6,P.W+6);for(let i=0;i<10;i++){g.fillStyle=i%2?'#469a40':'#3f8a3a';g.fillRect(-P.L/2+i*P.L/10,-P.W/2,P.L/10,P.W)}g.strokeStyle='#fff';g.lineWidth=0.4;g.strokeRect(-P.L/2,-P.W/2,P.L,P.W);g.beginPath();g.moveTo(0,-P.W/2);g.lineTo(0,P.W/2);g.stroke();g.beginPath();g.arc(0,0,9.15,0,7);g.stroke();
 const col=st=>st.seatColor==='club'?club():st.seatColor==='alt'?'#f5f5f5':st.seatColor;
 geo.segs.forEach(s=>{const uc=closed.has('stand:'+s.key);const band=(d0,d1,fill)=>{g.beginPath();s.pts.forEach((p,i)=>{const x=p.x+p.nx*d0,z=p.z+p.nz*d0;i?g.lineTo(x,z):g.moveTo(x,z)});for(let i=s.pts.length-1;i>=0;i--){const p=s.pts[i];g.lineTo(p.x+p.nx*d1,p.z+p.nz*d1)}g.closePath();g.fillStyle=fill;g.fill()};
  band(0,s.sec.dMax+0.6,'#8d8a85');s.sec.tiers.forEach((t,i)=>band(t.d0,t.dEnd+0.3,uc?'#a8a29e':i%2?shade(col(s.st),-25):col(s.st)));
  if(SD.ROOF[s.st.roof].cover&&!uc){const c=SD.ROOF[s.st.roof].cover;band(c>=1?-2.5:s.sec.dMax*(1-c),s.sec.dMax+1.2,'rgba(230,235,240,.45)')}
  if(uc){g.strokeStyle='#f2b705';g.lineWidth=1;g.setLineDash([3,3]);band(0,s.sec.dMax,'rgba(242,183,5,.25)');g.setLineDash([])}
  if(s.key===U.sel&&U.cat==='stands'){g.strokeStyle='#22d3a6';g.lineWidth=1.2;g.beginPath();s.pts.forEach((p,i)=>{const x=p.x+p.nx*(s.sec.dMax+2),z=p.z+p.nz*(s.sec.dMax+2);i?g.lineTo(x,z):g.moveTo(x,z)});g.stroke()}
  const m=s.pts[s.pts.length>>1];if(s.kind==='stand'){g.fillStyle='#fff';g.font='bold 7px sans-serif';g.textAlign='center';g.fillText(s.key,m.x+m.nx*(s.sec.dMax+7),m.z+m.nz*(s.sec.dMax+7)+2)}});
 U.planGeo={geo,sc,W,H}}
function shade(hex,amt){const c=parseInt(hex.slice(1),16);const f=v=>cl(v+amt,0,255);return`rgb(${f(c>>16)},${f(c>>8&255)},${f(c&255)})`}
function bindPlan(){const cv=$('#sd-plan');if(!cv)return;const pts=new Map();let st=null,pinch=null,moved=false;cv.style.touchAction='none';
 cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;if(pts.size===1)st={x:e.clientX,y:e.clientY,cx:U.planCam.x,cy:U.planCam.y};if(pts.size===2){const[a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:U.planCam.z}}};
 cv.onpointermove=e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===2&&pinch){const[a,b]=[...pts.values()];U.planCam.z=cl(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d,0.6,5);moved=true;drawPlan()}else if(st&&pts.size===1){const dx=e.clientX-st.x,dy=e.clientY-st.y;if(Math.hypot(dx,dy)>6){moved=true;U.planCam.x=st.cx+dx;U.planCam.y=st.cy+dy;drawPlan()}}};
 cv.onpointerup=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!moved&&!pts.size)planTap(e)};cv.onwheel=e=>{e.preventDefault();U.planCam.z=cl(U.planCam.z*(e.deltaY<0?1.1:0.9),0.6,5);drawPlan()}}
function planTap(e){const pg=U.planGeo;if(!pg)return;const r=e.target.getBoundingClientRect();const x=(e.clientX-r.left-pg.W/2-U.planCam.x)/pg.sc,z=(e.clientY-r.top-pg.H/2-U.planCam.y)/pg.sc;
 if(U.placing){const S=SD.SITE[U.placing.t],w=U.placing.rot?S.h:S.w,h=U.placing.rot?S.w:S.h;const it={id:'g',t:U.placing.t,x:Math.round(x/SD.CELL-w/2),z:Math.round(z/SD.CELL-h/2),rot:U.placing.rot};placeCb(it,SD.canPlace(getD(),it,U.placing.moveId));return}
 let best=null,bd=1e9;pg.geo.segs.forEach(s=>s.pts.forEach(p=>{const dd=Math.hypot(p.x+p.nx*s.sec.dMax/2-x,p.z+p.nz*s.sec.dMax/2-z);if(dd<bd){bd=dd;best=s}}));if(best&&bd<30&&SD.SIDES.includes(best.key)){U.sel=best.key;U.cat='stands';cats();panel();drawPlan()}}
// ---- toolbar ----
U.view=v=>{if(window.SD3&&U.mode==='3d')SD3.view(v);$('#sd-views')&&$('#sd-views').classList.remove('on')};
U.toggleNight=()=>{U.night=!U.night;if(window.SD3&&U.mode==='3d')SD3.setNight(U.night);toolbar()};
U.toggleCrowd=()=>{U.crowd=!U.crowd;draw3D();toolbar();toast(U.crowd?'Match day: crowd in':'Empty stadium')};
U.toggleMode=()=>{U.mode=U.mode==='3d'?'2d':'3d';localStorage.setItem('cc_view',U.mode);vStadium()};
U.toggleTour=()=>{if(!window.SD3)return;SD3.tour(!SD3.touring());toolbar()};
U.toggleFull=()=>{U.full=!U.full;document.body.classList.toggle('sd-full',U.full);toolbar();setTimeout(()=>{if(U.mode==='2d')drawPlan()},50)};
U.photo=()=>{if(U.mode!=='3d'||!window.SD3)return toast('Photo mode needs the 3D view');const url=SD3.photo(2);const ov=document.createElement('div');ov.className='sd-photo';
 ov.innerHTML=`<img src="${url}"><div class="sd-ph-bar"><a class="btn" href="${url}" download="${cname().replace(/\W+/g,'-')}-stadium.jpg">Save photo</a><button class="btn sec" onclick="this.closest('.sd-photo').remove()">Close</button></div><div class="mut" style="text-align:center">On iPhone, press and hold the photo to save it to Photos.</div>`;document.body.appendChild(ov)};
U.setQ=q=>{if(window.SD3)SD3.setQuality(q);toolbar()};
function toolbar(){const el=$('#sd-tools');if(!el)return;const is3=U.mode==='3d';
 el.innerHTML=`${is3?`<button onclick="document.getElementById('sd-views').classList.toggle('on')">🎥</button><button class="${U.night?'on':''}" onclick="SDU.toggleNight()">${U.night?'🌙':'☀️'}</button><button class="${U.crowd?'on':''}" onclick="SDU.toggleCrowd()">👥</button><button class="${window.SD3&&SD3.touring&&SD3.touring()?'on':''}" onclick="SDU.toggleTour()">🔄</button><button onclick="SDU.photo()">📷</button>`:''}<button onclick="SDU.toggleMode()">${is3?'2D':'3D'}</button><button onclick="SDU.toggleFull()">${U.full?'✕':'⛶'}</button>`;
 const v=$('#sd-views');if(v)v.innerHTML=[['hero','Hero'],['broadcast','Broadcast'],['aerial','Aerial'],['blimp','Blimp'],['pitch','Pitch level'],['goal','Behind goal'],['W','From Main'],['E','From East'],['N','From North'],['S','From South']].map(([k,n])=>`<button onclick="SDU.view('${k}')">${n}</button>`).join('')+
  (is3&&window.SD3?`<div class="sd-q">Quality ${['auto','high','low'].map(q=>`<button class="${SD3.quality()===q?'on':''}" onclick="SDU.setQ('${q}')">${q}</button>`).join('')}</div>`:'')}
function cats(){const el=$('#sd-cats');if(!el)return;el.innerHTML=CATS.map(([k,i,n])=>`<button class="${U.cat===k?'on':''}" onclick="SDU.go('${k}')"><span>${i}</span>${n}${k==='works'&&G.stad.jobs.length?` (${G.stad.jobs.length})`:''}</button>`).join('');const on=el.querySelector('.on');if(on&&on.scrollIntoView)on.scrollIntoView({block:'nearest',inline:'center'})}
U.go=k=>{U.cat=k;if(k!=='site')cancelPlace();cats();panel()};
// ---- UI widgets ----
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=v=>esc(JSON.stringify(v));
function seg(path,opts,cur){return`<div class="seg">${opts.map(([v,l])=>`<button class="${cur===v?'on':''}" onclick='SDU.set("${path}",${JSON.stringify(v)})'>${l}</button>`).join('')}</div>`}
function slider(path,lbl,min,max,step,cur,unit=''){const id='s'+path.replace(/\W/g,'');return`<div class="sd-sl"><label>${lbl}<b id="${id}">${cur}${unit}</b></label><input type="range" min="${min}" max="${max}" step="${step}" value="${cur}" oninput="SDU.set('${path}',+this.value,1);document.getElementById('${id}').textContent=this.value+'${unit}'" onchange="SDU.set('${path}',+this.value)"></div>`}
function tog(path,lbl,cur,sub){return`<div class="row"><span>${lbl}${sub?`<br><small class="mut">${sub}</small>`:''}</span><button class="sd-tg ${cur?'on':''}" onclick='SDU.set("${path}",${cur?0:1})'><i></i></button></div>`}
function stepper(path,lbl,cur,min,max,sub,stepN=1){return`<div class="row"><span>${lbl}${sub?`<br><small class="mut">${sub}</small>`:''}</span><span class="sd-stp"><button onclick="SDU.set('${path}',${Math.max(min,cur-stepN)})">−</button><b>${cur}</b><button onclick="SDU.set('${path}',${Math.min(max,cur+stepN)})">+</button></span></div>`}
function swatches(path,cur){return`<div class="sd-sw">${SWATCH.map(c=>`<button class="${cur===c?'on':''}" style="background:${c==='club'?club():c==='alt'?'#f5f5f5':c}" onclick="SDU.set('${path}','${c}')">${c==='club'?'C':c==='alt'?'A':''}</button>`).join('')}<input type="color" value="${/^#/.test(cur)?cur:'#ffffff'}" onchange="SDU.set('${path}',this.value)"></div>`}
const card=(t,b)=>`<div class="card sd-card">${t?`<h3>${t}</h3>`:''}${b}</div>`;
function standChips(){return`<div class="sd-chips">${SD.SIDES.map(k=>`<button class="${U.sel===k?'on':''}" onclick="SDU.pick('${k}')">${SD.NAMES[k].replace(' (West)','')}</button>`).join('')}</div>`}
U.pick=k=>{U.sel=k;if(window.SD3&&U.mode==='3d')SD3.highlight(k);panel();if(U.mode==='2d')drawPlan()};
// ---- panels ----
function panel(){const el=$('#sd-panel');if(!el)return;const d=getD();const f=P[U.cat]||P.templates;el.innerHTML=f(d)}
const P={};
P.templates=d=>{const cache=U.tplCache||(U.tplCache={});return card('Start from a template',`<div class="mut" style="margin-bottom:8px">Loads a complete design into the preview. Nothing is built until you press Build. Your site layout is kept.</div><div class="sd-tpl">${Object.entries(SD.TEMPLATES).map(([k,t])=>{const s=cache[k]||(cache[k]=SD.stats(SD.fromTemplate(k)));
 return`<button onclick="SDU.tpl('${k}')"><b>${t.n}</b><small>${t.d}</small><span>${s.raw.toLocaleString()} seats · ${fmt(s.value)}</span></button>`}).join('')}</div>`)};
U.tpl=k=>{U.mut(d=>{const n=SD.fromTemplate(k,d.site);Object.keys(d).forEach(x=>delete d[x]);Object.assign(d,n)},'tpl');U.sel='W';toast(SD.TEMPLATES[k].n+' loaded into preview');U.pendingView='hero'};
P.layout=d=>card('Stadium layout',`<div class="sd-tpl">${Object.entries(SD.LAYOUTS).map(([k,l])=>`<button class="${d.layout===k?'on':''}" onclick="SDU.set('layout','${k}')"><b>${l.i} ${l.n}</b><small>${l.d}</small></button>`).join('')}</div>`)+
 (['bowl','horseshoe'].includes(d.layout)?card('Bowl shape',seg('shape',[['rounded','Rounded rectangle'],['oval','Oval']],d.shape)):'')+
 card('Footprint',slider('pitch.gap','Distance from pitch to stands',3,20,1,d.pitch.gap,'m')+`<h3 style="margin-top:10px">Pitch size</h3>`+seg('pitch.size',Object.entries(SD.PSIZE).map(([k,v])=>[k,v.n]),d.pitch.size)+tog('pitch.track','Athletics track',d.pitch.track,'Adds 11m around the pitch. Hurts atmosphere'));
P.stands=d=>{const k=U.sel,st=d.stands[k],L=d.layout;const open=L==='horseshoe'&&k==='S';const sec=SD.section(st);const geo=SD.geometry(d),sg=geo.segs.find(s=>s.key===k);const cap=sg?SD.segCap(sg):0;
 let h=standChips()+card(SD.NAMES[k],`<div class="row"><span>Capacity</span><b>${cap.toLocaleString()}</b></div><div class="row"><span>Height · depth</span><b>${sec.backH.toFixed(0)}m · ${sec.dMax.toFixed(0)}m</b></div>`+(open?'<div class="warn">A horseshoe leaves this end open. Change the layout to build here.</div>':'')+
  `<div class="row"><span>Tiers</span><span class="sd-stp"><button onclick="SDU.tiers(-1)">−</button><b>${st.tiers.length}</b><button onclick="SDU.tiers(1)">+</button></span></div>`);
 st.tiers.forEach((t,i)=>{h+=card(`Tier ${i+1}`+(i?` · ${i<=st.boxes?'boxes below':'concourse below'}`:''),slider(`stands.${k}.tiers.${i}.rows`,'Rows',4,60,1,t.rows)+slider(`stands.${k}.tiers.${i}.rake`,'Rake (steepness)',18,40,1,t.rake,'°'))});
 if(st.tiers.length)h+=card('Architecture',(st.tiers.length>1?slider(`stands.${k}.overhang`,'Cantilever overhang between tiers',0,8,0.5,st.overhang,'m')+slider(`stands.${k}.setback`,'Tier setback',0,6,0.5,st.setback,'m')+stepper(`stands.${k}.boxes`,'🥂 Executive box levels',st.boxes,0,st.tiers.length-1,'Glazed boxes between tiers'):'<div class="mut">Add a second tier to unlock overhang, setback and box levels.</div>')+
  slider(`stands.${k}.len`,'Stand length',0.6,1.15,0.01,st.len)+tog(`stands.${k}.curve`,'Curved stand',st.curve,'Bows outwards, like a bowl')+`<h3 style="margin-top:10px">Back wall facade</h3>`+seg(`stands.${k}.facade`,[['','Stadium default'],...Object.entries(SD.FACADE).map(([f,v])=>[f,v.n])],st.facade))+
  card('Seating',seg(`stands.${k}.seat`,Object.entries(SD.SEAT).map(([s,v])=>[s,v.n]),st.seat)+`<h3 style="margin-top:10px">Seat colour</h3>`+swatches(`stands.${k}.seatColor`,st.seatColor)+`<h3 style="margin-top:10px">Pattern</h3>`+seg(`stands.${k}.pattern`,Object.entries(SD.PATTERNS),st.pattern)+
  (st.pattern!=='none'?`<h3 style="margin-top:10px">Pattern colour</h3>`+swatches(`stands.${k}.patColor`,st.patColor):'')+(st.pattern==='letters'?`<div class="sd-sl"><label>Text spelt out in seats</label><input class="sd-in" maxlength="14" value="${esc(st.text||cname().split(' ')[0].toUpperCase())}" onchange="SDU.set('stands.${k}.text',this.value)"></div>`:''))+
  card('Features',tog(`stands.${k}.dugout`,'Dugouts & players\' tunnel',st.dugout,'One stand only')+tog(`stands.${k}.directors`,'Directors\' box',st.directors)+tog(`stands.${k}.media`,'Media gantry',st.media,'Hung under the roof')+
  `<div class="row"><span>Family section</span><button class="sd-tg ${d.ops.family===k?'on':''}" onclick="SDU.set('ops.family','${d.ops.family===k?'':k}')"><i></i></button></div><div class="row"><span>Away section</span><button class="sd-tg ${d.ops.away===k?'on':''}" onclick="SDU.set('ops.away','${d.ops.away===k?'':k}')"><i></i></button></div>`)+
  card('Tools',`<div class="sd-btns"><button class="btn sec" onclick="SDU.copyStand('opp')">Copy to opposite</button><button class="btn sec" onclick="SDU.copyStand('all')">Copy to all</button><button class="btn red" onclick="SDU.demolish()">Demolish stand</button></div>`);
 else h+=card('',`<div class="mut">Empty plot. Add a tier to build a stand here.</div>`);return h};
U.tiers=dl=>U.mut(d=>{const st=d.stands[U.sel];if(dl>0&&st.tiers.length<4){const last=st.tiers[st.tiers.length-1];st.tiers.push(SD.tier(last?Math.max(8,last.rows-4):14,last?Math.min(40,last.rake+3):26));if(st.roof==='none'&&st.tiers.length===1)st.roof='partial'}if(dl<0&&st.tiers.length)st.tiers.pop()},'tiers');
U.copyStand=m=>U.mut(d=>{const src=d.stands[U.sel];const opp={W:'E',E:'W',N:'S',S:'N'};const tg=m==='opp'?[opp[U.sel]]:SD.SIDES.filter(x=>x!==U.sel);tg.forEach(k=>{const keep={dugout:d.stands[k].dugout,directors:d.stands[k].directors,media:d.stands[k].media};d.stands[k]=Object.assign(SD.clone(src),keep,{dugout:0,directors:0,media:0},k==='W'?keep:{})})},'copy');
U.demolish=()=>U.mut(d=>{d.stands[U.sel].tiers=[]},'demo');
P.corners=d=>{const I=SD.layoutInfo(d);return card('Corners',`<div class="mut" style="margin-bottom:8px">${['bowl','athletics','horseshoe'].includes(d.layout)?'Bowl layouts always fill their corners (a horseshoe can put a screen or tower at its open end).':d.layout==='classic'?'Classic grounds can leave corners open, fill them, or add features.':'Corners are filled unless you choose a feature.'}</div>`+
 SD.CORNERS.map(c=>`<h3 style="margin-top:10px">${SD.NAMES[c]} <small class="mut">(now: ${SD.CORNER[I.corner(c)].n})</small></h3>`+seg('corners.'+c,Object.entries(SD.CORNER).map(([k,v])=>[k,v.n+(v.c?' '+fmt(v.c):'')]),d.corners[c])).join(''))};
P.roof=d=>{const k=U.sel,st=d.stands[k];return standChips()+card('Roof · '+SD.NAMES[k],`<div class="sd-tpl">${Object.entries(SD.ROOF).map(([r,v])=>`<button class="${st.roof===r?'on':''}" onclick="SDU.set('stands.${k}.roof','${r}')"><b>${v.n}</b><small>${v.cover?Math.round(v.cover*100)+'% cover · acoustics +'+v.ac:'No cover'} · £${v.m2}/m²</small></button>`).join('')}</div>`+
 tog(`stands.${k}.pillars`,'Support pillars',st.pillars,'Cheaper, but they block some views')+`<div class="sd-btns"><button class="btn sec" onclick="SDU.roofAll()">Use this roof on every stand</button></div>`)+
 card('Roof finish',`<h3>Roof colour</h3>`+swatches('roofColor',d.roofColor)+tog('poly','Translucent polycarbonate leading edge',d.poly,'Lets light reach the pitch')+tog('retract','Retractable pitch roof',d.retract?1:0,'Sliding panels over the pitch · '+fmt(60e6))+(d.retract?seg('retract',[[1,'Open'],[2,'Closed']],d.retract):''))+
 card('Floodlights',seg('lights',[['pylons','Corner pylons'],['roof','Roof-edge strip'],['none','None']],d.lights)+`<h3 style="margin-top:10px">Spec</h3>`+seg('lightLevel',[[0,'Basic'],[1,'Standard'],[2,'LED'],[3,'LED show']],d.lightLevel)+`<div class="mut" style="margin-top:6px">Switch to 🌙 night in the viewer to see them.</div>`)};
U.roofAll=()=>U.mut(d=>{const r=d.stands[U.sel].roof;SD.SIDES.forEach(k=>d.stands[k].roof=r)},'roofall');
P.exterior=d=>card('Facade material',`<div class="sd-tpl">${Object.entries(SD.FACADE).map(([f,v])=>`<button class="${d.facade===f?'on':''}" onclick="SDU.set('facade','${f}')"><b>${v.n}</b><small>£${v.m2}/m² · prestige +${v.pr}${f==='etfe'?' · glows in club colours at night':''}</small></button>`).join('')}</div><div class="mut" style="margin-top:6px">You can override the facade per stand in Stands.</div>`)+
 card('Colour theme',seg('extras.theme',Object.entries(SD.THEMES),d.extras.theme)+'<div class="mut" style="margin-top:6px">Seats set to “C” and the LED boards follow the theme.</div>')+card('Around the ground',`<div class="mut">Plazas, turnstiles, stair cores, shops, statues and more are placed on the site grid.</div><button class="btn sec big" onclick="SDU.go('site')">Open site planner →</button>`);
P.site=d=>{const sel=U.siteSel&&d.site.find(i=>i.id===U.siteSel);return(U.placing?card('Placing: '+SD.SITE[U.placing.t].n,`<div class="mut">Tap the ground in the viewer to place it. Green means it fits.</div><div class="sd-btns"><button class="btn sec" onclick="SDU.rot()">⟳ Rotate</button><button class="btn sec" onclick="SDU.autoPl()">Auto-place</button><button class="btn red" onclick="SDU.cancelPlace()">Cancel</button></div>`):'')+
 (sel?card('Selected: '+SD.SITE[sel.t].i+' '+SD.SITE[sel.t].n,`<div class="sd-btns"><button class="btn sec" onclick="SDU.move('${sel.id}')">Move</button><button class="btn red" onclick="SDU.rmSite('${sel.id}')">Remove</button><button class="btn sec" onclick="SDU.siteSel=null;SDU.panel()">Done</button></div>`):'')+
 card('Build around the ground',`<div class="sd-pal">${Object.entries(SD.SITE).map(([k,s])=>`<button class="${U.placing&&U.placing.t===k?'on':''}" onclick="SDU.place('${k}')"><span>${s.i}</span><b>${s.n}</b><small>${fmt(s.c)} · ${s.wk}w</small><small class="mut">${siteFx(s)}</small></button>`).join('')}</div>`)+
 card(`Placed (${d.site.length})`,d.site.map(it=>`<div class="row"><span>${SD.SITE[it.t].i} ${SD.SITE[it.t].n}</span><span><button class="btn sec" onclick="SDU.siteSel='${it.id}';SDU.panel()">Edit</button></span></div>`).join('')||'<div class="mut">Nothing placed yet.</div>')};
function siteFx(s){return[s.exits&&'+'+(s.exits/1000).toFixed(1)+'k exits',s.park&&'parking',s.tr&&'transport',s.shop&&'merch',s.pr&&'prestige',s.inc&&fmt(s.inc)+'/wk',s.atm&&'atmosphere',s.food&&'food',s.museum&&'tours',s.train&&'training'].filter(Boolean).join(' · ')}
function placeCb(it,ok){if(!ok)return toast('Doesn’t fit there');const mv=U.placing&&U.placing.moveId;U.mut(d=>{if(mv){const o=d.site.find(x=>x.id===mv);if(o){o.x=it.x;o.z=it.z;o.rot=it.rot}}else d.site.push({id:SD.uid(),t:it.t,x:it.x,z:it.z,rot:it.rot||0})},'site');if(mv)cancelPlace();else toast(SD.SITE[it.t].n+' placed. Tap again to add another');}
U.place=t=>{U.placing={t,rot:0,cb:placeCb};if(window.SD3&&U.mode==='3d')SD3.placing(U.placing);panel();toast('Tap the ground to place '+SD.SITE[t].n)};
U.rot=()=>{if(U.placing){U.placing.rot=U.placing.rot?0:1;if(window.SD3)SD3.placing(U.placing)}};
U.autoPl=()=>{const t=U.placing.t;U.mut(d=>{if(!SD.autoPlace(d,t,Math.random()*6.28))toast('No space found')},'site');};
function cancelPlace(){U.placing=null;if(window.SD3&&SD3.placing)SD3.placing(null)}U.cancelPlace=()=>{cancelPlace();panel()};
U.move=id=>{const it=getD().site.find(x=>x.id===id);U.placing={t:it.t,rot:it.rot||0,moveId:id,cb:placeCb};if(window.SD3&&U.mode==='3d')SD3.placing(U.placing);U.siteSel=null;panel();toast('Tap the new spot')};
U.rmSite=id=>{U.mut(d=>{d.site=d.site.filter(x=>x.id!==id)},'rm'+id);U.siteSel=null;panel()};U.panel=panel;
P.pitch=d=>{const p=d.pitch;return card('Surface',seg('pitch.surface',Object.entries(SD.SURF).map(([k,v])=>[k,v.n+(v.c?' '+fmt(v.c):'')]),p.surface)+tog('pitch.heating','Undersoil heating',p.heating,'No frozen pitches · '+fmt(2.5e6)))+
 card('Mowing pattern',seg('pitch.pattern',Object.entries(SD.MOW),p.pattern))+card('Dimensions',seg('pitch.size',Object.entries(SD.PSIZE).map(([k,v])=>[k,v.n]),p.size)+slider('pitch.gap','Distance to stands',3,20,1,p.gap,'m')+tog('pitch.track','Pitchside athletics track',p.track))+
 card('Goals & advertising',`<h3>Goal nets</h3>`+seg('pitch.goals',Object.entries(SD.GOALS),p.goals)+`<h3 style="margin-top:10px">Advertising boards</h3>`+seg('pitch.boards',[['static','Static'],['led','LED (animated)']],p.boards))};
P.interior=d=>{const o=d.ops,s=SD.stats(d,closedFor());const opt=(path,cur,lbl)=>`<div class="row"><span>${lbl}</span><select class="sd-in" style="width:auto" onchange="SDU.set('${path}',this.value)">${[['','None'],...SD.SIDES.map(k=>[k,SD.NAMES[k]])].map(([v,n])=>`<option value="${v}" ${cur===v?'selected':''}>${n}</option>`).join('')}</select></div>`;
 return card('Concourses',stepper('ops.kiosks','🌭 Food kiosks',o.kiosks,0,80,'',2)+stepper('ops.toilets','🚻 Toilet blocks',o.toilets,0,240,'Each licenses about 650 fans',5)+stepper('ops.bars','🍺 Bars',o.bars,0,30))+
 card('Hospitality',seg('ops.hosp',[[0,'None'],[1,'Lounge'],[2,'Club level'],[3,'Premium'],[4,'Ultra-lux']],o.hosp)+`<div class="mut" style="margin-top:6px">${s.boxes} executive boxes from your box levels. Luxury raises hospitality income.</div>`)+
 card('Sections',opt('ops.family',o.family,'👨‍👩‍👧 Family section')+opt('ops.away',o.away,'🧳 Away section')+tog('ops.segregation','Segregation fencing',o.segregation)+stepper('ops.accessible','♿ Accessible platforms',o.accessible,0,3))+
 card('Operations',`<h3>Media facilities</h3>`+seg('ops.media',[[0,'Basic'],[1,'Press room'],[2,'Broadcast centre']],o.media)+`<h3 style="margin-top:10px">Medical</h3>`+seg('ops.medical',[[0,'First aid'],[1,'Medical room'],[2,'Medical centre']],o.medical)+`<h3 style="margin-top:10px">Stewarding</h3>`+seg('ops.stewards',[[0,'Minimal'],[1,'Standard'],[2,'Strong'],[3,'Elite']],o.stewards)+tog('ops.police','Police control room',o.police,'Required above 30,000'))+
 card('Safety certificate',`<div class="row"><span>Seats & places</span><b>${s.raw.toLocaleString()}</b></div><div class="row"><span>Exit capacity</span><b class="${s.exits<s.raw?'bad':''}">${s.exits.toLocaleString()}</b></div><div class="row"><span>Toilet capacity</span><b class="${s.loos<s.raw?'bad':''}">${s.loos.toLocaleString()}</b></div><div class="row"><span>Licensed capacity</span><b>${s.cap.toLocaleString()}</b></div>`)};
P.brand=d=>{const e=d.extras;return card('Big screens',seg('extras.screens',[[0,'None'],[1,'1 end'],[2,'Both ends'],[4,'4 screens']],e.screens)+tog('extras.wrap','360° LED ribbon',e.wrap,'Runs around the tier fronts · '+fmt(9e6))+tog('extras.scoreboard','Scoreboard',e.scoreboard)+tog('extras.clock','Stadium clock',e.clock))+
 card('Name & crest',tog('extras.sign','Stadium name sign',e.sign)+`<div class="sd-sl"><label>Stadium name <small class="mut">(blank = club name)</small></label><input class="sd-in" maxlength="28" placeholder="e.g. The Fortress" value="${esc(e.naming)}" onchange="SDU.set('extras.naming',this.value.trim())"></div>`+
 `<div class="mut">${G.naming&&G.naming.name?`Naming rights sold: the sign reads “${esc(G.naming.name)}”.`:'Sell naming rights in the Owner screen. The sign updates automatically.'}</div><h3 style="margin-top:10px">Club crest</h3>`+seg('extras.crest',[['roof','On the roof'],['facade','On the facade'],['none','None']],e.crest))};
P.works=d=>{const S=G.stad;return card('Construction',S.jobs.length?S.jobs.map(j=>`<div class="sd-job"><div class="row"><span>🚧 ${j.label}<br><small class="mut">${j.phase||''}</small></span><b>${j.wait>0?'starts in '+j.wait+' wk':j.left+' wk'}</b></div><div class="bar"><i style="width:${j.wait>0?0:Math.round(100*(1-j.left/Math.max(1,j.total)))}%"></i></div></div>`).join(''):'<div class="mut">No active works. Edit the design and press Build.</div>')+
 (S.relocate?card('New stadium',`<div class="row"><span>🚚 New site build</span><b>${S.relocate.left} wk</b></div><div class="bar"><i style="width:${Math.round(100*(1-S.relocate.left/S.relocate.total))}%"></i></div>`):card('Relocate',`<div class="mut">Build the current preview design on a fresh site. You keep playing at the old ground until it opens, then sell the old site.</div><button class="btn sec big" onclick="SDU.relocate()">Move to a new stadium…</button>`))+
 card('How works happen',`<div class="mut">Structural work closes that stand, so capacity drops until it reopens. Roofs and seating follow in phase 2. Demolition refunds 15% of the value. Removed elements refund their salvage.</div>`)};
P.designs=d=>{const L=G.stad.designs;return card('Saved designs',`<div class="sd-btns"><button class="btn" onclick="SDU.saveD()">Save current preview</button><button class="btn sec" onclick="SDU.photo()">📷 Photo mode</button></div>`+(L.length?L.map((x,i)=>`<div class="row"><span><b>${esc(x.name)}</b><br><small class="mut">${x.cap.toLocaleString()} cap · ${fmt(x.value)} · ${SD.LAYOUTS[x.d.layout].n}</small></span><span class="sd-btns"><button class="btn sec" onclick="SDU.loadD(${i})">Load</button><button class="btn red" onclick="SDU.delD(${i})">✕</button></span></div>`).join(''):'<div class="mut" style="margin-top:8px">No saved designs yet.</div>'))+
 card('Stats summary',summary(d))};
function summary(d){const s=SD.stats(d,closedFor());const r=(a,b)=>`<div class="row"><span>${a}</span><b>${b}</b></div>`;return r('Layout',SD.LAYOUTS[d.layout].n)+r('Capacity (licensed)',s.cap.toLocaleString())+r('Roof cover',Math.round(s.cov*100)+'%')+r('Enclosure',Math.round(s.enclosure*100)+'%')+r('Executive boxes',s.boxes)+r('Atmosphere',s.atm)+r('Comfort',s.comfort)+r('Safety',s.safety)+r('Prestige',s.prestige)+r('Rebuild value',fmt(s.value))+r('Matchday revenue',fmt(s.revenue))+r('Upkeep / week',fmt(s.maint))}
U.saveD=()=>{const n=prompt('Name this design','Design '+(G.stad.designs.length+1));if(!n)return;const d=getD(),s=SD.stats(d);G.stad.designs.unshift({name:n.slice(0,30),d:SD.clone(d),cap:s.raw,value:s.value});G.stad.designs.length=Math.min(G.stad.designs.length,8);save();panel();toast('Design saved')};
U.loadD=i=>{const x=G.stad.designs[i];U.mut(d=>{const n=SD.normalize(SD.clone(x.d));Object.keys(d).forEach(k=>delete d[k]);Object.assign(d,n)},'load');toast('Loaded “'+x.name+'” into preview')};
U.delD=i=>{if(!confirm('Delete this design?'))return;G.stad.designs.splice(i,1);save();panel()};
// ---- main view ----
window.vStadium=function(){if(!SD.ensure())return old2D();if(U.forLoad!==G){U.draft=null;U.undo=[];U.redo=[];U.forLoad=G;U.tplCache=null;U.viewed=0}
 $('#view').innerHTML=`<div id="sd-stage" class="${U.mode}"><div id="sd-canvas"></div><div id="sd-tools"></div><div id="sd-views"></div><div class="sd-hint">${U.mode==='3d'?'Drag to orbit · pinch to zoom · two fingers to pan · tap a stand':'2D plan · pinch/drag · tap a stand'}</div></div>
 <div id="sd-stats"></div><div id="sd-cats"></div><div id="sd-panel"></div><div id="sd-bar"></div>`;
 toolbar();cats();panel();stats();bar();requestAnimationFrame(mountStage)};
window.addEventListener('resize',()=>{if(typeof tab!=='undefined'&&tab==='stadium'&&U.mode==='2d')drawPlan()});
// leaving the tab: drop fullscreen/placing
const _go=window.go;window.go=function(t){if(t!=='stadium'){cancelPlace();U.full=false;document.body.classList.remove('sd-full')}return _go.apply(this,arguments)};
if(typeof tab!=='undefined'&&tab==='stadium')render();
})();
