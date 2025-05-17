import requests
from config import *

# Endpoint de token da API Sicoob (ajuste para sandbox se necessário)
token_url = 'https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token'

# Escopos necessários
scopes = (
    "pix.write "
    "payloadlocation.write "
    "pix.read "
    "webhook.write "
    "cob.write "
    "lotecobv.write "
    "cob.read "
    "webhook.read "
    "cobv.read "
    "cobv.write "
    "lotecobv.read "
    "payloadlocation.read"
)

# Corpo da requisição
data = {
    'grant_type': 'client_credentials',
    'client_id': SICOOB_CLIENT_ID,
    'scope': scopes
}

# Requisição POST usando certificado (mTLS)
response = requests.post(
    token_url,
    data=data,
    cert=(SICOOB_CERT_PATH, SICOOB_KEY_PATH),
    headers={'Content-Type': 'application/x-www-form-urlencoded'}
)

# Verificando resposta
if response.status_code == 200:
    token_data = response.json()
    print("✅ Access Token obtido com sucesso:")
    print(token_data['access_token'])
else:
    print("❌ Erro ao obter token:", response.status_code)
    print(response.text)
