from flask import Flask, render_template, request, jsonify
from sicoob.pix import criar_cobranca  # ajuste conforme seu código
from config import *
from sicoob.auth import token_data
import requests
import sys
sys.path.append(r'/')

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cobrar', methods=['POST'])
def cobrar():
    try:
        valor = request.form.get('valor')
        valor_float = float(valor)
        valor_formatado = f"{valor_float:.2f}"
        dados = criar_cobranca(valor_formatado)
        return jsonify(dados)
    except Exception as e:
        return jsonify({"erro": str(e)}), 400

@app.route('/verificar', methods=['POST'])
def verificar():
    try:
        txid = request.form.get('txid')
        if not txid:
            return jsonify({"erro": "TXID não fornecido"}), 400

        access_token = token_data['access_token']
        client_id = SICOOB_CLIENT_ID
        cert = (SICOOB_CERT_PATH, SICOOB_KEY_PATH)

        url = f'https://api.sicoob.com.br/pix/api/v2/cob/{txid}'

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'x-sicoob-clientid': client_id
        }

        response = requests.get(url, headers=headers, cert=cert)
        print(f"🔁 Código de resposta Sicoob: {response.status_code}")
        print("📝 Conteúdo:", response.text)

        if response.status_code == 200:
            data = response.json()
            status = data.get('status') or data.get('cob', {}).get('status')
            return jsonify({"status": status})
        else:
            return jsonify({"erro": f"Erro ao consultar cobrança: {response.status_code}", "detalhes": response.text}), 400

    except Exception as e:
        import traceback
        traceback.print_exc()  # log completo no terminal
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
