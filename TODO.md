# TODO — Fidelidade ao Game Boy original

Objetivo: reproduzir o Game Boy DMG-01, incluindo comportamento observável dos registradores, restrições de memória e temporização dos componentes. Game Boy Color e Super Game Boy exigem escopos próprios.

Análise realizada em 27/09/2026 sobre o commit `a7c130a`. As tarefas abaixo ainda não foram implementadas. Esta lista distingue defeitos reproduzidos, funcionalidades ausentes e detalhes que precisam de investigação.

## Estado da validação

- Passaram os 11 testes individuais de `cpu_instrs`, o teste `instr_timing` e os 3 testes individuais de `mem_timing` de Blargg.
- `dmg_sound/rom_singles/01-registers.gb` falhou com `Failed #2`.
- `oam_bug/rom_singles/1-lcd_sync.gb` falhou com `Failed #3`: ligar o LCD inicia cedo demais na linha.
- `interrupt_time` e `halt_bug` não produziram resultado conclusivo no método de leitura e limite utilizados. Não devem ser considerados aprovados nem reprovados por essa execução.
- A saída dos testes básicos foi observada nas escritas da porta serial, pois a implementação atual termina as transferências imediatamente.
- Testes específicos em memória reproduziram os defeitos apontados nas seções seguintes. Aprovar os testes básicos não comprova fidelidade 1:1.

## Prioridade 1 — Barramento e DMA

- [ ] Separar explicitamente o acesso à VRAM do acesso à OAM. Atualmente, offsets `0x0000–0x009F` enviados pelo barramento à VRAM atingem a OAM. Arquivos: `src/SystemBus.js`, `src/LCDController.js`.
- [ ] Corrigir também as leituras internas de tiles para que offsets baixos da VRAM não sejam interpretados como OAM.
- [ ] Dar ao DMA acesso ao barramento sem aplicar o bloqueio destinado à CPU. As leituras da transferência atualmente retornam `0xFF` durante sua própria execução.
- [ ] Permitir que o DMA escreva diretamente na OAM. Atualmente, suas escritas são descartadas pelo bloqueio do barramento.
- [ ] Validar início, duração, reinício e páginas de origem da transferência OAM DMA contra testes de hardware. A implementação atual transfere um byte a cada quatro ciclos, mas isso sozinho não valida todo o protocolo.
- [ ] Garantir que VRAM e OAM fiquem acessíveis à CPU quando o LCD estiver desligado, inclusive imediatamente após a escrita em LCDC.
- [ ] Corrigir os bits superiores de IE: preservar o valor escrito em vez de forçar os bits 5–7 a `1`. Arquivo: `src/InterruptsController.js`.
- [ ] Revisar máscaras de leitura, bits não utilizados, registradores somente de leitura/escrita e endereços não mapeados do DMG, incluindo `FF50`.

Critério de conclusão: escritas em VRAM não alteram OAM; DMA copia os 160 bytes corretamente; bloqueios da CPU e acesso com LCD desligado passam em testes específicos.

## Prioridade 2 — CPU e interrupções

- [ ] Corrigir o atraso de `EI`: habilitar IME somente depois da instrução seguinte. Hoje a habilitação ocorre ao terminar o próprio `EI`. Arquivos: `src/OpcodeDecoder.js`, `src/ControlUnit.js`.
- [ ] Atender interrupções somente entre instruções, sem interromper uma fila de microciclos em execução.
- [ ] Dividir o atendimento de interrupções em cinco ciclos de máquina, intercalando os componentes e os acessos à pilha corretamente, em vez de somar 20 ciclos de uma vez.
- [ ] Validar interações entre `EI`, `DI`, `RETI`, interrupções pendentes e instruções consecutivas de habilitação.
- [ ] Implementar `STOP` do DMG: parada, comportamento do divisor e condição de despertar. A implementação atual segue executando instruções e escreve em `FF4D`, um registrador do CGB.
- [ ] Implementar o travamento da CPU nos 11 opcodes ilegais: `D3`, `DB`, `DD`, `E3`, `E4`, `EB`, `EC`, `ED`, `F4`, `FC`, `FD`. Eles não são instruções válidas faltantes; hoje apenas registram uma mensagem e continuam.
- [ ] Validar `HALT`, despertar com IME desligado e halt bug com testes dedicados. Existe implementação parcial, mas a fidelidade ainda não foi comprovada.
- [ ] Revisar a posição dos acessos ao barramento dentro de `CALL`, `RET`, instruções condicionais e demais instruções de múltiplos ciclos. Duração total correta não garante ordem correta dos acessos.
- [ ] Investigar e reproduzir o bug de corrupção de OAM causado por determinadas operações da CPU no DMG.

