import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Emulator from '../src/Emulator.js';
import MBC5 from '../src/MBC5.js';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(testsDir, 'mooneye-dma.json'), 'utf8'));
let root = path.resolve(testsDir, '../test-roms/mooneye', manifest.build);
// Expand-Archive pode ter sido executado numa pasta com o nome do build.
if (!fs.existsSync(path.join(root, 'acceptance'))) root = path.join(root, manifest.build);
let reportPath = null;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
    if (!args[i + 1] || !['--root', '--report'].includes(args[i])) {
        console.error('Uso: npm run test:dma-hardware -- [--root pasta-das-ROMs] [--report arquivo.json]');
        process.exit(1);
    }
    if (args[i] === '--root') root = path.resolve(args[i + 1]);
    else reportPath = path.resolve(args[i + 1]);
}

const results = [];
for (const entry of manifest.cases) {
    const started = performance.now();
    const result = { file: entry.file, checks: entry.checks, result: 'error' };
    try {
        const fullPath = path.join(root, entry.file);
        if (!fs.existsSync(fullPath)) throw new Error('ROM ausente: baixe o build especificado em tests/mooneye-dma.json (consulte TESTING.md).');
        const rom = new Uint8Array(fs.readFileSync(fullPath));
        result.sha256 = crypto.createHash('sha256').update(rom).digest('hex');
        if (result.sha256 !== entry.sha256) throw new Error('SHA-256 divergente: ROM diferente do build validado.');
        if (rom[0x147] !== entry.cartridgeType) throw new Error('Tipo de cartucho divergente do manifesto.');

        const emulator = new Emulator();
        emulator.loadROM(rom);
        const gb = emulator.console;
        if (entry.cartridgeType === 0x1B && !(gb.cartridge.MBC instanceof MBC5)) {
            throw new Error('sources-GS exige MBC5 real; fallback para ROM simples não é válido.');
        }
        result.mapper = gb.cartridge.MBC?.constructor.name ?? 'ROM';
        const control = gb.CPU.control;
        const original = control.decoder.opcodes[0x40];
        let verdict = null;
        // Protocolo oficial de resultado, observado no LD B,B executado.
        // Não modifica memória, registradores, clocks, LY ou serial.
        control.decoder.opcodes[0x40] = cpu => {
            const registers = ['B', 'C', 'D', 'E', 'H', 'L'].map(name => cpu.registers[name]);
            if (registers.every((value, i) => value === [3, 5, 8, 13, 21, 34][i])) verdict = 'pass';
            else if (registers.every(value => value === 0x42)) verdict = 'fail';
            original(cpu);
        };

        let cycles = 0;
        while (!verdict && cycles < 20_000_000 && performance.now() - started < 10_000) cycles += gb.step(4);
        result.result = verdict ?? 'timeout';
        result.cycles = cycles;
        result.pc = `0x${control.registers.PC.toString(16).padStart(4, '0')}`;
        result.registers = Object.fromEntries(['B', 'C', 'D', 'E', 'H', 'L'].map(name => [name, control.registers[name]]));
    } catch (error) {
        result.error = error.message;
    }
    result.milliseconds = Math.round(performance.now() - started);
    results.push(result);
    console.log(JSON.stringify(result));
}

const report = {
    suite: 'Mooneye acceptance — OAM DMA',
    build: manifest.build,
    target: manifest.target,
    executedAt: new Date().toISOString(),
    boot: 'Estado pós-boot padrão do emulador; ROM de boot não executada',
    protocol: 'LD B,B com B/C/D/E/H/L = 3/5/8/13/21/34 (pass) ou 42 hex em todos (fail)',
    passed: results.filter(result => result.result === 'pass').length,
    total: results.length,
    results
};
if (reportPath) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}
if (report.passed !== report.total) process.exitCode = 1;
