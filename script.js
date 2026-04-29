const esMovil = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
// ----- OBTENER ELEMENTOS DEL HTML -----
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreSpan = document.getElementById("score");
const livesSpan = document.getElementById("lives");
const resetBtn = document.getElementById("resetButton");
const pausePlayBtn = document.getElementById("pausePlayButton");
const radioMouse = document.querySelector('input[value="mouse"]');
const radioKeyboard = document.querySelector('input[value="keyboard"]');

// ----- IMAGEN DE FONDO (cámbiala si quieres) -----
const fondoImagen = new Image();
fondoImagen.src = "https://i.imgur.com/K7uFlBAl.jpg";

// ----- VARIABLES DEL JUEGO -----
let score = 0;
let lives = 3;
let gameRunning = true;   // false cuando game over o victoria
let paused = false;       // pausa voluntaria

// ----- PALETA -----
const barra = {
  x: canvas.width / 2 - 60,
  y: canvas.height - 40,
  width: 120,
  height: 18,
  speed: 8
};

// ----- BOLA -----
let bola = {
  x: canvas.width / 2,
  y: canvas.height - 70,
  radio: 8,
  dx: 3.5,
  dy: -3.5
};

// ----- BLOQUES -----
const filas = 6;
const columnas = 10;
const bloqueAncho = 65;
const bloqueAlto = 25;
const bloques = [];

function crearBloques() {
  for (let i = 0; i < filas; i++) {
    bloques[i] = [];
    for (let j = 0; j < columnas; j++) {
      bloques[i][j] = { activo: true, x: 0, y: 0 };
    }
  }
}

function dibujarBloques() {
  for (let i = 0; i < filas; i++) {
    for (let j = 0; j < columnas; j++) {
      if (bloques[i][j].activo) {
        const x = j * (bloqueAncho + 5) + 30;
        const y = i * (bloqueAlto + 5) + 50;
        bloques[i][j].x = x;
        bloques[i][j].y = y;
        const colores = ["#ff66cc", "#ff44aa", "#ff88ee", "#ffaaff", "#ffccee"];
        ctx.fillStyle = colores[i % colores.length];
        ctx.fillRect(x, y, bloqueAncho, bloqueAlto);
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(x, y, bloqueAncho, bloqueAlto);
      }
    }
  }
}

function dibujarPaleta() {
  ctx.fillStyle = "#66ffff";
  ctx.shadowBlur = 10;
  ctx.fillRect(barra.x, barra.y, barra.width, barra.height);
  ctx.shadowBlur = 0;
}

function dibujarBola() {
  ctx.beginPath();
  ctx.arc(bola.x, bola.y, bola.radio, 0, Math.PI * 2);
  ctx.fillStyle = "#ffff66";
  ctx.fill();
  ctx.closePath();
}

function actualizarUI() {
  scoreSpan.textContent = score;
  livesSpan.textContent = lives;
}

function reiniciarJuego() {
  gameRunning = true;
  paused = false;
  pausePlayBtn.textContent = "⏸️ Pausar";
  score = 0;
  lives = 3;
  bola.x = canvas.width / 2;
  bola.y = canvas.height - 70;
  bola.dx = 3.5;
  bola.dy = -3.5;
  barra.x = canvas.width / 2 - barra.width / 2;
  for (let i = 0; i < filas; i++) {
    for (let j = 0; j < columnas; j++) {
      bloques[i][j].activo = true;
    }
  }
  actualizarUI();
}

function colisionBloques() {
  let bloqueGolpeado = false;
  for (let i = 0; i < filas; i++) {
    for (let j = 0; j < columnas; j++) {
      const b = bloques[i][j];
      if (b.activo) {
        if (bola.x + bola.radio > b.x &&
            bola.x - bola.radio < b.x + bloqueAncho &&
            bola.y + bola.radio > b.y &&
            bola.y - bola.radio < b.y + bloqueAlto) {
          b.activo = false;
          score += 10;
          actualizarUI();
          bloqueGolpeado = true;
          let solapaIzq = (bola.x + bola.radio) - b.x;
          let solapaDer = (b.x + bloqueAncho) - (bola.x - bola.radio);
          let solapaSup = (bola.y + bola.radio) - b.y;
          let solapaInf = (b.y + bloqueAlto) - (bola.y - bola.radio);
          let minSolapa = Math.min(solapaIzq, solapaDer, solapaSup, solapaInf);
          if (minSolapa === solapaIzq || minSolapa === solapaDer) bola.dx = -bola.dx;
          if (minSolapa === solapaSup || minSolapa === solapaInf) bola.dy = -bola.dy;
          break;
        }
      }
    }
    if (bloqueGolpeado) break;
  }
}

