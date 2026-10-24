/** Original PrepCraft preparation illustrations. Run: node scripts/generate-landing-art.mjs */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const out = path.resolve("public/brand/landing");
await fs.mkdir(path.join(out, "source"), { recursive: true });
await fs.mkdir(path.join(out, "responsive"), { recursive: true });
await fs.mkdir(path.join(out, "hero", "source"), { recursive: true });
await fs.mkdir(path.join(out, "visuals", "source"), { recursive: true });
await fs.mkdir(path.join(out, "visuals", "responsive"), { recursive: true });

const definitions = `<defs>
  <linearGradient id="paper" x2=".8" y2="1"><stop stop-color="#f4f3ef"/><stop offset="1" stop-color="#d8d7d2"/></linearGradient>
  <linearGradient id="mineral" x2=".8" y2="1"><stop stop-color="#fbfaf6"/><stop offset=".6" stop-color="#e2e1dc"/><stop offset="1" stop-color="#bcbcb7"/></linearGradient>
  <linearGradient id="graphite" x2=".7" y2="1"><stop stop-color="#474944"/><stop offset=".52" stop-color="#292d2a"/><stop offset="1" stop-color="#181c19"/></linearGradient>
  <linearGradient id="edge" x2="0" y2="1"><stop stop-color="#5a5e58"/><stop offset="1" stop-color="#2c302c"/></linearGradient>
  <linearGradient id="stoneEdge" x2="0" y2="1"><stop stop-color="#c1c2bb"/><stop offset="1" stop-color="#8a8e87"/></linearGradient>
  <linearGradient id="copper" x2=".65" y2="1"><stop stop-color="#d4ac98"/><stop offset=".32" stop-color="#b2765f"/><stop offset=".7" stop-color="#A15F4B"/><stop offset="1" stop-color="#784736"/></linearGradient>
  <linearGradient id="glass" x2=".9" y2="1"><stop stop-color="#ffffff" stop-opacity=".6"/><stop offset=".5" stop-color="#eeeee9" stop-opacity=".24"/><stop offset="1" stop-color="#a8afa5" stop-opacity=".48"/></linearGradient>
  <linearGradient id="beam" x2="1" y2="0"><stop stop-color="#A15F4B" stop-opacity="0"/><stop offset=".5" stop-color="#A15F4B" stop-opacity=".11"/><stop offset="1" stop-color="#A15F4B" stop-opacity="0"/></linearGradient>
  <radialGradient id="light"><stop stop-color="#ffffff" stop-opacity=".72"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  <filter id="shadow" x="-60%" y="-100%" width="220%" height="320%"><feGaussianBlur stdDeviation="15"/></filter>
  <filter id="smallShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#202720" flood-opacity=".18"/></filter>
</defs>`;

