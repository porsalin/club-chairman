'use strict';
// ===== Club Chairman · 3D Stadium Designer · data model, geometry, economics =====
// Self-contained: overrides stadiumStats/roofCover, wraps advance for construction jobs.
(function(){
const SD=window.SD={};
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)), clone=o=>JSON.parse(JSON.stringify(o));
SD.clone=clone;
SD.SIDES=['W','S','E','N']; // loop order around the pitch (W = main stand)
SD.CORNERS=['SW','SE','NE','NW']; // corner after each side in loop order
SD.NAMES={W:'Main Stand (West)',E:'East Stand',N:'North End',S:'South End',SW:'SW Corner',SE:'SE Corner',NE:'NE Corner',NW:'NW Corner'};
SD.LAYOUTS={classic:{n:'Four separate stands',d:'Classic English ground. Stands stop short of the corners.',i:'🏴'},
 infill:{n:'Infilled corners',d:'Stands joined by filled corners, rectangular plan.',i:'⬛'},
 bowl:{n:'Enclosed bowl',d:'One continuous bowl. Choose oval or rounded rectangle.',i:'🥣'},
 horseshoe:{n:'Horseshoe',d:'A bowl open at the South end.',i:'🧲'},
 athletics:{n:'Athletics bowl',d:'Oval bowl around a running track. Further from the action.',i:'🏃'},
 euro:{n:'European steep ends',d:'Tight rectangle, very steep end terraces.',i:'🧱'}};
SD.SEAT={seated:{n:'All-seater',dens:2.0,cost:60},rail:{n:'Rail seating',dens:2.6,cost:120},terrace:{n:'Safe standing / terrace',dens:3.2,cost:22}};
SD.ROOF={none:{n:'Open',m2:0,cover:0,ac:0,w:0},classic:{n:'Pillared (old school)',m2:600,cover:.6,ac:5,w:4},partial:{n:'Partial cantilever',m2:900,cover:.6,ac:4,w:5},
 cantilever:{n:'Full cantilever',m2:1500,cover:1,ac:8,w:8},goalpost:{n:'Goalpost truss',m2:1300,cover:1,ac:7,w:8},tension:{n:'Tension cable',m2:1800,cover:1,ac:7,w:10},
 membrane:{n:'Membrane canopy',m2:2000,cover:1,ac:6,w:10},retractable:{n:'Retractable',m2:2600,cover:1,ac:9,w:14}};
SD.FACADE={brick:{n:'Red brick',m2:300,pr:4},concrete:{n:'Brutalist concrete',m2:250,pr:3},metal:{n:'Metal cladding',m2:450,pr:6},glass:{n:'Glass curtain wall',m2:800,pr:10},etfe:{n:'ETFE cushions',m2:1200,pr:14}};
SD.CORNER={open:{n:'Open',c:0},infill:{n:'Infilled',c:0},stand:{n:'Corner stand',c:0},screen:{n:'Big screen',c:1.6e6},tower:{n:'Control tower',c:4e6}};
SD.PATTERNS={none:'Plain',stripes:'Stripes',checker:'Blocks',mosaic:'Mosaic',letters:'Letters',crest:'Crest',tiers:'Tier colours'};
SD.MOW={stripes:'Stripes',checks:'Checks',circles:'Circles',diagonal:'Diagonal',plain:'Plain'};
SD.SURF={grass:{n:'Natural grass',c:0,q:60},hybrid:{n:'Hybrid stitched',c:3e6,q:85},artificial:{n:'Artificial 4G',c:1.5e6,q:70}};
SD.PSIZE={compact:{n:'Compact 100×64',L:100,W:64},std:{n:'Standard 105×68',L:105,W:68},large:{n:'Large 110×72',L:110,W:72}};
SD.GOALS={box:'Box nets',classic:'Classic stanchion',deep:'Deep continental'};
SD.THEMES={club:'Club colours',classic:'Heritage',mono:'Monochrome',neon:'Neon night'};
SD.SITE={ // w,h in 20m cells
 carpark:{n:'Car park',i:'🅿️',w:2,h:2,c:2e6,wk:4,park:1},msc:{n:'Multi-storey car park',i:'🏢',w:2,h:1,c:6e6,wk:10,park:2},
 bus:{n:'Bus interchange',i:'🚌',w:1,h:1,c:1.5e6,wk:4,tr:1},rail:{n:'Rail halt',i:'🚆',w:3,h:1,c:8e6,wk:12,tr:2},metro:{n:'Metro station',i:'Ⓜ️',w:1,h:1,c:20e6,wk:20,tr:3},
 plaza:{n:'Entrance plaza',i:'⛲',w:2,h:2,c:1.2e6,wk:3,exits:2500,pr:3},turnstiles:{n:'Turnstile block',i:'🎫',w:1,h:1,c:4e5,wk:2,exits:4000},
 stair:{n:'Stair core / ramp',i:'🌀',w:1,h:1,c:9e5,wk:3,exits:5000},shop:{n:'Club shop',i:'🛍️',w:1,h:1,c:2e6,wk:4,shop:2},
 megastore:{n:'Megastore',i:'🏬',w:2,h:1,c:6e6,wk:6,shop:3},statue:{n:'Legend statue',i:'🗿',w:1,h:1,c:3e5,wk:2,pr:4,fans:1},
 honours:{n:'Honours wall',i:'🏆',w:1,h:1,c:2e5,wk:1,pr:3},ticket:{n:'Ticket office',i:'🎟️',w:1,h:1,c:5e5,wk:2,exits:1000},
 fanzone:{n:'Fan zone',i:'🎪',w:2,h:2,c:1.5e6,wk:3,atm:3,food:6},museum:{n:'Museum & tours',i:'🏛️',w:2,h:1,c:4e6,wk:6,museum:2,pr:6},
 hotel:{n:'Hotel',i:'🏨',w:2,h:2,c:30e6,wk:40,pr:10,inc:60e3},office:{n:'Office block',i:'🏬',w:2,h:1,c:15e6,wk:30,pr:4,inc:30e3},
 training:{n:'Training pitch',i:'⚽',w:3,h:2,c:1.8e6,wk:6,train:1},trees:{n:'Landscaping',i:'🌳',w:1,h:1,c:6e4,wk:1,pr:1}};
