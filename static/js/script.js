let intervalo;
let pagamentoConcluido = false; // Variável para controlar se o pagamento foi concluído
let historicoPagamentos = JSON.parse(localStorage.getItem('historicoPagamentos')) || [];

function atualizarListaPagamentos() {
  const lista = $('#historico-pix');
  lista.empty();

  if (historicoPagamentos.length > 0) {
    historicoPagamentos.forEach(p => {
      lista.append(`
        <li>
          <span>✅ ${p.nome} - R$ ${parseFloat(p.valor).toFixed(2)}</span>
          <small>${p.dataHora}</small>
        </li>
      `);
    });
  } else {
    lista.append('<li style="text-align:center; color: #888;">Nenhum pagamento registrado ainda.</li>');
  }

  $('#lista-pix').fadeIn();
  $('#limpar-lista').show();
}

function salvarHistorico() {
  localStorage.setItem('historicoPagamentos', JSON.stringify(historicoPagamentos));
}

$('#form-cobrar').on('submit', function(e) {
  e.preventDefault();
  $('#alerta').html('');

  // Esconde e limpa o QR code anterior
  $('#qrcode').attr('src', '').hide();
  $('#resultado').hide();

  $('#verificar-btn').hide();
  $('#cancelar-btn')
    .text('Cancelar')
    .removeClass('btn-verde btn-pulse')
    .addClass('btn-vermelho')
    .show();

  $.post('/cobrar', $(this).serialize(), function(data) {
    if (data.qrcode && data.txid) {
      $('#txid').val(data.txid);
      $('#status').text('Aguardando pagamento...');

      // Quando a nova imagem for carregada, exibe com fadeIn
      $('#qrcode')
        .off('load') // remove handlers antigos
        .on('load', function () {
          $('#resultado').fadeIn();
          $('#qrcode').fadeIn();
          $('#verificar-btn').fadeIn();
        })
        .attr('src', data.qrcode);

      if (intervalo) clearInterval(intervalo);
      intervalo = setInterval(verificarPagamento, 5000);
    } else {
      mostrarAlerta('Erro ao gerar cobrança.', 'error');
    }
  }).fail(() => {
    mostrarAlerta('Erro na comunicação com o servidor.', 'error');
  });
});

function verificarPagamento() {
  const txid = $('#txid').val();
  $.post('/verificar', { txid }, function(data) {
    const statusMap = {
      'ATIVA': 'Aguardando pagamento',
      'CONCLUIDA': 'Pagamento recebido com sucesso',
      'REMOVIDA_PELO_USUARIO_RECEBEDOR': 'Cobrança cancelada',
      'EXPIRADA': 'Cobrança expirada',
    };
    const statusTexto = statusMap[data.status] || data.status;
    $('#status').text('Status: ' + statusTexto);

    if (data.status === 'CONCLUIDA') {
      pagamentoConcluido = true; // Marcar como pago
      clearInterval(intervalo);
      mostrarNotificacao('✅ Pagamento confirmado!');
      mostrarAlerta('✅ Pagamento confirmado!', 'success');
      document.getElementById('som-confirmacao').play().catch(() => {});

      let nomePagador = data.nome_pagador || 'Pagador não identificado';
      let cpfPagador = data.cpf_pagador || 'CPF não informado';
      let valorPago = data.valor_pago || 'Valor não informado';
      let horarioPagamento = data.horario_pagamento || 'Horário não informado';

      $('#status').text(`Pagamento confirmado! Pagador: ${nomePagador} | Valor: R$ ${valorPago} | CPF: ${cpfPagador} | Horário: ${horarioPagamento}`);

      const valor = $('input[name="valor"]').val();
      const dataHora = new Date().toLocaleString();

      historicoPagamentos.push({ nome: nomePagador, valor, dataHora });
      salvarHistorico();
      atualizarListaPagamentos();

      // Animação de saída rápida
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

$('#cancelar-btn').on('click', function () {
  if (pagamentoConcluido) {
    // Se o pagamento foi concluído, apenas reseta sem confirmação
    resetFormulario();
  } else {
    // Se o pagamento não foi concluído, pergunta ao usuário
    const confirmarCancelamento = confirm("Você tem certeza que deseja cancelar a cobrança?");
    if (confirmarCancelamento) {
      resetFormulario();
    }
  }
});

function resetFormulario() {
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

  pagamentoConcluido = false; // Reseta o status de pagamento ao cancelar
  setTimeout(function () {
    $('#form-cobrar').fadeIn(200);
  }, 100);
}

$('#limpar-lista').on('click', function () {
  if (confirm("Deseja limpar todo o histórico de pagamentos?")) {
    historicoPagamentos = [];
    salvarHistorico();
    atualizarListaPagamentos();
  }
});

function mostrarAlerta(msg, tipo) {
  $('#alerta').html(`<div class="alert ${tipo}">${msg}</div>`);
}

function mostrarNotificacao(msg) {
  const notif = $('#notificacao-pagamento');
  notif.text(msg).addClass('show');
  setTimeout(() => notif.removeClass('show'), 4000);
}

$(document).ready(() => {
  atualizarListaPagamentos();
});
