import Emulator from './src/Emulator.js';

const $rom    = document.getElementById('romInput');
const $start  = document.getElementById('startButton');
const $stop   = document.getElementById('stopButton');
const $log    = document.getElementById('output');
const $canvas = document.getElementById('screen');
const ctx     = $canvas.getContext('2d');
const imgData = ctx.createImageData(160, 144);

let romBytes = null;
let emulator = null;

$rom.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    romBytes = new Uint8Array(buffer);
    $start.disabled = false;

    $log.textContent = `ROM load: ${file.name} (${romBytes.length} bytes)`;
});

$start.addEventListener('click', () => {
    if (!romBytes) return;
    $start.disabled = true;
    $rom.disabled = true;
    $stop.disabled = false;
    $log.textContent += `\nStarting emulation...`;

    emulator = new Emulator();
    emulator.loadROM(romBytes);

    emulator.console.LCDC.onFrame = frame => {
        const data = imgData.data;
        for (let index = 0; index < 160 * 144; index++) {
            const pixel = frame[index] >>> 0; // ARGB
            const alpha = (pixel >>> 24) & 0xFF;
            const red   = (pixel >>> 16) & 0xFF;
            const green = (pixel >>>  8) & 0xFF;
            const blue  = (pixel       ) & 0xFF;
            const j = index * 4;
            data[j + 0] = red;
            data[j + 1] = green;
            data[j + 2] = blue;
            data[j + 3] = alpha;
        }
        ctx.putImageData(imgData, 0, 0);
    };

    emulator.onStop = () => {
        $log.textContent += `\nSTOP`;
        $start.disabled = false;
        $rom.disabled = false;
        $stop.disabled = true;
    };

    try {
        emulator.start();
    } catch (error) {
        console.error(error);
        $log.textContent += `\nError: ${error.message}\n${error.stack ?? ''}`;
    }
});

$stop.addEventListener('click', () => {
    if (emulator) {
        emulator.stop();
    }   
});

$start.disabled = true;
$stop.disabled = true;