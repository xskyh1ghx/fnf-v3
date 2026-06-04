const notesContainer = document.getElementById('notes');
const scoreEl = document.getElementById('score');
const healthFill = document.getElementById('health-fill');
const startBtn = document.getElementById('start-btn');
const song = document.getElementById('song');
const lanes = document.querySelectorAll('.lane');

let notes = [];
let score = 0;
let health = 1; // 1 = 100%
let started = false;
let startTime = 0;

// Simple chart: time (ms) and key
const chart = [
  { time: 1000, key: 'ArrowLeft' },
  { time: 1500, key: 'ArrowUp' },
  { time: 2000, key: 'ArrowRight' },
  { time: 2500, key: 'ArrowDown' },
  { time: 3000, key: 'ArrowLeft' },
  { time: 3500, key: 'ArrowUp' },
  { time: 4000, key: 'ArrowRight' },
  { time: 4500, key: 'ArrowDown' },
];

// Map keys to lane positions (0–3)
const lanePositions = {
  ArrowLeft: 0,
  ArrowUp: 1,
  ArrowDown: 2,
  ArrowRight: 3,
};

function spawnNotes() {
  chart.forEach(noteData => {
    const note = document.createElement('div');
    note.className = 'note';
    note.dataset.key = noteData.key;
    note.dataset.time = noteData.time;

    const laneIndex = lanePositions[noteData.key];
    const laneWidth = 400 / 4;
    const x = laneWidth * laneIndex + laneWidth / 2 - 20; // center note in lane

    note.style.left = x + 'px';
    note.textContent = arrowSymbol(noteData.key);

    notesContainer.appendChild(note);
    notes.push(note);
  });
}

function arrowSymbol(key) {
  if (key === 'ArrowLeft') return '←';
  if (key === 'ArrowUp') return '↑';
  if (key === 'ArrowDown') return '↓';
  if (key === 'ArrowRight') return '→';
  return '';
}

function update() {
  if (!started) return;

  const now = performance.now() - startTime;

  notes.forEach(note => {
    const noteTime = parseFloat(note.dataset.time);
    const travelTime = 1500; // ms from top to hit line
    const timeUntilHit = noteTime - now;
    const progress = 1 - (timeUntilHit / travelTime);
    const y = Math.max(0, Math.min(260, progress * 260)); // 260px to hit line

    note.style.top = y + 'px';

    // Missed note (passed hit line)
    if (timeUntilHit < -200) {
      missNote(note);
    }
  });

  requestAnimationFrame(update);
}

function hitNoteForKey(key) {
  if (!started) return;

  const now = performance.now() - startTime;
  const hitWindow = 200; // ms

  const hitNote = notes.find(note => {
    const noteTime = parseFloat(note.dataset.time);
    return (
      note.dataset.key === key &&
      Math.abs(noteTime - now) <= hitWindow
    );
  });

  if (hitNote) {
    score += 100;
    scoreEl.textContent = 'Score: ' + score;
    hitNote.remove();
    notes = notes.filter(n => n !== hitNote);
    flashLane(key, true);
  } else {
    // Bad hit
    changeHealth(-0.05);
    flashLane(key, false);
  }
}

function missNote(note) {
  note.remove();
  notes = notes.filter(n => n !== note);
  changeHealth(-0.1);
}

function changeHealth(delta) {
  health = Math.max(0, Math.min(1, health + delta));
  healthFill.style.width = (health * 100) + '%';

  if (health <= 0) {
    gameOver();
  }
}

function gameOver() {
  started = false;
  song.pause();
  alert('Game Over! Final score: ' + score);
}

function flashLane(key, good) {
  const lane = Array.from(lanes).find(l => l.dataset.key === key);
  if (!lane) return;
  lane.classList.add('active');
  lane.style.borderColor = good ? '#0f0' : '#f00';
  setTimeout(() => {
    lane.classList.remove('active');
    lane.style.borderColor = '#fff';
  }, 150);
}

window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'].includes(e.key)) {
    hitNoteForKey(e.key);
  }
});

startBtn.addEventListener('click', () => {
  if (started) return;
  started = true;
  score = 0;
  health = 1;
  scoreEl.textContent = 'Score: 0';
  healthFill.style.width = '100%';
  notes.forEach(n => n.remove());
  notes = [];

  spawnNotes();
  startTime = performance.now();
  song.currentTime = 0;
  song.play().catch(() => {
    console.log('Autoplay blocked; user interaction needed.');
  });
  requestAnimationFrame(update);
});
