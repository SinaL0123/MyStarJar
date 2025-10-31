// ===== Helpers =====
const $ = (s) => document.querySelector(s);

const starsEl      = $("#stars");
const addBtn       = $("#addBtn");
const pourBtn      = $("#pourBtn");
const exportBtn    = $("#exportBtn");
const clearBtn     = $("#clearBtn");
const countTip     = $("#countTip");
const musicBtn     = $("#musicBtn");
const bgMusic      = $("#bgMusic");

// Add form modal
const addModal     = $("#addModal");
const closeAddBtn  = $("#closeAdd");
const cancelAddBtn = $("#cancelAdd");
const form         = $("#form");

// Memo modal
const memoModal    = $("#modal");
const closeMemoBtn = $("#closeModal");
const putBackBtn   = $("#putBackBtn");
const deleteBtn    = $("#deleteBtn");
const saveAfterBtn = $("#saveAfter");
const moodPost     = $("#mood_post");
const guiltPost    = $("#guilt_post");

let stars = loadStars();
let currentId = null;

// ===== Init =====
renderAll();
updateCount();


form.date.valueAsDate = new Date();

// ===== UI open/close modals =====
addBtn.addEventListener("click", () => { addModal.classList.add("open"); });

// ===== Background Music Control =====
let isMusicPlaying = false;

// Update music button appearance
function updateMusicButton() {
  if (isMusicPlaying) {
    musicBtn.textContent = '♪';
    musicBtn.classList.remove('ghost');
    musicBtn.classList.add('music-playing');
  } else {
    musicBtn.textContent = '♪';
    musicBtn.classList.add('ghost');
    musicBtn.classList.remove('music-playing');
  }
}

const savedMusicState = localStorage.getItem('musicPlaying');
if (savedMusicState === 'true') {
  bgMusic.play().catch(() => {});
  isMusicPlaying = true;
  updateMusicButton();
}

musicBtn.addEventListener("click", () => {
  if (isMusicPlaying) {
    bgMusic.pause();
    isMusicPlaying = false;
  } else {
    bgMusic.play().catch(() => {});
    isMusicPlaying = true;
  }
  updateMusicButton();
  localStorage.setItem('musicPlaying', isMusicPlaying.toString());
});

// Update button state based on audio state
bgMusic.addEventListener('play', () => {
  isMusicPlaying = true;
  updateMusicButton();
  localStorage.setItem('musicPlaying', 'true');
});

bgMusic.addEventListener('pause', () => {
  isMusicPlaying = false;
  updateMusicButton();
  localStorage.setItem('musicPlaying', 'false');
});
closeAddBtn.addEventListener("click", () => { addModal.classList.remove("open"); form.reset(); form.date.valueAsDate = new Date(); });
cancelAddBtn.addEventListener("click", () => { addModal.classList.remove("open"); form.reset(); form.date.valueAsDate = new Date(); });
addModal.addEventListener("click", (e)=>{ if(e.target===addModal){ addModal.classList.remove("open"); } });

// ===== Folding Animation =====
function playFoldingAnimation(callback) {
  const foldingAnimation = document.getElementById("foldingAnimation");
  const foldingImage = foldingAnimation?.querySelector(".folding-image");
  
  if (!foldingAnimation || !foldingImage) {
    if (callback) callback();
    return;
  }
  
  foldingAnimation.style.display = 'flex';
  foldingAnimation.style.visibility = 'visible';
  foldingAnimation.style.opacity = '1';
  foldingAnimation.style.zIndex = '9999';
  foldingImage.style.opacity = '1';
  foldingImage.style.display = 'block';
  foldingAnimation.offsetHeight;
  
  let currentFrame = 0;
  const totalFrames = 16;
  const frameDuration = 100;
  
  function showFrame() {
    currentFrame++;
    if (currentFrame > totalFrames) {
      foldingAnimation.style.display = 'none';
      if (callback) callback();
      return;
    }
    const imageUrl = `foldsteps/${currentFrame}.png`;
    foldingImage.style.backgroundImage = `url('${imageUrl}')`;
    setTimeout(showFrame, frameDuration);
  }
  showFrame();
}

