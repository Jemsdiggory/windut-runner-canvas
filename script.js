const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartButton = document.getElementById("restartButton");

// settings game nya
const setting = {
  playerColor: "#3478f6",
  playerSize: 50,
  playerSpeed: 300,
  coinColor: "#ffd43b",
  coinSize: 14,
  coinScore: 20,
  obstaclePenalty: 20,
  winScore: 100,
  gameTime: 60
};

const playerImage = new Image();
playerImage.src = "player.jpg";
playerImage.onload = drawGame;

const player = {
  x: 100,
  y: canvas.height / 2,
  flightY: canvas.height / 2,
  size: setting.playerSize,
  color: setting.playerColor
};

const startPosition = { x: player.x, y: player.y };
const coins = [
  { x: 380, y: 130, size: setting.coinSize, color: setting.coinColor },
  { x: 680, y: 300, size: setting.coinSize, color: setting.coinColor },
  { x: 990, y: 180, size: setting.coinSize, color: setting.coinColor }
];
const hazards = [
  { x: 520, y: 145, size: 25, color: "#ed3451", name: "BAHAYA" },
  { x: 850, y: 290, size: 25, color: "#ed3451", name: "BAHAYA" },
  { x: 1200, y: 200, size: 25, color: "#ed3451", name: "BAHAYA" }
];

const keys = new Set();
let score = 0;
let timeLeft = setting.gameTime;
let gameState = "PLAYING";
let message = "";
let messageUntil = 0;
let lastFrame = 0;
let timerId;
let worldSpeed = setting.playerSpeed;
let floatTime = 0;
let gridOffset = 0;
const backgroundOffset = { far: 0, clouds: 0, near: 0 };