SD.CELL=20;
const PITCH_DEF={pattern:'stripes',surface:'grass',heating:0,size:'std',goals:'box',boards:'static',track:0,gap:8};
const OPS_DEF={kiosks:8,toilets:20,bars:2,hosp:1,family:'',away:'N',accessible:1,segregation:1,media:1,medical:1,stewards:1,police:0};
const EXTRA_DEF={screens:0,wrap:0,scoreboard:0,clock:0,sign:1,naming:'',crest:'facade',theme:'club'};
SD.tier=(rows=16,rake=30)=>({rows,rake});
SD.stand=(o={})=>Object.assign({tiers:[SD.tier()],overhang:2,setback:1,boxes:0,media:0,directors:0,dugout:0,seat:'seated',seatColor:'club',pattern:'none',text:'',patColor:'#ffffff',len:1,curve:0,facade:'',roof:'partial',pillars:0},o);
SD.blank=()=>({v:1,layout:'classic',shape:'rounded',stands:{W:SD.stand({dugout:1,directors:1,media:1}),E:SD.stand(),N:SD.stand(),S:SD.stand()},
 corners:{SW:'open',SE:'open',NE:'open',NW:'open'},roofColor:'#d9dee6',poly:0,retract:0,lights:'pylons',lightLevel:1,facade:'brick',
 site:[],pitch:clone(PITCH_DEF),ops:clone(OPS_DEF),extras:clone(EXTRA_DEF)});
SD.normalize=d=>{const b=SD.blank();d=Object.assign(b,d);for(const k of SD.SIDES)d.stands[k]=SD.stand(d.stands[k]||{tiers:[]});
 d.pitch=Object.assign(clone(PITCH_DEF),d.pitch);d.ops=Object.assign(clone(OPS_DEF),d.ops);d.extras=Object.assign(clone(EXTRA_DEF),d.extras);d.site=d.site||[];return d};

// ---------- Templates ----------
const T=(rows,rake)=>SD.tier(rows,rake);
SD.TEMPLATES={
 classic:{n:'Classic English',d:'Four stands, pylons, brick, a terrace end',f:()=>({layout:'classic',facade:'brick',lights:'pylons',roofColor:'#3b4250',
  stands:{W:SD.stand({tiers:[T(16,26),T(12,30)],boxes:1,directors:1,media:1,dugout:1,roof:'cantilever',len:.92}),E:SD.stand({tiers:[T(20,28)],roof:'classic',pillars:1,len:.9}),
  N:SD.stand({tiers:[T(28,30)],seat:'terrace',roof:'classic',pillars:1,len:.88}),S:SD.stand({tiers:[T(18,28)],roof:'partial',len:.85})}})},
 lower:{n:'Lower-league ground',d:'Compact, cheap and cheerful',f:()=>({layout:'classic',facade:'brick',lights:'pylons',lightLevel:0,
  stands:{W:SD.stand({tiers:[T(12,24)],dugout:1,directors:1,roof:'classic',pillars:1,len:.7}),E:SD.stand({tiers:[T(8,22)],seat:'terrace',roof:'none',len:.75}),N:SD.stand({tiers:[T(10,24)],seat:'terrace',roof:'partial',len:.7}),S:SD.stand({tiers:[],len:.6})},ops:{kiosks:3,toilets:8,bars:0,hosp:0,media:0}})},
 bowl:{n:'Modern bowl',d:'Rounded bowl, two tiers and boxes, full roof',f:()=>({layout:'bowl',shape:'rounded',facade:'glass',lights:'roof',lightLevel:2,roofColor:'#e8ecf2',poly:1,
  stands:Object.fromEntries(SD.SIDES.map(k=>[k,SD.stand({tiers:[T(24,28),T(22,33)],boxes:1,overhang:4,curve:k==='N'||k==='S'?1:0,roof:'cantilever',dugout:k==='W'?1:0,directors:k==='W'?1:0,media:k==='W'?1:0,pattern:k==='E'?'letters':'none'})])),extras:{screens:2,scoreboard:1,clock:1,sign:1,crest:'roof',theme:'club'},ops:{kiosks:24,toilets:70,bars:8,hosp:3,media:2,medical:2,stewards:2,police:1}})},
 cathedral:{n:'Cathedral',d:'Huge, steep, four tiers with goalpost trusses',f:()=>({layout:'infill',facade:'metal',lights:'roof',lightLevel:3,roofColor:'#b8c0cc',
  stands:{W:SD.stand({tiers:[T(26,30),T(14,33),T(20,35),T(14,37)],boxes:2,overhang:5,setback:2,roof:'goalpost',dugout:1,directors:1,media:1}),E:SD.stand({tiers:[T(26,30),T(18,34),T(22,36)],boxes:1,overhang:5,roof:'goalpost'}),
  N:SD.stand({tiers:[T(28,32),T(24,35)],boxes:1,overhang:4,roof:'cantilever',pattern:'crest'}),S:SD.stand({tiers:[T(28,32),T(24,35)],boxes:1,overhang:4,roof:'cantilever'})},
  corners:{SW:'infill',SE:'infill',NE:'infill',NW:'infill'},extras:{screens:2,scoreboard:1,clock:1,sign:1,crest:'roof',theme:'club'},ops:{kiosks:30,toilets:90,bars:10,hosp:4,media:2,medical:2,stewards:3,police:1}})},
 euro:{n:'Yellow-wall steep',d:'European rectangle with a giant steep terrace',f:()=>({layout:'euro',facade:'metal',lights:'roof',lightLevel:2,roofColor:'#ffffff',
  stands:{W:SD.stand({tiers:[T(22,30),T(18,34)],boxes:1,overhang:4,roof:'goalpost',dugout:1,directors:1,media:1}),E:SD.stand({tiers:[T(22,30),T(18,34)],boxes:1,overhang:4,roof:'goalpost'}),
  N:SD.stand({tiers:[T(30,30),T(16,34)],boxes:1,overhang:3,roof:'cantilever'}),S:SD.stand({tiers:[T(60,36)],seat:'rail',roof:'cantilever',pattern:'stripes',patColor:'#111111'})},corners:{SW:'infill',SE:'infill',NE:'infill',NW:'infill'},pitch:{gap:5}})},
 horseshoe:{n:'Horseshoe',d:'Bowl open at one end with a big screen',f:()=>({layout:'horseshoe',shape:'rounded',facade:'concrete',lights:'roof',lightLevel:2,roofColor:'#cfd5dd',
  stands:{W:SD.stand({tiers:[T(24,28),T(20,33)],boxes:1,overhang:4,roof:'membrane',dugout:1,directors:1,media:1}),E:SD.stand({tiers:[T(24,28),T(20,33)],boxes:1,overhang:4,roof:'membrane'}),N:SD.stand({tiers:[T(24,28),T(20,33)],boxes:1,overhang:4,roof:'membrane',curve:1}),S:SD.stand({tiers:[]})},
  corners:{SW:'screen',SE:'tower',NE:'infill',NW:'infill'},extras:{screens:2,scoreboard:1,clock:1,sign:1,crest:'roof',theme:'club'}})},
 athletics:{n:'Athletics oval',d:'Olympic-style bowl around a track',f:()=>({layout:'athletics',shape:'oval',facade:'concrete',lights:'roof',lightLevel:2,roofColor:'#f2f4f7',
  stands:Object.fromEntries(SD.SIDES.map(k=>[k,SD.stand({tiers:[T(30,24),T(20,30)],boxes:1,overhang:3,curve:1,roof:'tension',dugout:k==='W'?1:0,directors:k==='W'?1:0,media:k==='W'?1:0})])),pitch:{track:1,gap:8}})},
 etfe:{n:'ETFE arena',d:'Glowing cushion skin, steep 3-tier oval',f:()=>({layout:'bowl',shape:'oval',facade:'etfe',lights:'roof',lightLevel:3,roofColor:'#f5f7fa',poly:1,
  stands:Object.fromEntries(SD.SIDES.map(k=>[k,SD.stand({tiers:[T(22,30),T(16,34),T(20,37)],boxes:2,overhang:5,curve:1,roof:'cantilever',dugout:k==='W'?1:0,directors:k==='W'?1:0,media:k==='W'?1:0})])),pitch:{gap:6,boards:'led'},extras:{screens:2,wrap:1,scoreboard:1,clock:1,sign:1,crest:'roof',theme:'club'},ops:{kiosks:30,toilets:90,bars:10,hosp:4,media:2,medical:2,stewards:3,police:1}})},
 brutal:{n:'Brutalist',d:'Raw concrete rounded bowl, single huge tier',f:()=>({layout:'bowl',shape:'rounded',facade:'concrete',lights:'pylons',lightLevel:2,roofColor:'#9aa3ad',
  stands:Object.fromEntries(SD.SIDES.map(k=>[k,SD.stand({tiers:[T(40,31)],roof:'partial',dugout:k==='W'?1:0,directors:k==='W'?1:0,media:k==='W'?1:0})]))})}};
