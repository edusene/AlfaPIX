let intervalo;
let pagamentoConcluido = false;

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

  if (error) {
    console.error('❌ ERRO ao carregar histórico:', error);
    mostrarAlerta('Erro ao carregar histórico.', 'error');
    return;
  }

  if (data.length > 0) {
    data.forEach(p => {
      lista.append(`
        <li>
          <span>✅ ${p.nome} - R$ ${parseFloat(p.valor).toFixed(2)}</span>
          <small>${new Date(p.dataHora).toLocaleString()}</small>
        </li>
      `);
    });
  } else {
    lista.append('<li style="text-align:center; color:#888;">Nenhum pagamento registrado neste período.</li>');
  }
}

// -------------------- SALVAR NO HISTÓRICO --------------------

async function salvarNoHistorico(nome, valor) {
  const { error } = await supabase
    .from('historico_pagamentos')
    .insert([{ nome, valor, dataHora: new Date().toISOString() }]);

  if (error) {
    console.error('❌ ERRO Supabase:', error);
    mostrarAlerta('Erro ao salvar no Supabase.', 'error');
  } else {
    console.log('✅ SUPABASE: Pagamento salvo com sucesso');
  }
}

// -------------------- VERIFICAR PAGAMENTO --------------------

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
      console.log('✅ Pagamento concluído detectado!');

      pagamentoConcluido = true;
      clearInterval(intervalo);

      mostrarNotificacao('✅ Pagamento confirmado!');
      mostrarAlerta('✅ Pagamento confirmado!', 'success');
      document.getElementById('som-confirmacao').play().catch(() => {});

      const nomePagador = data.nome_pagador || 'Pagador não identificado';
      const valorPago = $('input[name="valor"]').val();

      await salvarNoHistorico(nomePagador, valorPago);
      await carregarHistorico();

      $('#status').text(`Pagamento confirmado! Pagador: ${nomePagador} | Valor: R$ ${valorPago}`);

      $('#titulo-qrcode').fadeOut(200);
      $('#qrcode').fadeOut(200);
      $('#verificar-btn').fadeOut(200);
      $('#status').fadeOut(200);

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

// -------------------- RESET FORMULÁRIO --------------------

function resetFormulario() {
  clearInterval(intervalo);

  $('#qrcode').fadeOut(100).attr('src', '');
  $('#verificar-btn').fadeOut(100);
  $('#status').fadeOut(100);
  $('#titulo-qrcode').fadeOut(100);
  $('#resultado').fadeOut(100);

  $('#form-cobrar')[0].reset();
  $('#alerta').html('');

  $('#cancelar-btn').fadeOut(100, function () {
    $('#form-cobrar').fadeIn(200);
  });

  pagamentoConcluido = false;
}

// -------------------- CÓDIGO PRINCIPAL --------------------

$(document).ready(function () {

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
    $('#resultado').hide();
    $('#qrcode').attr('src', '').hide();
    $('#verificar-btn').hide();

    const valor = $('input[name="valor"]').val();

    $.post('/cobrar', { valor: valor }, function (data) {
      console.log('Resposta do servidor:', data);

      if (data.qrcode && data.txid) {
        $('#txid').val(data.txid);
        $('#status').text('Aguardando pagamento...');
        $('#qrcode').attr('src', data.qrcode).fadeIn();
        $('#resultado').fadeIn();
        $('#verificar-btn').fadeIn();

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
    }).fail(function () {
      mostrarAlerta('Erro na comunicação com o servidor.', 'error');
    });
  });

  // BOTÃO CANCELAR
  $(document).on('click', '#cancelar-btn', function () {
    if (pagamentoConcluido) {
      resetFormulario();
    } else {
      const confirmar = confirm("Você tem certeza que deseja cancelar a cobrança?");
      if (confirmar) {
        clearInterval(intervalo);
        resetFormulario();
      }
    }
  });

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
    const dataInicio = $('#data-inicio').val();
    const dataFim = $('#data-fim').val();

    if (!dataInicio || !dataFim) {
      mostrarAlerta('Preencha as duas datas para aplicar o filtro.', 'error');
      return;
    }

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
  $('#verificar-btn').on('click', verificarPagamento);
});
