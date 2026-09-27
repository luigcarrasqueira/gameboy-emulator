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

## Testes de hardware do OAM DMA (Mooneye)

As seis ROMs de DMA do build oficial `mts-20260714-0944-31510e1` passaram no emulador em 27/09/2026. Trata-se de executar no emulador testes cujas expectativas foram verificadas em hardware pelo autor da suíte; não houve uma nova execução em um Game Boy físico nesta tarefa.

| ROM | Comportamento verificado | Resultado |
| --- | --- | --- |
| `acceptance/oam_dma/basic.gb` | Cópia básica para OAM | Aprovado |
| `acceptance/oam_dma_start.gb` | Início em M2 e continuidade da cópia anterior durante reinício | Aprovado |
| `acceptance/oam_dma_timing.gb` | OAM bloqueada um ciclo antes do fim e acessível após o fim | Aprovado |
| `acceptance/oam_dma_restart.gb` | Duração completa após reiniciar uma transferência em execução | Aprovado |
| `acceptance/oam_dma/sources-GS.gb` | ROM, VRAM, RAM de cartucho, WRAM e páginas altas do DMG | Aprovado |
| `acceptance/oam_dma/reg_read.gb` | FF46 retorna a última escrita também durante o DMA | Aprovado |

O teste de origens cobre páginas `00`, `3F`, `40`, `7F`, `80`, `9F`, `A0`, `BF`, `C0`, `DF`, `E0`, `FE` e `FF`. A variante `GS` tem resultado esperado de aprovação em DMG/MGB/SGB/SGB2; ela não serve como expectativa para CGB.

### Obter as ROMs e executar

Baixe o ZIP oficial indicado em [tests/mooneye-dma.json](tests/mooneye-dma.json) e extraia em `test-roms/mooneye/`. No PowerShell:

```powershell
$dmaBuild = 'mts-20260714-0944-31510e1'
$dmaBase = "https://gekkio.fi/files/mooneye-test-suite/$dmaBuild"
New-Item -ItemType Directory -Force -Path test-roms/mooneye | Out-Null
Invoke-WebRequest -Uri "$dmaBase/$dmaBuild.zip" -OutFile "test-roms/mooneye/$dmaBuild.zip"
Get-FileHash -LiteralPath "test-roms/mooneye/$dmaBuild.zip" -Algorithm SHA256
Expand-Archive -LiteralPath "test-roms/mooneye/$dmaBuild.zip" -DestinationPath test-roms/mooneye
npm run test:dma-hardware
```

O SHA-256 esperado do arquivo ZIP é `18aa29462dfe1fcd32a2cb3621733abdc72410074918b9245aa99a6920f7d3f2`. O executor verifica automaticamente o SHA-256 de cada ROM contra o manifesto e rejeita arquivos diferentes. ROMs baixadas continuam fora do controle de versão.

Para indicar outra pasta de extração ou gerar o relatório:

```sh
npm run test:dma-hardware -- --root caminho/para/mts-20260714-0944-31510e1 --report tests/reports/oam-dma.json
```

O [relatório da execução](tests/reports/oam-dma.json) inclui build, hashes, mapper, ciclos e registradores de resultado. O executor observa o protocolo oficial em `LD B,B`: `B/C/D/E/H/L = 3/5/8/13/21/34` significa aprovação; `0x42` em todos significa falha. ROM ausente, hash incorreto, falha e timeout retornam código de saída diferente de zero. O limite por ROM é 20 milhões de ciclos ou dez segundos. Os testes usam o estado pós-boot padrão, sem executar firmware, sem alterar LY/SC e sem atalhos nas temporizações.

### Correções exigidas pela validação

- A execução inicial aprovou início, duração e reinício, mas `reg_read` reprovou. A CPU bloqueava a leitura de `FF46` durante o DMA; essa leitura agora retorna a última escrita, como exigido pelo teste.
- `sources-GS` usa cartucho `0x1B`. Seu resultado inicial com fallback ROM-only não foi considerado validação suficiente. Foi adicionado MBC5 sem rumble (`0x19–0x1B`) e o executor exige uma instância real desse controlador para essa ROM.
- O suporte necessário ao cartucho foi verificado em regressões locais de bancos de ROM/RAM e nas oito ROMs `emulator-only/mbc5/rom_*.gb` do mesmo build, que passaram. Esses testes adicionais são de mapper e não entram nas seis aprovações de DMA.
- Os 33 testes locais e as 15 ROMs básicas de CPU/memória passaram após as correções.

Essa validação encerra o item de início, duração, reinício e páginas de origem do OAM DMA para os casos cobertos. Ela não comprova todos os efeitos de colisão entre DMA e busca de sprites da PPU, nem toda a fidelidade do DMG. Rumble, persistência de saves e demais controladores continuam pendentes.

## Referências de temporização

- [Pan Docs: DMA e restrições do barramento](https://gbdev.io/pandocs/OAM_DMA_Transfer.html)
- [Mooneye: início e reinício do DMA](https://github.com/Gekkio/mooneye-test-suite/blob/main/acceptance/oam_dma_start.s)
- [Mooneye: duração do DMA](https://github.com/Gekkio/mooneye-test-suite/blob/main/acceptance/oam_dma_timing.s)
- [Mooneye: páginas de origem no DMG](https://github.com/Gekkio/mooneye-test-suite/blob/main/acceptance/oam_dma/sources-GS.s)
- [Pan Docs: interrupções](https://gbdev.io/pandocs/Interrupts.html)

Além das regressões sintéticas, as seis ROMs de DMA listadas acima foram executadas. As outras áreas da suíte Mooneye continuam pendentes.