SD.fromTemplate=(id,keepSite)=>{const t=SD.TEMPLATES[id].f(),b=SD.blank();const d=SD.normalize(Object.assign(b,t,{pitch:Object.assign(b.pitch,t.pitch),ops:Object.assign(b.ops,t.ops),extras:Object.assign(b.extras,t.extras),corners:Object.assign(b.corners,t.corners)}));
 if(keepSite){d.site=clone(keepSite);SD.validateSite(d)}else{[['turnstiles',0],['turnstiles',Math.PI/2],['turnstiles',Math.PI],['turnstiles',-Math.PI/2],['stair',Math.PI/4],['stair',-3*Math.PI/4],['plaza',-Math.PI/2],['shop',-Math.PI/2+0.5],['carpark',2.6],['trees',0.8],['trees',-2.3],['statue',-Math.PI/2-0.4]].forEach(([t,a])=>SD.autoPlace(d,t,a))}
 const raw=SD.stats(d).raw;d.ops.toilets=Math.max(d.ops.toilets,Math.ceil(raw/560));d.ops.kiosks=Math.max(d.ops.kiosks,Math.ceil(raw/1600));if(raw>30000){d.ops.police=1;d.ops.stewards=Math.max(d.ops.stewards,2)}return d};
let _sid=0;SD.uid=()=>Date.now().toString(36).slice(-4)+(_sid++).toString(36)+Math.random().toString(36).slice(2,4);
SD.autoPlace=(d,t,ang)=>{const S=SD.SITE[t];for(let r=2;r<12;r++){for(let k=0;k<16;k++){const a=ang+(k%2?1:-1)*Math.ceil(k/2)*0.18;const it={id:SD.uid(),t,x:Math.round(Math.cos(a)*r-S.w/2),z:Math.round(Math.sin(a)*r-S.h/2),rot:0};if(SD.canPlace(d,it)){d.site.push(it);return it}}}return null};

// ---------- Geometry (shared by 3D and 2D plan) ----------
SD.layoutInfo=d=>{const L=d.layout,P=SD.PSIZE[d.pitch.size]||SD.PSIZE.std;let hx=P.L/2,hz=P.W/2,g=d.pitch.gap+(d.pitch.track||L==='athletics'?11:0),rc=0;
 if(L==='athletics'||(L==='bowl'||L==='horseshoe')&&d.shape==='oval')rc=L==='athletics'?36:24;rc=Math.min(rc,hz+g-4);
 const infill=c=>L==='bowl'||L==='horseshoe'||L==='athletics'?(L==='horseshoe'&&(c==='SW'||c==='SE')?(d.corners[c]==='screen'||d.corners[c]==='tower'?d.corners[c]:'open'):'infill'):L==='infill'||L==='euro'?(d.corners[c]==='open'?'infill':d.corners[c]):d.corners[c];
 return{hx,hz,g,rc,track:!!(d.pitch.track||L==='athletics'),corner:infill,open:L==='horseshoe'?'S':null,euro:L==='euro'}};
