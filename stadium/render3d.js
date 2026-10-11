// ===== Club Chairman · 3D Stadium renderer (Three.js, procedural) =====
import * as THREE from './vendor/three.module.min.js';
import {OrbitControls} from './vendor/OrbitControls.js';
const SD=window.SD;
const V=(x,y,z)=>new THREE.Vector3(x,y,z), C=c=>new THREE.Color(c);
const hash=(a,b,c=0)=>{let h=(a*374761393+b*668265263+c*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295};
const R={};let built=null;
// ---------- texture helpers ----------
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}t.anisotropy=4;return t}
const TEX={};
function seatTex(){return TEX.seat||(TEX.seat=canvasTex(64,32,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);for(let i=0;i<8;i++){g.fillStyle='#6b6b6b';g.fillRect(i*8,0,1,h);g.fillStyle='#d8d8d8';g.fillRect(i*8+1,h*0.55,7,h*0.45);g.fillStyle='#c4c4c4';g.fillRect(i*8+2,2,5,h*0.5)}},true))}
function crowdTex(){return TEX.crowd||(TEX.crowd=canvasTex(128,32,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);for(let i=0;i<16;i++){const x=i*8+Math.random()*2;const b=200+Math.random()*55|0;g.fillStyle=`rgb(${b},${b},${b})`;g.fillRect(x+1,h*0.35,6,h*0.65);
 const sk=['#f1c9a5','#d9a477','#8d5a3b','#5b3a26','#e8b996'][Math.random()*5|0];g.fillStyle=sk;g.beginPath();g.arc(x+4,h*0.25,3,0,7);g.fill();if(Math.random()<.3){g.fillStyle='#222';g.fillRect(x+1,h*0.08,6,3)}}},true))}
function facadeTex(type,col){const k='f'+type+col;if(TEX[k])return TEX[k];let t;
 if(type==='brick')t=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#8a8077';g.fillRect(0,0,w,h);for(let y=0;y<32;y++)for(let x=-1;x<9;x++){const l=0.8+Math.random()*0.35;g.fillStyle=`rgb(${150*l|0},${62*l|0},${48*l|0})`;g.fillRect(x*32+(y%2?16:0)+1,y*8+1,30,6)}
  g.fillStyle='#e9e1d2';g.fillRect(0,120,w,8);for(let i=0;i<4;i++){g.fillStyle='#2b2f35';g.fillRect(14+i*64,40,36,60);g.fillStyle='#e9e1d2';g.fillRect(12+i*64,36,40,5)}},true);
 else if(type==='concrete')t=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#a8a59f';g.fillRect(0,0,w,h);for(let i=0;i<4000;i++){const v=150+Math.random()*40|0;g.fillStyle=`rgba(${v},${v},${v-4},.35)`;g.fillRect(Math.random()*w,Math.random()*h,2,2)}
  for(let x=0;x<w;x+=32){g.fillStyle='#8f8c86';g.fillRect(x,0,6,h)}g.fillStyle='#77746f';g.fillRect(0,0,w,10);for(let x=0;x<w;x+=64){g.fillStyle='#3a3d42';g.fillRect(x+14,150,30,80)}},true);
 else if(type==='metal')t=canvasTex(256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);for(let i=0;i<=16;i++){gr.addColorStop(i/16,i%2?'#c9ced6':'#9aa2ad')}g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#6b737e';for(let y=0;y<h;y+=64)g.fillRect(0,y,w,2);g.fillStyle=col;g.fillRect(0,200,w,18)},true);
 else if(type==='glass')t=canvasTex(256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#9cc3dc');gr.addColorStop(1,'#3d5a73');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#d9e2ea';for(let x=0;x<w;x+=32)g.fillRect(x,0,3,h);for(let y=0;y<h;y+=42)g.fillRect(0,y,w,3);
  for(let i=0;i<30;i++){g.fillStyle='rgba(255,255,255,.12)';g.fillRect(Math.random()*w|0,Math.random()*h|0,28,38)}},true);
 else if(type==='etfe')t=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#8b949f';g.fillRect(0,0,w,h);const s=32;for(let y=-1;y<9;y++)for(let x=-1;x<9;x++){const cx=x*s+(y%2?s/2:0),cy=y*s*0.75;const gr=g.createRadialGradient(cx,cy,2,cx,cy,s*0.6);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#cfd6de');g.fillStyle=gr;
  g.beginPath();g.moveTo(cx,cy-s*0.48);g.lineTo(cx+s*0.47,cy);g.lineTo(cx,cy+s*0.48);g.lineTo(cx-s*0.47,cy);g.closePath();g.fill()}},true);
 return TEX[k]=t}
function textTex(text,o={}){const w=o.w||1024,h=o.h||128;return canvasTex(w,h,(g)=>{g.fillStyle=o.bg||'rgba(0,0,0,0)';g.fillRect(0,0,w,h);g.fillStyle=o.col||'#fff';g.textAlign='center';g.textBaseline='middle';let fs=h*0.72;g.font=`900 ${fs}px -apple-system,Segoe UI,Arial,sans-serif`;
 while(g.measureText(text).width>w*0.94&&fs>8){fs-=2;g.font=`900 ${fs}px -apple-system,Segoe UI,Arial,sans-serif`}g.fillText(text,w/2,h/2+2)})}
