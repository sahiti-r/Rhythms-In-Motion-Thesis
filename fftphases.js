// User can run any and all of the three phases in the desired order.
// Populate the array below with the desired sequence.
// Examples: [1, 2, 3], [3, 2], [2], [3, 2, 1]
// Phases 1 and 3 use the phaseDuration setting in milliseconds. Phase 2 runs till the Canvas is fully drawn with Mandalas

let phaseSequence = [1, 2, 3];
let phaseDuration = 30000;

let mic;
let amp;

let mandala1 = {};
let mandala2 = {};

let rows = 10;
let waveMaxHeight = 150;
let baseT = 0;
let timeOffset=500;

let startTime;
let waveTime;
let phaseSequenceIndex = 0;
let currentPhase;

// FFT & Threshold definition for filtering noise, on a scale of 0 to 1
// Mode 1 is FIXED threshold based. Mode 2 is ADAPTIVE.
let fft;
let noiseReductionMode = 1;
// Fixed Threshold definition for filtering noise, on a scale of 0 to 1
let thresholdFixed = 0.15;
// Adaptive Threshold floor and ceiling defintion
let thresholdFloorLimit = 0.02;
let thresholdCeilingLimit = 0.2;
let thresholdBackoffLimit = 0.4;
let thresholdChangeFactor = 0.01;
let adaptiveThreshold;

let samplesTotal=0;
let runtimeTotal;


function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  angleMode(DEGREES);
  colorMode(HSB, 360, 100, 100, 100);
  
  // Create & start an audio input
  mic = new p5.AudioIn();
  mic.start();


  // Initialize the first pair of mandalas
  reinitializeMandalas();
  
  //Initialize start time
  startTime = millis();
  runtimeTotal=millis();
  
  // For second phase
  x = 0;
  y = 0;
  
  fft = new p5.FFT();
  fft.setInput(mic);
  // Initialize adapative threshold for noise reduction at mid-level
  adaptiveThreshold = (thresholdFloorLimit + thresholdCeilingLimit)/2;
}

function getFilteredLevel(nrMode) {
  // Select threshold based on noise reduction mode
  if (nrMode == 1)
    currentThreshold = thresholdFixed;
  else
    currentThreshold = adaptiveThreshold;
  
  let spectrum = fft.analyze();
  // console.log(spectrum.length);
  // print(spectrum);
  totalEnergy = 0;
  maxEnergyFrequencyBand = 1;
  maxEnergyFrequency = 0;
  
  for (let i = 0; i < spectrum.length; i++) {
    frequencyEnergy = spectrum[i];
    normalizedFrequencyEnergy = map(frequencyEnergy, 0, 255, 0, 1);
    
    // Filter out noise
    if (normalizedFrequencyEnergy >= currentThreshold)
      totalEnergy = totalEnergy + normalizedFrequencyEnergy;
    
    // Figure out which frequency band has maximum energy to return those numbers
    if (normalizedFrequencyEnergy > maxEnergyFrequency) {
      maxEnergyFrequency = normalizedFrequencyEnergy;
      maxEnergyFrequencyBand = i;
    }
  }
  console.log("Total Energy: " + totalEnergy);
  normalizedTotalEnergy = totalEnergy/spectrum.length;
  console.log("Normalized Total Energy: " + normalizedTotalEnergy);
  
  // Learn from this frame of spectrum and back off if we are clipping too many frequency bands
  if (nrMode == 2) {
    if (((adaptiveThreshold / normalizedTotalEnergy) >= thresholdBackoffLimit) && (adaptiveThreshold > thresholdFloorLimit))
      adaptiveThreshold = adaptiveThreshold * (1 - thresholdChangeFactor);
    else if (((adaptiveThreshold / normalizedTotalEnergy) < thresholdBackoffLimit) && (adaptiveThreshold < thresholdCeilingLimit))
      adaptiveThreshold = adaptiveThreshold * (1 + thresholdChangeFactor);
  }

  // Function is returning three values as an array
  // 1. EnergyLevel, between 0 and 1
  // 2. Frequency band where maximum energy was found, between 0 and 1023
  // 3. Maximum energy found in the above frequency band, between 0 and 1
  return [normalizedTotalEnergy, maxEnergyFrequencyBand, maxEnergyFrequency];
}