// ===== Submit: Add Star with drop animation =====
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form).entries());
  if (!f.amount || !f.currency || !f.category) { 
    alert("Amount / Currency / Category are required."); 
    return; 
  }

  const id = "s_" + Date.now();
  const { x, y } = findDropPosition(f.amount, f.currency);
  const type = inferType(f.mediaUrl);

  const star = {
    id,
    title: (f.title || "").trim() || "Untitled Star",
    date: f.date || new Date().toISOString().slice(0,10),

    amount: Number(f.amount),
    currency: f.currency,
    category: f.category,
    planned: !!f.planned,

    mood_pre: clampNum(f.mood_pre || 3, 1, 5),
    guilt_pre: clampNum(f.guilt_pre || 0, 0, 5),
    intent_pre: (f.intent_pre || "").trim(),

    mood_post: null, guilt_post: null,
    text: (f.text || "").trim(),
    mediaUrl: (f.mediaUrl || "").trim(),
    type,
    x, y,
    revisit_count: 0
  };

  stars.push(star);
  saveStars();
  addModal.classList.remove("open");
  form.reset();
  form.date.valueAsDate = new Date();
  
  playFoldingAnimation(() => {
    addStarEl(star, {drop:true});
    updateCount();
  });
});

// ===== Random Pour =====
pourBtn.addEventListener("click", () => {
  if (!stars.length) return;
  const idx = Math.floor(Math.random() * stars.length);
  const s = stars[idx];
  const el = document.querySelector(`.star[data-id="${s.id}"]`);
  if (el){
    el.classList.add("pour");
    setTimeout(()=>{ 
      el.classList.add("out"); 
      openStar(s); 
    }, 900);
  }else{
    openStar(s);
  }
});

// ===== Export / Clear =====
exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(stars, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'star-jar-export.json'; a.click();
  URL.revokeObjectURL(url);
});
clearBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all stars?")) {
    stars = []; saveStars(); starsEl.innerHTML=''; updateCount();
  }
});

// ===== Memo modal behavior =====
function putBackCurrent(){
  if (!currentId) return;
  const el = document.querySelector(`.star[data-id="${currentId}"]`);
  if (el) el.classList.remove("pour","out");
}
closeMemoBtn.addEventListener("click", ()=>{
  putBackCurrent(); memoModal.classList.remove("open"); currentId = null;
});
putBackBtn.addEventListener("click", ()=>{
  putBackCurrent(); memoModal.classList.remove("open"); currentId = null;
});
memoModal.addEventListener("click", (e)=>{ if(e.target===memoModal){ putBackCurrent(); memoModal.classList.remove("open"); currentId=null; } });

deleteBtn.addEventListener("click", ()=>{
  if(!currentId) return;
  if(confirm("Delete this star?")){
    const deletedId = currentId;
    stars = stars.filter(s=>s.id!==deletedId); 
    saveStars();
    const n = document.querySelector(`.star[data-id="${deletedId}"]`); 
    if(n) n.remove();
    memoModal.classList.remove("open"); 
    currentId=null; 
    updateCount();
  }
});

saveAfterBtn.addEventListener("click", ()=>{
  if(!currentId) return;
  const s = stars.find(x=>x.id===currentId); if(!s) return;
  const mp = parseInt(moodPost.value,10); const gp = parseInt(guiltPost.value,10);
  if (!(mp>=1&&mp<=5) || !(gp>=0&&gp<=5)){ alert("After values: mood 1–5, guilt 0–5"); return; }
  s.mood_post = mp; s.guilt_post = gp; s.revisit_count = (s.revisit_count||0)+1; saveStars();
  const el = document.querySelector(`.star[data-id="${s.id}"]`); if(el) applyStarVisual(el, s);
  fillMemo(s);
});