const point = (x, y, z = 0) => [600 + (x - y) * .91, 210 + (x + y) * .43 - z];
const points = (p) => p.map((a) => a.join(",")).join(" ");
const line = (p, color = "#80867d", width = 2, more = "") => `<polyline points="${points(p)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${more}/>`;
const circle = (x, y, r, fill = "url(#copper)", extra = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const projectedLine = (p, color, width, more) => line(p.map((a) => point(...a)), color, width, more);
function tile(x, y, w, d, z = 0, height = 20, material = "mineral") {
  const a = point(x, y, z + height), b = point(x + w, y, z + height), c = point(x + w, y + d, z + height), e = point(x, y + d, z + height);
  const ba = point(x + w, y, z), ca = point(x + w, y + d, z), ea = point(x, y + d, z);
  const side = material === "graphite" ? "edge" : material === "copper" ? "copper" : "stoneEdge";
  return `<g><polygon points="${points([e, c, ca, ea])}" fill="url(#${side})"/><polygon points="${points([b, c, ca, ba])}" fill="url(#${side})" opacity=".8"/><polygon points="${points([a, b, c, e])}" fill="url(#${material})" stroke="${material === "graphite" ? "#777b71" : "#ffffff"}" stroke-opacity=".65" stroke-width="1.3"/>${line([a,b], "#fff", 1, 'opacity=".4"')}</g>`;
}
function inlay(x, y, w, d, z = 0, color = "#A15F4B", alpha = 1) {
  return `<polygon points="${points([point(x,y,z),point(x+w,y,z),point(x+w,y+d,z),point(x,y+d,z)])}" fill="${color}" opacity="${alpha}"/>`;
}
function orb(x, y, z, radius = 8, color = "url(#copper)") {
  const [px, py] = point(x, y, z);
  return circle(px, py, radius, color, 'stroke="#f4ede4" stroke-width="1.5"');
}
function foundation(w = 380, d = 320, y = 10) {
  return `<ellipse cx="600" cy="${510 + y}" rx="355" ry="60" fill="#353e32" opacity=".12" filter="url(#shadow)"/>${tile(-w/2, -d/2 + 180, w, d, 0, 14, "mineral")}`;
}
function frame(body, width, height, offset, transparent = false) {
  // Each composition shares the same 1200 × 800 design space, centred within its output ratio.
  const designHeight = 800;
  const factor = Math.min(width / 1200, height / designHeight);
  const shadow = body.match(/^<ellipse[^>]*\/>/)?.[0] ?? "";
  const centered = `${shadow}<g transform="translate(${offset[0]} ${offset[1]})">${body.slice(shadow.length)}</g>`;
  const backdrop = transparent ? "" : `<rect width="100%" height="100%" fill="url(#paper)"/><ellipse cx="${width*.34}" cy="${height*.18}" rx="${width*.65}" ry="${height*.8}" fill="url(#light)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${definitions}${backdrop}<g transform="translate(${(width-1200*factor)/2} ${(height-designHeight*factor)/2}) scale(${factor})">${centered}</g></svg>`;
  // Neutral materials must remain neutral even when their many surfaces overlap.
  // Preserve the copper scale; remove unintended olive casts from mineral values.
  return svg.replace(/#[0-9a-f]{6}/gi, (color) => {
    const rgb = [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16));
    if (Math.max(...rgb) - Math.min(...rgb) > 30) return color;
    const gray = Math.round(rgb.reduce((sum, value) => sum + value, 0) / 3);
    return `#${[gray, gray, Math.max(0, gray - 1)].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  });
}

function foldedCore() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1000" viewBox="0 0 1200 1000">${definitions}
  <defs>
    <linearGradient id="smoke" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c7c7c4" stop-opacity=".28"/><stop offset=".45" stop-color="#777774" stop-opacity=".17"/><stop offset="1" stop-color="#fafaf7" stop-opacity=".44"/></linearGradient>
    <linearGradient id="foldFront" x1="0" y1="0" x2="1" y2=".5"><stop stop-color="#252524"/><stop offset=".38" stop-color="#525250"/><stop offset=".7" stop-color="#282827"/><stop offset="1" stop-color="#171716"/></linearGradient>
    <linearGradient id="foldReturn" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#efefec"/><stop offset=".42" stop-color="#d4d4d0"/><stop offset=".72" stop-color="#a9a9a5"/><stop offset="1" stop-color="#e5e5e1"/></linearGradient>
    <linearGradient id="foldSeam" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="#c29680"/><stop offset=".5" stop-color="#A15F4B"/><stop offset="1" stop-color="#79503f"/></linearGradient>
  </defs>
  <g transform="translate(-150 -120) scale(1.25)">
  <ellipse cx="602" cy="794" rx="287" ry="36" fill="#202020" opacity=".15" filter="url(#shadow)"/>
  <g transform="translate(0 30)">
    <path d="M 388 312 L 588 206 Q 608 196 628 208 L 853 355 L 772 598 L 563 700 L 346 551 Z" fill="url(#smoke)" stroke="#b8b8b3" stroke-opacity=".6" stroke-width="1.6"/>
    <path d="M 451 278 L 594 216 L 559 329 L 486 377 L 420 585 L 329 535 L 389 331 Q 405 303 451 278 Z" fill="url(#foldFront)" stroke="#747470" stroke-width="1.3"/>
    <path d="M 389 331 Q 403 301 451 278 L 594 216 L 818 346 Q 834 355 826 377 L 720 429 L 559 329 Z" fill="url(#foldReturn)" stroke="#f2f2ec" stroke-width="1.3"/>
    <path d="M 389 331 Q 403 301 451 278 L 594 216 L 818 346" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="2"/>
    <path d="M 594 216 L 559 329 L 720 429 L 826 377 L 818 346 Z" fill="url(#foldSeam)" opacity=".93"/>
    <path d="M 826 377 L 777 579 Q 774 595 758 605 L 568 704 L 592 580 L 683 530 L 720 429 Z" fill="url(#foldReturn)" stroke="#efefeb" stroke-width="1.2"/>
    <path d="M 826 377 L 777 579 Q 774 595 758 605 L 568 704" fill="none" stroke="#ffffff" stroke-opacity=".8" stroke-width="2"/>
    <path d="M 329 535 L 420 585 L 592 580 L 568 704 L 369 645 Q 350 638 346 617 Z" fill="url(#foldFront)" stroke="#747470" stroke-width="1.2"/>
    <path d="M 420 585 L 592 580 L 683 530 L 486 492 Z" fill="url(#smoke)" stroke="#deded8" stroke-opacity=".65" stroke-width="1.3"/>
    <path d="M 457 425 L 644 461 L 683 530 L 486 492 Z" fill="url(#glass)" stroke="#e3e3dd" stroke-opacity=".7" stroke-width="1.3"/>
    <path d="M 349 532 L 405 346 Q 418 320 455 304" fill="none" stroke="#b17b62" stroke-width="3"/>
    <path d="M 445 589 L 592 580 L 683 530" fill="none" stroke="#A15F4B" stroke-width="3"/>
    <path d="M 394 618 L 524 657" fill="none" stroke="#969692" stroke-opacity=".6" stroke-width="1.5"/>
    <path d="M 469 454 L 610 481" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="1.3"/>
    <path d="M 264 614 L 309 637 L 293 693 L 248 671 Z" fill="url(#glass)" stroke="#bbbbba" stroke-opacity=".7"/>
    <path d="M 808 258 L 861 289 L 843 337 L 790 306 Z" fill="url(#glass)" stroke="#bbbbba" stroke-opacity=".7"/>
    <path d="M 282 648 L 321 669 M 831 300 L 869 320" fill="none" stroke="#A15F4B" stroke-width="2.5"/>
  </g></g></svg>`;
}

function heroFragment(kind) {
  let body = "";
  if(kind === "code") {
    body = `<path d="M 116 213 L 360 153 L 494 264 L 248 334 Z" fill="url(#graphite)" stroke="#8d8d88"/><path d="M 116 213 L 248 334 L 248 350 L 116 228 Z" fill="#252524"/><path d="M 248 334 L 494 264 L 494 281 L 248 350 Z" fill="#363634"/><path d="M 242 227 L 218 254 L 260 274 M 350 205 L 392 225 L 368 252 M 313 216 L 294 268" fill="none" stroke="#d8d8d2" stroke-width="5" stroke-linecap="round"/><path d="M 313 216 L 294 268" fill="none" stroke="#A15F4B" stroke-width="5"/>`;
  } else if(kind === "revision") {
    for(let i=0;i<3;i++)body+=`<ellipse cx="300" cy="${260+i*33}" rx="${105+i*38}" ry="${38+i*16}" fill="none" stroke="${i===0?'#A15F4B':'#a5a5a0'}" stroke-width="${i===0?6:3}"/><path d="M ${195-i*38} ${260+i*33} A ${105+i*38} ${38+i*16} 0 0 1 ${360+i*19} ${230+i*17}" fill="none" stroke="#efefea" stroke-width="1.8"/>`;
  } else if(kind === "pattern") {
    body=`<path d="M 167 235 L 300 176 L 433 235 M 167 235 L 243 346 L 300 176 L 365 346 L 433 235" fill="none" stroke="#8c8c87" stroke-width="3"/><path d="M 167 235 L 243 346 L 300 176" fill="none" stroke="#A15F4B" stroke-width="4"/>`;
    for(const [x,y]of [[167,235],[300,176],[433,235],[243,346],[365,346]])body+=`<path d="M ${x-20} ${y} L ${x} ${y-11} L ${x+20} ${y} L ${x} ${y+11} Z" fill="url(#mineral)" stroke="#aaaaa5" stroke-width="1"/>`;
  } else if(kind === "readiness") {
    body=`<path d="M 185 358 L 185 188 L 346 151 L 346 320" fill="none" stroke="url(#graphite)" stroke-width="20"/><path d="M 233 387 L 233 216 L 394 179 L 394 348" fill="none" stroke="url(#glass)" stroke-width="14"/><path d="M 176 356 L 176 180 L 344 141" fill="none" stroke="#A15F4B" stroke-width="2"/><path d="M 258 319 L 282 339 L 329 279" fill="none" stroke="#A15F4B" stroke-width="4"/>`;
  } else if(kind === "planner") {
    body=`<g transform="translate(-300 -50)">`;
    for(let row=0;row<3;row++)for(let col=0;col<4;col++)body+=tile(55+col*56,115+row*64,46,52,10,row===1&&col<2?32:12,row===1&&col<2?"copper":"mineral");
    body+="</g>";
  } else {
    body=`<path d="M 132 292 L 310 186 L 452 265 L 294 355 Z" fill="url(#glass)" stroke="#c5c5bf" stroke-width="1.3"/><path d="M 132 292 L 294 355 L 282 389 L 139 327 Z" fill="url(#graphite)"/><path d="M 294 355 L 452 265 L 443 300 L 282 389 Z" fill="url(#copper)"/><path d="M 135 292 L 294 355 L 448 268" fill="none" stroke="#efefeb" stroke-width="1.5"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">${definitions}<ellipse cx="300" cy="445" rx="155" ry="20" fill="#242424" opacity=".1" filter="url(#shadow)"/>${body}</svg>`;
}

const heroDefinitions = [
  ["hero-preparation-core",1200,1000,"Interlocking folded graphite, mineral and glass ribbons transform preparation into a clear readiness opening.",foldedCore],
  ["hero-code-layer",600,600,"A precise graphite practice plane connects a pair of code structures.",()=>heroFragment("code")],
  ["hero-revision-layer",600,600,"Three mineral interval rings express resurfacing revision.",()=>heroFragment("revision")],
  ["hero-pattern-layer",600,600,"A branching structural path resolves a recognized pattern.",()=>heroFragment("pattern")],
  ["hero-readiness-layer",600,600,"Aligned mineral thresholds converge on a clear readiness state.",()=>heroFragment("readiness")],
  ["hero-planner-layer",600,600,"Structured planning blocks elevate two deliberate focus windows.",()=>heroFragment("planner")],
  ["hero-depth-accent",600,600,"A thin graphite and mineral-glass fold carries one restrained Sienna edge.",()=>heroFragment("depth")],
];
const heroManifest=[];
for(const [name,width,height,alt,draw] of process.argv.includes("--gallery-only") ? [] : heroDefinitions){
  const svg=draw();
  await fs.writeFile(path.join(out,"hero","source",`${name}.svg`),svg);
  await sharp(Buffer.from(svg)).webp({quality:82,alphaQuality:100,effort:4}).toFile(path.join(out,"hero",`${name}.webp`));
  const {size}=await fs.stat(path.join(out,"hero",`${name}.webp`));
  heroManifest.push({name,src:`/brand/landing/hero/${name}.webp`,source:`/brand/landing/hero/source/${name}.svg`,width,height,alt,bytes:size,alpha:true});
}
if(!process.argv.includes("--gallery-only"))await fs.writeFile(path.join(out,"hero","manifest.json"),JSON.stringify({assets:heroManifest},null,2)+"\n");

// Five intentionally different compositions for the centered spatial hero gallery.
function galleryPractice(){
  let s=`<ellipse cx="600" cy="606" rx="300" ry="28" fill="#202020" opacity=".12" filter="url(#shadow)"/>`;
  s+=tile(-185,85,340,170,55,16,"graphite");
  s+=projectedLine([[-140,127,74],[-165,167,74],[-130,203,74]],"#d5d5cf",5);
  s+=projectedLine([[83,127,74],[116,166,74],[88,203,74]],"#d5d5cf",5);
  s+=projectedLine([[-10,130,74],[-31,207,74]],"#A15F4B",5);
  s+=tile(-225,-6,135,70,65,7,"glass");
  s+=inlay(-206,14,91,4,75,"#92928d");
  s+=inlay(-206,29,62,3,75,"#b0b0aa");
  s+=projectedLine([[-146,294,24],[-60,294,24],[23,294,24],[115,294,24]],"#a0a09b",3);
  for(const x of [-146,-60,23,115])s+=orb(x,294,24,6,x===115?"url(#copper)":"#b6b6af");
  const [cx,cy]=point(95,5,63);
  s+=`<ellipse cx="${cx}" cy="${cy}" rx="52" ry="24" fill="url(#glass)" stroke="#b0b0a9" stroke-width="2"/><path d="M ${cx} ${cy-14} V ${cy} L ${cx+22} ${cy+7}" fill="none" stroke="#A15F4B" stroke-width="3"/>`;
  s+=projectedLine([[99,315,27],[113,329,27],[145,293,27]],"#A15F4B",3);
  return s;
}
function galleryPatterns(){
  let s=`<ellipse cx="600" cy="602" rx="290" ry="28" fill="#202020" opacity=".1" filter="url(#shadow)"/>`;
  const left=[[300,297],[367,232],[427,313],[368,383],[456,417]];
  s+=line([left[0],left[2],left[1],left[3],left[4]],"#aaa9a4",2,'stroke-dasharray="5 7"');
  for(const [i,[x,y]]of left.entries())s+=`<path d="M ${x-23} ${y} L ${x} ${y-13} L ${x+23} ${y} L ${x} ${y+13} Z" fill="url(#${i===2?'graphite':'glass'})" stroke="#afafa8" stroke-width="1.4"/>`;
  s+=`<path d="M 490 300 L 534 313 L 522 342 L 478 329 Z" fill="url(#copper)"/>`;
  const right=[[594,249],[699,297],[804,345],[594,393],[699,441]];
  s+=line([right[0],right[1],right[2]],"#9e9e97",3);
  s+=line([right[0],right[3],right[4],right[1]],"#A15F4B",3);
  s+=`<path d="M 566 234 L 723 307 L 723 463 L 566 390 Z" fill="url(#glass)" stroke="#deded7" stroke-width="1"/>`;
  for(const [i,[x,y]]of right.entries())s+=`<path d="M ${x-27} ${y} L ${x} ${y-15} L ${x+27} ${y} L ${x} ${y+15} Z" fill="url(#${i===3?'graphite':'mineral'})" stroke="#b1b1ab" stroke-width="1.3"/>`;
  return s;
}
function galleryMistakes(){
  let s=`<ellipse cx="600" cy="606" rx="290" ry="30" fill="#202020" opacity=".11" filter="url(#shadow)"/>`;
  s+=line([[294,490],[394,398],[486,300]],"#777770",3);
  s+=line([[486,300],[547,238],[605,256]],"#a7a79f",2,'stroke-dasharray="5 8"');
  s+=line([[486,300],[557,374],[640,402],[742,451],[815,486]],"#A15F4B",3);
  for(const [i,[x,y]]of [[294,490],[394,398],[486,300],[640,402],[742,451],[815,486]].entries()){
    s+=`<path d="M ${x-32} ${y} L ${x} ${y-18} L ${x+32} ${y} L ${x} ${y+18} Z" fill="url(#${i<2?'graphite':i===2?'copper':'mineral'})" stroke="#aaa9a2" stroke-width="1.2"/><path d="M ${x-32} ${y} L ${x} ${y+18} L ${x+32} ${y} V ${y+10} L ${x} ${y+28} L ${x-32} ${y+10} Z" fill="#8b8b85"/>`;
  }
  s+=`<path d="M 464 248 L 535 282 L 535 343 L 464 309 Z" fill="url(#glass)" stroke="#c0c0ba" stroke-width="1.2"/><path d="M 683 483 L 708 497 L 742 465" fill="none" stroke="#A15F4B" stroke-width="3"/>`;
  return s;
}
function galleryRevision(){
  let s=`<ellipse cx="600" cy="606" rx="300" ry="29" fill="#202020" opacity=".1" filter="url(#shadow)"/>`;
  s+=`<path d="M 290 270 L 394 218 L 495 271 L 390 326 Z" fill="url(#graphite)" stroke="#9d9d96"/><path d="M 290 270 V 285 L 390 341 L 495 286 V 271 L 390 326 Z" fill="#4a4a47"/><path d="M 355 268 L 389 286 L 431 263" fill="none" stroke="#A15F4B" stroke-width="3"/>`;
  for(let i=0;i<4;i++){
    const x=429+i*101,y=335+i*47,rx=68+i*13,ry=26+i*5;
    s+=`<ellipse cx="${x}" cy="${y+12}" rx="${rx}" ry="${ry}" fill="url(#glass)" stroke="#999991" stroke-opacity=".6" stroke-width="1.4"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${i===3?'#A15F4B':'#b6b6ad'}" stroke-width="${i===3?4:2}"/><path d="M ${x-rx} ${y} A ${rx} ${ry} 0 0 1 ${x+rx*.65} ${y-ry*.75}" fill="none" stroke="#eeeee7" stroke-width="1.3"/>`;
  }
  s+=line([[434,282],[501,316],[590,358],[689,405]],"#a9a99f",1.6,'stroke-dasharray="3 8"');
  return s;
}
function galleryReadiness(){
  let s=`<ellipse cx="600" cy="641" rx="290" ry="28" fill="#202020" opacity=".1" filter="url(#shadow)"/>`;
  const nodes=[[320,270],[320,415],[446,534],[754,534],[880,415],[880,270]];
  for(const [x,y]of nodes)s+=line([[x,y],[600,365]],"#9e9e97",1.7);
  s+=foldedCore().replace('width="1200" height="1000"','x="270" y="70" width="660" height="550"');
  for(const [i,[x,y]]of nodes.entries()){
    s+=`<path d="M ${x-25} ${y} L ${x} ${y-14} L ${x+25} ${y} L ${x} ${y+14} Z" fill="url(#${i===2||i===3?'graphite':'mineral'})" stroke="#b4b4ac" stroke-width="1.3"/>`;
    s+=`<path d="M ${x-10} ${y} L ${x-2} ${y+6} L ${x+11} ${y-7}" fill="none" stroke="#A15F4B" stroke-width="2"/>`;
  }
  return s;
}
async function generateHeroGallery(){
  const gallery=path.join(out,"hero-gallery");
  await fs.mkdir(path.join(gallery,"source"),{recursive:true});
  await fs.mkdir(path.join(gallery,"responsive"),{recursive:true});
  const galleryAssets=[
    ["01-practice","A code plane, reasoning sheet, timer and evaluation path form an intentional practice sequence.",galleryPractice,[140,80]],
    ["02-patterns","An irregular problem structure resolves into an aligned graph with a recognized path.",galleryPatterns,[20,40]],
    ["03-mistakes","An interrupted diagonal attempt isolates a cause and resolves into a clean corrected path.",galleryMistakes,[30,20]],
    ["04-revision","A retained preparation plane creates four widening temporal echoes over a measured interval.",galleryRevision,[15,15]],
    ["05-readiness","Six preparation dimensions converge around a balanced folded mineral-glass readiness core.",galleryReadiness,[0,0]],
  ];
  const rows=[],checks=[],composites=[];
  for(const [index,[name,alt,draw,offset]]of galleryAssets.entries()){
    const svg=frame(draw(),1000,800,offset,true);
    await fs.writeFile(path.join(gallery,"source",`${name}.svg`),svg);
    await sharp(Buffer.from(svg)).webp({quality:82,alphaQuality:100,effort:4}).toFile(path.join(gallery,`${name}.webp`));
    await sharp(Buffer.from(svg)).resize({width:500}).webp({quality:82,alphaQuality:100,effort:4}).toFile(path.join(gallery,"responsive",`${name}-500.webp`));
    const {size}=await fs.stat(path.join(gallery,`${name}.webp`));
    rows.push({name,src:`/brand/landing/hero-gallery/${name}.webp`,source:`/brand/landing/hero-gallery/source/${name}.svg`,width:1000,height:800,alt,bytes:size,alpha:true,responsive:{src:`/brand/landing/hero-gallery/responsive/${name}-500.webp`,width:500,height:400}});
    const {data,info}=await sharp(path.join(gallery,`${name}.webp`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const at=(x,y)=>data[(y*info.width+x)*4+3];
    const corners=[at(0,0),at(999,0),at(0,799),at(999,799)];
    let solid=0,partial=0,transparent=0;
    for(let p=3;p<data.length;p+=4){if(data[p]===0)transparent++;else if(data[p]===255)solid++;else partial++;}
    if(corners.some(a=>a!==0)||!solid||!partial||!transparent)throw Error(`Gallery alpha failed: ${name}`);
    checks.push({name,cornerAlpha:corners,solidPixels:solid,partialAlphaPixels:partial,transparentPixels:transparent,passed:true});
    for(const [theme,background]of [[0,"#f8f8f6"],[1,"#20201f"]]){
      const resized=await sharp(path.join(gallery,`${name}.webp`)).resize(400,320).png().toBuffer();
      const input=await sharp(resized).flatten({background}).png().toBuffer();
      composites.push({input,left:theme*400,top:index*320});
    }
  }
  await fs.writeFile(path.join(gallery,"manifest.json"),JSON.stringify({webpQuality:82,alphaQuality:100,assets:rows},null,2)+"\n");
  await fs.writeFile(path.join(gallery,"alpha-validation.json"),JSON.stringify({verifiedAssets:5,checks},null,2)+"\n");
  await sharp({create:{width:800,height:1600,channels:3,background:"#f8f8f6"}}).composite(composites).png().toFile(path.join(gallery,"contact-sheet.png"));
  console.log(rows.map(a=>`${a.name}: ${a.width} × ${a.height}, ${(a.bytes/1024).toFixed(1)} KiB, alpha verified`).join("\n"));
}
await generateHeroGallery();
if(process.argv.includes("--gallery-only"))process.exit(0);

function focus() {
  let s = foundation(470, 380, 35);
  s += tile(-195, 70, 205, 255, 20, 11, "graphite");
  for (let i=0;i<4;i++) {
    s += inlay(-170,100+i*44,138,4,33,"#8c9388", .6);
    s += inlay(-170,112+i*44,88+(i%2)*25,3,33,"#626b5f",.65);
  }
  s += tile(45,75,135,110,24,66,"mineral");
  s += tile(65,95,95,70,91,5,"glass");
  s += projectedLine([[77,145,99],[95,127,99],[112,141,99],[144,108,99]],"#A15F4B",4);
  s += tile(45,218,135,75,26,20,"graphite");
  s += inlay(58,230,102,5,48,"#A15F4B");
  s += tile(-125,-5,285,24,68,20,"glass");
  const [cx,cy]=point(-78,55,135);
  s += `<ellipse cx="${cx}" cy="${cy}" rx="55" ry="25" fill="none" stroke="#d8dcd3" stroke-width="9"/><path d="M ${cx-54} ${cy} A 55 25 0 1 1 ${cx+45} ${cy+15}" fill="none" stroke="url(#copper)" stroke-width="9" stroke-linecap="round"/>`;
  return s;
}
function practice() {
  let s=`<ellipse cx="600" cy="555" rx="380" ry="48" fill="#30392d" opacity=".12" filter="url(#shadow)"/>`;
  const coords=[[-290,95],[-120,95],[50,95],[220,95]];
  s+=projectedLine([[-230,155,20],[-60,155,20],[110,155,20],[280,155,20]],"#aeb3a8",7);
  coords.forEach(([x,y],i)=>{
    s+=tile(x,y,124,124,30+i*10,27,i===2?"graphite":"mineral");
    const z=60+i*10;
    if(i===0) {s+=inlay(x+28,y+26,65,6,z,"#91998c");s+=inlay(x+28,y+44,50,5,z,"#b6bcb1");s+=orb(x+60,y+85,z,8);}
    if(i===1) {s+=projectedLine([[x+30,y+35,z],[x+60,y+65,z],[x+94,y+35,z]],"#6f7969",3);s+=projectedLine([[x+60,y+65,z],[x+60,y+97,z]],"#6f7969",3);s+=orb(x+60,y+65,z,7);}
    if(i===2) {s+=projectedLine([[x+43,y+30,z],[x+23,y+60,z],[x+43,y+91,z]],"#cdd3c6",4);s+=projectedLine([[x+80,y+30,z],[x+101,y+60,z],[x+80,y+91,z]],"#cdd3c6",4);s+=projectedLine([[x+69,y+34,z],[x+57,y+89,z]],"#A15F4B",4);}
    if(i===3) s+=projectedLine([[x+30,y+61,z],[x+52,y+83,z],[x+96,y+35,z]],"#A15F4B",6);
  });
  return s;
}
function patterns() {
  let s=foundation(490,350,40);
  const nodes=[[-170,90],[-60,90],[50,90],[160,90],[-115,200],[105,200],[-5,310]];
  const links=[[0,4],[1,4],[2,5],[3,5],[4,6],[5,6]];
  for(const [a,b]of links)s+=projectedLine([[...nodes[a],42],[...nodes[b],42]],"#9aa392",4);
  nodes.forEach(([x,y],i)=>{s+=tile(x-28,y-28,56,56,43,18,i===4||i===6?"graphite":"mineral");s+=inlay(x-10,y-10,20,20,63,i===4||i===6?"#A15F4B":"#a5ae9c");});
  s+=projectedLine([[-170,90,65],[-115,200,65],[-5,310,65]],"#A15F4B",3);
  s+=tile(-155,388,310,46,25,8,"glass");
  for(let i=0;i<7;i++)s+=inlay(-137+i*42,396,29,28,35,i===2||i===4?"#A15F4B":"#a4ab9d",i===2||i===4?.9:.65);
  return s;
}
function mistakes() {
  let s=`<ellipse cx="600" cy="550" rx="320" ry="65" fill="#333a2e" opacity=".12" filter="url(#shadow)"/>`;
  s+=tile(-220,80,185,190,15,20,"glass");
  const pieces=[[-214,88,74,72,25],[-127,82,81,79,46],[-216,174,77,82,45],[-117,180,80,87,16]];
  for(const [x,y,w,d,z] of pieces)s+=tile(x,y,w,d,z,22,"graphite");
  s+=projectedLine([[-5,170,52],[32,170,52],[55,194,52]],"#A15F4B",4);
  s+=tile(70,80,188,190,20,35,"graphite");
  for(let i=0;i<2;i++)for(let j=0;j<2;j++)s+=tile(82+i*85,92+j*85,74,74,58,13,"mineral");
  s+=projectedLine([[126,182,75],[152,207,75],[214,138,75]],"#A15F4B",6);
  s+=tile(-60,315,150,40,25,10,"glass");
  for(let i=0;i<4;i++)s+=inlay(-43+i*33,325,22,12,37,"#9ba491",.7);
  return s;
}
function revision() {
  let s=`<ellipse cx="600" cy="548" rx="335" ry="60" fill="#333a2e" opacity=".12" filter="url(#shadow)"/>`;
  for(let i=3;i>=0;i--){
    const w=125+i*100,h=47+i*37,cy=370+i*37;
    s+=`<ellipse cx="600" cy="${cy+12}" rx="${w}" ry="${h}" fill="none" stroke="#949d8c" stroke-width="10" opacity="${.15+i*.08}"/><ellipse cx="600" cy="${cy}" rx="${w}" ry="${h}" fill="none" stroke="${i===0?'url(#copper)':'#b6beb0'}" stroke-width="5"/><path d="M ${600-w} ${cy} A ${w} ${h} 0 0 1 ${600+w*.45} ${cy-h*.9}" fill="none" stroke="${i===0?'#d5b4a3':'#f7f8f0'}" stroke-width="2"/>`;
    const a=point(-80+i*25,180+i*55,35+i*17);
    s+=circle(a[0],a[1],8,i===1?'url(#copper)':'#65705c','stroke="#e6e9df" stroke-width="2"');
  }
  s+=tile(-75,65,150,150,80,18,"graphite");
  s+=tile(-57,83,114,114,101,8,"glass");
  for(let i=0;i<3;i++)s+=inlay(-36,105+i*27,72-i*15,5,111,i===1?"#A15F4B":"#a2ad97");
  return s;
}
function readiness() {
  let s=`<ellipse cx="600" cy="558" rx="365" ry="55" fill="#313b2b" opacity=".14" filter="url(#shadow)"/>`;
  for(let i=0;i<6;i++){
    const x=-275+i*84,z=i*28;
    s+=tile(x,130,76,170,8,z+20,i===5?"graphite":"mineral");
    s+=inlay(x+10,144,56,6,z+31,i>3?"#A15F4B":"#a6af9e");
  }
  s+=projectedLine([[-237,216,34],[-153,216,61],[-69,216,89],[15,216,117],[99,216,145],[183,216,173]],"#A15F4B",3);
  const [x,y]=point(205,150,188);
  s+=`<g filter="url(#smallShadow)"><path d="M ${x-40} ${y+75} V ${y-115} H ${x+110} V ${y+75}" fill="none" stroke="url(#glass)" stroke-width="17"/><path d="M ${x-41} ${y+75} V ${y-115} H ${x+110}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.5"/></g>`;
  return s;
}
function planning() {
  let s=foundation(450,380,35);
  s+=tile(-195,45,392,305,24,16,"graphite");
  for(let row=0;row<4;row++)for(let col=0;col<7;col++){
    const active=(row===1&&(col===1||col===2))||(row===2&&(col===4||col===5));
    const height=active?34:9;
    s+=tile(-179+col*53,65+row*69,43,56,43,height,active?"copper":row===3?"glass":"mineral");
    if(row===0&&col<3)s+=projectedLine([[-170+col*53,91,56],[-163+col*53,99,56],[-150+col*53,82,56]],"#5c6854",2);
  }
  s+=tile(-135,-10,270,18,52,9,"glass");
  return s;
}
function projects() {
  let s=`<ellipse cx="600" cy="580" rx="375" ry="60" fill="#303b29" opacity=".12" filter="url(#shadow)"/>`;
  const nodes=[[-200,80],[155,80],[-200,330],[155,330],[0,425]];
  nodes.forEach(([x,y])=>s+=projectedLine([[0,210,37],[x+22,y+22,37]],"#929e87",3));
  s+=tile(-78,132,156,156,37,55,"graphite");
  s+=tile(-57,153,114,114,96,17,"glass");
  s+=inlay(-26,184,52,52,115,"#A15F4B");
  nodes.forEach(([x,y],i)=>{
    s+=tile(x-25,y-25,94,94,34,18,"mineral");
    if(i===0){for(let j=0;j<3;j++)s+=inlay(x-9,y-6+j*20,61,9,54,"#6f7e62",.75);}
    if(i===1){for(let j=0;j<3;j++)s+=tile(x-9,y-8,61,49,55+j*10,7,j===2?"glass":"mineral");}
    if(i===2){s+=projectedLine([[x+2,y+12,55],[x+20,y+40,55],[x+47,y-1,55]],"#A15F4B",4);}
    if(i===3){for(let j=0;j<3;j++)s+=tile(x-10+j*22,y+9-j*5,15,29,55,10+j*9,"graphite");}
    if(i===4){s+=projectedLine([[x-1,y+18,55],[x+42,y+18,55]],"#65765a",3);s+=orb(x+9,y+18,55,5);s+=orb(x+34,y+18,55,5,"#53674a");}
  });
  return s;
}
function applications() {
  let s=`<ellipse cx="600" cy="562" rx="390" ry="57" fill="#313d29" opacity=".12" filter="url(#shadow)"/>`;
  const coords=[[-290,110],[-150,110],[-10,110],[-10,270],[130,270],[270,270]];
  s+=projectedLine(coords.map(([x,y],i)=>[x+40,y+40,37+i*5]),"#9da694",5);
  coords.forEach(([x,y],i)=>{
    s+=tile(x,y,80,80,42+i*5,17,i===5?"graphite":"mineral");
    s+=tile(x+23,y+23,34,34,62+i*5,8,i===5?"copper":"glass");
    if(i<3)s+=projectedLine([[x+26,y+40,74+i*5],[x+35,y+49,74+i*5],[x+54,y+28,74+i*5]],"#7f8b74",2);
    if(i===5)s+=projectedLine([[x+26,y+40,98],[x+35,y+49,98],[x+54,y+28,98]],"#f0dfd4",3);
  });
  s+=projectedLine([[-250,150,65],[-110,150,70],[30,150,75],[30,310,80]],"#A15F4B",3);
  return s;
}
function ready() {
  let s=`<ellipse cx="600" cy="582" rx="380" ry="60" fill="#30392a" opacity=".14" filter="url(#shadow)"/>`;
  s+=tile(-220,110,440,360,10,16,"mineral");
  s+=inlay(-90,145,180,270,29,"url(#beam)");
  const left=point(-120,100,20), right=point(120,100,20), topL=point(-120,100,220),topR=point(120,100,220);
  s+=`<polygon points="${points([left,topL,topR,right])}" fill="url(#glass)" stroke="#fff" stroke-opacity=".65" stroke-width="1.5"/>`;
  s+=`<path d="M ${left[0]} ${left[1]} V ${topL[1]} L ${topR[0]} ${topR[1]} V ${right[1]}" fill="none" stroke="url(#graphite)" stroke-width="27"/><path d="M ${left[0]-13} ${left[1]} V ${topL[1]-12} L ${topR[0]} ${topR[1]-12}" fill="none" stroke="#838a7c" stroke-width="1.5"/>`;
  s+=`<path d="M ${left[0]+12} ${left[1]-10} V ${topL[1]+11} L ${topR[0]-12} ${topR[1]+16}" fill="none" stroke="url(#copper)" stroke-width="4"/>`;
  for(let i=0;i<4;i++)s+=tile(-39,200+i*57,78,42,30,5,i===3?"graphite":"glass");
  s+=projectedLine([[-15,390,38],[-1,404,38],[23,375,38]],"#A15F4B",4);
  return s;
}

const assets = [
  ["01-focus-workspace",1200,750,"Layered preparation blocks, a focused plan and a small progress arc arranged on a calm mineral work surface.",focus],
  ["02-practice-flow",1200,750,"Four connected sculptural stations move from a question through structured thinking and code to evaluation.",practice],
  ["03-pattern-thinking",1200,900,"An array connects into a branching structure, with one recognized path traced in Smoked Sienna.",patterns],
  ["04-mistake-learning",1200,900,"Separated graphite fragments become an aligned structure with a clear correction mark.",mistakes],
  ["05-revision-memory",1200,800,"Expanding repetition intervals surround a retained preparation block, showing knowledge resurfacing over time.",revision],
  ["06-readiness-path",1200,800,"Six measured stone steps rise toward a transparent readiness threshold.",readiness],
  ["07-weekly-planning",1200,900,"A rhythm of modular time blocks contains two raised focus windows within a structured week.",planning],
  ["08-project-preparation",1200,900,"A central project structure connects to architecture, data, security, scaling and trade-off forms.",projects],
  ["09-application-journey",1200,750,"Six connected milestones follow a deliberate path from saved application to offer readiness.",applications],
  ["10-ready-moment",1200,750,"A clear mineral-glass threshold and completed stepping stones express calm preparation and readiness.",ready],
];
const manifest=[];
const visualManifest=[];
const offsets = [[150,80],[140,100],[150,65],[100,70],[0,0],[80,100],[160,80],[180,60],[120,85],[220,100]];
for(const [index,[name,width,height,alt,draw]] of assets.entries()){
  const svg=frame(draw(),width,height,offsets[index]);
  await fs.writeFile(path.join(out,"source",`${name}.svg`),svg);
  await sharp(Buffer.from(svg)).webp({quality:82,effort:6}).toFile(path.join(out,`${name}.webp`));
  await sharp(Buffer.from(svg)).resize({width:600}).webp({quality:82,effort:6}).toFile(path.join(out,"responsive",`${name}-600.webp`));
  const {size}=await fs.stat(path.join(out,`${name}.webp`));
  manifest.push({name,src:`/brand/landing/${name}.webp`,source:`/brand/landing/source/${name}.svg`,width,height,alt,bytes:size,responsive:{src:`/brand/landing/responsive/${name}-600.webp`,width:600,height:height/2}});
  const alphaName = name === "10-ready-moment" ? "10-ready-state" : name;
  const resolvedCore = index === 9 ? foldedCore().replace('width="1200" height="1000"', 'x="362" y="-25" width="280" height="234"') : "";
  const alphaSvg = frame(draw()+resolvedCore,width,height,offsets[index],true);
  await fs.writeFile(path.join(out,"visuals","source",`${alphaName}.svg`),alphaSvg);
  await sharp(Buffer.from(alphaSvg)).webp({quality:82,alphaQuality:100,effort:4}).toFile(path.join(out,"visuals",`${alphaName}.webp`));
  await sharp(Buffer.from(alphaSvg)).resize({width:600}).webp({quality:82,alphaQuality:100,effort:4}).toFile(path.join(out,"visuals","responsive",`${alphaName}-600.webp`));
  const alphaFile = await fs.stat(path.join(out,"visuals",`${alphaName}.webp`));
  const alphaAlt = index === 9 ? "The folded preparation core settles into a balanced readiness threshold at the end of a completed path." : alt;
  visualManifest.push({name:alphaName,src:`/brand/landing/visuals/${alphaName}.webp`,source:`/brand/landing/visuals/source/${alphaName}.svg`,width,height,alt:alphaAlt,bytes:alphaFile.size,alpha:true,responsive:{src:`/brand/landing/visuals/responsive/${alphaName}-600.webp`,width:600,height:height/2}});
}
await fs.writeFile(path.join(out,"manifest.json"),JSON.stringify({license:"Original PrepCraft artwork. Created for this project; no stock or third-party visual assets.",palette:["#A15F4B","warm mineral neutral","graphite"],webpQuality:82,assets:manifest},null,2)+"\n");
await fs.writeFile(path.join(out,"visuals","manifest.json"),JSON.stringify({license:"Original PrepCraft artwork; no stock or third-party visual assets.",webpQuality:82,alphaQuality:100,assets:visualManifest},null,2)+"\n");

const thumbs=await Promise.all(manifest.map(async(asset,index)=>{
  const img=await sharp(path.join(out,`${asset.name}.webp`)).resize(400,280,{fit:"contain",background:"#e7e7e1"}).png().toBuffer();
  return {input:img,left:(index%2)*400,top:Math.floor(index/2)*280};
}));
await sharp({create:{width:800,height:1400,channels:3,background:"#e7e7e1"}}).composite(thumbs).png().toFile(path.join(out,"contact-sheet.png"));
console.log(manifest.map(({name,width,height,bytes})=>`${name}: ${width} × ${height}, ${(bytes/1024).toFixed(1)} KiB`).join("\n"));

const transparentManifest=[...heroManifest,...visualManifest];
const alphaReport=[];
for(const asset of transparentManifest){
  const raw=await sharp(path.join("public",asset.src)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height,channels}=raw.info;
  const at=(x,y)=>raw.data[(y*width+x)*channels+3];
  const cornerAlpha=[at(0,0),at(width-1,0),at(0,height-1),at(width-1,height-1)];
  let transparent=0,partial=0,solid=0;
  for(let i=3;i<raw.data.length;i+=channels){
    const a=raw.data[i];
    if(a===0)transparent++;else if(a===255)solid++;else partial++;
  }
  if(cornerAlpha.some((value)=>value!==0)||partial===0||solid===0||transparent===0)throw Error(`Alpha verification failed: ${asset.name}`);
  alphaReport.push({name:asset.name,cornerAlpha,transparentPixels:transparent,partialAlphaPixels:partial,solidPixels:solid,passed:true});
}
await fs.writeFile(path.join(out,"alpha-validation.json"),JSON.stringify({verifiedAssets:alphaReport.length,checks:alphaReport},null,2)+"\n");
const alphaThumbs=[];
for(const [index,asset]of transparentManifest.entries()){
  for(const [theme,background]of [[0,"#f8f8f6"],[1,"#20201f"]]){
    const resized=await sharp(path.join("public",asset.src)).resize(350,260,{fit:"contain",background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    const img=await sharp(resized).flatten({background}).png().toBuffer();
    alphaThumbs.push({input:img,left:theme*350,top:index*260});
  }
}
await sharp({create:{width:700,height:transparentManifest.length*260,channels:3,background:"#f8f8f6"}}).composite(alphaThumbs).png().toFile(path.join(out,"transparent-contact-sheet.png"));
await sharp(path.join(out,"transparent-contact-sheet.png")).extract({left:0,top:0,width:700,height:1820}).png().toFile(path.join(out,"hero-review.png"));
await sharp(path.join(out,"transparent-contact-sheet.png")).extract({left:0,top:1820,width:700,height:2600}).png().toFile(path.join(out,"visuals-review.png"));
console.log(`Verified true alpha in ${alphaReport.length} hero/landing assets; all four corners transparent, foreground opaque and partially transparent material/shadow pixels present.`);