function crestTex(col,ini){return canvasTex(256,256,(g)=>{g.clearRect(0,0,256,256);g.beginPath();g.moveTo(128,8);g.lineTo(240,40);g.lineTo(228,150);g.quadraticCurveTo(200,220,128,250);g.quadraticCurveTo(56,220,28,150);g.lineTo(16,40);g.closePath();g.fillStyle='#fff';g.fill();
 g.save();g.scale(.88,.88);g.translate(17,16);g.beginPath();g.moveTo(128,8);g.lineTo(240,40);g.lineTo(228,150);g.quadraticCurveTo(200,220,128,250);g.quadraticCurveTo(56,220,28,150);g.lineTo(16,40);g.closePath();g.fillStyle=col;g.fill();g.restore();
 g.fillStyle='#fff';g.font='900 86px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(ini,128,128);g.fillStyle='#ffd34d';g.font='40px Arial';g.fillText('★',128,200)})}
function pitchTex(p,dims){const W=1024,H=Math.round(1024*(dims.W+10)/(dims.L+10));return canvasTex(W,H,(g)=>{const s=W/(dims.L+10),ox=5*s,oy=5*s,L=dims.L*s,Wd=dims.W*s;
 const base=p.surface==='artificial'?[44,140,62]:p.surface==='hybrid'?[52,132,58]:[58,124,52];const lt=p.surface==='artificial'?1.06:1.13;
 g.fillStyle=`rgb(${base})`;g.fillRect(0,0,W,H);const sh=f=>`rgb(${base.map(v=>Math.min(255,v*f|0))})`;g.fillStyle=sh(lt);
 if(p.pattern==='stripes'){for(let i=0;i<20;i+=2)g.fillRect(ox+i*L/20,0,L/20,H)}else if(p.pattern==='checks'){for(let i=0;i<20;i++)for(let j=0;j<12;j++)if((i+j)%2)g.fillRect(ox+i*L/20,oy+j*Wd/12,L/20,Wd/12)}
 else if(p.pattern==='diagonal'){g.save();g.beginPath();g.rect(0,0,W,H);g.clip();g.translate(W/2,H/2);g.rotate(Math.PI/4);for(let i=-20;i<20;i+=2)g.fillRect(i*W/24,-W,W/24,W*2);g.restore()}
 else if(p.pattern==='circles'){for(let r=14;r>0;r--){g.fillStyle=r%2?sh(lt):`rgb(${base})`;g.beginPath();g.arc(W/2,H/2,r*W/26,0,7);g.fill()}}
 if(p.surface==='grass')for(let i=0;i<9000;i++){g.fillStyle=`rgba(${Math.random()<.5?'20,60,20':'120,170,90'},.10)`;g.fillRect(Math.random()*W,Math.random()*H,2,2)}
 g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=Math.max(2,0.12*s);const m=(x,y)=>[ox+x*s,oy+y*s];g.strokeRect(ox,oy,L,Wd);g.beginPath();g.moveTo(W/2,oy);g.lineTo(W/2,oy+Wd);g.stroke();
 g.beginPath();g.arc(W/2,H/2,9.15*s,0,7);g.stroke();g.fillStyle='#fff';g.beginPath();g.arc(W/2,H/2,0.3*s,0,7);g.fill();
 for(const sd of[0,1]){const x0=sd?ox+L:ox,dir=sd?-1:1;g.strokeRect(Math.min(x0,x0+dir*16.5*s),H/2-20.16*s,16.5*s,40.32*s);g.strokeRect(Math.min(x0,x0+dir*5.5*s),H/2-9.16*s,5.5*s,18.32*s);
  g.beginPath();g.arc(x0+dir*11*s,H/2,0.3*s,0,7);g.fill();g.beginPath();g.arc(x0+dir*11*s,H/2,9.15*s,sd?Math.PI-0.93:-0.93,sd?Math.PI+0.93:0.93);g.stroke()}
 for(const [cx,cy,a] of [[ox,oy,0],[ox+L,oy,Math.PI/2],[ox+L,oy+Wd,Math.PI],[ox,oy+Wd,-Math.PI/2]]){g.beginPath();g.arc(cx,cy,1*s,a,a+Math.PI/2);g.stroke()}})}
function netTex(){return TEX.net||(TEX.net=(()=>{const t=canvasTex(64,64,(g)=>{g.clearRect(0,0,64,64);g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;for(let i=0;i<=64;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i,64);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(64,i);g.stroke()}},true);return t})())}
function adTex(led,col){return canvasTex(1024,32,(g,w,h)=>{const ads=['AURORA BANK','VOLTA ENERGY','KESTREL AIR','NORTHWIND','PIXELCORE','BREWHOUSE','ZEPHYR MOBILE','GRANITE INS.'];
 for(let i=0;i<8;i++){const x=i*128;g.fillStyle=led?(i%2?col:'#0b1220'):['#1d4ed8','#f8fafc','#b91c1c','#065f46','#111827','#f59e0b','#7c3aed','#0e7490'][i];g.fillRect(x,0,128,h);
  g.fillStyle=led?(i%2?'#fff':col):(i===1||i===5?'#111':'#fff');g.font='900 17px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(ads[i],x+64,h/2+1)}},true)}
function screenTex(home,away){return canvasTex(512,288,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#0f2a55');gr.addColorStop(1,'#04101f');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font='900 46px Arial';g.textAlign='center';
 g.fillText(home.slice(0,12).toUpperCase(),w/2,70);g.font='900 110px Arial';g.fillStyle='#ffd34d';g.fillText('2 - 1',w/2,180);g.font='700 36px Arial';g.fillStyle='#9fc2ff';g.fillText(away.slice(0,14).toUpperCase(),w/2,250)})}
function skyTex(night){return canvasTex(16,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);if(night){gr.addColorStop(0,'#01030a');gr.addColorStop(.6,'#0b1530');gr.addColorStop(1,'#26314d')}else{gr.addColorStop(0,'#5d93d6');gr.addColorStop(.55,'#a9cbee');gr.addColorStop(1,'#e8eef4')}g.fillStyle=gr;g.fillRect(0,0,w,h)})}
function groundTex(){return TEX.ground||(TEX.ground=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#5f7d47';g.fillRect(0,0,w,h);for(let i=0;i<5000;i++){g.fillStyle=`rgba(${Math.random()<.5?'40,60,30':'130,150,90'},.18)`;g.fillRect(Math.random()*w,Math.random()*h,3,3)}},true))}
function parkTex(){return TEX.park||(TEX.park=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#4a4f57';g.fillRect(0,0,w,h);g.fillStyle='#e5e7eb';for(let r=0;r<4;r++)for(let i=0;i<=16;i++)g.fillRect(i*16,r*64+8,2,22);for(let r=0;r<4;r++)g.fillRect(0,r*64+30,w,2)}))}
function lampTex(){return TEX.lamp||(TEX.lamp=canvasTex(64,48,(g,w,h)=>{g.fillStyle='#222';g.fillRect(0,0,w,h);for(let y=0;y<4;y++)for(let x=0;x<6;x++){g.fillStyle='#fff';g.beginPath();g.arc(6+x*10.4,7+y*11.5,4.2,0,7);g.fill()}}))}
function winTex(){return TEX.win||(TEX.win=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#2a3340';g.fillRect(0,0,w,h);for(let y=0;y<8;y++)for(let x=0;x<8;x++){g.fillStyle=Math.random()<.55?'#ffd98a':'#3b4656';g.fillRect(x*16+3,y*16+4,10,9)}},true))}
// ---------- geometry builder ----------
class GB{constructor(){this.p=[];this.c=[];this.uv=[];this.i=[]}
 quad(a,b,c,d,col,uv){const n=this.p.length/3;for(const v of[a,b,c,d])this.p.push(v[0],v[1],v[2]);for(let k=0;k<4;k++)this.c.push(col.r,col.g,col.b);
  const u=uv||[0,0,1,0,1,1,0,1];this.uv.push(...u);this.i.push(n,n+1,n+2,n,n+2,n+3)}
 tri(a,b,c,col){const n=this.p.length/3;for(const v of[a,b,c])this.p.push(v[0],v[1],v[2]);for(let k=0;k<3;k++)this.c.push(col.r,col.g,col.b);this.uv.push(0,0,1,0,0,1);this.i.push(n,n+1,n+2)}
 box(p1,p2,w,col,hgt){// beam from p1 to p2 (arrays) with square section w
  const a=V(...p1),b=V(...p2),dir=b.clone().sub(a).normalize();let up=Math.abs(dir.y)>.9?V(1,0,0):V(0,1,0);const s=V().crossVectors(dir,up).normalize().multiplyScalar(w/2),u=V().crossVectors(s,dir).normalize().multiplyScalar((hgt||w)/2);
  const P=(o,x,y)=>o.clone().add(s.clone().multiplyScalar(x)).add(u.clone().multiplyScalar(y)).toArray();
  const fs=[[-1,-1],[1,-1],[1,1],[-1,1]];for(let k=0;k<4;k++){const [x1,y1]=fs[k],[x2,y2]=fs[(k+1)%4];this.quad(P(a,x1,y1),P(a,x2,y2),P(b,x2,y2),P(b,x1,y1),col)}}
 mesh(mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));
  g.setIndex(this.p.length/3>65535?new THREE.Uint32BufferAttribute(this.i,1):new THREE.Uint16BufferAttribute(this.i,1));g.computeVertexNormals();return new THREE.Mesh(g,mat)}}
// ---------- palette ----------
function palette(d,club){const th=d.extras.theme;const cc=C(club);
 if(th==='mono')return{seat:C('#2b2f36'),alt:C('#e5e7eb'),acc:C('#ffffff'),led:'#ffffff'};if(th==='classic')return{seat:C('#7a1f24'),alt:C('#e9e1d2'),acc:C('#c9a227'),led:'#c9a227'};
 if(th==='neon')return{seat:cc.clone().multiplyScalar(.8),alt:C('#111'),acc:C('#ff2fd6'),led:'#ff2fd6'};return{seat:cc,alt:C('#f5f5f5'),acc:cc,led:club}}
const resolveCol=(v,pal)=>v==='club'||!v?pal.seat:v==='alt'?pal.alt:C(v);
function maskFor(st,cols,rows,club,ini){if(st.pattern!=='letters'&&st.pattern!=='crest')return null;const c=document.createElement('canvas');c.width=cols;c.height=rows;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,cols,rows);g.fillStyle='#fff';
 if(st.pattern==='letters'){const t=(st.text||ini.word).toUpperCase();let fs=rows*0.8;g.font=`900 ${fs}px Arial`;while(g.measureText(t).width>cols*0.92&&fs>4){fs-=1;g.font=`900 ${fs}px Arial`}g.textAlign='center';g.textBaseline='middle';g.fillText(t,cols/2,rows/2+1)}
 else{const r=rows*0.42;g.beginPath();g.arc(cols/2,rows/2,r,0,7);g.fill();g.fillStyle='#000';g.beginPath();g.arc(cols/2,rows/2,r*0.8,0,7);g.fill();g.fillStyle='#fff';g.font=`900 ${r*0.9}px Arial`;g.textAlign='center';g.textBaseline='middle';g.fillText(ini.short,cols/2,rows/2+1)}
 const data=g.getImageData(0,0,cols,rows).data;return(ci,rg)=>data[((rows-1-rg)*cols+ci)*4]>110}
// ---------- stand builder ----------
const CONC=C('#cdc8be'),CONC2=C('#9f9a92'),DARK=C('#2a2b2e'),SOFF=C('#77736c'),FLOOR=C('#8d8a85'),GLASS=C('#7fb2d6');
function buildSeg(seg,ctx){const{d,pal,crowd,underCon,club}=ctx;const st=seg.st,sec=seg.sec,pts=seg.pts,n=pts.length;const body=new GB(),seats=new GB(),fac=new GB(),glass=new GB();
 const P=(i,dd,h)=>{const p=pts[i];return[p.x+p.nx*dd,h,p.z+p.nz*dd]};
 const totalRows=sec.tiers.reduce((a,t)=>a+t.rows,0);const cols=n-1;const mask=underCon?null:maskFor(st,cols,totalRows,club,ctx.ini);
 const base=resolveCol(st.seatColor,pal),patc=resolveCol(st.patColor,pal);const fill=ctx.fill;
 const away=d.ops.away===seg.key||(seg.ab&&d.ops.away===seg.ab[0]&&0),family=d.ops.family===seg.key;
 const tmp=new THREE.Color();
 const cellCol=(ci,rg,ti,ri,t)=>{if(underCon)return CONC2;const aisle=seg.kind!=='cstand'&&ci%8===4;if(aisle)return CONC;if(t.rows>12&&Math.abs(ri-(t.rows>>1))<=1&&ci%16===12)return DARK;
  let c=base;const p=st.pattern;if(p==='stripes'&&(rg/3|0)%2)c=patc;else if(p==='checker'&&((ci/4|0)+(rg/4|0))%2)c=patc;else if(p==='mosaic'){const h=hash(ci,rg,7);c=h<.3?patc:h<.4?pal.alt:base}else if(p==='tiers'&&ti%2)c=patc;else if(mask&&mask(ci,rg))c=patc;
  if(st.directors&&seg.kind==='stand'&&ti===0&&ri>=t.rows-4&&Math.abs(ci-cols/2)<cols*0.09)c=C('#7d1426');
  if(family&&ci<cols*0.3)c=tmp.copy(c).lerp(C('#ffffff'),.25);
  if(crowd){const h=hash(ci*3+1,rg*5+2,seg.key.charCodeAt(0));if(h<fill){const k=hash(ci,rg,99);return away?(k<.6?C('#f7d417'):k<.85?C('#1d2b4f'):C('#e8e8e8')):(k<.55?C(club):k<.78?C('#f2f2f2'):k<.9?C('#1c2333'):C(club).multiplyScalar(.6))}}return c};
 const shade=(c,f)=>tmp.copy(c).multiplyScalar(f).clone();
 let rg0=0;
 sec.tiers.forEach((t,ti)=>{const next=sec.tiers[ti+1];const bottom=ti===0?0:t.h0-1.2;const backBottom=ti===0?0:Math.max(bottom,t.top-5);
  // AO factor: covered by tier above if d > next.d0
  const cov=dd=>next&&dd>next.d0?0.62:1;const outline=[];
  outline.push([t.d0,bottom,'w'],[t.d0,t.h0+0.9,'w'],[t.d0+0.3,t.h0+0.9,'w'],[t.d0+0.3,t.h0,'w']);
  const x0=t.d0+0.3;
  // front wall + parapet
  for(let i=0;i<cols;i++){for(let k=0;k<3;k++){const A=outline[k],B=outline[k+1];body.quad(P(i,A[0],A[1]),P(i+1,A[0],A[1]),P(i+1,B[0],B[1]),P(i,B[0],B[1]),k===0?CONC:shade(CONC,.9))}}
  // rows
  for(let r=0;r<t.rows;r++){const dA=x0+r*t.rd,dB=dA+t.rd,h=t.h0+r*t.rise,h2=h+t.rise,f=cov(dA+0.4);
   for(let i=0;i<cols;i++){const c=cellCol(i,rg0+r,ti,r,t);const u0=pts[i].u/4,u1=pts[i+1].u/4;
    seats.quad(P(i,dA,h),P(i+1,dA,h),P(i+1,dB,h),P(i,dB,h),shade(c,f),[u0,0,u1,0,u1,.55,u0,.55]);
    seats.quad(P(i,dB,h),P(i+1,dB,h),P(i+1,dB,h2),P(i,dB,h2),shade(c,f*0.72),[u0,.55,u1,.55,u1,1,u0,1])}}
  rg0+=t.rows;const dEnd=x0+t.rows*t.rd;
  // concourse floor to back, inner back wall up to next soffit / top
  const segsB=[[dEnd,t.top,sec.dMax,t.top,FLOOR]];if(!next)segsB.push([sec.dMax,t.top,sec.dMax,sec.backH,CONC2]);
  segsB.push([sec.dMax,sec.backH*(next?0:1)+(next?t.top:0),sec.dMax,next?t.top:sec.backH,CONC2]);
  // back down & soffit (underside)
  segsB.push([sec.dMax,next?t.top:sec.backH,sec.dMax,backBottom,SOFF]);if(ti>0)segsB.push([sec.dMax,backBottom,t.d0,bottom,SOFF]);
  for(const [a0,b0,a1,b1,col] of segsB){if(Math.abs(a0-a1)<1e-3&&Math.abs(b0-b1)<1e-3)continue;for(let i=0;i<cols;i++)body.quad(P(i,a0,b0),P(i+1,a0,b0),P(i+1,a1,b1),P(i,a1,b1),col)}
  // exec boxes glass / dark recess between this tier and next
  if(next){const gh=next.h0-1.2-t.top;const dg=Math.min(dEnd+0.4,sec.dMax-0.5);for(let i=0;i<cols;i++)(next.boxes?glass:body).quad(P(i,dg,t.top),P(i+1,dg,t.top),P(i+1,dg,t.top+gh*0.85),P(i,dg,t.top+gh*0.85),next.boxes?GLASS:DARK)}
  // end caps
  const poly=[[t.d0,bottom],[t.d0,t.h0+0.9],[t.d0+0.3,t.h0+0.9],[t.d0+0.3,t.h0]];for(let r=0;r<t.rows;r++){poly.push([x0+(r+1)*t.rd,t.h0+r*t.rise],[x0+(r+1)*t.rd,t.h0+(r+1)*t.rise])}
  poly.push([sec.dMax,t.top]);if(!next)poly.push([sec.dMax,sec.backH]);poly.push([sec.dMax,backBottom]);
  const capAt=(i,sgn)=>{const v2=poly.map(p=>new THREE.Vector2(p[0],p[1]));const tris=THREE.ShapeUtils.triangulateShape(v2,[]);const tn=V(pts[i].nz*-1,0,pts[i].nx).multiplyScalar(-1);
   // tangent t = (-nz?) : n=(tz,-tx) => t=(-nz,nx)
   const tv=V(-pts[i].nz,0,pts[i].nx);for(const [a,b,c] of tris){let A=P(i,...poly[a]),B=P(i,...poly[b]),Cc=P(i,...poly[c]);const nrm=V().crossVectors(V(...B).sub(V(...A)),V(...Cc).sub(V(...A)));if(nrm.dot(tv)*sgn<0){const s=B;B=Cc;Cc=s}body.tri(A,B,Cc,CONC2)}};
  if(seg.capStart)capAt(0,-1);if(seg.capEnd)capAt(n-1,1)});
 // facade (outer skin)
 const fh=sec.backH,fd=sec.dMax+0.6;
 for(let i=0;i<cols;i++){const u0=pts[i].u/8,u1=pts[i+1].u/8;fac.quad(P(i,fd,fh),P(i+1,fd,fh),P(i+1,fd,0),P(i,fd,0),C('#ffffff'),[u0,fh/8,u1,fh/8,u1,0,u0,0]);
  body.quad(P(i,sec.dMax,fh),P(i+1,sec.dMax,fh),P(i+1,fd,fh),P(i,fd,fh),CONC2)}
 if(seg.capStart||seg.capEnd)for(const [i,sgn] of [[0,-1],[n-1,1]]){if(sgn<0&&!seg.capStart||sgn>0&&!seg.capEnd)continue;const a=P(i,sec.dMax,0),b=P(i,fd,0),c=P(i,fd,fh),e=P(i,sec.dMax,fh);if(sgn<0)body.quad(b,a,e,c,CONC2);else body.quad(a,b,c,e,CONC2)}
 return{body,seats,fac,glass}}
// ---------- roof ----------
function buildRoof(seg,ctx,G2){const st=seg.st,sec=seg.sec,pts=seg.pts,n=pts.length,R0=SD.ROOF[st.roof];if(!R0.cover||!sec.tiers.length)return null;const roof=new GB(),poly=new GB(),steel=new GB();
 const P=(i,dd,h)=>{const p=pts[i];return[p.x+p.nx*dd,h,p.z+p.nz*dd]};const rc=C(ctx.d.roofColor),under=C('#dfe3e8'),stc=C(st.roof==='goalpost'||st.roof==='tension'?'#f4f4f4':'#d0d4da');
 const dB=sec.dMax+1.2,hb=sec.backH+0.8,full=R0.cover>=1;const dF=full?-2.5:sec.dMax*(1-R0.cover),hf=hb+(full?3:1.2);const memb=st.roof==='membrane';
 const polyD=ctx.d.poly&&full?Math.min(7,(dB-dF)*0.3):0;const dP=dF+polyD;
 const sag=(i,f)=>memb?-Math.sin(Math.PI*((pts[i].u/18)%1))*1.6*Math.sin(Math.PI*f):0;
 const steps=memb?5:1;
 for(let i=0;i<n-1;i++){for(let s=0;s<steps;s++){const f0=s/steps,f1=(s+1)/steps;const da=dP+(dB-dP)*f0,db=dP+(dB-dP)*f1,ha=hf+(hb-hf)*((da-dF)/(dB-dF)),hbb=hf+(hb-hf)*((db-dF)/(dB-dF));
   roof.quad(P(i,da,ha+sag(i,f0)),P(i+1,da,ha+sag(i+1,f0)),P(i+1,db,hbb+sag(i+1,f1)),P(i,db,hbb+sag(i,f1)),rc);
   roof.quad(P(i,db,hbb-0.5+sag(i,f1)),P(i+1,db,hbb-0.5+sag(i+1,f1)),P(i+1,da,ha-0.5+sag(i+1,f0)),P(i,da,ha-0.5+sag(i,f0)),under)}
  if(polyD){const hP=hf+(hb-hf)*((dP-dF)/(dB-dF));poly.quad(P(i,dF,hf),P(i+1,dF,hf),P(i+1,dP,hP),P(i,dP,hP),C('#dfefff'))}
  roof.quad(P(i,dF,hf-0.6),P(i+1,dF,hf-0.6),P(i+1,dF,hf+0.2),P(i,dF,hf+0.2),C('#8a9099'))}
 const L=pts[n-1].u;const every=st.roof==='tension'?24:14;const sup=[];for(let u=every/2;u<L;u+=every){let i=0;while(i<n-2&&pts[i+1].u<u)i++;sup.push(i)}
 if(st.roof==='cantilever'||st.roof==='retractable')sup.forEach(i=>{steel.box(P(i,dB,hb),P(i,dB-6,hb+6),0.5,stc);steel.box(P(i,dB-6,hb+6),P(i,dF+1,hf+0.6),0.45,stc);steel.box(P(i,dB,0),P(i,dB,hb),0.8,stc)});
 if(st.roof==='partial')sup.forEach(i=>{steel.box(P(i,dB,hb),P(i,dF+0.5,hf+0.3),0.35,stc)});
 if(st.roof==='classic'||st.pillars){sup.forEach((i,k)=>{if(k%1)return;const dd=Math.max(dF+2,sec.tiers[0].d0+sec.tiers[0].rows*sec.tiers[0].rd*0.25);const t=sec.tiers.find(t=>dd>=t.d0&&dd<=t.dEnd)||sec.tiers[0];const h0=t.h0+(dd-t.d0)/t.rd*t.rise;steel.box(P(i,dd,h0),P(i,dd,hf+(hb-hf)*((dd-dF)/(dB-dF))-0.4),0.35,C('#3b4250'))})}
 if(st.roof==='goalpost'){const th=2.4;for(let i=0;i<n-1;i++){steel.box(P(i,dF+0.6,hf+0.2),P(i+1,dF+0.6,hf+0.2),0.5,stc);steel.box(P(i,dF+0.6,hf+th),P(i+1,dF+0.6,hf+th),0.5,stc);steel.box(P(i,dF+0.6,hf+0.2),P(i+1,dF+0.6,hf+th),0.25,stc)}
  const t0=V(-pts[0].nz,0,pts[0].nx),t1=V(-pts[n-1].nz,0,pts[n-1].nx);const e0=V(...P(0,dF+0.6,0)).addScaledVector(t0,-2.5),e1=V(...P(n-1,dF+0.6,0)).addScaledVector(t1,2.5);
  steel.box([e0.x,0,e0.z],[e0.x,hf+th,e0.z],1.4,stc);steel.box([e1.x,0,e1.z],[e1.x,hf+th,e1.z],1.4,stc);steel.box([e0.x,hf+th,e0.z],P(0,dF+0.6,hf+th),1,stc);steel.box([e1.x,hf+th,e1.z],P(n-1,dF+0.6,hf+th),1,stc)}
 let cables=null;if(st.roof==='tension'||memb){const lp=[];sup.forEach(i=>{const mt=P(i,dB+5,hb+(memb?14:20));steel.box(P(i,dB+5,0),mt,0.9,stc);lp.push(...mt,...P(i,dF+1,hf),...mt,...P(i,(dF+dB)/2,(hf+hb)/2+0.3),...mt,...P(i,dB+16,0))});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));cables=new THREE.LineSegments(g,ctx.mats.cable)}
 return{roof,poly,steel,cables,dF,hf,hb,dB}}
// ---------- main build ----------
function disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
function mats(){if(R.M)return R.M;const M={};const std=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.85,metalness:0},o));
 M.body=std({vertexColors:true,roughness:.92});M.seats=std({vertexColors:true,map:seatTex(),roughness:.8});M.crowd=std({vertexColors:true,map:crowdTex(),roughness:.9});
 M.glass=std({vertexColors:true,roughness:.15,metalness:.4,emissive:C('#ffd38a'),emissiveIntensity:0});M.roof=std({vertexColors:true,roughness:.6,metalness:.25,side:THREE.DoubleSide});
 M.membrane=std({vertexColors:true,roughness:.7,transparent:true,opacity:.9,side:THREE.DoubleSide});M.poly=std({vertexColors:true,transparent:true,opacity:.45,roughness:.2,depthWrite:false,side:THREE.DoubleSide});
 M.steel=std({vertexColors:true,roughness:.5,metalness:.5});M.cable=new THREE.LineBasicMaterial({color:'#e5e7eb'});M.scaff=new THREE.LineBasicMaterial({color:'#c08a3e'});
 M.lamp=new THREE.MeshBasicMaterial({map:lampTex(),color:'#777'});M.white=std({color:'#ffffff',roughness:.4});M.net=new THREE.MeshBasicMaterial({map:netTex(),transparent:true,side:THREE.DoubleSide,depthWrite:false});
 M.crane=std({color:'#f2b705',roughness:.6,metalness:.3});M.track=std({color:'#b5452f',roughness:.95});M.apron=std({color:'#a3a29d',roughness:.95});M.inner=std({color:'#36502f',roughness:1});
 M.grass=std({map:groundTex(),roughness:1});M.grass.map.repeat.set(60,60);M.city=std({vertexColors:true,roughness:.8});M.win=std({map:winTex(),emissive:C('#ffffff'),emissiveMap:winTex(),emissiveIntensity:0,roughness:.4});
 M.park=std({map:parkTex(),roughness:.95});M.ghostOk=new THREE.MeshBasicMaterial({color:'#22d3a6',transparent:true,opacity:.45});M.ghostBad=new THREE.MeshBasicMaterial({color:'#f87171',transparent:true,opacity:.45});
 M.sel=new THREE.MeshBasicMaterial({color:'#22d3a6',transparent:true,opacity:.22,depthWrite:false});M.foundation=std({color:'#8b8b85',transparent:true,opacity:.7});return R.M=M}
function std(c,o){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8},o))}
function build(d,opts){const M=mats();if(R.root){R.scene.remove(R.root);disposeGroup(R.root)}const root=new THREE.Group();R.root=root;R.scene.add(root);R.pick=[];R.dyn=[];R.spots.forEach(s=>s.userData.on=false);
 const club=opts.club||'#c0392b',pal=palette(d,club),G2=SD.geometry(d),I=G2.I;R.G2=G2;R.design=d;R.opts=opts;const closed=opts.closed||new Set();
 const words=(opts.clubName||'Club').split(' ');const ini={word:words[0].slice(0,10),short:words.map(w=>w[0]).join('').slice(0,3)};
 const ctx={d,pal,club,crowd:opts.crowd,fill:opts.fill||0.85,ini,mats:M};
 const facMat=t=>{const key='fm'+t+club;if(R[key])return R[key];const tex=facadeTex(t,club);const m=std('#ffffff',{map:tex,roughness:t==='glass'?.2:t==='metal'?.45:.9,metalness:t==='glass'?.3:t==='metal'?.5:0});
  R.nightMats=R.nightMats||new Set();if(t==='etfe'){m.emissive=C(club);m.emissiveMap=tex;m.emissiveIntensity=0;R.nightMats.add([m,1.3])}if(t==='glass'){m.emissive=C('#ffcf7a');m.emissiveMap=winTex();m.emissiveIntensity=0;R.nightMats.add([m,0.8])}if(t==='brick'||t==='concrete'){m.emissive=C('#ffd9a0');m.emissiveIntensity=0;m.emissiveMap=tex;R.nightMats.add([m,0.06])}return R[key]=m};
 const roofs={};
 G2.segs.forEach(seg=>{const uc=closed.has('stand:'+seg.key);const parts=buildSeg(seg,Object.assign({},ctx,{underCon:uc}));const grp=new THREE.Group();grp.userData.key=seg.key;
  const add=(gb,m,cast=true)=>{if(!gb.p.length)return null;const me=gb.mesh(m);me.castShadow=cast;me.receiveShadow=true;me.userData.key=seg.kind==='stand'?seg.key:(seg.ab?seg.ab[0]:seg.key);grp.add(me);R.pick.push(me);return me};
  add(parts.body,M.body);add(parts.seats,opts.crowd&&!uc?M.crowd:M.seats);add(parts.glass,M.glass,false);add(parts.fac,uc?M.body:facMat(seg.st.facade||d.facade));
  if(!uc&&!closed.has('roof:'+seg.key)&&seg.kind!=='cstand'){const r=buildRoof(seg,ctx,G2);if(r){roofs[seg.key]=r;const rm=r.roof.mesh(seg.st.roof==='membrane'?M.membrane:M.roof);rm.castShadow=true;rm.receiveShadow=true;grp.add(rm);
   if(r.poly.p.length)grp.add(r.poly.mesh(M.poly));if(r.steel.p.length){const s=r.steel.mesh(M.steel);s.castShadow=true;grp.add(s)}if(r.cables)grp.add(r.cables)}}
  if(uc||closed.has('roof:'+seg.key))addConstruction(grp,seg,M);root.add(grp)});
 R.roofs=roofs;
 // ground, apron, pitch
 const big=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),M.grass);big.rotation.x=-Math.PI/2;big.position.y=-0.05;big.receiveShadow=true;root.add(big);
 const ext=G2.ext;const ap=new THREE.Mesh(new THREE.PlaneGeometry(ext*2+40,ext*1.72+40),M.apron);ap.rotation.x=-Math.PI/2;ap.position.y=-0.02;ap.receiveShadow=true;root.add(ap);
 const inner=new THREE.Mesh(new THREE.PlaneGeometry((I.hx+I.g)*2+4,(I.hz+I.g)*2+4),M.inner);inner.rotation.x=-Math.PI/2;inner.position.y=0.0;inner.receiveShadow=true;root.add(inner);
 const P=SD.PSIZE[d.pitch.size]||SD.PSIZE.std;if(I.track){const sh=roundRect(I.hx+I.g-1,I.hz+I.g-1,Math.max(I.rc+I.g-1,I.hz+I.g-1));sh.holes.push(roundRect(I.hx+3,I.hz+3,Math.max(I.rc+3,I.hz+2),true));const tm=new THREE.Mesh(new THREE.ShapeGeometry(sh,24),M.track);tm.rotation.x=Math.PI/2;tm.position.y=0.01;tm.receiveShadow=true;root.add(tm)}
 const ptex=pitchTex(d.pitch,P);const pm=new THREE.Mesh(new THREE.PlaneGeometry(P.L+10,P.W+10),std('#ffffff',{map:ptex,roughness:d.pitch.surface==='artificial'?.6:.95}));pm.rotation.x=-Math.PI/2;pm.position.y=0.02;pm.receiveShadow=true;root.add(pm);R.dyn.push(()=>ptex.dispose&&0);
 buildGoals(root,P,d.pitch.goals,M);buildBoards(root,P,d,pal,club,M);
 // floodlights
 buildLights(root,d,G2,roofs,M,closed);
 buildExtras(root,d,G2,roofs,M,club,opts,closed);
 buildSite(root,d,M,closed,club);buildCity(root,G2);
 if(d.retract||Object.values(d.stands).some(s=>s.roof==='retractable')){const w=(I.hx+I.g+6),h=(I.hz+I.g+6),op=d.retract===2?0.05:1;const pm2=std('#e6eaf0',{transparent:true,opacity:.92,metalness:.3,roughness:.4});
  const ymax=Math.max(...Object.values(roofs).map(r=>r.hf),20)+3;for(const s of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(w,0.6,h*2),pm2);m.position.set(s*(w/2+(op>0.5?w*0.95:0)),ymax,0);m.castShadow=true;root.add(m)}
  const rail=new GB();for(const z of[-h,h])rail.box([-w*2,ymax+0.5,z],[w*2,ymax+0.5,z],1.2,C('#9aa3ad'));root.add(rail.mesh(M.steel))}
 setNight(R.night,true);R.dirty=true;return G2}