// section profile of a stand: d = horizontal distance from inner line, h = height
SD.section=(st,rakeBonus=0)=>{const tiers=[];let d0=0,h0=1.1;const rd=st.seat==='terrace'?0.6:0.8;
 st.tiers.forEach((t,i)=>{const rows=cl(Math.round(t.rows),3,70),rake=cl(t.rake+rakeBonus,12,40),rise=rd*Math.tan(rake*Math.PI/180);
  if(i>0){const p=tiers[i-1];d0=Math.max(p.d0+2,p.dEnd+(+st.setback||0)-(+st.overhang||0));h0=p.top+3.4+(i<=st.boxes?3.6:0)}
  const dEnd=d0+rows*rd,top=h0+rows*rise;tiers.push({d0,h0,rows,rd,rise,rake,dEnd,top,boxes:i>0&&i<=st.boxes})});
 const dMax=tiers.length?Math.max(...tiers.map(t=>t.dEnd))+3:0,topH=tiers.length?tiers[tiers.length-1].top:0;return{tiers,dMax,backH:topH+2.4,topH}};
function arc(cx,cz,r,a0,a1,n){const p=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;p.push({x:cx+r*Math.cos(a),z:cz+r*Math.sin(a)})}return p}
function frame(pts){let u=0;return pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];let tx=b.x-a.x,tz=b.z-a.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;
 if(i)u+=Math.hypot(p.x-pts[i-1].x,p.z-pts[i-1].z);return{x:p.x,z:p.z,nx:tz,nz:-tx,u}})}
SD.pathLen=(pts,d)=>{let L=0;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];L+=Math.hypot(b.x+b.nx*d-a.x-a.nx*d,b.z+b.nz*d-a.z-a.nz*d)}return L};
const minProfile=(a,b)=>{const n=Math.min(a.tiers.length,b.tiers.length);return SD.stand({tiers:[...Array(n)].map((_,i)=>SD.tier(Math.min(a.tiers[i].rows,b.tiers[i].rows),(a.tiers[i].rake+b.tiers[i].rake)/2)),overhang:Math.min(a.overhang,b.overhang),setback:Math.min(a.setback,b.setback),boxes:Math.min(a.boxes,b.boxes,n-1),seat:a.seat===b.seat?a.seat:'seated',seatColor:a.seatColor,roof:a.roof===b.roof?a.roof:(SD.ROOF[a.roof].cover>=SD.ROOF[b.roof].cover?b.roof:a.roof),facade:a.facade})};
// closed: set of stand keys excluded (under construction shown separately)
SD.geometry=(d)=>{const I=SD.layoutInfo(d),{hx,hz,g,rc}=I,segs=[];
 // side definitions in loop order: W(-z, +x dir), S(+x, +z dir), E(+z, -x dir), N(-x, -z dir)
 const SIDE={W:{a:[-1,-1],b:[1,-1],ax:'x'},S:{a:[1,-1],b:[1,1],ax:'z'},E:{a:[1,1],b:[-1,1],ax:'x'},N:{a:[-1,1],b:[-1,-1],ax:'z'}};
 const prevC={W:'NW',S:'SW',E:'SE',N:'NE'},nextC={W:'SW',S:'SE',E:'NE',N:'NW'};
 SD.SIDES.forEach(k=>{const st=d.stands[k];if(!st.tiers.length||I.open===k)return;const s=SIDE[k];const isX=s.ax==='x';
  const off=(isX?hz:hx)+g,half=(isX?hx:hz)-rc;const lenF=cl(st.len,.5,1.15);
  const startF=I.corner(prevC[k])==='infill'?1:lenF,endF=I.corner(nextC[k])==='infill'?1:lenF;
  const n=Math.max(8,Math.round(half*2/2.5)),pts=[];const curveD=st.curve?(half*2)*0.075:0;
  for(let i=0;i<=n;i++){const t=-startF+(startF+endF)*i/n;const along=t*half*(rc===0&&lenF>1&&startF===lenF?1:1);const bulge=curveD*(1-t*t);
   let x,z;if(k==='W'){x=along;z=-(off+bulge)}else if(k==='S'){x=off+bulge;z=along}else if(k==='E'){x=-along;z=off+bulge}else{x=-(off+bulge);z=-along}pts.push({x,z})}
  const rb=I.euro&&(k==='N'||k==='S')?7:0;segs.push({key:k,kind:'stand',st,pts:frame(pts),sec:SD.section(st,rb),closed:false,capStart:startF!==1||I.corner(prevC[k])!=='infill',capEnd:endF!==1||I.corner(nextC[k])!=='infill'})});
 // corners: center at pitch corner minus rc
 const CC={SW:{sx:1,sz:-1,a0:-Math.PI/2,A:'W',B:'S'},SE:{sx:1,sz:1,a0:0,A:'S',B:'E'},NE:{sx:-1,sz:1,a0:Math.PI/2,A:'E',B:'N'},NW:{sx:-1,sz:-1,a0:Math.PI,A:'N',B:'W'}};
 SD.CORNERS.forEach(c=>{const t=I.corner(c),C=CC[c],cx=C.sx*(hx-rc),cz=C.sz*(hz-rc);const A=d.stands[C.A],B=d.stands[C.B];
  if(t==='infill'){const aOk=A.tiers.length&&I.open!==C.A,bOk=B.tiers.length&&I.open!==C.B;if(!aOk&&!bOk)return;const prof=aOk&&bOk?minProfile(A,B):SD.stand(Object.assign(clone(aOk?A:B),{}));if(!aOk||!bOk)prof.tiers=prof.tiers.slice(0,1);
   const sideA=SD.section(prof);const n=Math.max(6,Math.round((rc+g+sideA.dMax/2)*Math.PI/2/3));segs.push({key:c,kind:'corner',st:prof,pts:frame(arc(cx,cz,rc+g,C.a0,C.a0+Math.PI/2,n)),sec:sideA,capStart:!aOk,capEnd:!bOk,ab:[C.A,C.B]})}
  else if(t==='stand'){const prof=SD.stand({tiers:[SD.tier(14,28)],roof:'none',seat:A.seat,seatColor:A.seatColor,facade:A.facade});
   segs.push({key:c,kind:'cstand',st:prof,pts:frame(arc(cx,cz,rc+g+4,C.a0+0.2,C.a0+Math.PI/2-0.2,8)),sec:SD.section(prof),capStart:true,capEnd:true})}});
 let ext=0;segs.forEach(s=>s.pts.forEach(p=>{ext=Math.max(ext,Math.abs(p.x+p.nx*s.sec.dMax),Math.abs(p.z+p.nz*s.sec.dMax))}));
 return{I,segs,ext:Math.max(ext,hx+g+20),CC}};

