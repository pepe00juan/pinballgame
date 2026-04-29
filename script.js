// ----- OBTENER ELEMENTOS DEL HTML -----
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreSpan = document.getElementById("score");
const livesSpan = document.getElementById("lives");
const resetBtn = document.getElementById("resetButton");
const pausePlayBtn = document.getElementById("pausePlayButton");
const radioMouse = document.querySelector('input[value="mouse"]');
const radioKeyboard = document.querySelector('input[value="keyboard"]');

// ----- IMAGEN DE FONDO -----
const fondoImagen = new Image();
fondoImagen.src = "https://i.imgur.com/9ZwMcDk.jpeg";

// ----- VARIABLES DEL JUEGO -----
let score = 0;
let lives = 3;
let gameRunning = true;
let paused = false;
let yaPerdioVida = false;
let tiempoUltimaPerdida = 0; // FIX: para evitar pérdidas rápidas

// ----- NIVELES Y GUARDADO -----
let nivelActual = 1;
let puntuacionMaxima = 0;
let totalNiveles = 10;

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
const filas = 8;
const columnas = 10;
const bloqueAncho = 65;
const bloqueAlto = 22;
const bloques = [];

// ----- FUNCIÓN CREAR BLOQUES -----
function crearBloques() {
  let densidadObjetivo;
  if (nivelActual <= 2) densidadObjetivo = 0.45;
  else if (nivelActual <= 5) densidadObjetivo = 0.65;
  else if (nivelActual <= 8) densidadObjetivo = 0.80;
  else densidadObjetivo = 0.92;

  const nuevaMatriz = Array(filas).fill().map(() => Array(columnas).fill(false));
  let minPorFila = nivelActual <= 2 ? 3 : (nivelActual <= 5 ? 5 : 7);
  
  for (let i = 0; i < filas; i++) {
    let indicesDisponibles = Array.from({length: columnas}, (_, idx) => idx);
    for (let k = 0; k < minPorFila; k++) {
      if (indicesDisponibles.length === 0) break;
      let rand = Math.floor(Math.random() * indicesDisponibles.length);
      let col = indicesDisponibles[rand];
      nuevaMatriz[i][col] = true;
      indicesDisponibles.splice(rand, 1);
    }
    for (let j = 0; j < columnas; j++) {
      if (!nuevaMatriz[i][j] && Math.random() < densidadObjetivo) {
        nuevaMatriz[i][j] = true;
      }
    }
  }
  
  for (let j = 0; j < columnas; j++) {
    let colVacia = true;
    for (let i = 0; i < filas; i++) {
      if (nuevaMatriz[i][j]) {
        colVacia = false;
        break;
      }
    }
    if (colVacia) {
      let filaAzar = Math.floor(Math.random() * filas);
      nuevaMatriz[filaAzar][j] = true;
    }
  }
  
  for (let i = 0; i < filas; i++) {
    let consecutivasVacias = 0;
    for (let j = 0; j < columnas; j++) {
      if (!nuevaMatriz[i][j]) {
        consecutivasVacias++;
        if (consecutivasVacias >= 4) {
          nuevaMatriz[i][j] = true;
          consecutivasVacias = 0;
        }
      } else {
        consecutivasVacias = 0;
      }
    }
  }
  
  for (let i = 0; i < filas; i++) {
    bloques[i] = [];
    for (let j = 0; j < columnas; j++) {
      bloques[i][j] = { activo: nuevaMatriz[i][j], x: 0, y: 0 };
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
  // FIX: Garantizar que las vidas no se muestren negativas
  if (lives < 0) lives = 0;
  scoreSpan.textContent = score;
  livesSpan.textContent = lives;
}

// ----- GUARDADO -----
function guardarProgreso() {
  let recordActual = localStorage.getItem('puntuacionMaxima');
  if (recordActual === null || score > parseInt(recordActual)) {
    localStorage.setItem('puntuacionMaxima', score);
  }
  localStorage.setItem('nivelAlcanzado', nivelActual);
  localStorage.setItem('vidasGuardadas', lives < 0 ? 0 : lives);
  localStorage.setItem('puntuacionActual', score);
}

function cargarProgreso() {
  let nivelGuardado = localStorage.getItem('nivelAlcanzado');
  let recordGuardado = localStorage.getItem('puntuacionMaxima');
  let vidasGuardadas = localStorage.getItem('vidasGuardadas');
  let puntuacionGuardada = localStorage.getItem('puntuacionActual');
  
  if (nivelGuardado !== null) {
    nivelActual = parseInt(nivelGuardado);
    let vidasCargadas = vidasGuardadas !== null ? parseInt(vidasGuardadas) : 3;
    // FIX: Asegurar vidas válidas (entre 1 y 5, o reiniciar a 3 si es 0 o negativo)
    if (vidasCargadas <= 0) vidasCargadas = 3;
    lives = vidasCargadas;
    score = puntuacionGuardada !== null ? parseInt(puntuacionGuardada) : 0;
    puntuacionMaxima = recordGuardado !== null ? parseInt(recordGuardado) : 0;
    actualizarUI();
    crearBloques();
    bola.x = canvas.width / 2;
    bola.y = canvas.height - 70;
    bola.dx = 3.5 + (nivelActual * 0.15);
    bola.dy = -3.5 - (nivelActual * 0.15);
    barra.x = canvas.width / 2 - barra.width / 2;
    yaPerdioVida = false;
    alert(`Progreso cargado: Nivel ${nivelActual}, Puntos ${score}, Vidas ${lives}`);
  } else {
    // FIX: Valores por defecto seguros
    nivelActual = 1;
    lives = 3;
    score = 0;
    puntuacionMaxima = 0;
    yaPerdioVida = false;
    crearBloques();
    actualizarUI();
  }
}

function resetearProgreso() {
  localStorage.clear();
  nivelActual = 1;
  lives = 3;
  score = 0;
  puntuacionMaxima = 0;
  yaPerdioVida = false;
  gameRunning = true;
  paused = false;
  crearBloques();
  bola.x = canvas.width / 2;
  bola.y = canvas.height - 70;
  bola.dx = 3.5;
  bola.dy = -3.5;
  barra.x = canvas.width / 2 - barra.width / 2;
  actualizarUI();
  alert("Progreso reiniciado. ¡Empiezas desde nivel 1!");
}

function reiniciarJuego() {
  if (confirm("¿Quieres empezar desde el nivel 1? (Se perderá el progreso guardado)")) {
    resetearProgreso();
  } else {
    cargarProgreso();
  }
  gameRunning = true;
  paused = false;
  yaPerdioVida = false;
  pausePlayBtn.textContent = "⏸️ Pausar";
}

// ----- COLISIONES -----
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

// ----- MOVIMIENTO BOLA (CORREGIDO) -----
function moverBola() {
  if (!gameRunning || paused) return;
  
  bola.x += bola.dx;
  bola.y += bola.dy;
  
  // Rebotes laterales y superior
  if (bola.x + bola.radio > canvas.width || bola.x - bola.radio < 0) {
    bola.dx = -bola.dx;
  }
  if (bola.y - bola.radio < 0) {
    bola.dy = -bola.dy;
  }
  
  // Pérdida de vida con protección mejorada
  if (bola.y + bola.radio > canvas.height) {
    // Evitar pérdidas múltiples en el mismo frame o muy seguidas
    const ahora = Date.now();
    if (!yaPerdioVida && (ahora - tiempoUltimaPerdida > 500)) {
      lives--;
      actualizarUI();
      
      // FIX: Si después de restar lives es 0 o negativo, game over inmediato
      if (lives <= 0) {
        gameRunning = false;
        paused = false;
        alert("💀 GAME OVER 💀\nPresiona 'NUEVA PARTIDA'");
        return;
      }
      
      guardarProgreso();
      yaPerdioVida = true;
      tiempoUltimaPerdida = ahora;
      
      // Reposicionar bola y paleta
      bola.x = canvas.width / 2;
      bola.y = canvas.height - 70;
      bola.dx = 3.5 + (nivelActual * 0.15);
      bola.dy = -3.5 - (nivelActual * 0.15);
      barra.x = canvas.width / 2 - barra.width / 2;
    }
  } else {
    yaPerdioVida = false;
  }
  
  // Colisión con paleta
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
  
  // Victoria y subir de nivel
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
    if (nivelActual < totalNiveles) {
      nivelActual++;
      guardarProgreso();
      bola.x = canvas.width / 2;
      bola.y = canvas.height - 70;
      bola.dx = 3.5 + (nivelActual * 0.15);
      bola.dy = -3.5 - (nivelActual * 0.15);
      barra.x = canvas.width / 2 - barra.width / 2;
      crearBloques();
      alert(`🎉 ¡PASAS AL NIVEL ${nivelActual}! 🎉`);
    } else {
      gameRunning = false;
      paused = false;
      alert("🎉 ¡FELICIDADES, COMPLETASTE TODOS LOS NIVELES! 🎉");
    }
  }
}

// ----- CONTROL RATÓN -----
function moverPaletaMouse(e) {
  if (!gameRunning || paused) return;
  const controlModo = document.querySelector('input[name="control"]:checked').value;
  if (controlModo !== "mouse") return;
  const rect = canvas.getBoundingClientRect();
  let mouseX = e.clientX - rect.left;
  mouseX = Math.min(Math.max(mouseX, 0), canvas.width - barra.width);
  barra.x = mouseX;
}

// ----- CONTROL TÁCTIL -----
function moverPaletaTouch(e) {
  e.preventDefault();
  if (!gameRunning || paused) return;
  const rect = canvas.getBoundingClientRect();
  let touchX = e.touches[0].clientX - rect.left;
  touchX = Math.min(Math.max(touchX, 0), canvas.width - barra.width);
  barra.x = touchX;
}

canvas.addEventListener("touchstart", moverPaletaTouch);
canvas.addEventListener("touchmove", moverPaletaTouch);

// ----- CONTROL TECLADO -----
let teclaIzquierda = false;
let teclaDerecha = false;

function actualizarPaletaTeclado() {
  if (!gameRunning || paused) return;
  const controlModo = document.querySelector('input[name="control"]:checked').value;
  if (controlModo !== "keyboard") return;
  if (teclaIzquierda) barra.x -= barra.speed;
  if (teclaDerecha) barra.x += barra.speed;
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
  if (e.key === "ArrowLeft") teclaIzquierda = false;
  if (e.key === "ArrowRight") teclaDerecha = false;
}

// ----- PAUSA -----
function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  pausePlayBtn.textContent = paused ? "▶️ Reanudar" : "⏸️ Pausar";
}

// ----- FONDO -----
function dibujarFondo() {
  if (fondoImagen.complete && fondoImagen.naturalWidth > 0) {
    ctx.drawImage(fondoImagen, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#2a0f2a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ----- ANIMACIÓN -----
function animar() {
  dibujarFondo();
  dibujarBloques();
  dibujarPaleta();
  dibujarBola();
  actualizarPaletaTeclado();
  moverBola();
  requestAnimationFrame(animar);
}

// ----- EVENTOS E INICIALIZACIÓN -----
canvas.addEventListener("mousemove", moverPaletaMouse);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
resetBtn.addEventListener("click", reiniciarJuego);
pausePlayBtn.addEventListener("click", togglePause);

// FIX: Inicialización segura
crearBloques();
cargarProgreso();  // Esto cargará valores válidos (si no hay guardado, pone lives=3)
animar();