function roundRect(hx,hz,r,hole){r=Math.min(r,hz,hx);const s=hole?new THREE.Path():new THREE.Shape();s.moveTo(-hx+r,-hz);s.lineTo(hx-r,-hz);s.absarc(hx-r,-hz+r,r,-Math.PI/2,0);s.lineTo(hx,hz-r);s.absarc(hx-r,hz-r,r,0,Math.PI/2);s.lineTo(-hx+r,hz);s.absarc(-hx+r,hz-r,r,Math.PI/2,Math.PI);s.lineTo(-hx,-hz+r);s.absarc(-hx+r,-hz+r,r,Math.PI,Math.PI*1.5);return s}
function addConstruction(grp,seg,M){const sec=seg.sec,pts=seg.pts,n=pts.length;const P=(i,dd,h)=>{const p=pts[i];return[p.x+p.nx*dd,h,p.z+p.nz*dd]};const lp=[];const fd=sec.dMax+2,H=sec.backH+3;
 for(let i=0;i<n;i+=1){lp.push(...P(i,fd,0),...P(i,fd,H))}for(let h=0;h<=H;h+=2.2){for(let i=0;i<n-1;i++)lp.push(...P(i,fd,h),...P(i+1,fd,h))}for(let i=0;i<n-1;i+=2)lp.push(...P(i,fd,0),...P(i+1,fd,H));
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));grp.add(new THREE.LineSegments(g,M.scaff));
 const cr=(i,ang)=>{const b=V(...P(i,sec.dMax+12,0)),h=H+26;const gb=new GB(),y=C('#f2b705');gb.box([b.x,0,b.z],[b.x,h,b.z],2,y);const dir=V(-pts[i].nx,0,-pts[i].nz).applyAxisAngle(V(0,1,0),ang);
  const tip=b.clone().addScaledVector(dir,48);gb.box([b.x,h,b.z],[tip.x,h,tip.z],1.2,y,1.6);const back=b.clone().addScaledVector(dir,-14);gb.box([b.x,h,b.z],[back.x,h,back.z],1.4,y);gb.box([back.x,h-1.5,back.z],[back.x+0.01,h-4,back.z],3,C('#555'));gb.box([b.x,h,b.z],[b.x,h+7,b.z],1,y);
  const m=gb.mesh(M.crane);m.castShadow=true;grp.add(m);const cg=new THREE.BufferGeometry();const hk=b.clone().addScaledVector(dir,32);cg.setAttribute('position',new THREE.Float32BufferAttribute([hk.x,h,hk.z,hk.x,h*0.45,hk.z,b.x,h+7,b.z,tip.x,h,tip.z,b.x,h+7,b.z,back.x,h,back.z],3));grp.add(new THREE.LineSegments(cg,M.cable))};
 cr(Math.floor(n*0.3),0.25);if(n>20)cr(Math.floor(n*0.78),-0.4)}