function draw() {
  samplesTotal++;
  if (phaseSequenceIndex >= phaseSequence.length) {
      runtimeTotal = millis() - runtimeTotal;
      console.log("All phases are now finished: " + phaseSequence);
      console.log("Sample rate (per second): " + samplesTotal*1000/runtimeTotal);
      console.log("Number of samples:" + samplesTotal + ", Total runtime (ms):" + runtimeTotal);
      noLoop();
  }
  currentPhase = phaseSequence[phaseSequenceIndex];
  let elapsedTime = millis() - startTime;

  if (currentPhase === 1) {
    // First phase: Drawing mandalas
    translate(width / 2, height / 2);

    drawMandala(mandala1);
    drawMandala(mandala2);

    if (mandala1.finishedDrawing && mandala2.finishedDrawing) {
      reinitializeMandalas();
    }

    // Switch to the next phase after configured time
    if (elapsedTime > phaseDuration) {
      console.log("Sketch changed!");
      phaseSequenceIndex = phaseSequenceIndex + 1;
      startTime = millis();
    }
    
    // Second phase: Reactive mandalas with mic input
  } else if (currentPhase === 2) {
    
    // Get the level of amplitude from the mic
    // let level = mic.getLevel();
    const retValue = getFilteredLevel(noiseReductionMode);
    let level = retValue[0];
    // let maxFreqencyBand = retValue[1];
    // let maxFrequencyEnergy = retValue[2];
    console.log ("Level: " + level);

    // Calculate the radius based on amplitude
    let radius = (level * width) / 3.5;

    // Calculate progress based on the current y position
    let progress = map(y, 0, height, 0, 1);

    // Draw mandala
    mandala(x, y, radius, level, progress);

    x += 2;

    if (x > width) {
      x = 0;
      y += 50;
    }

    if (y > height) {
      console.log("Sketch changed!")
      phaseSequenceIndex = phaseSequenceIndex + 1;
      startTime = millis();
    }
    
  } else if (currentPhase == 3) {
      const retValue = getFilteredLevel(noiseReductionMode);
      let sample = retValue[0];
      // let maxFreqencyBand = retValue[1];
      // let maxFrequencyEnergy = retValue[2];

      let amplifySample = map(sample, 0, 1, 0, 1);
      print (sample);
  
      offset = elapsedTime;
      adjustedNumber = Math.trunc(offset/timeOffset);
      // console.log("AdjustedNumber" + adjustedNumber);
  
      if (adjustedNumber >= rows)
        drawWaves(rows, amplifySample);
      else
        drawWaves(adjustedNumber, amplifySample);
    
      // Switch to the next phase after configured time
      if (elapsedTime > phaseDuration) {
        console.log("Sketch changed!");
        phaseSequenceIndex = phaseSequenceIndex + 1;
        startTime = millis();
      }
  }
}

function reinitializeMandalas() {
  background(0, 0, 0, 20); // Optionally fade the previous frames
  
  // Get the level of amplitude of the mic
  // let level = getFilteredLevel(noiseReductionMode);
  let level = mic.getLevel();

  // Initialize the first mandala with random parameters
  mandala1 = createMandala(level, random(-width / 2, width / 2), random(-height / 2, height /2));

  // Initialize the second mandala with random parameters
  mandala2 = createMandala(level, random(-width / 2, width / 2), random(-height / 2, height /2));
}

