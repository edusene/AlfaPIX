import requests
import qrcode
import base64
from io import BytesIO
from .auth import token_data
from config import *

def criar_cobranca(valor):
    access_token = token_data['access_token']
    client_id = SICOOB_CLIENT_ID
    cert = (SICOOB_CERT_PATH, SICOOB_KEY_PATH)

    url = 'https://api.sicoob.com.br/pix/api/v2/cob'

    payload = {
        "valor": {
            "original": f"{valor}"
        },
        "chave": "03021591000171",
        "solicitacaoPagador": "Alfa Gás",
        "calendario": {
            "expiracao": 3600
        }
    }

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
        'x-sicoob-clientid': client_id
    }

    response = requests.post(url, json=payload, headers=headers, cert=cert)

    if response.status_code == 201:
        data = response.json()
        print("Resposta completa:", data)

        if 'brcode' in data:
            brcode = data['brcode']

            # Gerar QR code a partir do BR code (string oficial do Pix)
            qr_img = qrcode.make(brcode)
            buffered = BytesIO()
            qr_img.save(buffered, format="PNG")

            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            img_base64_str = f"data:image/png;base64,{img_base64}"

            return {
                "txid": data.get('txid', ''),
                "qrcode": img_base64_str
            }
        else:
            raise ValueError("Campo 'brcode' não encontrado na resposta da API.")
    else:
        raise Exception(f"Erro ao criar cobrança: {response.status_code} - {response.text}")