function buildGoals(root,P,style,M){const gb=new GB(),w=C('#ffffff'),hw=3.66,ht=2.44;const nets=new GB();
 for(const s of[-1,1]){const x=s*P.L/2;const dep=style==='deep'?2.8:style==='classic'?2:1.6;const xb=x+s*dep;
  gb.box([x,0,-hw],[x,ht,-hw],0.12,w);gb.box([x,0,hw],[x,ht,hw],0.12,w);gb.box([x,ht,-hw-0.06],[x,ht,hw+0.06],0.12,w);
  const topB=style==='classic'?0.6:ht;const mid=style==='deep'?[x+s*1.2,ht]:null;
  // net planes
  const q=(a,b,c,e)=>{if(s>0)nets.quad(a,b,c,e,w,[0,0,6,0,6,3,0,3]);else nets.quad(b,a,e,c,w,[0,0,6,0,6,3,0,3])};
  q([xb,0,-hw],[xb,0,hw],[mid?mid[0]:xb,topB,hw],[mid?mid[0]:xb,topB,-hw]);q([x,ht,-hw],[x,ht,hw],[mid?mid[0]:xb,topB,hw],[mid?mid[0]:xb,topB,-hw]);
  for(const z of[-hw,hw]){nets.quad([x,0,z],[xb,0,z],[mid?mid[0]:xb,topB,z],[x,ht,z],w,[0,0,3,0,3,3,0,3])}
  if(style!=='box'){gb.box([x,ht,-hw],[mid?mid[0]:xb,topB,-hw],0.06,w);gb.box([x,ht,hw],[mid?mid[0]:xb,topB,hw],0.06,w)}
  // corner flags
  for(const z of[-1,1]){gb.box([x,0,z*P.W/2],[x,1.5,z*P.W/2],0.05,w)}}
 const g=gb.mesh(M.white);g.castShadow=true;root.add(g);root.add(nets.mesh(M.net))}