function drawBackground() {
  ctx.fillStyle = "#e9f4ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // pegunungan bergerak paling pelan.
  ctx.fillStyle = "rgba(84, 146, 198, 0.12)";
  for (let x = -backgroundOffset.far; x < canvas.width; x += 220) {
    ctx.beginPath();
    ctx.moveTo(x, 370);
    ctx.quadraticCurveTo(x + 55, 255, x + 110, 350);
    ctx.quadraticCurveTo(x + 165, 275, x + 220, 370);
    ctx.lineTo(x + 220, canvas.height);
    ctx.lineTo(x, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  // Awan di lapisan tengah.
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  for (let x = -backgroundOffset.clouds; x < canvas.width; x += 360) {
    drawCloud(x + 55, 92, 1);
    drawCloud(x + 245, 165, 0.75);
  }

  // Bukit dekat gerak lebih cepat.
  ctx.fillStyle = "rgba(43, 122, 169, 0.08)";
  for (let x = -backgroundOffset.near; x < canvas.width; x += 300) {
    ctx.beginPath();
    ctx.moveTo(x, 425);
    ctx.quadraticCurveTo(x + 75, 375, x + 150, 420);
    ctx.quadraticCurveTo(x + 225, 385, x + 300, 425);
    ctx.lineTo(x + 300, canvas.height);
    ctx.lineTo(x, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(37, 100, 150, 0.12)";
  ctx.lineWidth = 1;

  for (let x = -gridOffset; x <= canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

}

function drawCloud(x, y, scale) {
  ctx.beginPath();
  ctx.ellipse(x, y, 30 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 17 * scale, y + 2 * scale, 16 * scale, 11 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 16 * scale, y + 1 * scale, 19 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);

  if (playerImage.complete && playerImage.naturalWidth > 0) {
    ctx.save();
    ctx.clip();
    ctx.drawImage(playerImage, player.x - player.size, player.y - player.size, player.size * 2, player.size * 2);
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.size, player.y - player.size, player.size * 2, player.size * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = player.color;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#fff";
  ctx.stroke();

  ctx.fillStyle = "#17356b";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PLAYER", player.x, player.y + player.size + 22);
}

function drawCoin(coin) {
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, coin.size, 0, Math.PI * 2);
  ctx.fillStyle = coin.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(coin.x, coin.y, coin.size * 0.38, coin.size * 0.68, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff4b0";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawHazard(hazard) {
  ctx.fillStyle = hazard.color;
  ctx.beginPath();
  ctx.moveTo(hazard.x, hazard.y - hazard.size);
  ctx.lineTo(hazard.x + hazard.size, hazard.y + hazard.size);
  ctx.lineTo(hazard.x - hazard.size, hazard.y + hazard.size);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.fillStyle = "#17356b";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(hazard.name, hazard.x, hazard.y + hazard.size + 18);
}

function drawGame() {
  drawBackground();
  coins.forEach(drawCoin);
  hazards.forEach(drawHazard);
  drawPlayer();

  ctx.textAlign = "left";
  ctx.font = "bold 18px Arial";
  ctx.fillStyle = "#14285d";
  ctx.fillText(`Score: ${score}`, 18, 30);
  ctx.textAlign = "right";
  ctx.fillText(`Time: ${timeLeft}s`, canvas.width - 18, 30);

  if (message && performance.now() < messageUntil) {
    ctx.textAlign = "center";
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = message.startsWith("Bahaya!") ? "#ed3451" : "#14285d";
    ctx.fillText(message, canvas.width / 2, 42);
  }

  if (gameState !== "PLAYING") {
    ctx.fillStyle = "rgba(20, 40, 93, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = gameState === "WIN" ? "#ffe06b" : "#fff";
    ctx.font = "bold 36px Arial";
    ctx.fillText(gameState === "WIN" ? "YOU WIN!" : "GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`Score akhir: ${score}`, canvas.width / 2, canvas.height / 2 + 34);
  }
}

function finishGame(state) {
  if (gameState !== "PLAYING") return;
  gameState = state;
  keys.clear();
  clearInterval(timerId);
  restartButton.hidden = false;
}

function getBox(object) {
  return {
    x: object.x - object.size,
    y: object.y - object.size,
    width: object.size * 2,
    height: object.size * 2
  };
}

function isColliding(a, b) {
  return !(
    a.x + a.width <= b.x ||
    a.x >= b.x + b.width ||
    a.y + a.height <= b.y ||
    a.y >= b.y + b.height
  );
}

function moveCoin(coin) {
  coin.x = canvas.width + 160 + Math.random() * 420;
  coin.y = 60 + Math.random() * (canvas.height - 120);
}

function moveHazard(hazard) {
  const otherHazards = hazards.filter((other) => other !== hazard);
  const lastHazard = Math.max(canvas.width, ...otherHazards.map((other) => other.x));
  hazard.x = lastHazard + 240 + Math.random() * 260;
  hazard.y = hazard.size + 45 + Math.random() * (canvas.height - hazard.size * 2 - 90);
}

function update(deltaTime) {
  if (gameState !== "PLAYING") return;

  worldSpeed = Math.min(worldSpeed + 6 * deltaTime, 600);
  backgroundOffset.far = wrapOffset(backgroundOffset.far + worldSpeed * 0.08 * deltaTime, 220);
  backgroundOffset.clouds = wrapOffset(backgroundOffset.clouds + worldSpeed * 0.18 * deltaTime, 360);
  backgroundOffset.near = wrapOffset(backgroundOffset.near + worldSpeed * 0.32 * deltaTime, 300);
  gridOffset = wrapOffset(gridOffset + worldSpeed * deltaTime, 40);

  // player terbang, sementara  koin sama obstacle bergerak ke arahnya.
  let directionY = 0;
  if (keys.has("arrowdown") || keys.has("s")) directionY++;
  if (keys.has("arrowup") || keys.has("w")) directionY--;
  player.flightY += directionY * setting.playerSpeed * deltaTime;
  player.flightY = Math.max(player.size + 5, Math.min(canvas.height - player.size - 5, player.flightY));
  floatTime += deltaTime;
  player.y = player.flightY + Math.sin(floatTime * 4) * 5;

  coins.forEach((coin) => {
    coin.x -= worldSpeed * deltaTime;
    if (coin.x + coin.size < 0) moveCoin(coin);
  });
  hazards.forEach((hazard) => {
    hazard.x -= worldSpeed * deltaTime;
    if (hazard.x + hazard.size < 0) moveHazard(hazard);
  });

  const playerBox = getBox(player);
  for (const coin of coins) {
    if (isColliding(playerBox, getBox(coin))) {
      score += setting.coinScore;
      moveCoin(coin);
      message = `+${setting.coinScore} Score!`;
      messageUntil = performance.now() + 800;
      if (score >= setting.winScore) {
        finishGame("WIN");
        break;
      }
    }
  }

  if (gameState !== "PLAYING") return;

  for (const hazard of hazards) {
    if (isColliding(playerBox, getBox(hazard))) {
      score -= setting.obstaclePenalty;
      moveHazard(hazard);
      message = `Bahaya! -${setting.obstaclePenalty} Score`;
      messageUntil = performance.now() + 1200;
      break;
    }
  }
}

function gameLoop(time) {
  const deltaTime = lastFrame ? Math.min((time - lastFrame) / 1000, 0.05) : 0;
  lastFrame = time;
  update(deltaTime);
  drawGame();
  requestAnimationFrame(gameLoop);  
}

function wrapOffset(value, width) {
  return ((value % width) + width) % width;
}

function restartGame() {
  score = 0;
  timeLeft = setting.gameTime;
  gameState = "PLAYING";
  player.x = startPosition.x;
  player.flightY = startPosition.y;
  player.y = player.flightY;
  worldSpeed = setting.playerSpeed;
  backgroundOffset.far = 0;
  backgroundOffset.clouds = 0;
  backgroundOffset.near = 0;
  floatTime = 0;
  gridOffset = 0;
  coins[0].x = 380;
  coins[0].y = 130;
  coins[1].x = 680;
  coins[1].y = 300;
  coins[2].x = 990;
  coins[2].y = 180;
  hazards[0].x = 520;
  hazards[0].y = 145;
  hazards[1].x = 850;
  hazards[1].y = 290;
  hazards[2].x = 1200;
  hazards[2].y = 200;
  message = "";
  keys.clear();
  restartButton.hidden = true;
  clearInterval(timerId);
  timerId = setInterval(() => {
    if (gameState !== "PLAYING") return;
    timeLeft--;
    if (timeLeft <= 0) {
      timeLeft = 0;
      finishGame("GAME_OVER");
    }
    drawGame();
  }, 1000);
  drawGame();
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "w", "s"].includes(key)) {
    event.preventDefault();
    if (gameState === "PLAYING") keys.add(key);
  }
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener("blur", () => keys.clear());

restartButton.addEventListener("click", restartGame);
restartGame();
requestAnimationFrame(gameLoop);
