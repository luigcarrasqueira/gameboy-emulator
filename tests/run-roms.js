import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Emulator from '../src/Emulator.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../test-roms');
const requested = process.argv.slice(2);
const cases = requested.length ? requested : [
    ...Array.from({ length: 11 }, (_, i) => {
        const dir = path.join(root, 'cpu_instrs/individual');
        if (!fs.existsSync(dir)) return null;
        return `cpu_instrs/individual/${fs.readdirSync(dir).find(f => f.startsWith(String(i + 1).padStart(2, '0')) && f.endsWith('.gb'))}`;
    }).filter(Boolean),
    'instr_timing/instr_timing.gb',
    ...['01-read_timing', '02-write_timing', '03-modify_timing'].map(n => `mem_timing/individual/${n}.gb`)
];

if (!fs.existsSync(root)) {
    console.error('ROMs ausentes. Consulte TESTING.md para obter a suíte de testes.');
    process.exit(1);
}

let failures = 0;
for (const file of cases) {
    const fullPath = path.resolve(root, file);
    if (!fullPath.startsWith(root + path.sep) || !fs.existsSync(fullPath)) {
        console.error(`ROM ausente ou caminho inválido: ${file}`);
        failures++;
        continue;
    }
    const emulator = new Emulator();
    emulator.loadROM(new Uint8Array(fs.readFileSync(fullPath)));
    const gb = emulator.console;
    let serialText = '';
    // Observa o protocolo de saída de Blargg sem mudar a emulação da serial.
    const serialWrite = gb.bus.serial.writeByte.bind(gb.bus.serial);
    gb.bus.serial.writeByte = (address, value) => {
        if (address === 0xFF02 && (value & 0x81) === 0x81) serialText += String.fromCharCode(gb.bus.serial.SB);
        serialWrite(address, value);
    };
    let cycles = 0;
    const started = Date.now();
    let result = 'timeout';
    let text = '';
    while (cycles < 250_000_000 && Date.now() - started < 30_000) {
        cycles += gb.step(70224);
        const read = gb.bus.eramRead;
        if (read(1) === 0xDE && read(2) === 0xB0 && read(3) === 0x61 && read(0) !== 0x80) {
            result = read(0) === 0 ? 'pass' : 'fail';
            for (let i = 4; i < 8192; i++) {
                const byte = read(i);
                if (byte === 0) break;
                text += String.fromCharCode(byte);
            }
            break;
        }
        if (/Passed|Failed/.test(serialText)) {
            result = /Failed/.test(serialText) ? 'fail' : 'pass';
            text = serialText;
            break;
        }
    }
    if (result !== 'pass') failures++;
    console.log(JSON.stringify({ file, result, cycles, milliseconds: Date.now() - started, output: (text || serialText).trim() }));
}
if (failures) process.exitCode = 1;