function buildBoards(root,P,d,pal,club,M){const led=d.pitch.boards==='led';const tex=adTex(led,pal.led||club);const m=std('#ffffff',{map:tex,emissive:C('#ffffff'),emissiveMap:tex,emissiveIntensity:led?0.6:0.05,roughness:.5});R.boardMat=m;R.boardLED=led;
 const gb=new GB(),w=C('#ffffff'),hx=P.L/2+4,hz=P.W/2+3.5,h=0.9;const seg=[[[-hx,-hz],[hx,-hz]],[[hx,hz],[-hx,hz]],[[-hx-1,hz-6],[-hx-1,-hz+6]],[[hx+1,-hz+6],[hx+1,hz-6]]];
 seg.forEach(([a,b])=>{const L=Math.hypot(b[0]-a[0],b[1]-a[1]);gb.quad([a[0],0.1,a[1]],[b[0],0.1,b[1]],[b[0],h,b[1]],[a[0],h,a[1]],w,[0,0,L/40,0,L/40,1,0,1]);gb.quad([b[0],0.1,b[1]],[a[0],0.1,a[1]],[a[0],h,a[1]],[b[0],h,b[1]],C('#333'),[0,0,0,0,0,0,0,0])});
 tex.repeat.set(1,1);const me=gb.mesh(m);root.add(me);R.boards=tex}
function buildLights(root,d,G2,roofs,M,closed){const I=G2.I;let ex=I.hx+I.g,ez=I.hz+I.g,hmax=10;G2.segs.forEach(s=>s.pts.forEach(p=>{ex=Math.max(ex,Math.abs(p.x+p.nx*s.sec.dMax));ez=Math.max(ez,Math.abs(p.z+p.nz*s.sec.dMax));hmax=Math.max(hmax,s.sec.backH)}));
 const heads=[];const lv=d.lightLevel;
 if(d.lights==='pylons'){const H=Math.max(42,hmax+22);for(const [sx,sz] of[[1,1],[1,-1],[-1,1],[-1,-1]]){const x=sx*(ex+6),z=sz*(ez+6);const gb=new GB(),c=C('#9aa1aa');
   for(const [ox,oz] of[[-1,-1],[1,-1],[1,1],[-1,1]])gb.box([x+ox*2.2,0,z+oz*2.2],[x+ox*0.6,H,z+oz*0.6],0.35,c);for(let h=4;h<H;h+=4){const f=1-h/H*0.73;for(const [a,b] of[[[-1,-1],[1,-1]],[[1,-1],[1,1]],[[1,1],[-1,1]],[[-1,1],[-1,-1]]])gb.box([x+a[0]*2.2*f,h,z+a[1]*2.2*f],[x+b[0]*2.2*f,h+4,z+b[1]*2.2*f],0.15,c)}
   const m=gb.mesh(M.steel);m.castShadow=true;root.add(m);const head=new THREE.Mesh(new THREE.PlaneGeometry(11,7.5),M.lamp);head.position.set(x,H+2,z);head.lookAt(0,0,0);root.add(head);const back=new THREE.Mesh(new THREE.BoxGeometry(11.4,7.9,0.6),std('#4b5563'));back.position.copy(head.position);back.quaternion.copy(head.quaternion);back.translateZ(-0.35);root.add(back);heads.push(head.position.clone())}}
 else if(d.lights==='roof'){const gb=new GB();for(const k in roofs){const r=roofs[k];const s=G2.segs.find(x=>x.key===k);if(!s)continue;const p=s.pts;for(let i=0;i<p.length-1;i++){const a=[p[i].x+p[i].nx*(r.dF+0.6),r.hf-1.0,p[i].z+p[i].nz*(r.dF+0.6)],b=[p[i+1].x+p[i+1].nx*(r.dF+0.6),r.hf-1.0,p[i+1].z+p[i+1].nz*(r.dF+0.6)];gb.box(a,b,0.9,C('#ffffff'),0.7)}
  const mid=p[p.length>>1];heads.push(V(mid.x+mid.nx*r.dF,r.hf,mid.z+mid.nz*r.dF))}if(gb.p.length){R.lampStrip=gb.mesh(M.lamp);root.add(R.lampStrip)}}
 R.heads=heads;const inten=[220,320,430,560][lv]||320;R.spots.forEach((sp,i)=>{const h=heads[i%Math.max(1,heads.length)];sp.userData.on=!!h&&d.lights!=='none';if(h){sp.position.copy(h);sp.userData.int=inten*(heads.length<4?4/Math.max(heads.length,1)*0.8:1)}const t=[[-25,0,-15],[25,0,15],[-25,0,15],[25,0,-15]][i];sp.target.position.set(...t)})}