// ---------- Capacity, economics, stats ----------
const segCap=s=>{const dens=SD.SEAT[s.st.seat].dens;let c=0;s.sec.tiers.forEach(t=>{const L=SD.pathLen(s.pts,(t.d0+t.dEnd)/2);c+=t.rows*L*dens*(s.st.seat==='terrace'?0.75/0.8*1:1)});return Math.round(c*0.92)};
SD.segCap=segCap;
function roofArea(s){const r=SD.ROOF[s.st.roof];if(!r.cover)return 0;const depth=s.sec.dMax*r.cover+(r.cover>=1?2:0);return SD.pathLen(s.pts,s.sec.dMax*0.6)*depth}
function structCost(s){let c=0;const L=SD.pathLen(s.pts,s.sec.dMax/2);s.sec.tiers.forEach((t,i)=>{c+=t.rows*L*2*(850*(1+0.35*i))*(1+(t.rake-28)*0.015)});
 c*=1+(+s.st.overhang||0)*0.025+(s.st.curve?0.1:0);c+=s.st.boxes*L*20e3;return c}
function facadeArea(s){return SD.pathLen(s.pts,s.sec.dMax)*s.sec.backH}
// cost of each component for a design: returns map key -> {c,wk,struct}
SD.components=d=>{const G2=SD.geometry(d),comp={};const fac=d.facade;
 G2.segs.forEach(s=>{const k=s.key,st=s.st,cap=segCap(s);const stKey=s.kind==='stand'?k:k;
  const struct=JSON.stringify([d.layout,d.shape,d.pitch.size,d.pitch.gap,d.pitch.track,st.tiers,st.overhang,st.setback,st.boxes,st.len,st.curve,s.kind]);
  comp['stand:'+k]={label:SD.NAMES[k]+(s.kind==='stand'?'':' build'),c:structCost(s)+facadeArea(s)*SD.FACADE[st.facade||fac].m2,wk:Math.round(6+s.sec.tiers.reduce((a,t)=>a+5+t.rows/6,0)*(s.kind==='stand'?1:0.6)),sig:struct+(st.facade||fac),struct:1,cap};
  comp['seat:'+k]={label:SD.NAMES[k]+' seating',c:cap*SD.SEAT[st.seat].cost+(st.pattern!=='none'?(st.pattern==='letters'||st.pattern==='crest'?150e3:80e3):0),wk:2,sig:JSON.stringify([st.seat,st.seatColor,st.pattern,st.text,st.patColor])};
  if(s.kind!=='cstand')comp['roof:'+k]={label:SD.NAMES[k]+' roof',c:roofArea(s)*(SD.ROOF[st.roof].m2+(d.poly&&SD.ROOF[st.roof].cover?250:0))+(st.roof==='retractable'?8e6:0),wk:SD.ROOF[st.roof].w,sig:JSON.stringify([st.roof,st.pillars,d.roofColor,d.poly,struct])};
  if(s.kind==='stand')comp['fit:'+k]={label:SD.NAMES[k]+' fittings',c:st.media*1.2e6+st.directors*0.8e6+st.dugout*0.5e6,wk:2,sig:JSON.stringify([st.media,st.directors,st.dugout])}});
 SD.CORNERS.forEach(c=>{const t=G2.I.corner(c);if(t==='screen'||t==='tower')comp['cx:'+c]={label:SD.NAMES[c]+' '+SD.CORNER[t].n,c:SD.CORNER[t].c,wk:t==='tower'?8:4,sig:t}});
 if(d.stands.W.roof==='retractable'||d.retract)comp.retract={label:'Retractable pitch roof',c:60e6,wk:30,sig:'r'};
 comp.lights={label:'Floodlights',c:(d.lights==='none'?0:d.lights==='pylons'?2e6:3e6)*(1+d.lightLevel*0.6),wk:3+d.lightLevel,sig:d.lights+d.lightLevel};
 const p=d.pitch;comp.pitch={label:'Pitch works',c:SD.SURF[p.surface].c+p.heating*2.5e6+(p.size!=='std'?1.5e6:0)+(p.boards==='led'?2.5e6:3e5)+(p.track?3e6:0)+5e4,wk:3,sig:JSON.stringify([p.surface,p.heating,p.size,p.track])};
 comp.pitchlook={label:'Pitch dressing',c:3e4+(p.boards==='led'?2.5e6:3e5)+6e4,wk:1,sig:JSON.stringify([p.pattern,p.goals,p.boards])};
 const o=d.ops;comp.ops={label:'Interior fit-out',c:o.kiosks*8e4+o.toilets*6e4+o.bars*2.5e5+[0,2e6,6e6,15e6,30e6][o.hosp]+(o.family?3e5:0)+(o.away?3e5:0)+o.accessible*5e5+o.segregation*4e5+[0,1e6,4e6][o.media]+[0,5e5,2e6][o.medical]+o.police*1.2e6+o.stewards*2e5,wk:4,sig:JSON.stringify(o)};
 const e=d.extras;comp.extras={label:'Screens & branding',c:e.screens*1.5e6+e.wrap*9e6+e.scoreboard*6e5+e.clock*1.5e5+e.sign*4e5+(e.crest!=='none'?3e5:0)+5e4,wk:3,sig:JSON.stringify(e)};
 d.site.forEach(it=>{const S=SD.SITE[it.t];if(S)comp['site:'+it.id]={label:S.n,c:S.c,wk:S.wk,sig:it.t+'@'+it.x+','+it.z}});
 return{comp,geo:G2}};
