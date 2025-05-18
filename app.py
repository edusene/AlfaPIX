from flask import Flask, render_template, request, jsonify
from sicoob.pix import criar_cobranca
from config import *
from sicoob.auth import token_data
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/cobrar', methods=['POST'])
def cobrar():
    try:
        # Pegando o valor diretamente do formulário
        valor = request.form.get('valor')

        # Verificando se o valor foi fornecido
        if not valor:
            return jsonify({"erro": "Valor não fornecido."}), 400

        # Tentando converter o valor para float
        try:
            valor_float = float(valor)
        except ValueError:
            return jsonify({"erro": "Valor inválido."}), 400

        valor_formatado = f"{valor_float:.2f}"

        # Chama a função de criação da cobrança
        dados = criar_cobranca(valor_formatado)

        if not dados:
            return jsonify({"erro": "Erro ao criar cobrança."}), 400

        # Retorna os dados da cobrança
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
            status = data.get('status')
            retorno = {
                "status": status,
                "txid": data.get("txid"),
                "valor": data.get("valor", {}).get("original", "Não informado"),
                "solicitacaoPagador": data.get("solicitacaoPagador", "Não informado"),
                "brcode": data.get("brcode")
            }

            # Se a cobrança foi paga e há informações no campo 'pix'
            if status == "CONCLUIDA" and data.get("pix"):
                pix_info = data["pix"][0]
                pagador = pix_info.get("pagador", {})

                # Verificar se o pagador existe e obter o nome
                nome_pagador = pagador.get("nome", "Pagador não identificado")
                cpf_pagador = pagador.get("cpf", "CPF não informado")

                # Adiciona as informações ao retorno
                retorno.update({
                    "nome_pagador": nome_pagador,
                    "cpf_pagador": cpf_pagador,
                    "valor_pago": pix_info.get("valor", "Valor não informado"),
                    "horario_pagamento": pix_info.get("horario", "Horário não informado")
                })

            return jsonify(retorno)

        else:
            return jsonify(
                {"erro": f"Erro ao consultar cobrança: {response.status_code}", "detalhes": response.text}), 400

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"erro": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