function buildExtras(root,d,G2,roofs,M,club,opts,closed){const e=d.extras,I=G2.I;R.screens=[];const scrMat=()=>{const t=screenTex(opts.clubName||'Home',opts.oppName||'Visitors');const m=new THREE.MeshBasicMaterial({map:t});m.toneMapped=false;return m};
 const addScreen=(pos,w,h,legs)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),scrMat());m.position.copy(pos);m.lookAt(0,pos.y*0.4,0);root.add(m);const b=new THREE.Mesh(new THREE.BoxGeometry(w+0.8,h+0.8,1),std('#1f2937'));b.position.copy(pos);b.quaternion.copy(m.quaternion);b.translateZ(-0.55);b.castShadow=true;root.add(b);
  if(legs){const gb=new GB();const dir=V(0,0,0).sub(pos).setY(0).normalize();const side=V(-dir.z,0,dir.x);for(const s of[-1,1]){const p=pos.clone().addScaledVector(side,s*w*0.35).addScaledVector(dir,-0.8);gb.box([p.x,0,p.z],[p.x,pos.y-h/2,p.z],0.8,C('#4b5563'))}root.add(gb.mesh(M.steel))}R.screens.push(m)};
 const seg=k=>G2.segs.find(s=>s.key===k);const top=(k,dd)=>{const s=seg(k);if(!s)return null;const p=s.pts[s.pts.length>>1],r=roofs[k];const D=dd!=null?dd:(r?r.dF+3:s.sec.dMax-2);const y=r?r.hf+5:s.sec.backH+5;return V(p.x+p.nx*D,y,p.z+p.nz*D)};
 // corner screens / towers
 for(const c of SD.CORNERS){const t=I.corner(c);if(t!=='screen'&&t!=='tower')continue;const cc=G2.CC[c];const a=cc.a0+Math.PI/4,r=I.rc+I.g+12;const cx=cc.sx*(I.hx-I.rc)+Math.cos(a)*r,cz=cc.sz*(I.hz-I.rc)+Math.sin(a)*r;
  if(t==='screen')addScreen(V(cx,13,cz),16,9,true);else{const tw=new THREE.Mesh(new THREE.CylinderGeometry(4,5,30,16),std('#d1d5db'));tw.position.set(cx,15,cz);tw.castShadow=true;root.add(tw);const gl=new THREE.Mesh(new THREE.CylinderGeometry(6,5,5,16),R.M.glass.clone());gl.material.vertexColors=false;gl.material.color=C('#7fb2d6');gl.position.set(cx,32.5,cz);root.add(gl);const cap=new THREE.Mesh(new THREE.CylinderGeometry(6.6,6.6,0.8,16),std('#374151'));cap.position.set(cx,35.4,cz);root.add(cap)}}
 if(e.screens>=1){const p=top('N')||top('S');if(p)addScreen(p,14,8)}if(e.screens>=2){const p=top('S');if(p)addScreen(p,14,8)}if(e.screens>=4){for(const k of['W','E']){const s=seg(k);if(!s)continue;const p=s.pts[2];const r=roofs[k];const D=r?r.dF+3:s.sec.dMax-2,y=r?r.hf+4:s.sec.backH+4;addScreen(V(p.x+p.nx*D,y,p.z+p.nz*D),10,6)}}
 if(e.scoreboard){const s=seg('S')||seg('N');if(s){const p=s.pts[Math.floor(s.pts.length*0.2)],r=roofs[s.key];const y=(r?r.hb:s.sec.backH)+4;const m=new THREE.Mesh(new THREE.PlaneGeometry(10,3.2),new THREE.MeshBasicMaterial({map:textTex('HOME 2  1 AWAY',{bg:'#050a14',col:'#ffb020',w:512,h:160}),toneMapped:false}));m.position.set(p.x+p.nx*(s.sec.dMax-1),y,p.z+p.nz*(s.sec.dMax-1));m.lookAt(0,y,0);root.add(m);R.screens.push(m)}}
 if(e.clock){const s=seg('N')||seg('W');if(s){const p=s.pts[Math.floor(s.pts.length*0.8)],r=roofs[s.key];const y=(r?r.hb:s.sec.backH)+4;const t=canvasTex(128,128,(g)=>{g.fillStyle='#fff';g.beginPath();g.arc(64,64,60,0,7);g.fill();g.strokeStyle='#111';g.lineWidth=6;g.stroke();for(let i=0;i<12;i++){const a=i/6*Math.PI;g.fillStyle='#111';g.fillRect(64+Math.cos(a)*48-2,64+Math.sin(a)*48-2,4,4)}g.lineWidth=5;g.beginPath();g.moveTo(64,64);g.lineTo(64,22);g.moveTo(64,64);g.lineTo(92,70);g.stroke()});
  const m=new THREE.Mesh(new THREE.CircleGeometry(3,32),new THREE.MeshBasicMaterial({map:t,toneMapped:false}));m.position.set(p.x+p.nx*(s.sec.dMax-1),y,p.z+p.nz*(s.sec.dMax-1));m.lookAt(0,y,0);root.add(m)}}
 // wraparound LED ribbon at front of tier 2 (or tier 1)
 if(e.wrap){const gb=new GB();G2.segs.forEach(s=>{if(closed.has('stand:'+s.key))return;const t=s.sec.tiers[1]||s.sec.tiers[0];if(!t)return;const y0=s.sec.tiers[1]?t.h0-1.2:0.1,y1=t.h0+0.9;const p=s.pts;for(let i=0;i<p.length-1;i++){const dd=t.d0-0.05;gb.quad([p[i].x+p[i].nx*dd,y0,p[i].z+p[i].nz*dd],[p[i+1].x+p[i+1].nx*dd,y0,p[i+1].z+p[i+1].nz*dd],[p[i+1].x+p[i+1].nx*dd,y1,p[i+1].z+p[i+1].nz*dd],[p[i].x+p[i].nx*dd,y1,p[i].z+p[i].nz*dd],C('#fff'),[p[i].u/30,0,p[i+1].u/30,0,p[i+1].u/30,1,p[i].u/30,1])}});
  const tex=adTex(true,club);tex.wrapS=THREE.RepeatWrapping;const m=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});R.wrapTex=tex;root.add(gb.mesh(m))}
 // name sign on main stand facade
 const main=seg('W')||G2.segs[0];if(main&&e.sign){const p=main.pts[main.pts.length>>1],dd=main.sec.dMax+0.75;const name=(opts.signName||e.naming||(opts.clubName||'Club')+' Stadium').toUpperCase();const w=Math.min(main.pts[main.pts.length-1].u*0.7,name.length*2.6);const h=Math.max(2.5,Math.min(5,main.sec.backH*0.16));
  const tex=textTex(name,{col:'#ffffff',w:1024,h:128});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/8),new THREE.MeshStandardMaterial({map:tex,transparent:true,emissive:C('#ffffff'),emissiveMap:tex,emissiveIntensity:0}));R.signMat=m.material;
  m.position.set(p.x+p.nx*dd,main.sec.backH*0.72,p.z+p.nz*dd);m.lookAt(m.position.x+p.nx,m.position.y,m.position.z+p.nz);root.add(m)}
 if(e.crest!=='none'){const tex=crestTex(club,(opts.clubName||'C').split(' ').map(w=>w[0]).join('').slice(0,2));const mat=new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:.5});
  if(e.crest==='roof'&&roofs.W){const s=seg('W'),r=roofs.W,p=s.pts[s.pts.length>>1];const dd=(r.dF+r.dB)/2,y=Math.max(r.hf,r.hb)+0.6;const m=new THREE.Mesh(new THREE.PlaneGeometry(16,16),mat);m.rotation.order='YXZ';m.rotation.y=Math.atan2(-p.nx,-p.nz);m.rotation.x=-Math.PI/2;m.position.set(p.x+p.nx*dd,y,p.z+p.nz*dd);root.add(m)}
  else{const s=seg('E')||main;if(s){const p=s.pts[s.pts.length>>1],dd=s.sec.dMax+0.8,sz=Math.min(12,s.sec.backH*0.6);const m=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),mat);m.position.set(p.x+p.nx*dd,s.sec.backH*0.55,p.z+p.nz*dd);m.lookAt(m.position.x+p.nx,m.position.y,m.position.z+p.nz);root.add(m)}}}
 // dugouts, tunnel, media gantry
 const W=seg('W');if(W){const st=W.st;const z=-(I.hz+1.5);if(st.dugout){for(const x of[-9,9]){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(8,1.8,1.6),std('#1f2937'));b.position.y=0.9;g.add(b);const rf=new THREE.Mesh(new THREE.BoxGeometry(8.2,0.1,2.2),std('#bfe0ff',{transparent:true,opacity:.5}));rf.position.set(0,1.9,0.3);g.add(rf);g.position.set(x,0,z);root.add(g)}
  const tn=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,6,12,1,true,0,Math.PI),std(club,{side:THREE.DoubleSide}));tn.rotation.x=Math.PI/2;tn.rotation.z=Math.PI/2;tn.position.set(0,0,z-0.5);root.add(tn)}
  if(st.media&&roofs.W){const r=roofs.W,p=W.pts[W.pts.length>>1];const dd=Math.max(r.dF+4,2),y=r.hf-3;const m=new THREE.Mesh(new THREE.BoxGeometry(20,2.4,2.6),std('#374151'));m.position.set(p.x+p.nx*dd,y,p.z+p.nz*dd);m.lookAt(m.position.x+p.nx,y,m.position.z+p.nz);root.add(m);
   const g2=new THREE.Mesh(new THREE.PlaneGeometry(19,1.2),R.M.glass.clone());g2.material.vertexColors=false;g2.material.color=C('#88b4d4');g2.position.copy(m.position);g2.quaternion.copy(m.quaternion);g2.translateZ(-1.32);g2.rotateY(Math.PI);root.add(g2)}}}