// ===== Render =====
function renderAll(){
  starsEl.innerHTML='';
  stars.forEach(s=> addStarEl(s));
}
function addStarEl(star, opts={}){
  const el = document.createElement('button');
  el.className = `star cat-${star.category} ${star.planned? 'planned-yes':'planned-no'}`;
  el.dataset.id = star.id;
  el.style.left = `${star.x}%`;
  el.style.top  = `${star.y}%`;
  
  // Set random rotation angles for animation
  const baseAngle = Math.random()*10-5;
  el.style.setProperty('--r', baseAngle.toFixed(1)+'deg'); // Slight tilt angle
  el.style.setProperty('--r0', '0deg');
  el.style.setProperty('--r1', (baseAngle + 8).toFixed(1)+'deg');
  el.style.setProperty('--r2', (baseAngle + 4).toFixed(1)+'deg');
  el.style.setProperty('--r3', (baseAngle + 2).toFixed(1)+'deg');

  applyStarVisual(el, star);

  el.addEventListener('click', ()=> openStar(star));
  starsEl.appendChild(el);
  
  if (opts.drop){
    const initialX = 50;
    const initialY = 5;
    
    if (starsEl) {
      const containerHeight = starsEl.offsetHeight;
      const containerWidth = starsEl.offsetWidth;
      const dropDistanceY = ((star.y - initialY) / 100) * containerHeight;
      const slideOffsetX = ((initialX - star.x) / 100) * containerWidth;
      
      el.style.setProperty('--drop-offset-y', dropDistanceY + 'px');
      el.style.setProperty('--drop-offset-x', slideOffsetX + 'px');
    }
    
    el.style.left = `${star.x}%`;
    el.style.top = `${star.y}%`;
    el.style.willChange = 'transform';
    el.classList.add('drop');
    
    setTimeout(() => {
      el.classList.remove('drop');
      el.style.transform = 'none';
      el.style.willChange = 'auto';
      el.style.left = `${star.x}%`;
      el.style.top = `${star.y}%`;
    }, 1800);
  }
}

function applyStarVisual(el, star){
  const amt = Number(star.amount)||0;
  const currency = star.currency || 'USD';
  let normalizedAmt = amt;
  if (currency === 'JPY' || currency === 'CNY') {
    normalizedAmt = amt / 7;
  } else if (currency === 'EUR') {
    normalizedAmt = amt * 1.1;
  }
  let sz = 16 + Math.log10(Math.max(normalizedAmt, 1)) * 8;
  sz = Math.min(48, Math.max(16, sz));
  el.style.setProperty('--sz', sz+'px');

  const roi = calcEmotionalROI(star);
  let b=1.0; 
  if(roi!=null){ 
    if(roi>=0.02) b=1.35; 
    else if(roi>=0.008) b=1.18; 
    else if(roi>=0) b=1.0; 
    else b=0.75; 
  }
  el.style.setProperty('--b', b);
}

function openStar(star){
  currentId = star.id;
  fillMemo(star);
  memoModal.classList.add('open');
}

function fillMemo(star){
  $("#mTitle").textContent = star.title || 'Untitled Star';
  $("#mMeta").innerHTML = [
    `📅 ${star.date}`,
    `💳 ${fmtAmount(star)} ${star.planned ? "(Planned)" : "(Unplanned)"}`,
    `🏷️ ${star.category}`,
    `🙂 mood_before: ${star.mood_pre} · guilt_before: ${star.guilt_pre}`,
    star.intent_pre ? `🎯 intent: ${escapeHtml(star.intent_pre)}` : ""
  ].filter(Boolean).join(" · ");

  const media = $("#mMedia"); media.innerHTML=''; 
  if (star.mediaUrl){
    const url = star.mediaUrl;
    if (/\.(png|jpg|jpeg|gif|webp|avif)(\?|#|$)/i.test(url)){ const img = document.createElement('img'); img.src=url; media.appendChild(img); media.hidden=false; }
    else if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)){ const v=document.createElement('video'); v.src=url; v.controls=true; media.appendChild(v); media.hidden=false; }
    else{ media.innerHTML=`<a href="${url}" target="_blank" rel="noopener">Open link ↗</a>`; media.hidden=false; }
  } else media.hidden=true;

  $("#mText").textContent = star.text || '';
  moodPost.value  = star.mood_post ?? '';
  guiltPost.value = star.guilt_post ?? '';

  const roiVal = calcEmotionalROI(star);
  const guiltDelta = calcGuiltDelta(star);
  $("#mROI").innerHTML = roiVal === null
    ? `Emotional ROI: <i>Waiting for After score to calculate</i>`
    : `Emotional ROI = <b>${roiVal.toFixed(4)}</b> (= (mood_after − mood_before) ÷ amount) · guilt Δ=${guiltDelta>=0?"+":""}${guiltDelta}`;
}

