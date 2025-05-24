from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from sicoob.pix import criar_cobranca
from sicoob.auth import token_data
from config import *

import requests
from datetime import datetime, timedelta
import traceback
import os

from zoneinfo import ZoneInfo
from dateutil import parser

from supabase import create_client, Client

# Carregar variáveis do ambiente ANTES de criar o cliente
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não estão configuradas no ambiente.")

# Criar o cliente Supabase uma única vez, com as variáveis corretas
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Fuso horário fixo UTC-4 para "America/Manaus"
FUSO = timedelta(hours=-4)

def now_fixed_offset():
    return datetime.utcnow() + FUSO

# Usuários autorizados (idealmente carregar de ambiente ou arquivo seguro)
USUARIOS = {
    'ALFA': '3551',
    'teste': '1234'
}

app = Flask(__name__)
# Ideal: usar variável de ambiente para secret_key em produção
app.secret_key = os.getenv('FLASK_SECRET_KEY', '15112020')
app.permanent_session_lifetime = timedelta(days=365)

def rows_to_list(rows):
    # Supabase já retorna lista de dicts, só retorna direto
    return rows

# ===========================
# ROTAS
# ===========================

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form.get('usuario')
        senha = request.form.get('senha')

        if usuario in USUARIOS and senha == USUARIOS[usuario]:
            session.permanent = True
            session['usuario'] = usuario
            return redirect(url_for('index'))
        else:
            return render_template('login.html', erro='Usuário ou senha incorretos')

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('usuario', None)
    return redirect(url_for('login'))

@app.route('/')
def index():
    if 'usuario' not in session:
        return redirect(url_for('login'))

    usuario = session.get('usuario')
    modo_visualizacao = (usuario == 'teste')
    return render_template('index.html', modo_visualizacao=modo_visualizacao)

# ===========================
# HISTÓRICO
# ===========================

@app.route('/historico')
def historico():
    inicio_str = request.args.get('inicio')
    fim_str = request.args.get('fim')

    try:
        inicio = datetime.strptime(inicio_str, '%Y-%m-%d %H:%M:%S')
        fim = datetime.strptime(fim_str, '%Y-%m-%d %H:%M:%S')
    except Exception as e:
        return jsonify({'error': f'Formato de data inválido: {e}'}), 400

    try:
        response = supabase.from_('historico_pagamentos') \
            .select('nome, valor, dataHora') \
            .gte('dataHora', inicio.isoformat()) \
            .lte('dataHora', fim.isoformat()) \
            .order('dataHora', desc=True) \
            .execute()

        if response.data is None:
            print('Erro na resposta do Supabase:', response)
            return jsonify({'error': 'Erro ao consultar banco'}), 500

        registros = response.data

        resultado = []
        for p in registros:
            iso_str = p['dataHora']  # exemplo: '2025-05-24T21:28:54.941+00:00'
            # Converter para datetime com timezone (UTC)
            dt_utc = parser.parse(iso_str)

            # Converter para horário de Cuiabá
            dt_cuiaba = dt_utc.astimezone(ZoneInfo('America/Cuiaba'))

            # Formatar para string legível
            datahora_formatada = dt_cuiaba.strftime('%d/%m/%Y %H:%M:%S')

            resultado.append({
                'nome': p['nome'],
                'valor': p['valor'],
                'dataHora': datahora_formatada
            })

        return jsonify(resultado)

    except Exception as e:
        print('Erro interno:', e)
        traceback.print_exc()
        return jsonify({'error': 'Erro interno no servidor'}), 500

@app.route('/historico-tudo')
def historico_tudo():
    try:
        response = supabase \
            .from_('historico_pagamentos') \
            .select('id, nome, valor, dataHora') \
            .order('dataHora', desc=True) \
            .execute()

        if response.error:
            raise Exception(response.error.message)

        lista = rows_to_list(response.data)
        return jsonify(lista), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/historico-hoje')