function siteMesh(it,M,club){const S=SD.SITE[it.t],C0=SD.CELL;const w=(it.rot?S.h:S.w)*C0,h=(it.rot?S.w:S.h)*C0;const g=new THREE.Group();const add=(geo,mat,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m};
 const pave=std('#b9b5ad');const box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
 switch(it.t){case'carpark':{const p=add(new THREE.PlaneGeometry(w-2,h-2),M.park);p.rotation.x=-Math.PI/2;p.position.y=0.03;p.castShadow=false;const cars=new THREE.InstancedMesh(box(1.9,1.4,4.3),std('#ffffff',{roughness:.4,metalness:.5}),40);let k=0;const m4=new THREE.Matrix4();
  for(let r=0;r<4;r++)for(let i=0;i<10;i++){if(hash(i,r,it.x*7+it.z)<.35)continue;m4.makeTranslation(-w/2+3+i*(w-6)/10,0.7,-h/2+4+r*h/4.1);cars.setMatrixAt(k,m4);cars.setColorAt(k,C(['#e5e7eb','#111827','#b91c1c','#1d4ed8','#6b7280','#f59e0b'][hash(i,r,3)*6|0]));k++}cars.count=k;cars.castShadow=true;g.add(cars);break}
  case'msc':add(box(w-4,12,h-4),std('#9ca3af'),0,6,0);for(let f=1;f<4;f++)add(box(w-3,0.5,h-3),std('#6b7280'),0,f*3,0);break;
  case'hotel':add(box(w*0.5,42,h*0.45),M.win,0,21,0);add(box(w*0.8,8,h*0.8),std('#cbd5e1'),0,4,0);add(new THREE.PlaneGeometry(w*0.4,4),new THREE.MeshBasicMaterial({map:textTex('HOTEL',{col:'#fff',w:256,h:64}),transparent:true}),0,39,h*0.226);break;
  case'office':add(box(w*0.7,26,h*0.6),std('#7fa3c4',{metalness:.4,roughness:.25}),0,13,0);break;
  case'training':{const t=pitchTex({pattern:'stripes',surface:'grass'},{L:w-14,W:h-14});const p=add(new THREE.PlaneGeometry(w-4,h-4),std('#fff',{map:t}));p.rotation.x=-Math.PI/2;p.position.y=0.03;break}
  case'bus':add(box(w*0.8,0.3,h*0.4),pave,0,0.15,0);add(box(w*0.8,0.3,4),std('#1f2937'),0,3.5,0);add(box(11,3,2.6),std('#dc2626'),0,1.6,h*0.3);break;
  case'rail':add(box(w,0.8,8),pave,0,0.4,0);add(box(w,0.3,4),std('#3f3f46'),0,0.15,7);add(box(28,4,4),std('#e5e7eb'),0,2.5,7);add(box(16,5,6),std('#94a3b8'),0,2.5,-4);break;
  case'metro':add(box(10,4,8),std('#e5e7eb',{metalness:.3}),0,2,0);add(new THREE.PlaneGeometry(4,4),new THREE.MeshBasicMaterial({map:textTex('M',{bg:'#c0392b',w:128,h:128}),toneMapped:false}),0,5,4.05);add(box(0.4,6,0.4),std('#333'),4,3,4);break;
  case'plaza':{const p=add(new THREE.PlaneGeometry(w-1,h-1),pave);p.rotation.x=-Math.PI/2;p.position.y=0.04;add(new THREE.CylinderGeometry(4,4.5,0.8,24),std('#94a3b8'),0,0.4,0);add(new THREE.CylinderGeometry(3.4,3.4,0.2,24),std('#4aa3df',{roughness:.1}),0,0.75,0);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;tree(g,Math.cos(a)*w*0.36,Math.sin(a)*h*0.36)}break}
  case'turnstiles':for(let i=0;i<5;i++)add(box(1.6,2.4,1.2),std('#475569'),-6+i*3,1.2,0);add(box(16,0.3,4),std(club),0,3,0);break;
  case'stair':{const c=add(new THREE.CylinderGeometry(6,6,22,20,1,true),std('#d6d3cd',{side:THREE.DoubleSide}),0,11,0);for(let k=0;k<6;k++){const r=add(new THREE.TorusGeometry(6.4,0.35,6,24),std('#9ca3af'),0,2+k*3.6,0);r.rotation.x=Math.PI/2}break}
  case'shop':add(box(w*0.7,7,h*0.6),std('#e5e7eb'),0,3.5,0);add(new THREE.PlaneGeometry(w*0.6,2),new THREE.MeshBasicMaterial({map:textTex('CLUB SHOP',{bg:club,w:512,h:96}),toneMapped:false}),0,6,h*0.301);add(box(w*0.6,4,0.2),std('#7fb2d6',{metalness:.3,roughness:.15}),0,2,h*0.3);break;
  case'megastore':add(box(w*0.8,9,h*0.7),std('#f3f4f6'),0,4.5,0);add(new THREE.PlaneGeometry(w*0.6,2.6),new THREE.MeshBasicMaterial({map:textTex('MEGASTORE',{bg:club,w:512,h:96}),toneMapped:false}),0,7.5,h*0.351);break;
  case'statue':add(box(3,3,3),std('#d6d3cd'),0,1.5,0);add(new THREE.CapsuleGeometry(0.7,2.2,4,8),std('#8a6a2f',{metalness:.8,roughness:.35}),0,4.8,0);add(new THREE.SphereGeometry(0.45,10,8),std('#8a6a2f',{metalness:.8,roughness:.35}),0,6.6,0);break;
  case'honours':add(box(16,4,1),std('#3b3b3b'),0,2,0);add(new THREE.PlaneGeometry(15,3),std('#c9a227',{metalness:.9,roughness:.3}),0,2,0.51);break;
  case'ticket':add(box(8,4,5),std('#e5e7eb'),0,2,0);add(new THREE.PlaneGeometry(7,1.4),new THREE.MeshBasicMaterial({map:textTex('TICKETS',{bg:'#111827',w:256,h:64}),toneMapped:false}),0,3.4,2.51);break;
  case'fanzone':{const p=add(new THREE.PlaneGeometry(w-2,h-2),std('#6b8f4e'));p.rotation.x=-Math.PI/2;p.position.y=0.04;for(let i=0;i<5;i++){add(new THREE.ConeGeometry(3.5,4,4),std(i%2?club:'#ffffff'),-12+i*6,2,-8)}const s=add(new THREE.PlaneGeometry(10,6),new THREE.MeshBasicMaterial({map:screenTex('FAN','ZONE'),toneMapped:false}),0,6,10);s.rotation.y=Math.PI;break}
  case'museum':add(box(w*0.75,10,h*0.6),std('#e7e1d4'),0,5,0);for(let i=0;i<6;i++)add(new THREE.CylinderGeometry(0.6,0.6,9,10),std('#f5f0e6'),-w*0.3+i*w*0.12,4.5,h*0.32);add(box(w*0.8,1.4,h*0.68),std('#d6cfc0'),0,10.5,0);break;
  case'trees':for(let i=0;i<5;i++)tree(g,(hash(i,1,it.x)-.5)*14,(hash(i,2,it.z)-.5)*14);break}
 g.position.set((it.x)*C0+w/2,0,(it.z)*C0+h/2);return g}
function tree(g,x,z){const t=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,3,6),std('#6b4f2e'));t.position.set(x,1.5,z);g.add(t);const c=new THREE.Mesh(new THREE.IcosahedronGeometry(2.6,0),std('#3f6b35',{flatShading:true}));c.position.set(x,4.6,z);c.castShadow=true;g.add(c)}
function buildSite(root,d,M,closed,club){R.siteGroup=new THREE.Group();root.add(R.siteGroup);d.site.forEach(it=>{if(!SD.SITE[it.t])return;let m;if(closed.has('site:'+it.id)){const S=SD.SITE[it.t],w=(it.rot?S.h:S.w)*SD.CELL,h=(it.rot?S.w:S.h)*SD.CELL;m=new THREE.Mesh(new THREE.BoxGeometry(w-3,1,h-3),M.foundation);m.position.set(it.x*SD.CELL+w/2,0.5,it.z*SD.CELL+h/2)}else m=siteMesh(it,M,club);m.userData.site=it.id;m.traverse(o=>o.userData.site=it.id);R.siteGroup.add(m)})}
function buildCity(root,G2){if(!R.cityGeo){const gb=new GB();for(let i=0;i<140;i++){const a=hash(i,1)*Math.PI*2,r=290+hash(i,2)*260;const x=Math.cos(a)*r,z=Math.sin(a)*r,w=14+hash(i,3)*26,h=6+Math.pow(hash(i,4),2.5)*55,dd=14+hash(i,5)*26;const c=C().setHSL(.58+hash(i,7)*.08,.12,.32+hash(i,6)*.22);
  const y=h;const p=[[x-w/2,z-dd/2],[x+w/2,z-dd/2],[x+w/2,z+dd/2],[x-w/2,z+dd/2]];for(let k=0;k<4;k++){const a1=p[k],b1=p[(k+1)%4];gb.quad([b1[0],0,b1[1]],[a1[0],0,a1[1]],[a1[0],y,a1[1]],[b1[0],y,b1[1]],c)}gb.quad([p[0][0],y,p[0][1]],[p[3][0],y,p[3][1]],[p[2][0],y,p[2][1]],[p[1][0],y,p[1][1]],c.clone().multiplyScalar(.8))}
  for(let i=0;i<90;i++){}R.cityGeo=gb}root.add(R.cityGeo.mesh(R.M.city));const tg=new THREE.Group();for(let i=0;i<70;i++){const a=hash(i,9)*Math.PI*2,r=G2.ext+45+hash(i,8)*110;tree(tg,Math.cos(a)*r,Math.sin(a)*r)}root.add(tg)}
// ---------- scene, lights, camera ----------
function init(){if(R.renderer)return true;const cv=document.createElement('canvas');let rd;try{rd=new THREE.WebGLRenderer({canvas:cv,antialias:true,preserveDrawingBuffer:false,powerPreference:'high-performance'})}catch(e){return false}if(!rd.getContext())return false;
 R.renderer=rd;rd.outputColorSpace=THREE.SRGBColorSpace;rd.toneMapping=THREE.ACESFilmicToneMapping;rd.toneMappingExposure=1.0;rd.shadowMap.enabled=true;rd.shadowMap.type=THREE.PCFSoftShadowMap;
 R.quality=localStorage.getItem('cc_q')||'auto';R.pr=Math.min(window.devicePixelRatio||1,R.quality==='low'?1.25:2);rd.setPixelRatio(R.pr);
 const s=R.scene=new THREE.Scene();R.cam=new THREE.PerspectiveCamera(45,1,1,3000);R.cam.position.set(150,110,170);
 R.hemi=new THREE.HemisphereLight('#dbe8ff','#4a5a3a',0.9);s.add(R.hemi);R.sun=new THREE.DirectionalLight('#fff4e0',2.2);R.sun.position.set(120,180,80);R.sun.castShadow=true;const sc=R.sun.shadow.camera;sc.left=-200;sc.right=200;sc.top=200;sc.bottom=-200;sc.far=600;R.sun.shadow.mapSize.set(2048,2048);R.sun.shadow.bias=-0.0006;R.sun.shadow.normalBias=0.6;s.add(R.sun);
 R.spots=[];for(let i=0;i<4;i++){const sp=new THREE.SpotLight('#f4f8ff',0,420,0.62,0.55,1.2);sp.decay=1.2;s.add(sp);s.add(sp.target);R.spots.push(sp)}
 R.ctl=new OrbitControls(R.cam,cv);R.ctl.enableDamping=true;R.ctl.dampingFactor=0.08;R.ctl.maxPolarAngle=Math.PI*0.49;R.ctl.minDistance=15;R.ctl.maxDistance=650;R.ctl.screenSpacePanning=false;R.ctl.target.set(0,0,0);
 R.ctl.addEventListener('change',()=>{R.dirty=true;R.lastInteract=performance.now()});R.ctl.addEventListener('start',()=>{R.anim=null});
 R.ray=new THREE.Raycaster();R.night=false;R.frames=0;R.fpsT=performance.now();R.fps=60;R.lastInteract=performance.now();
 cv.addEventListener('pointerdown',e=>{R.down={x:e.clientX,y:e.clientY,t:performance.now()}});cv.addEventListener('pointermove',e=>{if(R.placing)hover(e)});
 cv.addEventListener('pointerup',e=>{if(!R.down)return;const moved=Math.hypot(e.clientX-R.down.x,e.clientY-R.down.y);if(moved<8&&performance.now()-R.down.t<500)tap(e);R.down=null});
 const loop=()=>{requestAnimationFrame(loop);if(!cv.isConnected||document.hidden)return;const now=performance.now();R.frames++;if(now-R.fpsT>1000){R.fps=R.frames*1000/(now-R.fpsT);R.frames=0;R.fpsT=now;autoQ()}
  if(R.anim){const a=R.anim,t=Math.min(1,(now-a.t0)/a.dur),k=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;R.cam.position.lerpVectors(a.p0,a.p1,k);R.ctl.target.lerpVectors(a.q0,a.q1,k);if(t>=1)R.anim=null;R.dirty=true}
  if(R.tour){const ang=0.0025;const p=R.cam.position.clone().sub(R.ctl.target);p.applyAxisAngle(V(0,1,0),ang);R.cam.position.copy(R.ctl.target).add(p);R.dirty=true}
  R.ctl.update();const live=R.boardLED||R.wrapTex;if(live){if(R.boards&&R.boardLED)R.boards.offset.x=(now/9000)%1;if(R.wrapTex)R.wrapTex.offset.x=-(now/14000)%1}
  const idle=now-R.lastInteract>2500&&!R.tour&&!R.anim;if(R.dirty||!idle||(live&&R.frames%3===0)){R.renderer.render(R.scene,R.cam);R.dirty=false}};loop();return true}
