# Rhythms in Motion
## Translating Indian Classical Dance into Real-Time Visual Art through Embedded Systems

---

## Introduction:

Indian classical dance, particularly forms like *Kuchipudi*, *Bharatanatyam*, and *Kathak*, are defined by quick rhythmic footwork and graceful hand gestures. The movement and rhythm in these dances creates an auditory and visual experience for the audience, while also displaying the dancer’s artistry and the culture’s traditions. The advancement of technology opened up the possibility of blending traditional dance forms with modern systems, creating a new avenue for creative expression. Embedded systems, which process real-time input and translate it into another form, present an innovative way to capture classical dance and transform it into visual experiences.

In this project, the interactions of dance, technology, and art are explored. An embedded system captures the rhythmic patterns of Indian classical dance through auditory input and translates these patterns into a visual background. The project particularly focuses on how the beats and patterns created by the feet can be captured and visualized, in order to emphasize the rhythmic complexity of classical Indian dance. This exploration not only showcases the beauty of classical dance but also opens new possibilities for how performance art can engage audiences through multiple senses. By creating a live interaction between dance, sound, and visuals, this project aims to expand the traditional boundaries of dance performance and audience engagement.

---

## Hardware Setup & Assumptions:

This programming project expects rhythmic beats of dance to be sourced as input, by listening to the system mic interface. The author connected a **CONTACT microphone** using special cables (with 3.5mm and 6.5mm TRRS audio pins) to the computer which treated the external CONTACT mic as the system mic.

The program works even if there is no contact mic, but the input becomes generic ambient sound vs. the dance footwork-only sounds picked up by a contact mic. While the built-in noise reduction processing can help eliminate the noise, using a CONTACT microphone yields the best results to visualize dance footwork.

---
## Visualization Structure

| **Phase**  | **Description**                                                                 |
|------------|---------------------------------------------------------------------------------|
| Phase-1    | Ambient mandalas with petal colors based on input energy.                      |
| Phase-2    | Rhythmic mandalas dynamically evolving with the dance.                         |
| Phase-3    | Modern wave visuals responding to footwork rhythms.                            |

---

## Project Overview:

The program, written in **P5.js**, makes use of some P5 libraries such as **Fast Fourier Transform (FFT)** and the associated audio processing functionality.

### Configuration Settings
Users can customize various settings at the top of the program to adjust the visualization styles and processing logic.

### Execution Flow
1. **`preload()` & `setup()`**: One-time loading and initialization.
2. **Visualization Phases**:
   The program progresses through three distinct phases, controlled by the variable `currentPhase`:
   - **Phase-1**: Mandalas are drawn with petal colors chosen by the energy observed in input audio. These mandalas are designed to provide an ambient background.
   - **Phase-2**: A time progression of the rhythmic dance is captured by a series of dynamic mandalas whose size and color are determined by FFT audio processing and noise reduction.
   - **Phase-3**: Rhythm and dynamics of dance are visualized by modern waves. Wave motion is determined by FFT audio processing and noise reduction. Energy level in audio also determines the color of a wave.


   **Customization**:
   Set `currentPhase` to:
   - `1` (default): Runs all phases sequentially.
   - `2`: Starts directly with Phase-2 and progresses.
   - `3`: Runs only Phase-3.

---

## Detailed Functionality

### Audio Processing:
- **`draw()`**: The entry point to each iteration of audio processing. Frequency of the **`draw()`** function execution depends on the computer system’s clock speed and performance.

- **`getFilteredLevel()`**: Uses **Fast Fourier Transform (FFT)** to analyze the frequency spectrum using a configurable number of bands (defaulted to 1024). It reduces noise by employing the following noise reduction modes:
  - **`noiseReductionMode = 1`** (Fixed Threshold):
    - `thresholdFixed = 0.15`: Frequency bands below 15% energy level are clipped.
  - **`noiseReductionMode = 2`** (Adaptive Threshold):
    - `thresholdFloorLimit = 0.02`: Audio below 2% level is always clipped.
    - `thresholdCeilingLimit = 0.2`: Audio above 20% level is never clipped.
    - `thresholdBackoffLimit = 0.4`: Ensures the cutoff threshold is never too high compared to the observed maximum energy level.
    - `thresholdChangeFactor = 0.01`: Adaptive threshold is increased or decreased by 1% each time.

### Mandala Visualization:
- **`createMandala()`**: Determines parameters and values for drawing the mandala, such as color, hue range, complementary colors, number of petals, and layers based on the energy level of the microphone input. Returns these values in a dictionary for future functions.

- **`reinitializeMandala()`**: Utilized during Phase-1. Fades the background of previously drawn mandalas to highlight new mandalas, randomly selecting two locations on the canvas for drawing.

- **`drawMandala(mandala)`**: Generates mandalas layer by layer using the values returned from **`createMandala()`**. For each layer, randomly selects five points (x1, y1), (x2, y2), (x3, y3), (x4, y4), and (x5, y5) to draw petal curves.

- **`drawGradientPetal(mandala)`**: Generates each petal by setting hue, saturation, and brightness based on the parameters from **`createMandala()`**. Utilizes `curveVertex` shapes for symmetry and repeats the process five times, rotating angles to achieve a petal-like effect.

### Wave Visualization:
- **`drawWaves(number of waves, audio sample)`**: Loops through each wave and invokes **`drawWave()`**. Draws backward in layers to ensure short waves remain visible.

- **`drawWave(wave number, total number)`**: Draws one wave at a time. Energy in audio rhythms is used to move the wave and determine its color.

---

## Installation & Execution

1. Open the project in the [p5.js Web Editor](https://editor.p5js.org/sahiti.rachakonda/sketches/-V9QR6gKY).
2. Click **Run**.
3. Optionally, connect the system mic to a **contact microphone** for optimal input.

---

## License
This project is licensed under the **GNU General Public License v3.0**.
[View License Details](https://choosealicense.com/licenses/gpl-3.0/#)