def historico_hoje():
    try:
        agora = now_fixed_offset()
        inicio = agora.replace(hour=0, minute=0, second=0, microsecond=0)
        fim = inicio + timedelta(days=1) - timedelta(seconds=1)

        inicio_str = inicio.strftime('%Y-%m-%d %H:%M:%S')
        fim_str = fim.strftime('%Y-%m-%d %H:%M:%S')

        response = supabase \
            .from_('historico_pagamentos') \
            .select('id, nome, valor, dataHora') \
            .gte('dataHora', inicio_str) \
            .lte('dataHora', fim_str) \
            .order('dataHora', desc=True) \
            .execute()

        if response.error:
            raise Exception(response.error.message)

        lista = rows_to_list(response.data)
        return jsonify(lista), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ===========================
# PIX - COBRANÇA E VERIFICAÇÃO
# ===========================

@app.route('/cobrar', methods=['POST'])
def cobrar():
    try:
        valor = request.form.get('valor')

        if not valor:
            return jsonify({"erro": "Valor não fornecido."}), 400

        try:
            valor_float = float(valor)
        except ValueError:
            return jsonify({"erro": "Valor inválido."}), 400

        valor_formatado = f"{valor_float:.2f}"
        dados = criar_cobranca(valor_formatado)

        if not dados:
            return jsonify({"erro": "Erro ao criar cobrança."}), 400

        return jsonify(dados), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"erro": str(e)}), 500

@app.route('/verificar', methods=['POST'])
def verificar():
    try:
        txid = request.form.get('txid')

        if not txid:
            return jsonify({"erro": "TXID não fornecido."}), 400

        access_token = token_data['access_token']
        client_id = SICOOB_CLIENT_ID
        cert = (SICOOB_CERT_PATH, SICOOB_KEY_PATH)

        url = f'https://api.sicoob.com.br/pix/api/v2/cob/{txid}'

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'x-sicoob-clientid': client_id
        }

        response = requests.get(url, headers=headers, cert=cert, timeout=10)
        print(f"🔁 Código resposta Sicoob: {response.status_code}")
        print("📝 Conteúdo:", response.text)

        if response.status_code == 200:
            data = response.json()
            status = data.get('status')
            retorno = {
                "status": status,
                "txid": data.get("txid"),
                "valor": data.get("valor", {}).get("original", "Não informado"),
                "solicitacaoPagador": data.get("solicitacaoPagador", "Não informado"),
                "brcode": data.get("brcode")
            }

            if status == "CONCLUIDA" and data.get("pix"):
                pix_info = data["pix"][0]
                pagador = pix_info.get("pagador", {})

                retorno.update({
                    "nome_pagador": pagador.get("nome", "Pagador não identificado"),
                    "cpf_pagador": pagador.get("cpf", "CPF não informado"),
                    "valor_pago": pix_info.get("valor", "Valor não informado"),
                    "horario_pagamento": pix_info.get("horario", "Horário não informado")
                })

            return jsonify(retorno), 200

        else:
            return jsonify({
                "erro": f"Erro ao consultar cobrança: {response.status_code}",
                "detalhes": response.text
            }), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({"erro": str(e)}), 500

# ===========================
# SALVAR HISTÓRICO
# ===========================

@app.route('/salvar-historico', methods=['POST'])
def salvar_historico():
    try:
        dados = request.get_json()
        print('🟨 Dados recebidos:', dados)  # Debug útil

        nome = dados.get('nome')
        valor = dados.get('valor')
        dataHora = dados.get('dataHora')

        if not nome or not valor or not dataHora:
            return jsonify({'error': 'Dados incompletos'}), 400

        response = supabase.from_('historico_pagamentos').insert([{
            'nome': nome,
            'valor': valor,
            'dataHora': dataHora
        }]).execute()

        if response.data is None or len(response.data) == 0:
            print('❌ Erro na resposta do Supabase:', response)
            return jsonify({'error': 'Erro ao salvar no banco de dados'}), 500

        return jsonify({'message': 'Salvo com sucesso'}), 200

    except Exception as e:
        print('❌ Erro ao salvar no histórico:', e)
        return jsonify({'error': str(e)}), 500

# ===========================
# MAIN
# ===========================

if __name__ == '__main__':
    app.run(debug=True)