function createMandala(amplitude, offsetX, offsetY) {
  let petals, layers, hueRange;

  // Choose a warm or cool color family based on amplitude value
  if (amplitude > 0.0002) {
    // Warm colors (reds, pinks, oranges, yellows)
    if (random() < 0.5) {
      hueRange = [0, 60]; // Reds, oranges, yellows
    } else {
      hueRange = [300, 360]; // Pinks, deep reds
    }
    petals = floor(random(25, 30));
    layers = floor(random(12, 15));
  } else {
    // Cool colors (blues, greens, purples)
    hueRange = [180, 300];
    petals = floor(random(20, 25));
    layers = floor(random(8, 12));
  }

  baseHue = hueRange[0] + (hueRange[1] - hueRange[0]) * pow(random(), 0.5); // Set a base hue within the chosen color range
  
    // Calculate complementary hue for accents with special handling for yellow
  if (baseHue >= 0 && baseHue <= 60) { // If the base color is in the yellow range
    complementaryHue = (baseHue + 150) % 360; // Offset by 150 degrees to avoid green
  } else {
    complementaryHue = (baseHue + 180) % 360; // Standard complementary hue
  }

  return {
    amplitude: amplitude,
    petals: petals,
    layers: layers,
    baseHue: baseHue,
    complementaryHue: complementaryHue,
    ang: 360 / petals,
    currentLayer: 0,
    currentPetal: 0,
    drawNextPetal: true,
    finishedDrawing: false,
    offsetX: offsetX,
    offsetY: offsetY,
    currentShape: generateNewShape()
  };
}

function drawMandala(mandala) {
  push();
  translate(mandala.offsetX, mandala.offsetY);

  if (!mandala.finishedDrawing) {
    if (mandala.currentLayer < mandala.layers) {
      if (frameCount % 2 === 0) { 
            drawGradientPetal(mandala);
            mandala.currentPetal++;
      }
      if (mandala.currentPetal >= mandala.petals) {
        mandala.currentPetal = 0;
        mandala.currentLayer++;
        mandala.currentShape = generateNewShape();
      }
    } else {
      mandala.finishedDrawing = true;
    }
  } else {
    //applyFlowEffect(mandala);
  }

  pop();
}

function drawGradientPetal(mandala) {
  let ly = (mandala.currentLayer + 1) / mandala.layers;
  let { x1, x2, y2, x3, y3, x4, x5, y5 } = mandala.currentShape;

  x1 *= ly;
  x4 *= ly;
  x2 *= ly;
  y2 *= ly;
  x3 *= ly;
  y3 *= ly;
  x5 *= ly;
  y5 *= ly;

  let petalSteps = 5;
  for (let i = 0; i < petalSteps; i++) {
    let hue = (mandala.baseHue + mandala.currentLayer * 5 + i * 3) % 360;
    let sat = 80 - i * 10;
    let brt = 100 - i * 15;
    let alph = map(mandala.currentLayer, 0, mandala.layers, 30, 90) - i * 5;
    fill(hue, sat, brt, alph);
    stroke(hue, sat - 30, brt - 20, alph - 10);
    strokeWeight(0.5);

    push();
    rotate(mandala.ang * mandala.currentPetal);

    beginShape();
    curveVertex(x1 * i / petalSteps, 0);
    curveVertex(x1 * i / petalSteps, 0);
    curveVertex(x2 * i / petalSteps, y2 * i / petalSteps);
    curveVertex(x3 * i / petalSteps, y3 * i / petalSteps);
    curveVertex(x5 * i / petalSteps, y5 * i / petalSteps);
    curveVertex(x4 * i / petalSteps, 0);
    curveVertex(x4 * i / petalSteps, 0);
    endShape();

    beginShape();
    curveVertex(x1 * i / petalSteps, 0);
    curveVertex(x1 * i / petalSteps, 0);
    curveVertex(x2 * i / petalSteps, -y2 * i / petalSteps);
    curveVertex(x3 * i / petalSteps, -y3 * i / petalSteps);
    curveVertex(x5 * i / petalSteps, -y5 * i / petalSteps);
    curveVertex(x4 * i / petalSteps, 0);
    curveVertex(x4 * i / petalSteps, 0);
    endShape();

    pop();
  }
}