SD.value=d=>{const{comp}=SD.components(d);return Object.values(comp).reduce((a,x)=>a+x.c,0)};
// diff two designs: list of job items
SD.diff=(from,to)=>{const A=SD.components(from).comp,B=SD.components(to).comp,items=[];let cost=0;
 for(const k in B){const b=B[k],a=A[k];if(a&&a.sig===b.sig)continue;let c=b.c-(a?0.25*a.c:0);c=Math.max(c,b.c*0.05+5e4);if(k.startsWith('site:')&&a)c=b.c*0.3;items.push({key:k,label:b.label,cost:c,wk:b.wk,struct:!!b.struct&&!!a||!!b.struct});cost+=c}
 for(const k in A)if(!B[k]){const r=-0.15*A[k].c;items.push({key:k,label:'Demolish '+A[k].label,cost:r,wk:A[k].struct?4:1,demo:1});cost+=r}
 const wk=items.reduce((m,x)=>Math.max(m,x.wk),0);return{items,cost:Math.round(cost),wk}};

// stats: closed = Set of keys under construction
SD.stats=(d,closed=new Set())=>{const{comp,geo}=SD.components(d);let raw=0,tot=0,roofed=0,terr=0,boxes=0,perim=0,encl=0,rakeSum=0,closeSum=0,tiersMax=0;
 const I=geo.I;
 geo.segs.forEach(s=>{const k=s.key;const cap=comp['stand:'+k].cap;const L=SD.pathLen(s.pts,0);perim+=L;if(closed.has('stand:'+k))return;encl+=L;raw+=cap;
  const cov=closed.has('roof:'+k)?0:SD.ROOF[s.st.roof].cover;roofed+=cap*cov;if(s.st.seat!=='seated')terr+=cap*(s.st.seat==='terrace'?1:.8);
  s.sec.tiers.forEach(t=>{rakeSum+=t.rake*t.rows*L});tot+=s.sec.tiers.reduce((a,t)=>a+t.rows,0)*L;tiersMax=Math.max(tiersMax,s.sec.tiers.length);if(s.kind==='stand')boxes+=Math.round(s.st.boxes*L/6)});
 const fullPerim=2*(I.hx*2+I.hz*2)+(Math.PI*2*(I.rc+I.g))-8*I.rc;const enclosure=cl(encl/fullPerim,0,1);
 const o=d.ops,e=d.extras;const site=d.site.filter(it=>!closed.has('site:'+it.id));const sum=f=>site.reduce((a,it)=>a+((SD.SITE[it.t]||{})[f]||0),0);
 const cov=raw?roofed/raw:0,terrF=raw?terr/raw:0,rake=tot?rakeSum/tot:28;
 // safety certificate
 const exits=Math.round(raw*0.7+sum('exits')+o.stewards*2500);
 const loos=o.toilets*650,certF=[0.85,0.95,1,1.04][o.stewards]*(o.medical?1:0.9)*(o.police||raw<30000?1:0.85)*(o.segregation||!o.away?1:0.92);
 const cert=Math.round(Math.min(exits,loos)*certF);const cap=Math.min(raw,cert);
 const atm=cl(Math.round(22+enclosure*20+cov*10+(raw?geo.segs.reduce((a,s)=>a+(closed.has('roof:'+s.key)?0:SD.ROOF[s.st.roof].ac)*segCap(s),0)/raw:0)+(rake-27)*0.7+(14-I.g)*0.8+terrF*14+Math.min(raw/60000,1.2)*6+tiersMax*1.2+e.screens+e.wrap*3+d.lightLevel+sum('atm')+(d.pitch.boards==='led'?1:0)+(o.away&&o.segregation?2:0)),0,100);
 const comfort=cl(Math.round(cov*25+(1-terrF)*8+Math.min(10,(o.kiosks+o.bars*2)*1000/Math.max(cap,1)*3)+Math.min(10,loos/Math.max(cap,1)*6)+o.hosp*4+o.accessible*3+(o.family?3:0)+sum('park')*3+sum('tr')*3+o.medical*2),0,100);
 const safety=cl(Math.round((raw?cert/raw:1)*55+o.stewards*8+o.medical*6+o.police*7+o.segregation*5+Math.min(10,sum('exits')/3000)),0,100);
 const prestige=cl(Math.round(cap/1500+SD.FACADE[d.facade].pr*1.5+geo.segs.reduce((a,s)=>a+SD.ROOF[s.st.roof].w,0)/4+sum('pr')+o.hosp*3+e.screens*1.5+e.wrap*4+(e.crest!=='none'?2:0)+tiersMax*2+(d.pitch.surface==='hybrid'?3:0)),0,100);
 const value=Object.values(comp).reduce((a,x)=>a+x.c,0);
 const food=Math.round(o.kiosks*1.5+o.bars*4+sum('food'));const hosp=boxes+[0,4,10,20,35][o.hosp];
 const maint=Math.round(value*0.00012+o.stewards*6e3+o.police*8e3+o.medical*4e3+(d.extras.wrap?6e3:0));
 const revenue=Math.round(cap*0.88*(1.5+food*0.06)+hosp*4500*(1+o.hosp*0.25));
 return{raw,cap,cert,exits,loos,atm,comfort,safety,prestige,value,maint,hosp,food,revenue,cov,enclosure,boxes,
  pitchQ:SD.SURF[d.pitch.surface].q+d.pitch.heating*12,access:Math.min(3,sum('park'))+Math.min(3,sum('tr')),park:Math.min(3,sum('park')),tr:Math.min(3,sum('tr')),shop:Math.min(3,sum('shop')),museum:Math.min(2,sum('museum')),inc:sum('inc'),limit:cap<raw?(exits<loos?'exits':'toilets'):'seats'}};

