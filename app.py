from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from sicoob.pix import criar_cobranca
from sicoob.auth import token_data
from config import *

import requests
import sqlite3
from datetime import datetime, timedelta
import traceback
import os

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

# Banco de dados
def get_db_connection():
    conn = sqlite3.connect('historico.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS historico_pagamentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                valor REAL NOT NULL,
                dataHora TEXT NOT NULL,
                status TEXT
            )
        ''')
        conn.commit()

init_db()

def rows_to_list(rows):
    return [{
        'id': row['id'],
        'nome': row['nome'],
        'valor': row['valor'],
        'dataHora': row['dataHora']
    } for row in rows]

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
    try:
        inicio = request.args.get('inicio')
        fim = request.args.get('fim')

        if not inicio or not fim:
            return jsonify({"error": "Parâmetros 'inicio' e 'fim' são obrigatórios."}), 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, nome, valor, dataHora
                FROM historico_pagamentos
                WHERE dataHora BETWEEN ? AND ?
                ORDER BY dataHora DESC
            """, (inicio, fim))
            rows = cursor.fetchall()

        lista = rows_to_list(rows)
        return jsonify(lista), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/historico-tudo')
def historico_tudo():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, nome, valor, dataHora
                FROM historico_pagamentos
                ORDER BY dataHora DESC
            """)
            rows = cursor.fetchall()

        lista = rows_to_list(rows)
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

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, nome, valor, dataHora
                FROM historico_pagamentos
                WHERE dataHora BETWEEN ? AND ?
                ORDER BY dataHora DESC
            """, (inicio_str, fim_str))
            rows = cursor.fetchall()

        lista = rows_to_list(rows)
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
        nome = dados.get('nome')
        valor = dados.get('valor')

        if not nome or valor is None:
            return jsonify({"error": "Nome e valor são obrigatórios."}), 400

        try:
            valor_float = float(valor)
        except ValueError:
            return jsonify({"error": "Valor inválido."}), 400

        data_hora = now_fixed_offset().strftime('%Y-%m-%d %H:%M:%S')

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO historico_pagamentos (nome, valor, dataHora)
                VALUES (?, ?, ?)
            """, (nome, valor_float, data_hora))
            conn.commit()

        print(f"[DEBUG] Histórico salvo: {nome} - {valor_float} - {data_hora}")

        return jsonify({"status": "ok"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ===========================
# MAIN
# ===========================

if __name__ == '__main__':
    app.run(debug=False)
