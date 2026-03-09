// ═══════════════════════════════════════════════════
//  STARFIELD
// ═══════════════════════════════════════════════════
const canvas = document.getElementById("starfield");
const ctx    = canvas.getContext("2d");
let w, h, dpr, stars = [], animId;
let mouseX = 0, mouseY = 0;

function resize() {
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  w = window.innerWidth; h = window.innerHeight;
  canvas.width  = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px"; canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  createStars(Math.floor((w * h) / 9000));
}

function rand(a, b) { return Math.random() * (b - a) + a; }

function createStars(count) {
  stars = Array.from({ length: count }, () => {
    const layer = Math.random() < 0.18 ? 3 : Math.random() < 0.5 ? 2 : 1;
    return { x: rand(0,w), y: rand(0,h), r: layer===3?rand(1.8,2.8):layer===2?rand(1,1.8):rand(0.4,1),
             a: rand(0.2,0.9), tw: rand(0.001,0.008), driftX: rand(-0.06,0.06),
             driftY: rand(0.08,0.32), layer, phase: rand(0, Math.PI*2) };
  });
}

function drawStars() {
  ctx.clearRect(0, 0, w, h);
  for (const s of stars) {
    s.a += Math.sin(performance.now() * s.tw + s.phase) * 0.003;
    s.a = Math.max(0.1, Math.min(0.95, s.a));
    s.x += s.driftX; s.y += s.driftY;
    const p = s.layer * 0.00032;
    if (s.y > h+5) s.y = -5;
    if (s.x > w+5) s.x = -5;
    if (s.x < -5)  s.x = w+5;
    ctx.beginPath();
    ctx.arc(s.x + mouseX*p*w, s.y + mouseY*p*h, s.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${s.a.toFixed(3)})`;
    ctx.fill();
  }
  animId = requestAnimationFrame(drawStars);
}

window.addEventListener("resize", resize, { passive: true });
window.addEventListener("mousemove", e => {
  mouseX = (e.clientX/w)*2 - 1;
  mouseY = (e.clientY/h)*2 - 1;
}, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelAnimationFrame(animId); else drawStars();
});
resize(); drawStars();

// ═══════════════════════════════════════════════════
//  BURST CANVAS — per-number animations
// ═══════════════════════════════════════════════════
const burst      = document.getElementById("burstCanvas");
const bCtx       = burst.getContext("2d");
let bW, bH, bParticles = [], bAnimId = null;

function resizeBurst() {
  bW = burst.width  = window.innerWidth;
  bH = burst.height = window.innerHeight;
}
window.addEventListener("resize", resizeBurst);
resizeBurst();

// Particle profiles per life path number
const BURST_PROFILES = {
  1:  { color:"#ff6b35", color2:"#fcd257", shape:"arrow",   count:40, speed:7 },
  2:  { color:"#7ec8e3", color2:"#a9bada", shape:"wave",    count:50, speed:4 },
  3:  { color:"#fcd257", color2:"#ff9f43", shape:"sparkle", count:55, speed:6 },
  4:  { color:"#5dbb63", color2:"#a9bada", shape:"square",  count:35, speed:5 },
  5:  { color:"#ff9f43", color2:"#fcd257", shape:"triangle",count:60, speed:9 },
  6:  { color:"#ff7675", color2:"#fdcb6e", shape:"heart",   count:45, speed:5 },
  7:  { color:"#a29bfe", color2:"#74b9ff", shape:"star",    count:50, speed:5 },
  8:  { color:"#fcd257", color2:"#e17055", shape:"diamond", count:40, speed:6 },
  9:  { color:"#81ecec", color2:"#a29bfe", shape:"circle",  count:55, speed:5 },
  11: { color:"#ffffff", color2:"#a29bfe", shape:"sparkle", count:70, speed:7 },
  22: { color:"#fcd257", color2:"#5dbb63", shape:"diamond", count:50, speed:6 },
  33: { color:"#fdcb6e", color2:"#ff7675", shape:"heart",   count:60, speed:5 },
};

function createBurstParticles(num) {
  const prof = BURST_PROFILES[num] || BURST_PROFILES[7];
  const cx = bW / 2, cy = bH / 2;
  bParticles = Array.from({ length: prof.count }, () => {
    const angle = rand(0, Math.PI * 2);
    const spd   = rand(prof.speed * 0.5, prof.speed * 1.5);
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      alpha: 1,
      size: rand(4, 10),
      color: Math.random() < 0.5 ? prof.color : prof.color2,
      shape: prof.shape,
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.1, 0.1),
      life: 1,
      decay: rand(0.012, 0.025),
    };
  });
}

function drawShape(ctx, shape, size, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  switch (shape) {
    case "circle":
      ctx.beginPath(); ctx.arc(0, 0, size/2, 0, Math.PI*2); ctx.fill(); break;
    case "square":
      ctx.fillRect(-size/2, -size/2, size, size); break;
    case "diamond":
      ctx.beginPath(); ctx.moveTo(0,-size/2); ctx.lineTo(size/2,0);
      ctx.lineTo(0,size/2); ctx.lineTo(-size/2,0); ctx.closePath(); ctx.fill(); break;
    case "triangle":
      ctx.beginPath(); ctx.moveTo(0,-size/2); ctx.lineTo(size/2,size/2);
      ctx.lineTo(-size/2,size/2); ctx.closePath(); ctx.fill(); break;
    case "star":
      ctx.beginPath();
      for (let i=0;i<5;i++) {
        const a = (i*Math.PI*2/5) - Math.PI/2;
        const b = a + Math.PI/5;
        if(i===0) ctx.moveTo(Math.cos(a)*size/2, Math.sin(a)*size/2);
        else ctx.lineTo(Math.cos(a)*size/2, Math.sin(a)*size/2);
        ctx.lineTo(Math.cos(b)*size/4, Math.sin(b)*size/4);
      }
      ctx.closePath(); ctx.fill(); break;
    case "sparkle":
      ctx.lineWidth = size/5;
      ctx.beginPath(); ctx.moveTo(0,-size/2); ctx.lineTo(0,size/2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-size/2,0); ctx.lineTo(size/2,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-size/3,-size/3); ctx.lineTo(size/3,size/3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(size/3,-size/3); ctx.lineTo(-size/3,size/3); ctx.stroke(); break;
    case "heart":
      ctx.beginPath();
      ctx.moveTo(0, size/4);
      ctx.bezierCurveTo(-size/2,-size/2,-size,-size/6,-size/2,size/4);
      ctx.bezierCurveTo(0,size*0.7,size/2,size/4,0,size/4);
      ctx.bezierCurveTo(size/2,size/4,size,-size/6,size/2,size/4);
      ctx.bezierCurveTo(size,-size/6,size/2,-size/2,0,size/4);
      ctx.fill(); break;
    case "wave":
      ctx.lineWidth = size/4; ctx.beginPath();
      for(let i=-size;i<=size;i+=2) {
        const y2 = Math.sin(i*0.3)*size/3;
        if(i===-size) ctx.moveTo(i,y2); else ctx.lineTo(i,y2);
      }
      ctx.stroke(); break;
    case "arrow":
      ctx.beginPath(); ctx.moveTo(-size/2,size/4); ctx.lineTo(size/4,size/4);
      ctx.lineTo(size/4,size/2); ctx.lineTo(size/2,0);
      ctx.lineTo(size/4,-size/2); ctx.lineTo(size/4,-size/4);
      ctx.lineTo(-size/2,-size/4); ctx.closePath(); ctx.fill(); break;
    default:
      ctx.beginPath(); ctx.arc(0,0,size/2,0,Math.PI*2); ctx.fill();
  }
}

function animateBurst() {
  bCtx.clearRect(0, 0, bW, bH);
  let alive = false;
  for (const p of bParticles) {
    if (p.life <= 0) continue;
    alive = true;
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.12; // gravity
    p.vx *= 0.99;
    p.rot += p.rotSpeed;
    p.life -= p.decay;
    bCtx.save();
    bCtx.globalAlpha = Math.max(0, p.life);
    bCtx.translate(p.x, p.y);
    bCtx.rotate(p.rot);
    drawShape(bCtx, p.shape, p.size, p.color);
    bCtx.restore();
  }
  if (alive) bAnimId = requestAnimationFrame(animateBurst);
  else { bCtx.clearRect(0,0,bW,bH); bAnimId = null; }
}

function triggerBurst(num) {
  if (bAnimId) cancelAnimationFrame(bAnimId);
  createBurstParticles(num);
  animateBurst();
  const wrap = document.getElementById("resultWrap");
  wrap.classList.add("burst-active");
  setTimeout(() => wrap.classList.remove("burst-active"), 1000);
}

// ═══════════════════════════════════════════════════
//  NUMEROLOGY DATA
// ═══════════════════════════════════════════════════
const LIFE_PATH_DATA = {
  1: {
    title: "The Leader",
    element: "Fire · Sun · Independence",
    desc: "You are a natural-born pioneer with an independent spirit and fierce determination. You thrive when charting your own course and have an innate ability to inspire others with your vision and courage. The number 1 is the primal force of creation — and you carry that energy in everything you do.",
    strengths: ["Leadership","Courage","Innovation","Determination","Self-reliance"],
    challenges: ["Stubbornness","Impatience","Domineering","Loneliness","Overconfidence"],
    purpose: "Your soul's purpose is to step into your power unapologetically. You are here to blaze trails, not follow them.",
    career: "You excel in entrepreneurship, executive leadership, military, athletics, or any field that demands independence and initiative.",
    love: "In relationships you need a partner who respects your autonomy. You love deeply but require space to lead. Power struggles can arise — choosing partners who admire rather than compete with you brings harmony.",
    famousPeople: [
      { name:"Martin Luther King Jr.", role:"Civil Rights Leader", born:"Jan 15, 1929" },
      { name:"Steve Jobs",             role:"Tech Visionary",      born:"Feb 24, 1955" },
      { name:"Lady Gaga",              role:"Musician & Artist",   born:"Mar 28, 1986" },
      { name:"Tom Hanks",              role:"Actor",               born:"Jul 9, 1956"  },
      { name:"Nikola Tesla",           role:"Inventor",            born:"Jul 10, 1856" },
    ],
  },
  2: {
    title: "The Peacemaker",
    element: "Water · Moon · Partnership",
    desc: "You possess a deep gift for diplomacy and emotional intelligence. Your sensitivity allows you to sense what others need, making you an extraordinary partner and mediator. The number 2 is the energy of duality, harmony, and the sacred power of togetherness.",
    strengths: ["Diplomacy","Empathy","Intuition","Patience","Cooperation"],
    challenges: ["Indecisiveness","Over-sensitivity","People-pleasing","Self-doubt","Codependency"],
    purpose: "Your soul's mission is to heal divisions and bring people together. You thrive in service to others and in creating environments of peace.",
    career: "You shine as a counsellor, therapist, diplomat, mediator, musician, or in any collaborative or healing role.",
    love: "Love is your greatest domain. You are devoted, attentive, and deeply romantic. Your challenge is to love yourself as fully as you love others — setting healthy boundaries ensures your relationships are nourishing, not draining.",
    famousPeople: [
      { name:"Barack Obama",   role:"44th U.S. President",  born:"Aug 4, 1961"  },
      { name:"Jennifer Aniston",role:"Actress",             born:"Feb 11, 1969" },
      { name:"Kanye West",     role:"Music Producer",       born:"Jun 8, 1977"  },
      { name:"Diana, Princess",role:"Humanitarian",         born:"Jul 1, 1961"  },
      { name:"Bill Clinton",   role:"42nd U.S. President",  born:"Aug 19, 1946" },
    ],
  },
  3: {
    title: "The Creator",
    element: "Air · Jupiter · Expression",
    desc: "You radiate creativity and self-expression. Your natural charm and artistic gifts draw people to you, and you uplift every room you enter with joy and inspiration. The number 3 vibrates at the frequency of joy itself — it is the trinity of mind, body, and spirit finding voice.",
    strengths: ["Creativity","Charisma","Optimism","Communication","Inspiration"],
    challenges: ["Scattered energy","Superficiality","Moodiness","Self-doubt","Procrastination"],
    purpose: "You are here to create, communicate, and uplift. Your art — whether it is painting, writing, speaking, or simply your presence — is medicine for the world.",
    career: "Writer, artist, performer, comedian, teacher, public speaker, designer, or any creative field where self-expression is the currency.",
    love: "You need a partner who celebrates your creativity and shares your love of laughter. Emotional depth matters — you crave connection that goes beyond the surface. Routine can feel like a cage; adventure in love keeps you thriving.",
    famousPeople: [
      { name:"David Bowie",      role:"Musician & Artist",  born:"Jan 8, 1947"  },
      { name:"Celine Dion",      role:"Singer",             born:"Mar 30, 1968" },
      { name:"John Travolta",    role:"Actor",              born:"Feb 18, 1954" },
      { name:"Christina Aguilera",role:"Singer",            born:"Dec 18, 1980" },
      { name:"Kevin Spacey",     role:"Actor",              born:"Jul 26, 1959" },
    ],
  },
  4: {
    title: "The Builder",
    element: "Earth · Saturn · Foundation",
    desc: "You are the foundation others rely on. Disciplined and hardworking, you excel at turning dreams into reality through meticulous effort and unwavering dedication. The number 4 is the number of the square — stability, structure, and the eternal laws that hold all things in place.",
    strengths: ["Discipline","Reliability","Precision","Loyalty","Endurance"],
    challenges: ["Rigidity","Workaholism","Resistance to change","Stubbornness","Repression"],
    purpose: "You are here to build — lasting institutions, families, businesses, and legacies. Your patient, methodical nature is a rare and precious gift.",
    career: "Engineering, architecture, accounting, project management, law, medicine, construction, or any role requiring discipline and precision.",
    love: "You show love through action and consistency rather than grand gestures. You are fiercely loyal and seek a partner who values reliability. Learning to express vulnerability deepens your relationships profoundly.",
    famousPeople: [
      { name:"Oprah Winfrey",   role:"Media Mogul",        born:"Jan 29, 1954" },
      { name:"Brad Pitt",       role:"Actor",              born:"Dec 18, 1963" },
      { name:"Elon Musk",       role:"Entrepreneur",       born:"Jun 28, 1971" },
      { name:"Clint Eastwood",  role:"Actor & Director",   born:"May 31, 1930" },
      { name:"Arnold Schwarzenegger", role:"Actor & Politician", born:"Jul 30, 1947" },
    ],
  },
  5: {
    title: "The Adventurer",
    element: "Air · Mercury · Freedom",
    desc: "Freedom is your lifeblood. You crave variety, change, and new experiences. Your adaptability and curiosity lead you to a life rich with discovery and transformation. The number 5 is pure kinetic energy — the rolling stone that gathers experiences instead of moss.",
    strengths: ["Adaptability","Curiosity","Charisma","Resourcefulness","Courage"],
    challenges: ["Restlessness","Impulsivity","Commitment issues","Overindulgence","Irresponsibility"],
    purpose: "You are here to experience the full spectrum of life and share the wisdom of your adventures with others. Your freedom-loving nature is a gift when channelled with purpose.",
    career: "Travel, journalism, sales, marketing, film, exploration, politics, or any role where variety, communication, and freedom are present.",
    love: "You need a partner who understands your need for independence. Clinginess is the death of romance for you. You fall fast and love intensely — but commitment comes only when you choose it freely, not under pressure.",
    famousPeople: [
      { name:"Beyoncé",          role:"Singer & Entrepreneur",born:"Sep 4, 1981" },
      { name:"Abraham Lincoln",  role:"16th U.S. President",  born:"Feb 12, 1809"},
      { name:"Angelina Jolie",   role:"Actress & Activist",   born:"Jun 4, 1975" },
      { name:"Vincent Van Gogh", role:"Painter",              born:"Mar 30, 1853"},
      { name:"Mick Jagger",      role:"Musician",             born:"Jul 26, 1943"},
    ],
  },
  6: {
    title: "The Nurturer",
    element: "Earth · Venus · Harmony",
    desc: "You are driven by love, family, and responsibility. With a heart overflowing with compassion, you are the caretaker of your community and a beacon of unconditional support. The number 6 is the most loving vibration in numerology — the cosmic parent.",
    strengths: ["Compassion","Responsibility","Protectiveness","Devotion","Generosity"],
    challenges: ["Martyrdom","Over-protectiveness","Self-neglect","Control tendencies","Perfectionism"],
    purpose: "You are here to create beautiful, loving environments where others can flourish. Your care is your spiritual practice.",
    career: "Teaching, healthcare, counselling, social work, interior design, hospitality, parenting, veterinary work — any role where nurturing is the core.",
    love: "Love is your native language. You are a devoted partner and parent, often putting others first to a fault. The deepest lesson of your path is that receiving love is as sacred as giving it.",
    famousPeople: [
      { name:"John Lennon",     role:"Musician",           born:"Oct 9, 1940"  },
      { name:"Michael Jackson", role:"Entertainer",        born:"Aug 29, 1958" },
      { name:"Albert Einstein", role:"Physicist",          born:"Mar 14, 1879" },
      { name:"Bruce Willis",    role:"Actor",              born:"Mar 19, 1955" },
      { name:"Claire Danes",    role:"Actress",            born:"Apr 12, 1979" },
    ],
  },
  7: {
    title: "The Seeker",
    element: "Water · Neptune · Wisdom",
    desc: "You are a deep thinker drawn to the mysteries of existence. Your analytical mind and spiritual curiosity lead you on an endless quest for truth, wisdom, and inner knowing. The number 7 is the most spiritually significant number — the bridge between the seen and unseen worlds.",
    strengths: ["Wisdom","Analytical depth","Intuition","Introspection","Spiritual insight"],
    challenges: ["Isolation","Cynicism","Secretiveness","Over-analysis","Emotional distance"],
    purpose: "You are here to seek and share truth. Your purpose unfolds in solitude, study, and the quiet moments when the universe speaks directly to you.",
    career: "Research, science, philosophy, writing, psychology, spirituality, technology, investigation, or any field demanding deep analytical or intuitive insight.",
    love: "You are selective and take time to trust. Once you open your heart, your love is profound and loyal. You need intellectual connection as much as emotional — a partner who can match your depth of thought and respects your need for solitude.",
    famousPeople: [
      { name:"Leonardo DiCaprio",role:"Actor",              born:"Nov 11, 1974" },
      { name:"Princess Diana",   role:"Humanitarian",       born:"Jul 1, 1961"  },
      { name:"Stephen Hawking",  role:"Physicist",          born:"Jan 8, 1942"  },
      { name:"Bruce Lee",        role:"Martial Artist",     born:"Nov 27, 1940" },
      { name:"Marilyn Monroe",   role:"Actress",            born:"Jun 1, 1926"  },
    ],
  },
  8: {
    title: "The Powerhouse",
    element: "Earth · Saturn · Abundance",
    desc: "You are destined for material and worldly achievement. With exceptional leadership and business acumen, you have the power to build lasting legacies and great abundance. The number 8 is the number of infinity turned upright — the eternal cycle of giving and receiving on the material plane.",
    strengths: ["Authority","Ambition","Strategic vision","Resilience","Executive power"],
    challenges: ["Materialism","Workaholism","Control","Ruthlessness","Fear of failure"],
    purpose: "You are here to master the material world and demonstrate that power, wielded with integrity, is one of the highest forms of service.",
    career: "Finance, banking, real estate, executive leadership, law, medicine, entrepreneurship — any arena where authority and strategy determine outcomes.",
    love: "You are intensely loyal and protective, and you express love through provision and security. The risk is neglecting emotional intimacy in favour of achievement. Your relationships flourish when you bring the same dedication to your personal life as your professional one.",
    famousPeople: [
      { name:"Nelson Mandela",   role:"Statesman",          born:"Jul 18, 1918" },
      { name:"Pablo Picasso",    role:"Painter",            born:"Oct 25, 1881" },
      { name:"Edgar Allan Poe",  role:"Writer",             born:"Jan 19, 1809" },
      { name:"Sandra Bullock",   role:"Actress",            born:"Jul 26, 1964" },
      { name:"50 Cent",          role:"Rapper & Entrepreneur",born:"Jul 6, 1975"},
    ],
  },
  9: {
    title: "The Humanitarian",
    element: "Fire · Mars · Universal Love",
    desc: "You carry the wisdom of all numbers. Compassionate and idealistic, you feel called to serve humanity and leave the world more beautiful than you found it. The number 9 is the completion — the old soul who has lived many lives and accumulated their wisdom as a gift to share.",
    strengths: ["Compassion","Wisdom","Generosity","Idealism","Universal love"],
    challenges: ["Bitterness","Idealism vs. reality","Self-sacrifice","Emotional wounds","Letting go"],
    purpose: "You are here to serve humanity with love and wisdom. Your journey involves releasing attachment to outcomes and trusting that your gifts always find the right recipients.",
    career: "Humanitarian work, teaching, art, medicine, writing, activism, spirituality, counselling — any path that allows you to contribute to the greater good.",
    love: "You love deeply and with great generosity, sometimes giving so much you have nothing left for yourself. You are drawn to broken souls you wish to heal. Your greatest relationship lesson: you cannot love others into wholeness — only yourself.",
    famousPeople: [
      { name:"Mahatma Gandhi",    role:"Independence Leader", born:"Oct 2, 1869"  },
      { name:"Mother Teresa",     role:"Saint & Humanitarian",born:"Aug 26, 1910" },
      { name:"Elvis Presley",     role:"Musician",            born:"Jan 8, 1935"  },
      { name:"Jim Carrey",        role:"Actor & Comedian",    born:"Jan 17, 1962" },
      { name:"Tyra Banks",        role:"Model & TV Host",     born:"Dec 4, 1973"  },
    ],
  },
  11: {
    title: "The Illuminator",
    element: "Air · Uranus · Illumination ✦ Master Number",
    desc: "You are a Master Number — a rare soul with extraordinary intuitive and spiritual gifts. You are here to inspire and enlighten others, bridging the human and the divine. Life Path 11 is the most intuitive of all numbers, a beacon of spiritual light in a world that desperately needs it.",
    strengths: ["Intuition","Inspiration","Spiritual insight","Sensitivity","Visionary power"],
    challenges: ["Anxiety","Overwhelm","Self-doubt","Impracticality","Nervous tension"],
    purpose: "Your mission is to be a living bridge between the spiritual and physical realms — channelling divine insight into human understanding through art, teaching, healing, or leadership.",
    career: "Spiritual teacher, healer, psychologist, artist, inventor, visionary, counsellor — any role that allows you to channel higher wisdom into the world.",
    love: "You feel love at the deepest possible level. You are drawn to souls who share your spiritual sensitivity. Your partner must be able to hold space for your intensity without being overwhelmed by it.",
    famousPeople: [
      { name:"Jacqueline Kennedy",role:"Former First Lady",   born:"Jul 28, 1929" },
      { name:"Michelle Obama",    role:"Author & Activist",   born:"Jan 17, 1964" },
      { name:"Prince Charles",    role:"Former Prince of Wales",born:"Nov 14, 1948"},
      { name:"David Beckham",     role:"Footballer",          born:"May 2, 1975"  },
      { name:"Tony Blair",        role:"Former Prime Minister",born:"May 6, 1953" },
    ],
  },
  22: {
    title: "The Master Builder",
    element: "Earth · Vulcan · Manifestation ✦ Master Number",
    desc: "You carry the most powerful of all Life Path energies. You have the rare capacity to turn the highest spiritual ideals into concrete, world-changing realities. Life Path 22 combines the visionary sensitivity of 11 with the practical, methodical power of 4.",
    strengths: ["Manifestation power","Discipline","Vision","Precision","Global impact"],
    challenges: ["Enormous pressure","Self-limitation","Perfectionism","Overwhelm","Fear of failure"],
    purpose: "You are here to build something that outlasts you — a system, an institution, a movement, an idea — that elevates the entire human experience.",
    career: "Architecture, engineering, politics, international business, large-scale philanthropy, spiritual leadership, or any role operating at a civilisation-shaping scale.",
    love: "You are intensely loyal but can get so absorbed in your grand mission that intimate relationships suffer. The right partner understands your vision and supports your work without losing themselves in your orbit.",
    famousPeople: [
      { name:"Bill Gates",       role:"Tech Philanthropist", born:"Oct 28, 1955" },
      { name:"Paul McCartney",   role:"Musician",            born:"Jun 18, 1942" },
      { name:"Dalai Lama",       role:"Spiritual Leader",    born:"Jul 6, 1935"  },
      { name:"Demi Moore",       role:"Actress",             born:"Nov 11, 1962" },
      { name:"Will Smith",       role:"Actor & Producer",    born:"Sep 25, 1968" },
    ],
  },
  33: {
    title: "The Master Teacher",
    element: "Fire · Neptune · Unconditional Love ✦ Master Number",
    desc: "You embody the highest expression of love and spiritual teaching. Your path is one of selfless service, healing, and uplifting all of humanity through pure compassion. Life Path 33 is the rarest and most spiritually evolved of all numbers.",
    strengths: ["Unconditional love","Compassion","Healing","Selflessness","Spiritual mastery"],
    challenges: ["Martyrdom","Emotional exhaustion","Perfectionism","Overwhelm","Self-sacrifice"],
    purpose: "You are here to be the embodiment of unconditional love — healing through your presence, teaching through your being, and transforming lives simply by showing up fully.",
    career: "Healing arts, spiritual teaching, music, art, social reform, medicine, religious leadership — any path where love and service are inseparable.",
    love: "Your love is boundless and sacred. Your greatest challenge is ensuring that your love for humanity does not eclipse your love for the individual souls closest to you. You deserve to receive as much as you give.",
    famousPeople: [
      { name:"Francis Ford Coppola",role:"Film Director",    born:"Apr 7, 1939"  },
      { name:"Stephen King",    role:"Author",               born:"Sep 21, 1947" },
      { name:"Meryl Streep",    role:"Actress",              born:"Jun 22, 1949" },
      { name:"Albert Camus",    role:"Philosopher & Author", born:"Nov 7, 1913"  },
      { name:"Shaquille O'Neal",role:"Athlete & Entrepreneur",born:"Mar 6, 1972" },
    ],
  },
};

// ═══════════════════════════════════════════════════
//  CALCULATION
// ═══════════════════════════════════════════════════
function reduce(n, master = true) {
  while (n > 9) {
    if (master && (n===11||n===22||n===33)) break;
    n = String(n).split("").reduce((s,d)=>s+parseInt(d),0);
  }
  return n;
}

function calcLifePath(day, month, year) {
  const d = reduce(day);
  const m = reduce(month);
  const y = reduce(String(year).split("").reduce((s,d)=>s+parseInt(d),0));
  return reduce(d + m + y);
}

// ═══════════════════════════════════════════════════
//  UI
// ═══════════════════════════════════════════════════
const beginBtn    = document.getElementById("beginBtn");
const modalOv     = document.getElementById("modalOverlay");
const modalClose  = document.getElementById("modalClose");
const calcBtn     = document.getElementById("calculateBtn");
const recalcBtn   = document.getElementById("recalcBtn");
const stepInput   = document.getElementById("stepInput");
const stepResult  = document.getElementById("stepResult");
const inputError  = document.getElementById("inputError");

function openModal() {
  modalOv.classList.add("visible");
  setTimeout(()=>document.getElementById("inputDay").focus(), 350);
}
function closeModal() {
  modalOv.classList.remove("visible");
  setTimeout(()=>{ showStep(stepInput); clearInputs(); }, 360);
}
function showStep(el) {
  [stepInput,stepResult].forEach(s=>s.classList.add("hidden"));
  el.classList.remove("hidden");
}
function clearInputs() {
  ["inputDay","inputMonth","inputYear"].forEach(id=>document.getElementById(id).value="");
  inputError.textContent="";
}

beginBtn.addEventListener("click", openModal);
modalClose.addEventListener("click", closeModal);
recalcBtn.addEventListener("click", ()=>{ showStep(stepInput); clearInputs(); setTimeout(()=>document.getElementById("inputDay").focus(),50); });
modalOv.addEventListener("click", e=>{ if(e.target===modalOv) closeModal(); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape" && modalOv.classList.contains("visible")) closeModal(); });

// ── TABS ──
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    ["tabOverview","tabLife","tabFamous"].forEach(id=>{
      document.getElementById(id).classList.toggle("hidden", id!=="tab"+cap(tab));
    });
  });
});
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

// ── CALCULATE ──
calcBtn.addEventListener("click", ()=>{
  const day   = parseInt(document.getElementById("inputDay").value);
  const month = parseInt(document.getElementById("inputMonth").value);
  const year  = parseInt(document.getElementById("inputYear").value);

  if(!day||!month||!year){ inputError.textContent="Please fill in all three fields."; return; }
  if(day<1||day>31||month<1||month>12){ inputError.textContent="Please enter a valid date."; return; }
  if(year<1900||year>new Date().getFullYear()){ inputError.textContent="Please enter a valid birth year."; return; }
  inputError.textContent="";

  const num  = calcLifePath(day, month, year);
  const data = LIFE_PATH_DATA[num] || LIFE_PATH_DATA[9];

  document.getElementById("resultNumber").textContent = num;
  document.getElementById("resultTitle").textContent  = data.title;
  document.getElementById("resultElement").textContent = data.element;
  document.getElementById("resultDesc").textContent    = data.desc;

  const mkTags = (arr, cls="") => arr.map(t=>`<span class="trait-tag ${cls}">${t}</span>`).join("");
  document.getElementById("resultStrengths").innerHTML  = mkTags(data.strengths);
  document.getElementById("resultChallenges").innerHTML = mkTags(data.challenges,"challenge");

  document.getElementById("lifeContent").innerHTML = `
    <div class="life-block"><div class="life-block-title">✦ Soul Purpose</div><p>${data.purpose}</p></div>
    <div class="life-block"><div class="life-block-title">◈ Career &amp; Calling</div><p>${data.career}</p></div>
    <div class="life-block"><div class="life-block-title">♡ Love &amp; Relationships</div><p>${data.love}</p></div>
  `;

  document.getElementById("famousGrid").innerHTML = data.famousPeople.map(p=>`
    <div class="famous-card">
      <div class="famous-name">${p.name}</div>
      <div class="famous-role">${p.role}</div>
      <div class="famous-born">Born ${p.born}</div>
    </div>
  `).join("");

  // Re-trigger tab to overview
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  document.querySelector('.tab-btn[data-tab="overview"]').classList.add("active");
  document.getElementById("tabOverview").classList.remove("hidden");
  document.getElementById("tabLife").classList.add("hidden");
  document.getElementById("tabFamous").classList.add("hidden");

  // Re-animate number
  const numEl = document.getElementById("resultNumber");
  numEl.style.animation="none"; numEl.offsetHeight; numEl.style.animation="";

  showStep(stepResult);

  // Burst after modal animates in
  setTimeout(()=>triggerBurst(num), 400);
});

// ═══════════════════════════════════════════════════
//  HISTORY PAGE
// ═══════════════════════════════════════════════════
const historyOv   = document.getElementById("historyOverlay");
const learnBtn    = document.getElementById("learnBtn");
const historyClose= document.getElementById("historyClose");
const histCalcBtn = document.getElementById("historyCalculateBtn");

learnBtn.addEventListener("click", ()=>{
  historyOv.classList.add("visible");
  document.getElementById("historyPanel").scrollTop = 0;
});
historyClose.addEventListener("click", ()=> historyOv.classList.remove("visible"));
historyOv.addEventListener("click", e=>{ if(e.target===historyOv) historyOv.classList.remove("visible"); });
document.addEventListener("keydown", e=>{
  if(e.key==="Escape" && historyOv.classList.contains("visible")) historyOv.classList.remove("visible");
});
histCalcBtn.addEventListener("click", ()=>{
  historyOv.classList.remove("visible");
  setTimeout(openModal, 450);
});