// ---------- Migration from the old model ----------
SD.migrate=S=>{const d=SD.blank(),scale=x=>x;const rmap={none:'none',partial:'partial',full:'cantilever'};
 ['N','S','E','W'].forEach(k=>{const o=S.stands&&S.stands[k];if(!o)return;const src=o.build&&o.build.target?o.build.target:o;const n=src.tiers||0;
  d.stands[k]=SD.stand({tiers:[...Array(n)].map((_,i)=>SD.tier(k==='W'||k==='E'?16-i*2:14-i*2,26+i*3)),seat:src.seat==='standing'?'terrace':'seated',roof:rmap[src.roof]||'partial',boxes:src.boxes>0&&n>1?1:0,len:k==='W'||k==='E'?.9:.85,dugout:k==='W'?1:0,directors:k==='W'?1:0,media:k==='W'?1:0})});
 // match old capacities per stand
 if(window.standCap)try{const geo=SD.geometry(d);['N','S','E','W'].forEach(k=>{const o=S.stands[k];if(!o)return;const src=o.build&&o.build.target?o.build.target:o;const want=src.tiers?window.standCap(src,k):0;const seg=geo.segs.find(x=>x.key===k);if(!seg||!want)return;const f=want/Math.max(1,SD.segCap(seg));d.stands[k].tiers.forEach(t=>t.rows=cl(Math.round(t.rows*f),5,45))})}catch(e){}
 if(window.standCap)try{let want=0;for(const k in S.stands){const o=S.stands[k],src=o.build&&o.build.target?o.build.target:o;if(src.tiers)want+=window.standCap(src,k)}
  SD.CORNERS.forEach(c=>{const o=S.stands&&S.stands[c];if(o&&(o.tiers||(o.build&&o.build.target&&o.build.target.tiers)))d.corners[c]='stand'});
  for(let it=0;it<3;it++){const raw=SD.stats(d).raw;if(!raw||!want)break;const f=want/raw;if(Math.abs(f-1)<0.02)break;['N','S','E','W'].forEach(k=>d.stands[k].tiers.forEach(t=>t.rows=cl(Math.round(t.rows*f),5,60)))}}catch(e){}
 SD.CORNERS.forEach(c=>{const o=S.stands&&S.stands[c];if(o&&(o.tiers||(o.build&&o.build.target&&o.build.target.tiers)))d.corners[c]='stand'});
 const g=S.global||{};d.lightLevel=cl(g.lights||0,0,3);d.extras.screens=[0,1,2,4][g.screens||0];d.extras.wrap=g.screens>=3?1:0;d.pitch.surface=g.pitch||'grass';d.pitch.heating=g.heating?1:0;
 let id=1;const add=(t,x,z)=>d.site.push({id:'m'+(id++),t,x,z});
 if(g.parking>=1)add('carpark',-8,4);if(g.parking>=2)add('msc',6,-6);if(g.parking>=3)add('carpark',-10,4);
 if(g.transport===1)add('bus',5,4);if(g.transport===2)add('rail',4,6);if(g.transport>=3)add('metro',5,4);
 if(g.shop===1)add('shop',-5,-4);if(g.shop>=2)add('megastore',-6,-4);if(g.museum)add('museum',3,-6);
 d._auto=1;
 let kiosks=0,boxes=0;for(const k in (S.stands||{}))kiosks+=S.stands[k].kiosks||0;d.ops.kiosks=Math.max(4,kiosks);
 d.jobs0=(S.queue||[]).filter(q=>q.left>0).map(q=>({key:q.target?'stand:'+q.key:q.glob?'old:'+q.glob:'pitch',label:q.label,left:q.left,total:q.left}));
 return d};
SD.ensure=()=>{if(typeof G==='undefined'||!G||!G.stad)return null;const S=G.stad;if(!S.design){const d=SD.migrate(S);S.jobs=d.jobs0||[];delete d.jobs0;S.design=d;S.designs=S.designs||[];S.queue=[];SD.validateSite(d);if(d._auto){delete d._auto;[['turnstiles',-1.57],['turnstiles',1.57],['turnstiles',0],['turnstiles',3.14],['stair',0.8],['stair',-2.3],['plaza',-1.2]].forEach(([t,a])=>SD.autoPlace(d,t,a))}{const raw=SD.stats(d).raw;d.ops.toilets=Math.max(d.ops.toilets,Math.ceil(raw/560));d.ops.kiosks=Math.max(d.ops.kiosks,Math.ceil(raw/1600));if(raw>30000){d.ops.police=1;d.ops.stewards=2}}SD.syncGlobal()}
 S.design=SD.normalize(S.design);S.jobs=S.jobs||[];S.designs=S.designs||[];return S.design};

SD.closed=()=>new Set((((typeof G!=='undefined'&&G)&&G.stad&&G.stad.jobs)||[]).filter(j=>!(j.wait>0)).map(j=>j.key));
// live stats: stands being rebuilt are shut; stands still waiting for their phase keep their old capacity
SD.effective=S=>S.design;
SD.live=S=>{const jobs=S.jobs||[];const shut=new Set(jobs.map(j=>j.key));const st=SD.stats(S.design,shut);const wait=jobs.filter(j=>j.wait>0&&j.key.startsWith('stand:')).map(j=>j.key.slice(6));
 if(wait.length&&S.prev){try{const g=SD.geometry(SD.normalize(clone(S.prev)));let add=0;g.segs.forEach(sg=>{if(wait.includes(sg.key))add+=SD.segCap(sg)});st.raw+=add;st.cap+=add;st.oldOpen=add}catch(e){}}return st};