Critério de conclusão: manter os testes básicos aprovados e obter resultados conclusivos nos testes de interrupções, HALT, STOP e temporização dos acessos.

## Prioridade 3 — Gráficos e PPU

- [ ] Corrigir a base dos tiles com índice assinado: o índice zero deve apontar para `0x9000`, correspondente ao offset `0x1000` da VRAM. Arquivo: `src/LCDController.js`.
- [ ] Implementar a janela: bits de LCDC, mapa próprio, `WX`, `WY`, recorte e contador interno de linhas da janela.
- [ ] Implementar sprites de 8×8 e 8×16, transparência, inversão horizontal/vertical e seleção de paleta.
- [ ] Implementar seleção de até dez sprites por linha e prioridade entre sprites conforme o DMG.
- [ ] Implementar prioridade dos sprites em relação ao fundo e à janela, usando os índices de cor anteriores à aplicação da paleta.
- [ ] Manter sprites visíveis quando o fundo estiver desligado, conforme os bits de controle do DMG.
- [ ] Substituir o desenho atômico de uma linha por processamento progressivo de pixels, com busca de tiles e filas de pixels.
- [ ] Modelar a duração variável do modo 3, incluindo descarte por `SCX`, início da janela e penalidades dos sprites.
- [ ] Implementar efeitos observáveis de alterações de paleta, scrolling e controle durante uma linha.
- [ ] Tratar STAT como uma linha combinada com interrupção na transição de baixo para alto. Hoje fontes habilitadas podem gerar solicitações adicionais mesmo quando a linha deveria permanecer alta.
- [ ] Ignorar escritas em LY; hoje uma escrita redefine o valor para zero.
- [ ] Corrigir a sequência de ligar/desligar o LCD, seus efeitos imediatos e a temporização da primeira linha.
- [ ] Investigar e implementar detalhes da linha 153, coincidência LY/LYC e comportamento de escritas em STAT no DMG.

Critério de conclusão: fundo, janela e sprites corretos, testes de sincronização e STAT aprovados e comparação visual de ROMs gráficas de teste.

## Prioridade 4 — Timer e porta serial

- [ ] Corrigir escritas em TIMA durante o intervalo entre overflow e recarregamento: devem cancelar o recarregamento e sua interrupção em toda a janela permitida. Arquivo: `src/Timer.js`.
- [ ] Ignorar escritas em TIMA durante o ciclo de recarregamento.
- [ ] Fazer escritas em TMA durante o ciclo de recarregamento atualizarem também TIMA.
- [ ] Validar os efeitos de escritas em DIV e TAC, mudanças de frequência e habilitação/desabilitação do timer.
- [ ] Implementar transferência serial por bits e por ciclos. Hoje escrever o bit de início dispara imediatamente a interrupção. Arquivo: `src/Serial.js`.
- [ ] Implementar clock interno do DMG a 8192 Hz, recebimento sem cabo e limpeza do bit de início ao terminar a transferência.
- [ ] Implementar clock externo e uma interface para conectar outro dispositivo à porta serial.
- [ ] Avançar a serial junto aos demais componentes no loop do sistema. Arquivo: `src/GameBoy.js`.

