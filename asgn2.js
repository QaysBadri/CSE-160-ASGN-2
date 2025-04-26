// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
let u_ModelMatrix;

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

  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix"
  );
  if (!u_GlobalRotateMatrix) {
    console.log("Failed to get the storage location of u_GlobalRotateMatrix");
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
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
let g_globalAngle = 0;
let g_yellowAngle = 0;
let g_magnetaAngle = 0;
let g_yellowAnimation = false;
let g_magnetaAnimation = false;

// Set up actions for the HTML UI elements
function addActionsForHtmlUI() {
  // Button Events
  document.getElementById("animationYellowOnButton").onclick = function () {
    g_yellowAnimation = true;
  };

  document.getElementById("animationYellowOffButton").onclick = function () {
    g_yellowAnimation = false;
  };

  document.getElementById("animationMagnetaOnButton").onclick = function () {
    g_magnetaAnimation = true;
  };

  document.getElementById("animationMagnetaOffButton").onclick = function () {
    g_magnetaAnimation = false;
  };

  // Add Slider Events
  document
    .getElementById("magnetaSlide")
    .addEventListener("mousemove", function () {
      g_magnetaAngle = this.value;
      renderAllShapes();
    });

  document
    .getElementById("yellowSlide")
    .addEventListener("mousemove", function () {
      g_yellowAngle = this.value;
      renderAllShapes();
    });

  document
    .getElementById("angleSlide")
    .addEventListener("mousemove", function () {
      g_globalAngle = this.value;
      renderAllShapes();
    });
}

function main() {
  // Set up canvas and gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  // gl.clear(gl.COLOR_BUFFER_BIT);
  // renderAllShapes();
  requestAnimationFrame(tick);
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
  // renderAllShapes();
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  // console.log(g_seconds);

  updateAnimationAngle();

  renderAllShapes();

  requestAnimationFrame(tick);
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

function updateAnimationAngle() {
  if (g_yellowAnimation) {
    g_yellowAngle = 45 * Math.sin(g_seconds);
  }
  if (g_magnetaAnimation) {
    g_magnetaAngle = 45 * Math.sin(3 * g_seconds);
  }
}

// Draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  // Check the time at the start of this function
  var startTime = performance.now();

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.matrix.translate(-0.25, -0.75, 0.0);
  body.matrix.rotate(-5, 1, 0, 0);
  body.matrix.scale(0.5, 0.3, 0.5);
  body.render();

  var yellow = new Cube();
  yellow.color = [1.0, 1.0, 0.0, 1.0];
  yellow.matrix.setTranslate(0.0, -0.5, 0.0);
  yellow.matrix.rotate(-5, 1, 0, 0);

  yellow.matrix.rotate(-g_yellowAngle, 0, 0, 1);

  var yellowCoordinatesMat = new Matrix4(yellow.matrix);
  yellow.matrix.scale(0.25, 0.7, 0.5);
  yellow.matrix.translate(-0.5, 0.0, 0.0);
  yellow.render();

  var magneta = new Cube();
  magneta.color = [1.0, 0.0, 1.0, 1.0];
  magneta.matrix = yellowCoordinatesMat;
  magneta.matrix.translate(0, 0.65, 0);
  magneta.matrix.rotate(g_magnetaAngle, 0, 0, 1);
  magneta.matrix.scale(0.3, 0.3, 0.3);
  magneta.matrix.translate(-0.5, 0, -0.001);
  magneta.render();

  // Check the time at the end of the function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML(
    " ms: " + Math.floor(duration) + " fps: " + Math.floor(1000 / duration),
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