SD.syncGlobal=()=>{const S=G.stad,d=S.design;if(!d)return;const st=SD.live(S);const g=S.global=S.global||{};
 g.lights=d.lights==='none'?0:d.lightLevel;g.screens=Math.min(3,d.extras.screens>=4?3:d.extras.screens>=2?2:d.extras.screens)+(d.extras.wrap?0:0);if(d.extras.wrap)g.screens=3;g.pitch=d.pitch.surface;g.heating=d.pitch.heating;g.parking=st.park;g.transport=st.tr;g.shop=st.shop;g.museum=st.museum};
// site occupancy
SD.footprint=d=>Math.ceil((SD.geometry(d).ext+6)/SD.CELL);
SD.cellsOf=it=>{const S=SD.SITE[it.t],r=it.rot?1:0,w=r?S.h:S.w,h=r?S.w:S.h,c=[];for(let i=0;i<w;i++)for(let j=0;j<h;j++)c.push((it.x+i)+','+(it.z+j));return c};
SD.canPlace=(d,it,ignoreId)=>{const geo=SD.geometry(d),ext=geo.ext+4,C=SD.CELL;const S=SD.SITE[it.t],w=it.rot?S.h:S.w,h=it.rot?S.w:S.h;
 const x0=it.x*C,z0=it.z*C,x1=x0+w*C,z1=z0+h*C;if(Math.max(Math.abs(x0),Math.abs(x1),Math.abs(z0),Math.abs(z1))>230)return false;
 const nx=cl(0,x0,x1),nz=cl(0,z0,z1);const ex=Math.max(geo.I.hx+geo.I.g,1),ez=Math.max(geo.I.hz+geo.I.g,1);
 if(!(x1<=-ext||x0>=ext||z1<=-ext*0.86||z0>=ext*0.86))return false;
 const used=new Set();d.site.forEach(o=>{if(o.id!==ignoreId)SD.cellsOf(o).forEach(c=>used.add(c))});return SD.cellsOf(it).every(c=>!used.has(c))};
SD.validateSite=d=>{d.site=d.site.filter(it=>SD.SITE[it.t]);const keep=[];const tmp=Object.assign({},d,{site:keep});d.site.forEach(it=>{if(SD.canPlace(tmp,it))keep.push(it);else{for(let r=1;r<12;r++){let ok=false;for(const [dx,dz] of [[r,0],[-r,0],[0,r],[0,-r],[r,r],[-r,-r],[r,-r],[-r,r]]){const t2=Object.assign({},it,{x:it.x+dx,z:it.z+dz});if(SD.canPlace(tmp,t2)){keep.push(t2);ok=true;break}}if(ok)break}}});d.site=keep;return d};

// ---------- Hooks into the game ----------
const baseStats=window.stadiumStats;
window.stadiumStats=function(S){if(!S||!S.design)return baseStats(S);const st=SD.live(S);
 return{cap:st.cap,atm:st.atm,hosp:st.hosp,food:st.food,comfort:st.comfort,pitchQ:st.pitchQ,access:st.access,safety:st.safety,prestige:st.prestige}};
window.roofCover=function(){const S=G&&G.stad;if(!S||!S.design)return 0;return SD.live(S).cov};
SD.tick=()=>{const S=G.stad;if(!S.design)return;const done=[];const started=[];S.jobs=S.jobs.filter(j=>{if(j.wait>0){j.wait--;if(!j.wait&&j.key.startsWith('stand:'))started.push(j);return true}j.left--;if(j.left<=0){done.push(j);return false}return true});started.forEach(j=>G.log.unshift('🚧 Work starts: '+j.label));if(!S.jobs.some(j=>j.wait>0))S.prev=null;
 done.forEach(j=>{G.log.unshift('🏗️ Complete: '+j.label)});if(done.length&&window.toast)setTimeout(()=>toast('🏗️ '+done[0].label+' complete'+(done.length>1?' (+'+(done.length-1)+')':'')),1200);
 if(S.relocate){S.relocate.left--;if(S.relocate.left<=0){S.design=S.relocate.design;S.jobs=[];G.cash+=S.relocate.sale||0;G.log.unshift('🚚 Moved into the new stadium! Old ground sold for '+fmt(S.relocate.sale||0));S.relocate=null}}
 const st=SD.live(S);G.cash-=st.maint;G.cash+=st.inc;const L=G.ledger&&G.ledger[0];if(L&&L.parts&&!L.parts.stadium){L.out=Math.round(L.out+st.maint);L.income=Math.round(L.income+st.inc);L.parts.stadium=st.maint;if(st.inc)L.parts.property=st.inc}
 SD.syncGlobal()};
SD.signName=()=>{const e=G.stad.design.extras;return(G.naming&&G.naming.name)||e.naming||''};
SD.hook=()=>{if(SD._hooked)return;SD._hooked=1;
 if(typeof window.completeDay==='function'){// v2 engine: one tick per processed calendar day, same as the core build queue
  const prev=window.onDayDone;window.onDayDone=function(){const r=prev?prev.apply(this,arguments):undefined;try{if(G&&G.stad){SD.ensure();SD.tick()}}catch(e){console.error('stadium tick',e)}return r}}
 else{const adv=window.advance;window.advance=function(){const w=G&&G.week,s=G&&G.season;if(G)SD.ensure();const r=adv.apply(this,arguments);
  if(G&&G.stad&&G.stad.design&&(G.week!==w||G.season!==s)&&!(G.season!==s&&G.week===1&&w>38)){SD.tick();save();if(typeof tab!=='undefined'&&tab==='stadium')render()}return r}}
 const mi=window.matchIncome;if(mi)window.matchIncome=function(att){const r=mi(att);if(G&&G.stad&&G.stad.design){const o=G.stad.design.ops;r.hosp=Math.round(r.hosp*(1+o.hosp*0.25));r.food=Math.round(r.food*(1+o.bars*0.02))}return r}};
SD.hook();
const ng=window.newGame;window.newGame=function(){const r=ng.apply(this,arguments);try{SD.ensure();save()}catch(e){console.error(e)}return r};
try{if(typeof G!=='undefined'&&G&&G.stad)SD.ensure()}catch(e){console.error('stadium migrate',e)}
})();