function generateNewShape() {
  return {
    x1: random(50, 80),
    x4: random(130, 170),
    x2: random(70, 100),
    y2: random(30, 60),
    x3: random(100, 140),
    y3: random(40, 80),
    x5: random(60, 100),
    y5: random(20, 50)
  };
}

function mandala(cx, cy, radius, level, progress) {
  let points = floor(lerp(8, 30, progress)); // Transition from more uniform to more random points
  let layers = floor(lerp(4, 12, progress)); // Transition from more to fewer layers
  let angleStep = 360 / points;

  push();
  translate(cx, cy);
  noFill();

  // Determine colors based on amplitude threshold
  let colors;
  if (radius > width / 15) {
    colors = ['#FFB3B3', '#FFC1C1']; // Pastel red and pink for high amplitude
  } else if (radius > width / 25) {
    colors = ['#FFECB3', '#C5E1A5']; // Pastel yellow and green for medium amplitude
  } else {
    colors = ['#C3B1E1', '#A2C4E6']; // Pastel purple and blue for low amplitude
  }

  // Draw mandala layers
  for (let layer = layers; layer > 0; layer--) {
    let currR = (layer / layers) * radius;
    let x1 = random(0.35 * currR, 0.45 * currR);
    let x2 = random(0.5 * currR, 0.7 * currR);
    let maxY2 = x2 * tan(angleStep) * 0.9;
    let y2 = random(0.06 * currR, maxY2);
    let x3 = random(x2 * 1.1, 0.85 * currR);
    let maxY3 = x3 * tan(angleStep) * 0.9;
    let y3 = random(0.06 * currR, maxY3);
    let x4 = random(0.88 * currR, 0.99 * currR);

    stroke(random(colors));
    strokeWeight(2);

    for (let i = 0; i < points; i++) {
      let angle = i * angleStep;
      push();
      rotate(angle);

      beginShape();
      curveVertex(x4, 0);
      curveVertex(x4, 0);
      curveVertex(x3, y3);
      curveVertex(x2, y2);
      curveVertex(x1, 0);
      curveVertex(x2, -y2);
      curveVertex(x3, -y3);
      curveVertex(x4, 0);
      curveVertex(x4, 0);
      endShape();

      pop();
    }
  }

  // Add small dots for decorative effect
  for (let i = 0; i < points; i++) {
    let angle = i * angleStep;
    let x = cos(angle) * (radius * 0.95);
    let y = sin(angle) * (radius * 0.95);
    fill(random(colors));
    noStroke();
    ellipse(x, y, radius / 30);
  }

  pop();
}

function drawWaves(number, sample) {
  // Loop through all our rows and draw each wave
  // We loop "backwards" to draw them one on top of the other
  // nicely
  
  for (let i = adjustedNumber; i >= 0; i--) {
    drawWave(i, adjustedNumber);
  }

  baseT += sample;
}

/**
Draws the nth wave.

Paramters are
* n - the number of the wave
* rows - the total number of waves
*/

function drawWave(n, rows) {
  // Calculate the base y for this wave based on an offset from the bottom of the canvas and subtracting the number of waves to move up. 
  
  let baseY = height - n*waveMaxHeight/3;

  let t = baseT + n*100;
  
  let startX = 0;
  push();
  
  // Using the HSB model to vary their color more easily
  colorMode(HSB);
 
  let hue = map(n, 0, rows, 200, 360);
  fill(hue, 60, 50); 
  stroke(hue, 40, 35);
  strokeWeight(1.0);
  
  // Vertex-based drawing
  beginShape();
  vertex(startX, baseY);
  
  // Loop along the x axis drawing vertices for each point
  for (let x = startX; x <= width; x += 10) {
    
    // Calculate the wave's y based on the noise() function
    let y = baseY - map(noise(t), 0, 1, 10, waveMaxHeight);

    vertex(x, y);
    t += 0.01;
  }
  
  // Draw the final three vertices to close the shape around
  // the edges of the canvas
  vertex(width, baseY);
  vertex(width, height);
  vertex(0, height);
  endShape();
}