Critério de conclusão: testes de overflow e escrita do timer aprovados; serial transmite oito bits, respeita os clocks e solicita interrupção somente ao finalizar.

## Prioridade 5 — Áudio

O subsistema de áudio está ausente: leituras em `FF10–FF3F` retornam `0xFF` e escritas são ignoradas.

- [ ] Criar a APU e conectá-la ao barramento e ao clock do sistema.
- [ ] Implementar os canais de pulso 1 e 2, duty cycle, frequência, comprimento e envelope.
- [ ] Implementar sweep de frequência do canal 1, incluindo overflow e efeitos da direção do sweep.
- [ ] Implementar o canal de onda, wave RAM, buffer de amostra, nível de saída e regras de acesso durante reprodução.
- [ ] Implementar o canal de ruído, divisor, modos do registrador de deslocamento e envelope.
- [ ] Implementar sequenciamento a partir das bordas do divisor, incluindo efeitos de escritas em DIV.
- [ ] Implementar `NR50`, `NR51`, `NR52`, estado ligado/desligado, máscaras de leitura e estado dos canais.
- [ ] Implementar mistura estéreo, conversão de amostras e filtro de saída compatível com o DMG.
- [ ] Investigar peculiaridades de trigger, comprimento, envelope e corrupção de wave RAM com testes dedicados.
- [ ] Conectar a saída de áudio ao navegador e controlar seu ciclo de vida ao iniciar, pausar e parar.

Critério de conclusão: executar toda a suíte `dmg_sound`, validar registradores e temporização e verificar a saída audível dos quatro canais.

## Prioridade 6 — Cartuchos e saves

- [ ] Corrigir o MBC1 para manter os bits superiores de seleção do banco em `0x4000–0x7FFF` também no modo 1. Arquivo: `src/MBC1.js`.
- [ ] Corrigir o caso de seleção do banco zero em ROMs pequenas quando bits não conectados do registrador estão ligados.
- [ ] Validar as configurações de ROM/RAM do MBC1 e, se incluídos no escopo, os cartuchos multicart MBC1M.
- [ ] Unificar a convenção de endereços da RAM externa entre barramento, `Cartridge` e controladores. Hoje `Cartridge` sem MBC espera endereços absolutos, enquanto o barramento usa offsets; esse caminho é contornado por `GameBoy`.
- [ ] Mapear RAM externa apenas quando o cartucho a possui. O caminho sem MBC atualmente oferece RAM mesmo a cartuchos sem ela.
- [ ] Remover o truncamento de endereços em 16 bits da memória genérica para permitir bancos de RAM acima de 64 KiB. Arquivo: `src/Memory.js`.
- [ ] Implementar MBC2 e sua RAM de quatro bits.
- [ ] Implementar MBC3, seleção de RAM e relógio RTC, incluindo latch, parada e overflow de dias.
- [ ] Implementar MBC5, bancos de ROM/RAM e sinal de rumble nos tipos correspondentes.
- [ ] Definir e documentar a cobertura de controladores especiais, como MBC6, MBC7, HuC1, HuC3 e periféricos de cartucho. Compatibilidade universal exige trabalho adicional além dos controladores comuns.
- [ ] Rejeitar explicitamente controladores não suportados em vez de carregá-los silenciosamente como ROM simples.
- [ ] Validar cabeçalho, tamanho e compatibilidade da ROM; distinguir cartuchos exclusivos de CGB.
- [ ] Persistir e restaurar RAM de cartuchos com bateria e estado do RTC quando aplicável.

Critério de conclusão: testes de bancos e RAM aprovados por controlador, saves preservados entre sessões e limitações de cartuchos claramente documentadas.

## Prioridade 7 — Inicialização e controles

