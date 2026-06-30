(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const hudFase = document.getElementById('hudFase');
  const hudPontos = document.getElementById('hudPontos');
  const hudVidas = document.getElementById('hudVidas');
  const hudEscudos = document.getElementById('hudEscudos');
  const overlay = document.getElementById('overlay');
  const overlayTitulo = document.getElementById('overlayTitulo');
  const overlayTexto = document.getElementById('overlayTexto');
  const btnComecar = document.getElementById('btnComecar');

  const W = canvas.width;
  const H = canvas.height;
  const TOTAL_BLOCOS_ESCUDO = 4 * 44;

  const FASES = [
    {
      numero: 1,
      nome: 'Fase 1 - Primeira Invasão',
      descricao: 'Formação clássica: mire com calma e proteja os escudos.',
      linhas: 4,
      colunas: 8,
      velocidade: 38,
      queda: 20,
      tiroInimigo: 0.56,
      chancePowerUp: 0.13,
      pontos: 80,
      hpBase: 1,
      eliteLinhas: 0,
      blindadoLinhas: 0,
      amplitude: 0,
      cor: '#65ff8f'
    },
    {
      numero: 2,
      nome: 'Fase 2 - Chuva Cósmica',
      descricao: 'Os invasores começam a atirar em diagonal.',
      linhas: 5,
      colunas: 9,
      velocidade: 52,
      queda: 22,
      tiroInimigo: 0.88,
      chancePowerUp: 0.16,
      pontos: 110,
      hpBase: 1,
      eliteLinhas: 1,
      blindadoLinhas: 0,
      amplitude: 3.5,
      cor: '#45d6ff'
    },
    {
      numero: 3,
      nome: 'Fase 3 - Enxame Vermelho',
      descricao: 'Naves blindadas aguentam mais disparos.',
      linhas: 5,
      colunas: 10,
      velocidade: 64,
      queda: 23,
      tiroInimigo: 1.02,
      chancePowerUp: 0.18,
      pontos: 135,
      hpBase: 1,
      eliteLinhas: 1,
      blindadoLinhas: 2,
      amplitude: 4.6,
      cor: '#ff5f7a'
    },
    {
      numero: 4,
      nome: 'Fase 4 - Cinturão de Asteroides',
      descricao: 'O ataque fica mais rápido e as formações oscilam.',
      linhas: 6,
      colunas: 10,
      velocidade: 74,
      queda: 24,
      tiroInimigo: 1.12,
      chancePowerUp: 0.20,
      pontos: 155,
      hpBase: 2,
      eliteLinhas: 1,
      blindadoLinhas: 1,
      amplitude: 6.2,
      cor: '#ffe066'
    },
    {
      numero: 5,
      nome: 'Fase 5 - Guarda da Nave-Mãe',
      descricao: 'A tropa de elite protege a entrada do chefão.',
      linhas: 5,
      colunas: 11,
      velocidade: 86,
      queda: 25,
      tiroInimigo: 1.26,
      chancePowerUp: 0.22,
      pontos: 180,
      hpBase: 2,
      eliteLinhas: 2,
      blindadoLinhas: 2,
      amplitude: 7.2,
      cor: '#45d6ff'
    },
    {
      numero: 6,
      nome: 'Fase 6 - Fortaleza Alienígena',
      descricao: 'Elimine a escolta e enfrente o chefão final.',
      linhas: 5,
      colunas: 11,
      velocidade: 92,
      queda: 26,
      tiroInimigo: 1.36,
      chancePowerUp: 0.24,
      pontos: 205,
      hpBase: 2,
      eliteLinhas: 2,
      blindadoLinhas: 2,
      amplitude: 8.2,
      chefe: true,
      chefeHp: 180,
      chefeNome: 'CHEFÃO - NAVE IMPERADORA',
      cor: '#ff5f7a'
    }
  ];

  const estado = {
    tela: 'menu',
    fase: 1,
    pontos: 0,
    vidas: 3,
    tempo: 0,
    banner: 0,
    direcaoInimiga: 1,
    jogador: null,
    balas: [],
    balasInimigas: [],
    inimigos: [],
    barreiras: [],
    particulas: [],
    powerUps: [],
    estrelas: [],
    chefe: null,
    teclado: {
      esquerda: false,
      direita: false,
      tiro: false
    },
    toque: {
      pointerId: null,
      alvoX: null
    },
    audio: null
  };

  function criarJogador() {
    return {
      x: W / 2 - 26,
      y: H - 64,
      w: 52,
      h: 34,
      velocidade: 430,
      recarga: 0,
      atrasoTiro: 0.24,
      invulneravel: 0,
      tiroTriplo: 0,
      tiroRapido: 0
    };
  }

  function criarEstrelas() {
    estado.estrelas = [];
    for (let i = 0; i < 105; i += 1) {
      estado.estrelas.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.7 + 0.35,
        v: Math.random() * 34 + 16,
        brilho: Math.random() * 0.6 + 0.35
      });
    }
  }

  function faseAtual() {
    return FASES[estado.fase - 1] || FASES[0];
  }

  function mostrarOverlay(titulo, texto, botao) {
    overlayTitulo.textContent = titulo;
    overlayTexto.textContent = texto;
    btnComecar.textContent = botao;
    overlay.classList.remove('oculto');
  }

  function ocultarOverlay() {
    overlay.classList.add('oculto');
  }

  function formatarPontos(valor) {
    return String(valor).padStart(5, '0');
  }

  function limparEntradas() {
    estado.teclado.esquerda = false;
    estado.teclado.direita = false;
    estado.teclado.tiro = false;
    estado.toque.pointerId = null;
    estado.toque.alvoX = null;
    document.querySelectorAll('.controles-touch button').forEach((botao) => botao.classList.remove('pressionado'));
  }

  function atualizarHud() {
    hudFase.textContent = `${estado.fase}/${FASES.length}`;
    hudPontos.textContent = formatarPontos(estado.pontos);
    hudVidas.textContent = estado.vidas;

    const porcentagem = Math.max(0, Math.round((estado.barreiras.length / TOTAL_BLOCOS_ESCUDO) * 100));
    hudEscudos.textContent = `${porcentagem}%`;
  }

  function iniciarJogo() {
    limparEntradas();
    estado.tela = 'jogando';
    estado.fase = 1;
    estado.pontos = 0;
    estado.vidas = 3;
    estado.tempo = 0;
    estado.jogador = criarJogador();
    carregarFase(1);
    ocultarOverlay();
    iniciarAudio();
  }

  function carregarFase(numero) {
    estado.fase = numero;
    estado.direcaoInimiga = 1;
    estado.balas = [];
    estado.balasInimigas = [];
    estado.powerUps = [];
    estado.particulas = [];
    estado.chefe = null;
    estado.banner = 2.4;
    estado.toque.alvoX = null;
    estado.toque.pointerId = null;
    estado.jogador.x = W / 2 - estado.jogador.w / 2;
    estado.jogador.invulneravel = 1.5;
    criarInimigos();
    criarBarreiras();
    atualizarHud();
  }

  function criarInimigos() {
    const fase = faseAtual();
    estado.inimigos = [];

    const espacamentoX = Math.min(74, (W - 150) / Math.max(1, fase.colunas - 1));
    const espacamentoY = fase.linhas >= 6 ? 46 : 52;
    const larguraTotal = (fase.colunas - 1) * espacamentoX;
    const inicioX = W / 2 - larguraTotal / 2;
    const inicioY = 70;

    for (let linha = 0; linha < fase.linhas; linha += 1) {
      for (let coluna = 0; coluna < fase.colunas; coluna += 1) {
        const elite = linha < fase.eliteLinhas;
        const blindado = linha < fase.blindadoLinhas || (fase.numero >= 5 && linha < 3 && coluna % 3 === 0);
        const assalto = fase.numero >= 4 && linha === fase.linhas - 1;
        const comandante = elite && blindado;
        const hpMax = fase.hpBase + (elite ? 1 : 0) + (blindado ? 1 : 0) + (comandante ? 1 : 0);
        const tipo = comandante ? 'comandante' : (elite ? 'elite' : (blindado ? 'blindado' : (assalto ? 'assalto' : 'normal')));

        estado.inimigos.push({
          x: inicioX + coluna * espacamentoX,
          y: inicioY + linha * espacamentoY,
          w: elite || comandante ? 42 : (blindado ? 44 : 38),
          h: elite || comandante ? 30 : 28,
          coluna,
          linha,
          hp: hpMax,
          hpMax,
          pontos: fase.pontos + linha * 16 + (elite ? 70 : 0) + (blindado ? 60 : 0) + (comandante ? 90 : 0),
          tipo,
          semente: Math.random() * Math.PI * 2
        });
      }
    }
  }

  function criarBarreiras() {
    estado.barreiras = [];
    const padrao = [
      '  XXXXXXXX  ',
      ' XXXXXXXXXX ',
      'XXXXXXXXXXXX',
      'XXXX    XXXX',
      'XXX      XXX'
    ];
    const tamanho = 10;
    const centros = [180, 380, 580, 780];
    const yBase = 432;

    centros.forEach((centro) => {
      const xBase = centro - (padrao[0].length * tamanho) / 2;
      padrao.forEach((linha, y) => {
        [...linha].forEach((celula, x) => {
          if (celula === 'X') {
            estado.barreiras.push({
              x: xBase + x * tamanho,
              y: yBase + y * tamanho,
              w: tamanho,
              h: tamanho,
              hp: 2
            });
          }
        });
      });
    });
  }

  function proximaFase() {
    if (estado.fase >= FASES.length) {
      vencerJogo();
      return;
    }

    estado.fase += 1;
    estado.vidas = Math.min(7, estado.vidas + 1);
    carregarFase(estado.fase);
  }

  function vencerJogo() {
    estado.tela = 'vitoria';
    limparEntradas();
    tocarSom(560, 0.16, 'triangle');
    setTimeout(() => tocarSom(760, 0.16, 'triangle'), 160);
    setTimeout(() => tocarSom(940, 0.24, 'triangle'), 330);
    mostrarOverlay('Vitória!', `Você concluiu as ${FASES.length} fases e derrotou o chefão com ${formatarPontos(estado.pontos)} pontos.`, 'Jogar novamente');
  }

  function fimDeJogo() {
    if (estado.tela === 'fim') return;
    estado.tela = 'fim';
    limparEntradas();
    tocarSom(120, 0.35, 'sawtooth');
    mostrarOverlay('Fim de jogo', `Pontuação final: ${formatarPontos(estado.pontos)}. Pressione R ou clique para tentar novamente.`, 'Tentar novamente');
  }

  function pausarOuContinuar() {
    if (estado.tela === 'jogando') {
      estado.tela = 'pausado';
      limparEntradas();
      mostrarOverlay('Pausado', 'Pressione P para continuar defendendo a Terra.', 'Continuar');
    } else if (estado.tela === 'pausado') {
      estado.tela = 'jogando';
      ocultarOverlay();
    }
  }

  function iniciarAudio() {
    if (!estado.audio) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        estado.audio = new AudioContext();
      }
    }
    if (estado.audio && estado.audio.state === 'suspended') {
      estado.audio.resume();
    }
  }

  function tocarSom(frequencia, duracao = 0.08, tipo = 'square', volume = 0.035) {
    const audio = estado.audio;
    if (!audio) return;

    const oscilador = audio.createOscillator();
    const ganho = audio.createGain();
    oscilador.type = tipo;
    oscilador.frequency.value = frequencia;
    ganho.gain.setValueAtTime(volume, audio.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duracao);
    oscilador.connect(ganho);
    ganho.connect(audio.destination);
    oscilador.start();
    oscilador.stop(audio.currentTime + duracao);
  }

  function atualizar(dt) {
    estado.tempo += dt;
    if (estado.banner > 0) estado.banner -= dt;

    atualizarEstrelas(dt);
    atualizarJogador(dt);
    atualizarBalas(dt);
    atualizarInimigos(dt);
    atualizarChefe(dt);
    atualizarPowerUps(dt);
    atualizarParticulas(dt);
    verificarConclusaoDaFase();
    atualizarHud();
  }

  function atualizarEstrelas(dt) {
    const multiplicador = estado.tela === 'jogando' ? 1 + estado.fase * 0.04 : 1;
    estado.estrelas.forEach((estrela) => {
      estrela.y += estrela.v * multiplicador * dt;
      if (estrela.y > H) {
        estrela.y = -4;
        estrela.x = Math.random() * W;
      }
    });
  }

  function atualizarJogador(dt) {
    const jogador = estado.jogador;
    if (!jogador) return;

    let direcao = 0;
    if (estado.teclado.esquerda) direcao -= 1;
    if (estado.teclado.direita) direcao += 1;

    if (direcao !== 0) {
      jogador.x += direcao * jogador.velocidade * dt;
    } else if (estado.toque.alvoX !== null) {
      const alvo = limitar(estado.toque.alvoX - jogador.w / 2, 18, W - jogador.w - 18);
      const diferenca = alvo - jogador.x;
      const passoMaximo = jogador.velocidade * 1.55 * dt;
      jogador.x += limitar(diferenca, -passoMaximo, passoMaximo);
    }

    jogador.x = limitar(jogador.x, 18, W - jogador.w - 18);
    jogador.recarga = Math.max(0, jogador.recarga - dt);
    jogador.invulneravel = Math.max(0, jogador.invulneravel - dt);
    jogador.tiroTriplo = Math.max(0, jogador.tiroTriplo - dt);
    jogador.tiroRapido = Math.max(0, jogador.tiroRapido - dt);
    jogador.atrasoTiro = jogador.tiroRapido > 0 ? 0.105 : 0.23;

    if (estado.teclado.tiro && jogador.recarga <= 0) {
      atirarJogador();
      jogador.recarga = jogador.atrasoTiro;
    }
  }

  function atirarJogador() {
    const jogador = estado.jogador;
    if (!jogador || estado.tela !== 'jogando') return;

    const centro = jogador.x + jogador.w / 2;
    const y = jogador.y - 12;
    const tiros = jogador.tiroTriplo > 0 ? [-14, 0, 14] : [0];

    tiros.forEach((offset, indice) => {
      estado.balas.push({
        x: centro - 3 + offset,
        y,
        w: 6,
        h: 18,
        vx: indice === 0 && tiros.length === 3 ? -58 : (indice === 2 ? 58 : 0),
        vy: -690,
        dano: 1,
        cor: '#65ff8f'
      });
    });

    tocarSom(880, 0.055, 'square', 0.025);
  }

  function atualizarBalas(dt) {
    estado.balas.forEach((bala) => {
      bala.x += bala.vx * dt;
      bala.y += bala.vy * dt;
    });

    estado.balasInimigas.forEach((bala) => {
      bala.x += bala.vx * dt;
      bala.y += bala.vy * dt;
    });

    colisaoBalasJogadorComAlvos();
    colisaoBalasInimigas();

    estado.balas = estado.balas.filter((bala) => !bala.morta && bala.y + bala.h > -20 && bala.x > -50 && bala.x < W + 50);
    estado.balasInimigas = estado.balasInimigas.filter((bala) => !bala.morta && bala.y < H + 70 && bala.x > -80 && bala.x < W + 80);
  }

  function colisaoBalasJogadorComAlvos() {
    for (const bala of estado.balas) {
      if (bala.morta) continue;

      if (estado.chefe && retangulosColidem(bala, estado.chefe)) {
        estado.chefe.hp -= bala.dano;
        bala.morta = true;
        estado.pontos += 22;
        criarExplosao(bala.x, bala.y, '#ff5f7a', 8);
        tocarSom(240, 0.045, 'square', 0.018);
        if (estado.chefe.hp <= 0) {
          destruirChefe();
        }
        continue;
      }

      for (const inimigo of estado.inimigos) {
        if (inimigo.morto || !retangulosColidem(bala, inimigo)) continue;

        inimigo.hp -= bala.dano;
        bala.morta = true;
        criarExplosao(bala.x, bala.y, corDoInimigo(inimigo), 10);

        if (inimigo.hp <= 0) {
          inimigo.morto = true;
          estado.pontos += inimigo.pontos;
          criarExplosao(inimigo.x + inimigo.w / 2, inimigo.y + inimigo.h / 2, '#ffe066', 20);
          talvezCriarPowerUp(inimigo.x + inimigo.w / 2, inimigo.y + inimigo.h / 2);
          tocarSom(190 + Math.random() * 120, 0.09, 'triangle', 0.03);
        } else {
          tocarSom(310, 0.045, 'square', 0.018);
        }
        break;
      }
    }

    estado.inimigos = estado.inimigos.filter((inimigo) => !inimigo.morto);
  }

  function colisaoBalasInimigas() {
    const jogador = estado.jogador;

    for (const bala of estado.balasInimigas) {
      if (bala.morta) continue;

      for (const bloco of estado.barreiras) {
        if (retangulosColidem(bala, bloco)) {
          bloco.hp -= bala.tipo === 'laser' ? 2 : 1;
          bala.morta = true;
          criarExplosao(bala.x, bala.y, bala.tipo === 'laser' ? '#ffe066' : '#45d6ff', 4);
          break;
        }
      }

      if (!bala.morta && jogador.invulneravel <= 0 && retangulosColidem(bala, jogador)) {
        bala.morta = true;
        receberDano();
      }
    }

    estado.barreiras = estado.barreiras.filter((bloco) => bloco.hp > 0);
  }

  function receberDano() {
    estado.vidas -= 1;
    criarExplosao(estado.jogador.x + estado.jogador.w / 2, estado.jogador.y + estado.jogador.h / 2, '#ff5f7a', 34);
    tocarSom(95, 0.28, 'sawtooth', 0.04);

    if (estado.vidas <= 0) {
      atualizarHud();
      fimDeJogo();
      return;
    }

    estado.jogador.invulneravel = 1.9;
    estado.jogador.x = W / 2 - estado.jogador.w / 2;
    estado.toque.alvoX = null;
  }

  function atualizarInimigos(dt) {
    if (estado.inimigos.length === 0) return;

    const fase = faseAtual();
    const totalInicial = fase.linhas * fase.colunas;
    const aceleracao = Math.max(0, totalInicial - estado.inimigos.length) * (fase.numero >= 4 ? 0.9 : 0.72);
    const velocidade = fase.velocidade + aceleracao;
    let bateuNaBorda = false;

    estado.inimigos.forEach((inimigo) => {
      const impulsoAssalto = inimigo.tipo === 'assalto' ? 1.18 : 1;
      inimigo.x += estado.direcaoInimiga * velocidade * impulsoAssalto * dt;

      if (fase.amplitude > 0) {
        inimigo.y += Math.sin(estado.tempo * (2.6 + fase.numero * 0.16) + inimigo.semente) * fase.amplitude * dt;
      }

      if (inimigo.x < 24 || inimigo.x + inimigo.w > W - 24) {
        bateuNaBorda = true;
      }
    });

    if (bateuNaBorda) {
      estado.direcaoInimiga *= -1;
      estado.inimigos.forEach((inimigo) => {
        inimigo.x += estado.direcaoInimiga * 18;
        inimigo.y += fase.queda;
      });
      tocarSom(130, 0.04, 'square', 0.018);
    }

    if (Math.random() < fase.tiroInimigo * dt) {
      const atirador = escolherAtirador();
      if (atirador) atirarInimigo(atirador);
    }

    if (fase.numero >= 4 && Math.random() < 0.26 * dt) {
      const atiradorExtra = escolherAtirador();
      if (atiradorExtra) atirarInimigo(atiradorExtra, true);
    }

    const invasorChegou = estado.inimigos.some((inimigo) => inimigo.y + inimigo.h >= estado.jogador.y - 12);
    if (invasorChegou) {
      fimDeJogo();
    }
  }

  function escolherAtirador() {
    const porColuna = new Map();
    estado.inimigos.forEach((inimigo) => {
      const atual = porColuna.get(inimigo.coluna);
      if (!atual || inimigo.y > atual.y) {
        porColuna.set(inimigo.coluna, inimigo);
      }
    });

    const candidatos = [...porColuna.values()];
    return candidatos[Math.floor(Math.random() * candidatos.length)];
  }

  function atirarInimigo(inimigo, tiroExtra = false) {
    const fase = faseAtual();
    const abertura = fase.numero >= 5 ? 130 : (fase.numero >= 2 ? 90 : 0);
    const diagonal = abertura ? (Math.random() - 0.5) * abertura : 0;
    const velocidade = 230 + fase.numero * 32 + (tiroExtra ? 25 : 0);
    estado.balasInimigas.push({
      x: inimigo.x + inimigo.w / 2 - 4,
      y: inimigo.y + inimigo.h,
      w: 8,
      h: 16,
      vx: diagonal,
      vy: velocidade,
      tipo: 'inimigo',
      cor: fase.numero >= 3 ? '#ff5f7a' : '#45d6ff'
    });
  }

  function criarChefe() {
    const fase = faseAtual();
    estado.chefe = {
      x: W / 2 - 122,
      y: 50,
      w: 244,
      h: 88,
      hp: fase.chefeHp,
      hpMax: fase.chefeHp,
      direcao: 1,
      recarga: 0.62,
      recargaLaser: 2.8,
      reforco: 4.6,
      pulso: 0
    };
    estado.banner = 2.3;
    estado.balasInimigas = [];
    repararEscudos();
    tocarSom(78, 0.6, 'sawtooth', 0.04);
  }

  function atualizarChefe(dt) {
    const chefe = estado.chefe;
    if (!chefe) return;

    const porcentagemVida = Math.max(0, chefe.hp / chefe.hpMax);
    chefe.pulso += dt;
    chefe.y = 48 + Math.sin(estado.tempo * 1.35) * 8;
    chefe.x += chefe.direcao * (105 + (1 - porcentagemVida) * 130) * dt;

    if (chefe.x < 24 || chefe.x + chefe.w > W - 24) {
      chefe.direcao *= -1;
      chefe.x = limitar(chefe.x, 24, W - chefe.w - 24);
    }

    chefe.recarga -= dt;
    chefe.recargaLaser -= dt;
    chefe.reforco -= dt;

    if (chefe.recarga <= 0) {
      atirarChefe();
      chefe.recarga = porcentagemVida < 0.35 ? 0.52 : (porcentagemVida < 0.68 ? 0.72 : 0.94);
    }

    if (chefe.recargaLaser <= 0) {
      atirarLaserChefe();
      chefe.recargaLaser = porcentagemVida < 0.4 ? 2.15 : 3.15;
    }

    if (porcentagemVida < 0.65 && chefe.reforco <= 0 && estado.inimigos.length < 7) {
      criarReforcoDoChefe();
      chefe.reforco = porcentagemVida < 0.35 ? 5.0 : 6.8;
    }
  }

  function atirarChefe() {
    const chefe = estado.chefe;
    const centro = chefe.x + chefe.w / 2;
    const porcentagemVida = chefe.hp / chefe.hpMax;
    const tiros = porcentagemVida < 0.35 ? [-180, -120, -60, 0, 60, 120, 180] : (porcentagemVida < 0.68 ? [-135, -70, 0, 70, 135] : [-95, 0, 95]);

    tiros.forEach((vx, indice) => {
      estado.balasInimigas.push({
        x: centro - 5 + Math.sin(estado.tempo * 5 + indice) * 10,
        y: chefe.y + chefe.h - 4,
        w: 10,
        h: 20,
        vx,
        vy: porcentagemVida < 0.35 ? 310 : 285,
        tipo: 'chefe',
        cor: '#ff5f7a'
      });
    });

    tocarSom(150, 0.09, 'sawtooth', 0.025);
  }

  function atirarLaserChefe() {
    const chefe = estado.chefe;
    const porcentagemVida = chefe.hp / chefe.hpMax;
    const centro = chefe.x + chefe.w / 2;
    const offsets = porcentagemVida < 0.45 ? [-96, 0, 96] : [-72, 72];

    offsets.forEach((offset) => {
      estado.balasInimigas.push({
        x: centro + offset - 8,
        y: chefe.y + chefe.h - 8,
        w: 16,
        h: 56,
        vx: offset * 0.12,
        vy: 330,
        tipo: 'laser',
        cor: '#ffe066'
      });
    });

    tocarSom(96, 0.16, 'sawtooth', 0.03);
  }

  function criarReforcoDoChefe() {
    const chefe = estado.chefe;
    if (!chefe) return;

    const quantidade = chefe.hp < chefe.hpMax * 0.35 ? 5 : 3;
    const inicio = chefe.x + chefe.w / 2 - (quantidade - 1) * 34 / 2;

    for (let i = 0; i < quantidade; i += 1) {
      estado.inimigos.push({
        x: limitar(inicio + i * 34, 30, W - 70),
        y: chefe.y + chefe.h + 20 + Math.random() * 18,
        w: 34,
        h: 25,
        coluna: 100 + i,
        linha: 10,
        hp: 2,
        hpMax: 2,
        pontos: 260,
        tipo: 'assalto',
        semente: Math.random() * Math.PI * 2
      });
    }

    criarExplosao(chefe.x + chefe.w / 2, chefe.y + chefe.h, '#45d6ff', 18);
  }

  function destruirChefe() {
    if (!estado.chefe) return;
    criarExplosao(estado.chefe.x + estado.chefe.w / 2, estado.chefe.y + estado.chefe.h / 2, '#ffe066', 150);
    criarExplosao(estado.chefe.x + estado.chefe.w / 2 - 70, estado.chefe.y + 38, '#ff5f7a', 70);
    criarExplosao(estado.chefe.x + estado.chefe.w / 2 + 70, estado.chefe.y + 38, '#45d6ff', 70);
    estado.chefe = null;
    estado.inimigos = [];
    estado.balasInimigas = [];
    estado.pontos += 5000;
    vencerJogo();
  }

  function verificarConclusaoDaFase() {
    if (estado.tela !== 'jogando') return;

    if (estado.inimigos.length === 0) {
      const fase = faseAtual();
      if (fase.chefe && !estado.chefe) {
        criarChefe();
      } else if (!fase.chefe && !estado.chefe) {
        proximaFase();
      }
    }
  }

  function talvezCriarPowerUp(x, y) {
    const fase = faseAtual();
    if (Math.random() > fase.chancePowerUp) return;

    const tipos = ['rapido', 'triplo', 'vida', 'escudo'];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    estado.powerUps.push({
      x: x - 12,
      y: y - 12,
      w: 24,
      h: 24,
      vy: 118,
      tipo
    });
  }

  function atualizarPowerUps(dt) {
    const jogador = estado.jogador;
    if (!jogador) return;

    estado.powerUps.forEach((powerUp) => {
      powerUp.y += powerUp.vy * dt;
      if (retangulosColidem(powerUp, jogador)) {
        aplicarPowerUp(powerUp.tipo);
        powerUp.coletado = true;
      }
    });

    estado.powerUps = estado.powerUps.filter((powerUp) => !powerUp.coletado && powerUp.y < H + 28);
  }

  function aplicarPowerUp(tipo) {
    const jogador = estado.jogador;
    if (tipo === 'rapido') jogador.tiroRapido = 7.5;
    if (tipo === 'triplo') jogador.tiroTriplo = 7.5;
    if (tipo === 'vida') estado.vidas = Math.min(7, estado.vidas + 1);
    if (tipo === 'escudo') repararEscudos();
    tocarSom(620, 0.12, 'triangle', 0.035);
  }

  function repararEscudos() {
    const antes = estado.barreiras.length;
    if (antes >= TOTAL_BLOCOS_ESCUDO) return;

    const padrao = [
      '  XXXXXXXX  ',
      ' XXXXXXXXXX ',
      'XXXXXXXXXXXX',
      'XXXX    XXXX',
      'XXX      XXX'
    ];
    const tamanho = 10;
    const centros = [180, 380, 580, 780];
    const yBase = 432;
    const existentes = new Set(estado.barreiras.map((bloco) => `${Math.round(bloco.x)}:${Math.round(bloco.y)}`));
    const candidatos = [];

    centros.forEach((centro) => {
      const xBase = centro - (padrao[0].length * tamanho) / 2;
      padrao.forEach((linha, y) => {
        [...linha].forEach((celula, x) => {
          if (celula === 'X') {
            const bx = xBase + x * tamanho;
            const by = yBase + y * tamanho;
            const chave = `${Math.round(bx)}:${Math.round(by)}`;
            if (!existentes.has(chave)) {
              candidatos.push({ x: bx, y: by, w: tamanho, h: tamanho, hp: 2 });
            }
          }
        });
      });
    });

    embaralhar(candidatos).slice(0, 38).forEach((bloco) => estado.barreiras.push(bloco));
  }

  function criarExplosao(x, y, cor, quantidade) {
    for (let i = 0; i < quantidade; i += 1) {
      const angulo = Math.random() * Math.PI * 2;
      const velocidade = Math.random() * 170 + 38;
      estado.particulas.push({
        x,
        y,
        vx: Math.cos(angulo) * velocidade,
        vy: Math.sin(angulo) * velocidade,
        vida: Math.random() * 0.5 + 0.25,
        vidaMax: 0.75,
        r: Math.random() * 3.2 + 1,
        cor
      });
    }
  }

  function atualizarParticulas(dt) {
    estado.particulas.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 55 * dt;
      p.vida -= dt;
    });
    estado.particulas = estado.particulas.filter((p) => p.vida > 0);
  }

  function desenhar() {
    desenharFundo();
    desenharBarreiras();
    desenharPowerUps();
    desenharBalas();
    desenharInimigos();
    desenharChefe();
    desenharJogador();
    desenharParticulas();
    desenharTextosDoJogo();
  }

  function desenharFundo() {
    const fase = faseAtual();
    const gradiente = ctx.createLinearGradient(0, 0, 0, H);
    gradiente.addColorStop(0, '#050816');
    gradiente.addColorStop(0.55, '#070b20');
    gradiente.addColorStop(1, '#02030a');
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, W, H);

    estado.estrelas.forEach((estrela) => {
      ctx.globalAlpha = estrela.brilho;
      ctx.fillStyle = '#f4f7ff';
      ctx.beginPath();
      ctx.arc(estrela.x, estrela.y, estrela.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(69, 214, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 40; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    if (estado.tela === 'jogando') {
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = fase.cor;
      ctx.beginPath();
      ctx.arc(W - 88, 74, 54 + Math.sin(estado.tempo * 2) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function desenharJogador() {
    const j = estado.jogador;
    if (!j) return;

    if (j.invulneravel > 0 && Math.floor(estado.tempo * 16) % 2 === 0) {
      ctx.globalAlpha = 0.42;
    }

    ctx.save();
    ctx.translate(j.x, j.y);
    ctx.fillStyle = '#65ff8f';
    ctx.beginPath();
    ctx.moveTo(j.w / 2, 0);
    ctx.lineTo(j.w, j.h);
    ctx.lineTo(0, j.h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#45d6ff';
    ctx.fillRect(j.w / 2 - 5, 10, 10, 14);

    ctx.fillStyle = '#ffe066';
    ctx.fillRect(6, j.h - 8, 12, 8);
    ctx.fillRect(j.w - 18, j.h - 8, 12, 8);

    if (j.tiroRapido > 0 || j.tiroTriplo > 0) {
      ctx.strokeStyle = j.tiroTriplo > 0 ? '#45d6ff' : '#ffe066';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(j.w / 2, j.h / 2, 34 + Math.sin(estado.tempo * 10) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function corDoInimigo(inimigo) {
    const cores = {
      normal: '#65ff8f',
      elite: '#45d6ff',
      blindado: '#ff5f7a',
      assalto: '#ffe066',
      comandante: '#d86bff'
    };
    return cores[inimigo.tipo] || cores.normal;
  }

  function desenharInimigos() {
    estado.inimigos.forEach((i) => {
      const corPrincipal = corDoInimigo(i);
      const oscilacao = Math.sin(estado.tempo * 4 + i.semente) * 2;

      ctx.save();
      ctx.translate(i.x, i.y + oscilacao);
      ctx.fillStyle = corPrincipal;
      ctx.fillRect(5, 8, i.w - 10, i.h - 8);
      ctx.fillRect(0, 14, i.w, 10);
      ctx.fillRect(8, 0, i.w - 16, 10);

      ctx.fillStyle = '#02030a';
      ctx.fillRect(10, 12, 6, 5);
      ctx.fillRect(i.w - 16, 12, 6, 5);

      ctx.fillStyle = '#ffe066';
      ctx.fillRect(5, i.h - 2, 8, 6);
      ctx.fillRect(i.w - 13, i.h - 2, 8, 6);

      if (i.hpMax > 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.24)';
        ctx.fillRect(0, -8, i.w, 4);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(0, -8, i.w * (i.hp / i.hpMax), 4);
      }
      ctx.restore();
    });
  }

  function desenharChefe() {
    const c = estado.chefe;
    if (!c) return;

    const fase = faseAtual();
    const vida = Math.max(0, c.hp / c.hpMax);
    const pulso = Math.sin(c.pulso * 8) * 4;
    ctx.save();
    ctx.translate(c.x, c.y);

    ctx.fillStyle = vida < 0.35 ? '#ff2f58' : '#ff5f7a';
    ctx.fillRect(22, 20, c.w - 44, c.h - 18);
    ctx.fillRect(0, 38, c.w, 24);
    ctx.fillRect(48, 0, c.w - 96, 28);
    ctx.fillRect(34, 62, 38, 18);
    ctx.fillRect(c.w - 72, 62, 38, 18);

    ctx.fillStyle = '#45d6ff';
    ctx.fillRect(78, 28, 20, 16);
    ctx.fillRect(c.w - 98, 28, 20, 16);
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(c.w / 2, 40, 16 + pulso * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = vida < 0.35 ? '#ffe066' : 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(c.w / 2, 40, 28 + pulso * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#02030a';
    ctx.fillRect(22, 62, 30, 10);
    ctx.fillRect(c.w - 52, 62, 30, 10);
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(220, 18, 520, 14);
    ctx.fillStyle = vida < 0.35 ? '#ffe066' : '#ff5f7a';
    ctx.fillRect(220, 18, 520 * vida, 14);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.strokeRect(220, 18, 520, 14);
    ctx.fillStyle = '#f4f7ff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(fase.chefeNome || 'CHEFÃO FINAL', W / 2, 14);
  }

  function desenharBalas() {
    estado.balas.forEach((b) => {
      ctx.fillStyle = b.cor;
      ctx.shadowColor = b.cor;
      ctx.shadowBlur = 12;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.shadowBlur = 0;
    });

    estado.balasInimigas.forEach((b) => {
      ctx.fillStyle = b.cor;
      ctx.shadowColor = b.cor;
      ctx.shadowBlur = b.tipo === 'laser' ? 18 : 10;
      if (b.tipo === 'laser') {
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fillRect(b.x + b.w / 2 - 2, b.y + 4, 4, b.h - 8);
      } else {
        ctx.fillRect(b.x, b.y, b.w, b.h);
      }
      ctx.shadowBlur = 0;
    });
  }

  function desenharBarreiras() {
    estado.barreiras.forEach((bloco) => {
      ctx.fillStyle = bloco.hp === 2 ? '#45d6ff' : '#1b7ea6';
      ctx.fillRect(bloco.x, bloco.y, bloco.w - 1, bloco.h - 1);
    });
  }

  function desenharPowerUps() {
    estado.powerUps.forEach((p) => {
      const cores = {
        rapido: '#ffe066',
        triplo: '#45d6ff',
        vida: '#ff5f7a',
        escudo: '#65ff8f'
      };
      const simbolos = {
        rapido: 'R',
        triplo: '3',
        vida: '+',
        escudo: 'E'
      };

      ctx.fillStyle = cores[p.tipo];
      ctx.shadowColor = cores[p.tipo];
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#02030a';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(simbolos[p.tipo], p.x + p.w / 2, p.y + p.h / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    });
  }

  function desenharParticulas() {
    estado.particulas.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.vida / p.vidaMax);
      ctx.fillStyle = p.cor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function desenharTextosDoJogo() {
    if (estado.banner <= 0 || estado.tela !== 'jogando') return;

    const fase = faseAtual();
    let titulo = fase.nome;
    let texto = fase.descricao;
    if (estado.chefe) {
      titulo = 'Chefão final';
      texto = 'Desvie dos lasers e ataque o núcleo da nave imperadora.';
    }

    ctx.save();
    ctx.globalAlpha = Math.min(1, estado.banner / 0.6);
    ctx.fillStyle = 'rgba(2, 3, 10, 0.58)';
    ctx.fillRect(0, H / 2 - 80, W, 142);
    ctx.fillStyle = estado.chefe ? '#ff5f7a' : fase.cor;
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(titulo, W / 2, H / 2 - 20);
    ctx.fillStyle = '#f4f7ff';
    ctx.font = '20px Arial';
    ctx.fillText(texto, W / 2, H / 2 + 22);
    ctx.restore();
  }

  function retangulosColidem(a, b) {
    return a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y;
  }

  function limitar(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor));
  }

  function embaralhar(lista) {
    for (let i = lista.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
  }

  function tratarTecla(evento, pressionada) {
    const tecla = evento.key.toLowerCase();

    if (['arrowleft', 'a'].includes(tecla)) estado.teclado.esquerda = pressionada;
    if (['arrowright', 'd'].includes(tecla)) estado.teclado.direita = pressionada;
    if (tecla === ' ') {
      estado.teclado.tiro = pressionada;
      evento.preventDefault();
    }

    if (!pressionada) return;
    if (tecla === 'p') pausarOuContinuar();
    if (tecla === 'r') iniciarJogo();
  }

  function configurarBotaoTouch(id, propriedade) {
    const botao = document.getElementById(id);
    if (!botao) return;

    const ativar = (evento) => {
      evento.preventDefault();
      botao.classList.add('pressionado');
      estado.teclado[propriedade] = true;
      iniciarAudio();
      try {
        botao.setPointerCapture(evento.pointerId);
      } catch (erro) {
        // O navegador pode não permitir captura em alguns eventos; o controle continua funcionando.
      }
    };

    const desativar = (evento) => {
      if (evento) evento.preventDefault();
      botao.classList.remove('pressionado');
      estado.teclado[propriedade] = false;
    };

    botao.addEventListener('pointerdown', ativar);
    botao.addEventListener('pointerup', desativar);
    botao.addEventListener('pointercancel', desativar);
    botao.addEventListener('lostpointercapture', desativar);
    botao.addEventListener('contextmenu', (evento) => evento.preventDefault());
  }

  function xDoCanvas(evento) {
    const rect = canvas.getBoundingClientRect();
    const escalaX = W / rect.width;
    return limitar((evento.clientX - rect.left) * escalaX, 0, W);
  }

  function configurarArrasteNoCanvas() {
    canvas.addEventListener('pointerdown', (evento) => {
      if (evento.pointerType === 'mouse' || estado.tela !== 'jogando') return;
      evento.preventDefault();
      iniciarAudio();
      estado.toque.pointerId = evento.pointerId;
      estado.toque.alvoX = xDoCanvas(evento);
      try {
        canvas.setPointerCapture(evento.pointerId);
      } catch (erro) {
        // Alguns navegadores móveis não capturam o ponteiro, mas ainda disparam pointermove.
      }
    });

    canvas.addEventListener('pointermove', (evento) => {
      if (estado.toque.pointerId !== evento.pointerId || estado.tela !== 'jogando') return;
      evento.preventDefault();
      estado.toque.alvoX = xDoCanvas(evento);
    });

    const encerrar = (evento) => {
      if (estado.toque.pointerId !== evento.pointerId) return;
      evento.preventDefault();
      estado.toque.pointerId = null;
      estado.toque.alvoX = null;
    };

    canvas.addEventListener('pointerup', encerrar);
    canvas.addEventListener('pointercancel', encerrar);
    canvas.addEventListener('lostpointercapture', () => {
      estado.toque.pointerId = null;
      estado.toque.alvoX = null;
    });
    canvas.addEventListener('contextmenu', (evento) => evento.preventDefault());
  }

  btnComecar.addEventListener('click', () => {
    if (estado.tela === 'pausado') {
      pausarOuContinuar();
      return;
    }
    iniciarJogo();
  });

  window.addEventListener('keydown', (evento) => tratarTecla(evento, true));
  window.addEventListener('keyup', (evento) => tratarTecla(evento, false));
  window.addEventListener('blur', limparEntradas);

  configurarBotaoTouch('btnEsquerda', 'esquerda');
  configurarBotaoTouch('btnDireita', 'direita');
  configurarBotaoTouch('btnTiro', 'tiro');
  configurarArrasteNoCanvas();

  let ultimoTempo = 0;
  function loop(timestamp) {
    const dt = ultimoTempo ? Math.min((timestamp - ultimoTempo) / 1000, 0.033) : 0;
    ultimoTempo = timestamp;

    if (estado.tela === 'jogando') {
      atualizar(dt);
    } else {
      atualizarEstrelas(dt);
      atualizarParticulas(dt);
    }

    desenhar();
    requestAnimationFrame(loop);
  }

  criarEstrelas();
  estado.jogador = criarJogador();
  atualizarHud();
  mostrarOverlay('Space Invaders', `Defenda a Terra em ${FASES.length} fases. Colete poderes, sobreviva à escolta e derrote o chefão final.`, 'Começar jogo');
  requestAnimationFrame(loop);
})();