// ===== Utils =====
function updateCount(){ countTip.textContent = `${stars.length} star${stars.length!==1?'s':''}` }
function saveStars(){ localStorage.setItem('starjar.v4', JSON.stringify(stars)); }
function loadStars(){ try{ return JSON.parse(localStorage.getItem('starjar.v4')||'[]'); } catch{ return []; } }
function inferType(url){ 
  if(!url) return 'text'; 
  if(/\.(png|jpg|jpeg|gif|webp|avif)(\?|#|$)/i.test(url)) return 'photo'; 
  if(/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) return 'video'; 
  return 'link'; 
}
function clampNum(v,lo,hi){ const n=Number(v); if(Number.isNaN(n))return lo; return Math.min(hi, Math.max(lo,n)); }
function fmtAmount(s){ const n = Number(s.amount)||0; return `${s.currency} ${n.toFixed(2)}`; }
function calcEmotionalROI(s){ if(s.mood_post==null) return null; const d = Number(s.mood_post)-Number(s.mood_pre); const a = Math.max(Number(s.amount)||0, 0.0001); return d/a; }
function calcGuiltDelta(s){ if(s.guilt_post==null) return 0; return Number(s.guilt_post)-Number(s.guilt_pre); }
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function findDropPosition(newStarAmount = 100, newStarCurrency = 'USD'){
  const newStarSize = calculateStarSize(newStarAmount, newStarCurrency);
  if (!starsEl) return {x: 50, y: 85};
  
  const containerWidth = starsEl.offsetWidth;
  const containerHeight = starsEl.offsetHeight;
  const edgePadding = Math.max(newStarSize / 2 + 8, 12);
  const paddingXPercent = (edgePadding / containerWidth) * 100;
  const paddingYPercent = (edgePadding / containerHeight) * 100;
  const starSizeYPercent = (newStarSize / containerHeight) * 100;
  const maxY = 95 - starSizeYPercent / 2 - paddingYPercent;
  const centerX = 50;
  const horizontalRange = 10;
  const minYStep = (newStarSize + 4) / containerHeight * 100;
  
  for(let y = maxY; y >= 15 + paddingYPercent; y -= minYStep){
    const positions = [
      centerX,
      centerX + (Math.random() - 0.5) * horizontalRange * 2,
      centerX + (Math.random() - 0.5) * horizontalRange * 2,
    ];
    for(const x of positions){
      const xRange = xRangeAtY(y, containerWidth, containerHeight, edgePadding, newStarSize);
      const safeX = Math.max(xRange.min + paddingXPercent, Math.min(xRange.max - paddingXPercent, x));
      if (!isOverlapping(safeX, y, newStarSize, containerWidth, containerHeight)){
        return {x: safeX, y: y};
      }
    }
  }
  const randomOffset = (Math.random() - 0.5) * horizontalRange * 2;
  return {x: Math.max(45, Math.min(55, centerX + randomOffset)), y: maxY};
  
  function isOverlapping(newX, newY, newSize, containerW, containerH){
    return stars.some(star => {
      const dx = star.x - newX;
      const dy = star.y - newY;
      const distance = Math.sqrt(dx*dx + dy*dy);
      const starSize = calculateStarSize(star.amount, star.currency);
      const starSizePercent = (starSize / containerH) * 100;
      const newSizePercent = (newSize / containerH) * 100;
      const bufferPercent = (8 / containerH) * 100;
      const minDistance = (starSizePercent + newSizePercent) / 2 + bufferPercent;
      return distance < minDistance;
    });
  }
  
  function calculateStarSize(amount, currency){
    const amt = Number(amount) || 0;
    let normalizedAmt = amt;
    if (currency === 'JPY' || currency === 'CNY') normalizedAmt = amt / 7;
    else if (currency === 'EUR') normalizedAmt = amt * 1.1;
    let sz = 16 + Math.log10(Math.max(normalizedAmt, 1)) * 8;
    return Math.min(48, Math.max(16, sz));
  }
  
  function xRangeAtY(y, containerW, containerH, padding, starSize){
    let minBase = 20, maxBase = 80;
    if (y < 12){ minBase = 30; maxBase = 70; }
    else if (y < 18){ minBase = 28; maxBase = 72; }
    else if (y < 25){ minBase = 35; maxBase = 65; }
    else if (y < 35){ minBase = 28; maxBase = 72; }
    else if (y < 50){ minBase = 24; maxBase = 76; }
    else if (y < 70){ minBase = 22; maxBase = 78; }
    else if (y < 85){ minBase = 20; maxBase = 80; }
    else { minBase = 22; maxBase = 78; }
    const starRadius = starSize / 2;
    const requiredSpace = starRadius + padding;
    const requiredSpacePercent = (requiredSpace / containerW) * 100;
    const min = Math.max(minBase + requiredSpacePercent, 5);
    const max = Math.min(maxBase - requiredSpacePercent, 95);
    return {min, max};
  }
}