- [ ] Ao iniciar com boot ROM, preparar o estado anterior ao boot e começar em `PC = 0x0000`. Hoje `loadBootROM` mantém o PC em `0x0100`. Arquivos: `src/GameBoy.js`, `src/Registers.js`.
- [ ] Separar inicialização com boot ROM de inicialização que simula o estado após o boot, incluindo LCD, timer, áudio e registradores.
- [ ] Validar mapeamento e desabilitação irreversível da boot ROM até o próximo reset.
- [ ] Corrigir os bits de seleção do joypad: bit 4 para direções e bit 5 para botões. Arquivo: `src/Joypad.js`.
- [ ] Combinar os grupos por AND quando ambos estiverem selecionados.
- [ ] Gerar interrupções pelas transições de alto para baixo das linhas selecionadas, incluindo seleção de um botão já pressionado.
- [ ] Corrigir a primeira pressão de botão, que atualmente não dispara a interrupção esperada.
- [ ] Conectar teclado ao joypad e liberar botões ao perder foco. Arquivo: `main.js`.
- [ ] Integrar o despertar de STOP aos sinais de entrada adequados.

Critério de conclusão: boot executado desde o início, estado sem boot validado e todos os botões funcionando com seleção e interrupções corretas.

## Prioridade 8 — Execução no navegador

- [ ] Corrigir o agendamento de frames: a combinação atual de espera de um frame com `requestAnimationFrame` adiciona atraso; usar tempo acumulado para manter a velocidade do hardware. Arquivo: `src/Emulator.js`.
- [ ] Evitar múltiplos loops concorrentes após chamadas repetidas de início ou ciclos rápidos de parar/iniciar.
- [ ] Definir comportamento de pausa e retomada quando a aba fica em segundo plano, sem acumular atraso ilimitado.
- [ ] Tratar falhas também nos callbacks posteriores ao início da emulação e restaurar o estado dos controles da página.
- [ ] Disponibilizar reset e carregamento de boot ROM na interface, caso façam parte do uso pretendido.

Critério de conclusão: velocidade estável, entrada responsiva, áudio sincronizado e ciclo de iniciar/parar confiável.

## Validação contínua e conclusão de fidelidade

- [ ] Criar um executor automatizado de testes que registre aprovação, falha e timeout separadamente.
- [ ] Registrar origem e versão das ROMs utilizadas e manter dependências de teste separadas do código do emulador.
- [ ] Transformar os defeitos reproduzidos nesta análise em testes de regressão.
- [ ] Reexecutar as suítes de CPU e memória depois das mudanças de temporização.
- [ ] Executar testes de hardware específicos, como Mooneye, escolhendo os resultados esperados para a revisão de DMG adotada.
- [ ] Executar suítes de gráficos, interrupções, DMA, timer, serial e áudio com resultados verificáveis.
- [ ] Comparar frames, registros e eventos por ciclo quando testes básicos não forem suficientes para detectar diferenças.
- [ ] Definir a revisão de hardware de referência e documentar comportamentos que variam entre modelos.
- [ ] Publicar uma matriz de compatibilidade e listar testes pendentes ou falhando antes de afirmar fidelidade 1:1.

## Referências

- [Pan Docs — referência do hardware](https://gbdev.io/pandocs/)
- [Interrupções](https://raw.githubusercontent.com/gbdev/pandocs/master/src/Interrupts.md)
- [Timer e comportamento de overflow](https://raw.githubusercontent.com/gbdev/pandocs/master/src/Timer_Obscure_Behaviour.md)
- [Renderização e duração dos modos da PPU](https://raw.githubusercontent.com/gbdev/pandocs/master/src/Rendering.md)
- [Detalhes do áudio](https://raw.githubusercontent.com/gbdev/pandocs/master/src/Audio_details.md)
- [MBC1](https://raw.githubusercontent.com/gbdev/pandocs/master/src/MBC1.md)
- [Serial](https://raw.githubusercontent.com/gbdev/pandocs/master/src/Serial_Data_Transfer_%28Link_Cable%29.md)
- [ROMs de teste de Blargg](https://github.com/retrio/gb-test-roms)
