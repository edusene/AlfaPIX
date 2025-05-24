let intervalo;
let pagamentoConcluido = false;

<<<<<<< HEAD
// Variáveis globais para filtro de datas
let filtroInicio;
let filtroFim;

// 🔧 Cria um objeto Date localmente (mes começa em 1)
function criarDataLocal(ano, mes, dia, hora = 0, minuto = 0, segundo = 0) {
  return new Date(ano, mes - 1, dia, hora, minuto, segundo);
}

// 🕒 Formata Date para string "YYYY-MM-DD HH:mm:ss"
function formatarLocal(date) {
  const pad = n => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
=======
// -------------------- ALERTAS E NOTIFICAÇÕES --------------------

function mostrarAlerta(msg, tipo) {
  $('#alerta').html(`<div class="alert ${tipo}">${msg}</div>`);
}

function mostrarNotificacao(msg) {
  const notif = $('#notificacao-pagamento');
  notif.text(msg).addClass('show');
  setTimeout(() => notif.removeClass('show'), 4000);
}

// -------------------- CARREGAR HISTÓRICO --------------------

async function carregarHistorico(inicio = null, fim = null) {
  let query = supabase
    .from('historico_pagamentos')
    .select('*')
    .order('dataHora', { ascending: false });

  if (inicio) query = query.gte('dataHora', inicio);
  if (fim) query = query.lte('dataHora', fim);

  const { data, error } = await query;

  const lista = $('#historico-pix');
  lista.empty();
>>>>>>> 89342013ec643a72b90a72196e07d8c14d340dca

// 🕓 Formata Date para exibição no padrão BR com UTC-4 (Rondônia)
function formatarDataLocalRondonia(data) {
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()} ` +
         `${pad(data.getHours())}:${pad(data.getMinutes())}:${pad(data.getSeconds())}`;
}

// 🚨 Exibe alerta com mensagem e tipo (ex: 'error', 'success')
function mostrarAlerta(msg, tipo) {
  $('#alerta').html(`<div class="alert ${tipo}">${msg}</div>`);
}

// 🔔 Exibe notificação temporária no topo da tela
function mostrarNotificacao(msg) {
  const notif = $('#notificacao-pagamento');
  notif.text(msg).addClass('show');
  setTimeout(() => notif.removeClass('show'), 4000);
}

// 📜 Converte string "YYYY-MM-DD HH:mm:ss" para objeto Date local
function parseDateLocal(str) {
  // troca espaço por 'T' para formato ISO aceito pelo JS, já em horário local
  return new Date(str.replace(' ', 'T'));
}

// Atualiza a lista de pagamentos exibida na tela
function atualizarHistorico(pagamentos) {
  const container = document.getElementById('lista-pagamentos');
  if (!container) {
    console.error('Elemento #lista-pagamentos não encontrado!');
    return;
  }

  // Animação de saída
  $(container).fadeOut(300, () => {
    container.innerHTML = '';

    if (!pagamentos || pagamentos.length === 0) {
      container.innerHTML = `<p>Nenhum pagamento encontrado.</p>`;
      const contador = document.getElementById('contador-registros');
      if (contador) contador.textContent = 'Total de registros: 0';

      // Animação de entrada
      $(container).fadeIn(300);
      return;
    }

    pagamentos.forEach(p => {
      const dataLocal = parseDateLocal(p.dataHora);

      const div = document.createElement('div');
      div.className = 'comprovante';

      div.innerHTML = `
        <p>👤 <strong>Nome:</strong> ${p.nome}</p>
        <p>💰 <strong>Valor:</strong> R$ ${parseFloat(p.valor).toFixed(2)}</p>
        <p>📅 <strong>Data/Hora:</strong> ${formatarDataLocalRondonia(dataLocal)}</p>
      `;

      container.appendChild(div);
    });
<<<<<<< HEAD

    const contador = document.getElementById('contador-registros');
    if (contador) contador.textContent = `Total de registros: ${pagamentos.length}`;

    // Animação de entrada
    $(container).fadeIn(300);
  });
}

// 🔍 Busca e carrega histórico com filtro de datas
function carregarHistorico(inicio = '', fim = '') {
  const url = `/historico?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`;
=======
  } else {
    lista.append('<li style="text-align:center; color:#888;">Nenhum pagamento registrado neste período.</li>');
  }
}

// -------------------- SALVAR NO HISTÓRICO --------------------

async function salvarNoHistorico(nome, valor) {
  const { error } = await supabase
    .from('historico_pagamentos')
    .insert([{ nome, valor, dataHora: new Date().toISOString() }]);
>>>>>>> 89342013ec643a72b90a72196e07d8c14d340dca

  fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log('📜 Histórico recebido:', data);
      atualizarHistorico(data);
    })
    .catch(err => {
      console.error('❌ Erro ao carregar histórico:', err);
      mostrarAlerta('Erro ao carregar histórico.', 'error');
    });
}

<<<<<<< HEAD
// 💾 Salva pagamento no histórico via POST
function salvarNoHistorico(nome, valor) {
  return fetch('/salvar-historico', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, valor })
  })
  .then(res => {
    if (!res.ok) throw new Error('Erro ao salvar no histórico.');
    console.log('✅ Histórico salvo');
  });
}
=======
// -------------------- VERIFICAR PAGAMENTO --------------------
>>>>>>> 89342013ec643a72b90a72196e07d8c14d340dca

// 🔍 Verifica status do pagamento e atualiza UI
function verificarPagamento() {
  const txid = $('#txid').val();

  $.post('/verificar', { txid }, async function (data) {
    console.log('📡 RESPOSTA /verificar:', data);

    const statusMap = {
      'ATIVA': 'Aguardando pagamento',
      'CONCLUIDA': 'Pagamento recebido com sucesso',
      'REMOVIDA_PELO_USUARIO_RECEBEDOR': 'Cobrança cancelada',
      'EXPIRADA': 'Cobrança expirada',
    };

    const statusRaw = (data.status || '').toUpperCase();
    const statusTexto = statusMap[statusRaw] || data.status || 'Desconhecido';
    $('#status').text('Status: ' + statusTexto);

    if (statusRaw === 'CONCLUIDA') {
      pagamentoConcluido = true;
      clearInterval(intervalo);

      mostrarNotificacao('✅ Pagamento confirmado!');
      mostrarAlerta('✅ Pagamento confirmado!', 'success');

      // Tocar som, evitar erro caso o áudio não carregue
      document.getElementById('som-confirmacao')?.play().catch(() => {});

      const nomePagador = data.nome_pagador || 'Pagador não identificado';
      const valorPago = data.valor_pago || $('input[name="valor"]').val();

      await salvarNoHistorico(nomePagador, valorPago);
      carregarHistorico(filtroInicio, filtroFim);

      $('#visualizar-lista').click();

      $('#status').text(`Pagamento confirmado! Pagador: ${nomePagador} | Valor: R$ ${valorPago}`);

      $('#titulo-qrcode, #qrcode, #verificar-btn, #status').fadeOut(200);

      setTimeout(() => {
        $('#cancelar-btn')
          .removeClass('btn-vermelho')
          .addClass('btn-verde btn-pulse')
          .text('🔄 Nova cobrança')
          .fadeIn(200);
      }, 200);
    }
  }).fail(() => {
    mostrarAlerta('Erro ao verificar pagamento.', 'error');
  });
}

<<<<<<< HEAD
// ♻️ Reseta formulário e UI para novo ciclo
=======
// -------------------- RESET FORMULÁRIO --------------------

>>>>>>> 89342013ec643a72b90a72196e07d8c14d340dca
function resetFormulario() {
  clearInterval(intervalo);

  $('#qrcode').fadeOut(100).attr('src', '');
  $('#verificar-btn, #status, #titulo-qrcode, #resultado').fadeOut(100);
  $('#form-cobrar')[0].reset();
  $('#alerta').html('');

  $('#cancelar-btn').fadeOut(100, () => {
    $('#form-cobrar').fadeIn(200);
  });

  pagamentoConcluido = false;
}

<<<<<<< HEAD
// 🚀 Inicialização ao carregar DOM
$(document).ready(() => {
  $('#lista-pix').addClass('escondido');
  $('#ocultar-lista').hide();
  $('#visualizar-lista').show();
  $('#abrir-filtro').hide();

  const hoje = new Date();
  filtroInicio = formatarLocal(criarDataLocal(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate(), 0, 0, 0));
  filtroFim = formatarLocal(criarDataLocal(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate(), 23, 59, 59));

  carregarHistorico(filtroInicio, filtroFim);
=======
// -------------------- CÓDIGO PRINCIPAL --------------------

$(document).ready(function () {
>>>>>>> 89342013ec643a72b90a72196e07d8c14d340dca

// Estado inicial
$('#lista-pix').addClass('escondido');
$('#ocultar-lista').hide();
$('#visualizar-lista').show();
$('#abrir-filtro').hide(); // 🔥 Esconde o botão de filtro inicialmente

  // Configurar datas para hoje (início e fim)
  const hoje = new Date().toISOString().split('T')[0];
  const inicioISO = new Date(hoje + "T00:00:00").toISOString();
  const fimISO = new Date(hoje + "T23:59:59").toISOString();

  // Carregar histórico inicial com filtro do dia
  carregarHistorico(inicioISO, fimISO);

  // FORMULÁRIO - Gerar cobrança
  $('#form-cobrar').on('submit', function (e) {
    e.preventDefault();

    $('#alerta').html('');
    $('#resultado, #qrcode, #verificar-btn').hide();

    const valor = $('input[name="valor"]').val();

    $.post('/cobrar', { valor }, function (data) {
      if (data.qrcode && data.txid) {
        $('#txid').val(data.txid);
        $('#status').text('Aguardando pagamento...');
        $('#qrcode').attr('src', data.qrcode).fadeIn();
        $('#resultado, #verificar-btn').fadeIn();

        $('#cancelar-btn')
          .removeClass('btn-verde btn-pulse')
          .addClass('btn-vermelho')
          .text('❌ Cancelar')
          .fadeIn();

        if (intervalo) clearInterval(intervalo);
        intervalo = setInterval(verificarPagamento, 5000);
      } else {
        mostrarAlerta('Erro ao gerar cobrança.', 'error');
      }
    }).fail(() => {
      mostrarAlerta('Erro na comunicação com o servidor.', 'error');
    });
  });

<<<<<<< HEAD
  $('#cancelar-btn').on('click', () => {
    if (pagamentoConcluido) {
      resetFormulario();
    } else {
      if (confirm("Você tem certeza que deseja cancelar a cobrança?")) {
=======
  // BOTÃO CANCELAR
  $(document).on('click', '#cancelar-btn', function () {
    if (pagamentoConcluido) {
      resetFormulario();
    } else {
      const confirmar = confirm("Você tem certeza que deseja cancelar a cobrança?");
      if (confirmar) {
>>>>>>> 89342013ec643a72b90a72196e07d8c14d340dca
        clearInterval(intervalo);
        resetFormulario();
      }
    }
  });

<<<<<<< HEAD
  $('#visualizar-lista').on('click', () => {
    $('#lista-pix').removeClass('escondido');
    setTimeout(() => $('#lista-pix').addClass('ativo'), 20);

    $('#visualizar-lista').hide();
    $('#ocultar-lista, #abrir-filtro').show();
  });

  $('#ocultar-lista').on('click', () => {
    $('#lista-pix').removeClass('ativo');
    setTimeout(() => $('#lista-pix').addClass('escondido'), 400);

    $('#ocultar-lista, #abrir-filtro').hide();
    $('#visualizar-lista').show();
  });

  $('#abrir-filtro').on('click', () => {
    $('#filtro-datas').addClass('ativo').removeClass('escondido');
    $('#abrir-filtro').hide();
  });

  $('#aplicar-filtro').on('click', () => {
=======
  // BOTÕES OCULTAR / VISUALIZAR LISTA
$('#ocultar-lista').on('click', function () {
  $('#lista-pix').addClass('escondido');
  $('#ocultar-lista').hide();
  $('#visualizar-lista').show();
  $('#abrir-filtro').hide(); // esconde o botão filtrar
});

$('#visualizar-lista').on('click', function () {
  $('#lista-pix').removeClass('escondido');
  $('#visualizar-lista').hide();
  $('#ocultar-lista').show();
  $('#abrir-filtro').show(); // mostra o botão filtrar
});


  // BOTÃO ABRIR FILTRO
  $('#abrir-filtro').on('click', function () {
    $('#filtro-datas').removeClass('escondido');
    $('#abrir-filtro').hide();
  });

  // BOTÃO APLICAR FILTRO (aplica filtro, não oculta)
  $('#aplicar-filtro').on('click', function () {
>>>>>>> 89342013ec643a72b90a72196e07d8c14d340dca
    const dataInicio = $('#data-inicio').val();
    const dataFim = $('#data-fim').val();

    if (!dataInicio || !dataFim) {
      mostrarAlerta('Preencha as duas datas para aplicar o filtro.', 'error');
      return;
    }

<<<<<<< HEAD
    const [anoIni, mesIni, diaIni] = dataInicio.split('-').map(Number);
    const [anoFim, mesFim, diaFim] = dataFim.split('-').map(Number);

    filtroInicio = formatarLocal(criarDataLocal(anoIni, mesIni, diaIni, 0, 0, 0));
    filtroFim = formatarLocal(criarDataLocal(anoFim, mesFim, diaFim, 23, 59, 59));

    carregarHistorico(filtroInicio, filtroFim);
  });

  $('#cancelar-filtro').on('click', () => {
    $('#data-inicio, #data-fim').val('');

    const hoje = new Date();
    filtroInicio = formatarLocal(criarDataLocal(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate(), 0, 0, 0));
    filtroFim = formatarLocal(criarDataLocal(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate(), 23, 59, 59));

    carregarHistorico(filtroInicio, filtroFim);

    $('#filtro-datas').removeClass('ativo');
    setTimeout(() => $('#filtro-datas').addClass('escondido'), 400);
    $('#abrir-filtro').show();
  });

=======
    const inicioFiltro = new Date(dataInicio + "T00:00:00").toISOString();
    const fimFiltro = new Date(dataFim + "T23:59:59").toISOString();

    carregarHistorico(inicioFiltro, fimFiltro);
  });

  // BOTÃO CANCELAR FILTRO (limpa, oculta filtro e recarrega histórico do dia)
  $('#cancelar-filtro').on('click', function () {
    $('#data-inicio').val('');
    $('#data-fim').val('');

    carregarHistorico(inicioISO, fimISO);

    $('#filtro-datas').addClass('escondido');
    $('#abrir-filtro').show();
  });

  // BOTÃO VERIFICAR PAGAMENTO
>>>>>>> 89342013ec643a72b90a72196e07d8c14d340dca
  $('#verificar-btn').on('click', verificarPagamento);
});
