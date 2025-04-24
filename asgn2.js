// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform float u_Size;
    void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  if (!u_Size) {
    console.log("Failed to get the storage location of u_Size");
    return;
  }
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_segments = 10;

// Set up actions for the HTML UI elements
function addActionsForHtmlUI() {
  // Button Events (Shape Type)
  //   document.getElementById("green").onclick = function () {
  //     g_selectedColor = [0.0, 1.0, 0.0, 1.0];
  //   };
  //   document.getElementById("red").onclick = function () {
  //     g_selectedColor = [1.0, 0.0, 0.0, 1.0];
  //   };
  document.getElementById("clearButton").onclick = function () {
    g_shapesList = [];
    renderAllShapes();
  };

  document.getElementById("pointButton").onclick = function () {
    g_selectedType = POINT;
  };
  document.getElementById("triButton").onclick = function () {
    g_selectedType = TRIANGLE;
  };
  document.getElementById("circleButton").onclick = function () {
    g_selectedType = CIRCLE;
  };

  document.getElementById("duckButton").onclick = function () {
    drawDuck();
  };
  document.getElementById("startButton").onclick = startGame;

  // Slider Events
  document.getElementById("redSlide").addEventListener("mouseup", function () {
    g_selectedColor[0] = this.value / 100;
  });
  document
    .getElementById("greenSlide")
    .addEventListener("mouseup", function () {
      g_selectedColor[1] = this.value / 100;
    });
  document.getElementById("blueSlide").addEventListener("mouseup", function () {
    g_selectedColor[2] = this.value / 100;
  });

  // Add Slider Events
  document.getElementById("sizeSlide").addEventListener("mouseup", function () {
    g_selectedSize = this.value;
  });
  document
    .getElementById("segmentsSlide")
    .addEventListener("mouseup", function () {
      g_segments = this.value;
    });
}

function main() {
  // Set up canvas and gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function (ev) {
    if (ev.buttons == 1) {
      click(ev);
    }
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  // gl.clear(gl.COLOR_BUFFER_BIT);
  renderAllShapes();
}

var g_shapesList = [];

function click(ev) {
  // Extract the event click and return it in WebGL coordinates
  let [x, y] = convertCoordinatesEventToGL(ev);

  // Create and store the new point
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
    point.segments = g_segments;
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  // Draw every shape that is supposed to be in the canvas
  renderAllShapes();
}

// Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return [x, y];
}

// Draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  // Check the time at the start of this function
  var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw each shape in the list
  // var len = g_shapesList.length;
  // for (var i = 0; i < len; i++) {
  //   g_shapesList[i].render();
  // }

  // Draw a test traingle
  drawTriangle3D([-1.0, 0.0, 0.0, -0.5, -1.0, 0.0, 0.0, 0.0, 0.0]);

  // Draw a cube
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.render();

  // Check the time at the end of the function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML(
    "numdot: " +
      len +
      " ms: " +
      Math.floor(duration) +
      " fps: " +
      Math.floor(1000 / duration),
    "numdot"
  );
}

// Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get : " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function drawRectangle(x1, y1, x2, y2, color) {
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  drawTriangle([x1, y1, x2, y1, x2, y2]);
  drawTriangle([x1, y1, x2, y2, x1, y2]);
}

function drawEllipseAtPosition(cx, cy, rx, ry, color, segments = 60) {
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  let angleStep = (2 * Math.PI) / segments;
  for (let i = 0; i < segments; i++) {
    let angle1 = i * angleStep;
    let angle2 = (i + 1) * angleStep;
    let x1 = cx + rx * Math.cos(angle1);
    let y1 = cy + ry * Math.sin(angle1);
    let x2 = cx + rx * Math.cos(angle2);
    let y2 = cy + ry * Math.sin(angle2);
    drawTriangle([cx, cy, x1, y1, x2, y2]);
  }
}

function drawDuck() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawRectangle(-1.0, -1.0, 1.0, -0.3, [0.1, 0.45, 0.8, 1.0]);
  drawEllipseAtPosition(-0.05, 0.0, 0.4, 0.25, [1.0, 0.95, 0.3, 1.0], 80);
  drawEllipseAtPosition(-0.5, 0.1, 0.15, 0.1, [1.0, 0.95, 0.3, 1.0], 60);
  drawEllipseAtPosition(0.1, 0.35, 0.17, 0.17, [1.0, 0.95, 0.3, 1.0], 60);
  drawEllipseAtPosition(0.25, 0.35, 0.08, 0.04, [1.0, 0.55, 0.0, 1.0], 40);
  drawEllipseAtPosition(0.07, 0.4, 0.03, 0.03, [0.0, 0.0, 0.0, 1.0], 20);
  drawEllipseAtPosition(0.08, 0.42, 0.01, 0.01, [1.0, 1.0, 1.0, 1.0], 10);
  drawEllipseAtPosition(-0.05, 0.05, 0.25, 0.12, [0.9, 0.85, 0.1, 1.0], 40);
  gl.uniform4f(u_FragColor, 1.0, 0.6, 0.2, 1.0);
  drawTriangle([0.05, -0.2, 0.1, -0.2, 0.08, -0.35]);
  drawTriangle([-0.05, -0.2, 0.0, -0.2, -0.03, -0.35]);
}

