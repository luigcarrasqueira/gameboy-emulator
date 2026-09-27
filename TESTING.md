# Validação do emulador

Requer Node.js 22 ou posterior. Não há dependências externas para os testes locais.

## Regressões locais

```sh
npm test
```

Os testes verificam separação de VRAM/OAM, restrições de memória, DMA (início, duração, reinício e origens), IE, mapeamento da boot ROM, atraso de EI, atendimento de interrupções, RETI, HALT e opcodes ilegais. Testes sintéticos comprovam os casos exercitados; não substituem ROMs validadas em hardware.

## ROMs de Blargg

Baixe a suíte separadamente; `test-roms/` é ignorada pelo Git:

```sh
git clone https://github.com/retrio/gb-test-roms.git test-roms
npm run test:roms
```

O conjunto padrão executa 11 ROMs individuais de CPU, `instr_timing` e três ROMs individuais de `mem_timing`. Uma ROM específica pode ser executada passando seu caminho relativo a `test-roms/`:

```sh
npm run test:roms -- dmg_sound/rom_singles/01-registers.gb
npm run test:roms -- oam_bug/rom_singles/1-lcd_sync.gb
```

O executor distingue `pass`, `fail` e `timeout` e retorna código de saída diferente de zero para falhas, ROMs ausentes ou timeouts. Ele observa a saída de texto nas escritas da serial e, quando presente, o protocolo de resultado da RAM externa (`DE B0 61`). O limite é 250 milhões de ciclos ou 30 segundos por ROM. Timeout não prova defeito no hardware emulado: pode exigir outro protocolo de leitura ou limite.

Áudio, sincronização fina da PPU, STOP e corrupção de OAM ainda têm pendências no `TODO.md`. Não se espera aprovação de toda a suíte neste estágio.

## Referências de temporização

- [Pan Docs: DMA e restrições do barramento](https://gbdev.io/pandocs/OAM_DMA_Transfer.html)
- [Mooneye: início e reinício do DMA](https://github.com/Gekkio/mooneye-test-suite/blob/main/acceptance/oam_dma_start.s)
- [Mooneye: duração do DMA](https://github.com/Gekkio/mooneye-test-suite/blob/main/acceptance/oam_dma_timing.s)
- [Mooneye: páginas de origem no DMG](https://github.com/Gekkio/mooneye-test-suite/blob/main/acceptance/oam_dma/sources-GS.s)
- [Pan Docs: interrupções](https://gbdev.io/pandocs/Interrupts.html)

Os fontes Mooneye foram consultados para orientar as regressões sintéticas; suas ROMs ainda precisam ser executadas para validar o conjunto completo de casos no emulador.