function autoQ(){if(R.quality!=='auto'||!R.mounted)return;if(performance.now()-R.lastInteract>2500&&!R.tour)return;R.fpsLog=(R.fpsLog||[]).concat(R.fps).slice(-3);const avg=R.fpsLog.reduce((a,b)=>a+b,0)/R.fpsLog.length;
 if(R.fpsLog.length>=3&&avg<26){if(R.renderer.shadowMap.enabled){R.renderer.shadowMap.enabled=false;R.scene.traverse(o=>{if(o.material)o.material.needsUpdate=true});R.fpsLog=[]}else if(R.pr>1){R.pr=Math.max(1,R.pr-0.5);R.renderer.setPixelRatio(R.pr);resize();R.fpsLog=[]}}}
function setQuality(q){R.quality=q;localStorage.setItem('cc_q',q);R.pr=Math.min(window.devicePixelRatio||1,q==='low'?1.25:2);R.renderer.setPixelRatio(R.pr);R.renderer.shadowMap.enabled=q!=='low';R.scene.traverse(o=>{if(o.material)o.material.needsUpdate=true});resize();R.dirty=true}
function resize(){const el=R.el;if(!el)return;const w=el.clientWidth,h=el.clientHeight;R.renderer.setSize(w,h,false);R.renderer.domElement.style.width=w+'px';R.renderer.domElement.style.height=h+'px';R.cam.aspect=w/h;R.cam.updateProjectionMatrix();R.dirty=true}
function mount(el){if(!init())return false;R.el=el;R.mounted=true;el.appendChild(R.renderer.domElement);resize();if(!R.ro){R.ro=new ResizeObserver(()=>resize());}R.ro.disconnect();R.ro.observe(el);return true}
function setNight(on,quiet){R.night=on;const s=R.scene;s.background=skyTex(on);s.fog=new THREE.Fog(on?'#0b1530':'#cfdcea',on?380:520,1500);R.hemi.intensity=on?0.55:0.9;R.hemi.color=C(on?'#8796c4':'#dbe8ff');R.hemi.groundColor=C(on?'#3a3530':'#4a5a3a');R.sun.intensity=on?0.12:1.9;R.sun.color=C(on?'#8aa0d6':'#fff4e0');
 R.renderer.toneMappingExposure=on?1.0:0.95;R.spots.forEach(sp=>sp.intensity=on&&sp.userData.on?sp.userData.int:0);const M=R.M;if(!M)return;M.lamp.color=C(on?'#ffffff':'#8a8f96');M.glass.emissiveIntensity=on?0.9:0;M.win.emissiveIntensity=on?1:0;
 (R.nightMats||new Set()).forEach(([m,v])=>m.emissiveIntensity=on?v:0);
 if(R.signMat)R.signMat.emissiveIntensity=on?1.2:0;if(R.boardMat)R.boardMat.emissiveIntensity=R.boardLED?(on?1.2:0.6):(on?0.25:0.05);R.dirty=true}
function camPresets(){const G2=R.G2,I=G2.I;const sec=k=>{const s=G2.segs.find(x=>x.key===k);return s?s.sec:{dMax:10,backH:8}};const ext=G2.ext;const W=sec('W'),E=sec('E'),N=sec('N'),S=sec('S');const zW=I.hz+I.g,xN=I.hx+I.g;
 return{hero:[[ext*1.05,ext*0.75,ext*1.25],[0,0,0]],broadcast:[[0,Math.max(18,W.backH*0.75),-(zW+W.dMax*0.65)],[0,0,6]],aerial:[[0.1,ext*2.3,ext*0.25],[0,0,0]],pitch:[[I.hx*0.75,1.8,-I.hz+6],[0,9,10]],
  W:[[0,W.backH*0.8+2,-(zW+W.dMax*0.75)],[0,4,0]],E:[[0,E.backH*0.8+2,zW+E.dMax*0.75],[0,4,0]],N:[[-(xN+N.dMax*0.75),N.backH*0.8+2,0],[0,4,0]],S:[[xN+S.dMax*0.75,S.backH*0.8+2,0],[0,4,0]],
  goal:[[-(I.hx+3),3.5,0],[10,3,0]],blimp:[[ext*0.2,ext*1.4,-ext*1.2],[0,0,0]]}}
function view(name,instant){const p=camPresets()[name];if(!p)return;R.tour=false;const a={p0:R.cam.position.clone(),q0:R.ctl.target.clone(),p1:V(...p[0]),q1:V(...p[1]),t0:performance.now(),dur:instant?1:900};if(instant){R.cam.position.copy(a.p1);R.ctl.target.copy(a.q1);R.ctl.update()}else R.anim=a;R.lastInteract=performance.now();R.dirty=true}
function ndc(e){const r=R.renderer.domElement.getBoundingClientRect();return new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1)}
function groundCell(e){R.ray.setFromCamera(ndc(e),R.cam);const t=-R.ray.ray.origin.y/R.ray.ray.direction.y;if(!(t>0))return null;const p=R.ray.ray.origin.clone().addScaledVector(R.ray.ray.direction,t);return p}
function hover(e){const p=groundCell(e);if(!p||!R.placing)return;const S=SD.SITE[R.placing.t],w=R.placing.rot?S.h:S.w,h=R.placing.rot?S.w:S.h;const x=Math.round(p.x/SD.CELL-w/2),z=Math.round(p.z/SD.CELL-h/2);
 const it={id:'ghost',t:R.placing.t,x,z,rot:R.placing.rot};const ok=SD.canPlace(R.design,it,R.placing.moveId);if(!R.ghost){R.ghost=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),R.M.ghostOk);R.scene.add(R.ghost)}
 R.ghost.visible=true;R.ghost.material=ok?R.M.ghostOk:R.M.ghostBad;R.ghost.scale.set(w*SD.CELL-1,6,h*SD.CELL-1);R.ghost.position.set(x*SD.CELL+w*SD.CELL/2,3,z*SD.CELL+h*SD.CELL/2);R.ghostIt={it,ok};R.dirty=true;R.lastInteract=performance.now()}
function tap(e){if(R.placing){hover(e);if(R.ghostIt&&R.placing.cb)R.placing.cb(R.ghostIt.it,R.ghostIt.ok);return}R.ray.setFromCamera(ndc(e),R.cam);const hits=R.ray.intersectObjects([...R.pick,...(R.siteGroup?R.siteGroup.children:[])],true);
 if(hits.length&&R.onPick){const o=hits[0].object;R.onPick(o.userData.site?{site:o.userData.site}:{key:o.userData.key})}}
function placing(p){R.placing=p;if(!p&&R.ghost){R.ghost.visible=false;R.dirty=true}}
function highlight(key){if(R.selMesh){R.scene.remove(R.selMesh);R.selMesh.geometry.dispose();R.selMesh=null}if(!key||!R.G2)return;const s=R.G2.segs.find(x=>x.key===key);if(!s)return;const gb=new GB();const p=s.pts;for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];const y=s.sec.backH+0.3;
 gb.quad([a.x,0.15,a.z],[b.x,0.15,b.z],[b.x+b.nx*(s.sec.dMax+0.6),0.15,b.z+b.nz*(s.sec.dMax+0.6)],[a.x+a.nx*(s.sec.dMax+0.6),0.15,a.z+a.nz*(s.sec.dMax+0.6)],C('#fff'))}const m=gb.mesh(R.M.sel);m.renderOrder=5;R.selMesh=m;R.scene.add(m);R.dirty=true;
 clearTimeout(R.selT);R.selT=setTimeout(()=>{if(R.selMesh){R.scene.remove(R.selMesh);R.selMesh=null;R.dirty=true}},1600)}
function photo(scale=2){const rd=R.renderer;const pr=rd.getPixelRatio();rd.setPixelRatio(Math.min(3,pr*scale/1.2+0.5));resize();const sm=rd.shadowMap.enabled;rd.shadowMap.enabled=true;R.scene.traverse(o=>{if(o.material&&!sm)o.material.needsUpdate=true});rd.render(R.scene,R.cam);const url=rd.domElement.toDataURL('image/jpeg',0.92);rd.setPixelRatio(pr);rd.shadowMap.enabled=sm;if(!sm)R.scene.traverse(o=>{if(o.material)o.material.needsUpdate=true});resize();R.dirty=true;return url}
window.SD3={mount,build,view,setNight:on=>setNight(on),isNight:()=>R.night,placing,highlight,photo,setQuality,quality:()=>R.quality,fps:()=>R.fps,tour:on=>{R.tour=on;R.dirty=true},touring:()=>!!R.tour,onPick:f=>{R.onPick=f},info:()=>({calls:R.renderer.info.render.calls,tris:R.renderer.info.render.triangles,shadows:R.renderer.shadowMap.enabled,pr:R.pr}),ready:true};
window.dispatchEvent(new Event('sd3ready'));