var duckPos = { x: -0.2, y: 0.0 };
var duckSpeed = 0.03;
var obstacles = [];
var obstacleSpawnInterval = 2000;
var lastObstacleSpawn = 0;
var score = 0;
var gameOver = false;
var lastTime = performance.now();

function spawnObstacle() {
  var obs = {
    x: 1.2,
    y: -0.3 + Math.random() * 1.6,
    r: 0.05,
    speed: 0.01 + Math.random() * 0.02,
  };
  obstacles.push(obs);
}

function drawObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    let obs = obstacles[i];
    drawEllipseAtPosition(obs.x, obs.y, obs.r, obs.r, [1.0, 0.0, 0.0, 1.0], 20);
  }
}

function checkCollision(duckX, duckY, obs) {
  let bodyCenterX = duckPos.x - 0.05;
  let bodyCenterY = duckPos.y;
  let duckRadius = 0.25;
  let dx = bodyCenterX - obs.x;
  let dy = bodyCenterY - obs.y;
  return Math.sqrt(dx * dx + dy * dy) < duckRadius + obs.r;
}

function drawGameDuck(duckX, duckY) {
  drawEllipseAtPosition(
    duckX - 0.05,
    duckY + 0.0,
    0.4,
    0.25,
    [1.0, 0.95, 0.3, 1.0],
    80
  );
  drawEllipseAtPosition(
    duckX - 0.5,
    duckY + 0.1,
    0.15,
    0.1,
    [1.0, 0.95, 0.3, 1.0],
    60
  );
  drawEllipseAtPosition(
    duckX + 0.1,
    duckY + 0.35,
    0.17,
    0.17,
    [1.0, 0.95, 0.3, 1.0],
    60
  );
  drawEllipseAtPosition(
    duckX + 0.25,
    duckY + 0.35,
    0.08,
    0.04,
    [1.0, 0.55, 0.0, 1.0],
    40
  );
  drawEllipseAtPosition(
    duckX + 0.07,
    duckY + 0.4,
    0.03,
    0.03,
    [0.0, 0.0, 0.0, 1.0],
    20
  );
  drawEllipseAtPosition(
    duckX + 0.08,
    duckY + 0.42,
    0.01,
    0.01,
    [1.0, 1.0, 1.0, 1.0],
    10
  );
  drawEllipseAtPosition(
    duckX - 0.05,
    duckY + 0.05,
    0.25,
    0.12,
    [0.9, 0.85, 0.1, 1.0],
    40
  );
  gl.uniform4f(u_FragColor, 1.0, 0.6, 0.2, 1.0);
  drawTriangle([
    duckX + 0.05,
    duckY - 0.2,
    duckX + 0.1,
    duckY - 0.2,
    duckX + 0.08,
    duckY - 0.35,
  ]);
  drawTriangle([
    duckX - 0.05,
    duckY - 0.2,
    duckX + 0.0,
    duckY - 0.2,
    duckX - 0.03,
    duckY - 0.35,
  ]);
}

function drawScore() {
  document.getElementById("scoreDisplay").innerHTML =
    "Score: " + Math.floor(score);
}

function updateGame() {
  let now = performance.now();
  let deltaTime = now - lastTime;
  lastTime = now;

  gl.clear(gl.COLOR_BUFFER_BIT);
  drawRectangle(-1.0, -1.0, 1.0, -0.3, [0.1, 0.45, 0.8, 1.0]);

  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].x -= obstacles[i].speed;
  }
  obstacles = obstacles.filter((obs) => obs.x + obs.r > -1.0);

  if (now - lastObstacleSpawn > obstacleSpawnInterval) {
    spawnObstacle();
    lastObstacleSpawn = now;
  }

  for (let i = 0; i < obstacles.length; i++) {
    if (checkCollision(duckPos.x, duckPos.y, obstacles[i])) {
      gameOver = true;
    }
  }

  if (!gameOver) {
    score += deltaTime * 0.01;
  }

  drawGameDuck(duckPos.x, duckPos.y);
  drawObstacles();
  drawScore();

  if (gameOver) {
    let gameOverElem = document.getElementById("gameOverDisplay");
    gameOverElem.style.display = "block";
    gameOverElem.innerHTML = "Game Over! Final Score: " + Math.floor(score);
  } else {
    requestAnimationFrame(updateGame);
  }
}

document.addEventListener("keydown", function (event) {
  if (event.code === "ArrowUp") {
    duckPos.y += duckSpeed;
    if (duckPos.y > 1.0) duckPos.y = 1.0;
  } else if (event.code === "ArrowDown") {
    duckPos.y -= duckSpeed;
    if (duckPos.y < -0.3) duckPos.y = -0.3;
  }
});

function startGame() {
  duckPos = { x: -0.2, y: 0.0 };
  obstacles = [];
  score = 0;
  gameOver = false;
  lastTime = performance.now();
  lastObstacleSpawn = performance.now();
  document.getElementById("gameOverDisplay").style.display = "none";
  requestAnimationFrame(updateGame);
}
