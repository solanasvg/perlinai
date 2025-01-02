let graph;
let stage;
let noiseMachine;
let ball;
let t = 0;
let bg;
let stageWidth = 1920;
let stageHeight = 600;
let lineSize = 16;
let lines = stageWidth / lineSize;
let xWidth = lineSize;
let minLineWidth = 4;
let highlightColor = "#00FFEE";
let lineColor = "#59167f";
let gridColor = "#210933";




function recalcLines() {
  lineSize = minLineWidth + Math.round(Math.random() * 16);
  lines = stageWidth / lineSize;
  xWidth = lineSize;
}

function run() {
  stage = new createjs.Stage("display");

  noiseMachine = new PerlinNoiseMachine();

  graph = new createjs.Shape();

  createjs.Ticker.on("tick", handleTick);

  stage.canvas.width = window.innerWidth;
  stage.canvas.height = window.innerHeight;
  stage.addChild(graph);
  stage.update();
}

window.addEventListener("resize", () => {
  stage.canvas.width = window.innerWidth;
  stage.canvas.height = window.innerHeight;
});

let xHighlight = 0;

function drawLines(g, lines, offset = 0) {
  for (let i = 0; i < lines; i++) {
    let noise = noiseMachine.noise(i * 0.1, t * 0.01, 0.024 * t);
    let noise2 = noiseMachine.noise(i * 0.01, t * 0.1, 0.024 * t);
    let y = noise * stage.canvas.height;
    let yoff = -noise * stage.canvas.height / 4;
    drawSpoke(i * xWidth + offset, y, yoff, g, i === xHighlight % lines);
  }
}

function handleTick() {
  t++;
  let g = graph.graphics;
  g.clear();

  drawGrid(g, lines);

  drawLines(g, lines);

  xHighlight++;
  if (xHighlight > lines) {
    xHighlight = 0;
  }
  stage.update();
}

function drawGrid(g, lines) {
  var gridsize = xWidth;
  for (var i = 0; i < lines; i++) {
    g.beginStroke(gridColor);
    g.moveTo(i * gridsize, 0);
    g.lineTo(i * gridsize, stage.canvas.height);
    g.moveTo(0, i * gridsize);
    g.lineTo(stage.canvas.width, i * gridsize);
    g.endStroke();
  }
}

function drawSpoke(x, y, yoff, g, highlight) {

  if (highlight) {
    g.beginStroke(highlightColor);
  } else {
    g.beginStroke(lineColor);
  }
  g.moveTo(x, stage.canvas.height / 2 + yoff);
  g.lineTo(x, y);
  g.endStroke();
  drawPoint(x, y, g, highlight);
  drawPoint(x, stage.canvas.height / 2 + yoff, g, highlight);
}

function drawPoint(x, y, g, highlight) {

  if (highlight) {
    g.beginStroke(highlightColor);
    g.beginFill(highlightColor);
  } else {
    g.beginFill(lineColor);
  }


  g.drawCircle(x, y, lineSize / 4);
  g.endStroke();
}

class PerlinNoiseMachine {

  constructor() {

    this.permutation = new Uint8Array(512);

    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // Fisher-Yates shuffle the array, and double it
    for (let i = 255; i > 0; i--) {
      let swapIndex = Math.random() * i | 0;

      let temp = this.permutation[i];
      this.permutation[i] = this.permutation[swapIndex];
      this.permutation[swapIndex] = temp;
      this.permutation[swapIndex + 255] = temp;
    }
  }

  noise(x, y = 0, z = 0) {
    let cubeX = (x | 0) & 255,cubeY = (y | 0) & 255,cubeZ = (z | 0) & 255; // which 'unit cube' this point lies on
    let offsetX = x - (x | 0),offsetY = y - (y | 0),offsetZ = z - (z | 0); // The point's location in that cube

    // Smoothing function:
    let u = this.fade(offsetX);
    let v = this.fade(offsetY);
    let w = this.fade(offsetZ);

    let p = this.permutation;

    // Hash all eight corners of the cube down to a single value using our precomputed permutation
    let aaa = p[p[p[cubeX] + cubeY] + cubeZ];
    let aba = p[p[p[cubeX] + cubeY + 1] + cubeZ];
    let aab = p[p[p[cubeX] + cubeY] + cubeZ + 1];
    let abb = p[p[p[cubeX] + cubeY + 1] + cubeZ + 1];
    let baa = p[p[p[cubeX + 1] + cubeY] + cubeZ];
    let bba = p[p[p[cubeX + 1] + cubeY + 1] + cubeZ];
    let bab = p[p[p[cubeX + 1] + cubeY] + cubeZ + 1];
    let bbb = p[p[p[cubeX + 1] + cubeY + 1] + cubeZ + 1];

    let gr = this.gradient;

    // Generate noise from the input. The gr function takes the hashed corner values and turns them into a
    // vector, then dot products that vector with the rest of the input, which in this case are the vectors from the
    // user-provided point to the corners of the unit cube it sits in.
    let x1 = this.lerp(gr(aaa, offsetX, offsetY, offsetZ), gr(baa, offsetX - 1, offsetY, offsetZ), u);
    let x2 = this.lerp(gr(aba, offsetX, offsetY - 1, offsetZ), gr(bba, offsetX - 1, offsetY - 1, offsetZ), u);
    let y1 = this.lerp(x1, x2, v);

    x1 = this.lerp(gr(aab, offsetX, offsetY, offsetZ - 1), gr(bab, offsetX - 1, offsetY, offsetZ - 1), u);
    x2 = this.lerp(gr(abb, offsetX, offsetY - 1, offsetZ - 1), gr(bbb, offsetX - 1, offsetY - 1, offsetZ - 1), u);
    let y2 = this.lerp(x1, x2, v);

    let out = this.lerp(y1, y2, w);

    // Normalize to 0-1, as the above output can be -1 to 1
    return (out + 1) / 2;
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, x) {
    return a + x * (b - a);
  }

  /**
   * Returns the dot product of the vector x,y,z with a pseudorandomly chosen vector from the list:
   * (1,1,0),(-1,1,0),(1,-1,0),(-1,-1,0),
   * (1,0,1),(-1,0,1),(1,0,-1),(-1,0,-1),
   * (0,1,1),(0,-1,1),(0,1,-1),(0,-1,-1)
   * based on the hash provided.
   * @param hash The hash to use to determine which vector is used in the dot product.
   * @param x
   * @param y
   * @param z
   */
  gradient(hash, x, y, z) {
    switch (hash & 0xF) {
      case 0x0:return x + y;
      case 0x1:return -x + y;
      case 0x2:return x - y;
      case 0x3:return -x - y;
      case 0x4:return x + z;
      case 0x5:return -x + z;
      case 0x6:return x - z;
      case 0x7:return -x - z;
      case 0x8:return y + z;
      case 0x9:return -y + z;
      case 0xA:return y - z;
      case 0xB:return -y - z;
      case 0xC:return y + x;
      case 0xD:return -y + z;
      case 0xE:return y - x;
      case 0xF:return -y - z;
      default:return 0; // never happens
    }
  }}


run();