function moverBola() {
  if (!gameRunning || paused) return;  // no se mueve si pausado o game over
  
  bola.x += bola.dx;
  bola.y += bola.dy;
  
  // rebotes laterales y superior
  if (bola.x + bola.radio > canvas.width || bola.x - bola.radio < 0) {
    bola.dx = -bola.dx;
  }
  if (bola.y - bola.radio < 0) {
    bola.dy = -bola.dy;
  }
  
  // perder vida
  if (bola.y + bola.radio > canvas.height) {
    lives--;
    actualizarUI();
    if (lives <= 0) {
      gameRunning = false;
      paused = false;
      alert("💀 GAME OVER 💀\nPresiona 'NUEVA PARTIDA'");
      return;
    } else {
      bola.x = canvas.width / 2;
      bola.y = canvas.height - 70;
      bola.dx = 3.5;
      bola.dy = -3.5;
      barra.x = canvas.width / 2 - barra.width / 2;
    }
  }
  
  // colisión con la paleta
  if (bola.y + bola.radio > barra.y &&
      bola.x > barra.x &&
      bola.x < barra.x + barra.width) {
    let impacto = (bola.x - barra.x) / barra.width;
    let angulo = (impacto - 0.5) * 1.2;
    bola.dx = angulo * 6;
    bola.dy = -Math.abs(bola.dy);
    if (Math.abs(bola.dx) < 2.5) bola.dx = bola.dx > 0 ? 2.5 : -2.5;
  }
  
  colisionBloques();
  
  // comprobar victoria
  let todosInactivos = true;
  for (let i = 0; i < filas; i++) {
    for (let j = 0; j < columnas; j++) {
      if (bloques[i][j].activo) {
        todosInactivos = false;
        break;
      }
    }
  }
  if (todosInactivos && gameRunning) {
    gameRunning = false;
    paused = false;
    alert("🎉 ¡HAS GANADO! 🎉");
  }
}

// ----- CONTROL POR RATÓN -----
function moverPaletaMouse(e) {
  if (!gameRunning || paused) return;
  const controlModo = document.querySelector('input[name="control"]:checked').value;
  if (controlModo !== "mouse") return;
  
  const rect = canvas.getBoundingClientRect();
  let mouseX = e.clientX - rect.left;
  mouseX = Math.min(Math.max(mouseX, 0), canvas.width - barra.width);
  barra.x = mouseX;
}

// ----- CONTROL POR TECLADO -----
let teclaIzquierda = false;
let teclaDerecha = false;

function actualizarPaletaTeclado() {
  if (!gameRunning || paused) return;
  const controlModo = document.querySelector('input[name="control"]:checked').value;
  if (controlModo !== "keyboard") return;
  
  if (teclaIzquierda) {
    barra.x -= barra.speed;
  }
  if (teclaDerecha) {
    barra.x += barra.speed;
  }
  barra.x = Math.min(Math.max(barra.x, 0), canvas.width - barra.width);
}

function handleKeyDown(e) {
  const controlModo = document.querySelector('input[name="control"]:checked').value;
  if (controlModo !== "keyboard") return;
  
  if (e.key === "ArrowLeft") {
    teclaIzquierda = true;
    e.preventDefault();
  } else if (e.key === "ArrowRight") {
    teclaDerecha = true;
    e.preventDefault();
  }
}

function handleKeyUp(e) {
  if (e.key === "ArrowLeft") {
    teclaIzquierda = false;
    e.preventDefault();
  } else if (e.key === "ArrowRight") {
    teclaDerecha = false;
    e.preventDefault();
  }
}

// ----- PAUSA Y REANUDAR -----
function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  pausePlayBtn.textContent = paused ? "▶️ Reanudar" : "⏸️ Pausar";
}

// ----- DIBUJAR FONDO -----
function dibujarFondo() {
  if (fondoImagen.complete && fondoImagen.naturalWidth > 0) {
    ctx.drawImage(fondoImagen, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#2a0f2a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ----- ANIMACIÓN PRINCIPAL -----
function animar() {
  dibujarFondo();
  dibujarBloques();
  dibujarPaleta();
  dibujarBola();
  
  actualizarPaletaTeclado();  // movimiento por teclado (si procede)
  moverBola();                // movimiento de la bola (respeta pausa)
  
  requestAnimationFrame(animar);
}

// ----- EVENTOS E INICIALIZACIÓN -----
canvas.addEventListener("mousemove", moverPaletaMouse);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
resetBtn.addEventListener("click", reiniciarJuego);
pausePlayBtn.addEventListener("click", togglePause);
// Mover paleta con el dedo (móvil)
canvas.addEventListener("touchmove", function(e) {
  e.preventDefault();  // evitar que la pantalla se desplace
  const rect = canvas.getBoundingClientRect();
  let touchX = e.touches[0].clientX - rect.left;
  touchX = Math.min(Math.max(touchX, 0), canvas.width - barra.width);
  barra.x = touchX;
});
canvas.addEventListener("touchstart", function(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  let touchX = e.touches[0].clientX - rect.left;
  touchX = Math.min(Math.max(touchX, 0), canvas.width - barra.width);
  barra.x = touchX;
});

crearBloques();
reiniciarJuego();
animar();
