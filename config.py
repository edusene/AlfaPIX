# config.py
import os

SICOOB_CLIENT_ID = '6b5b1caf-76ce-4e60-8169-ba7066b30840'
SICOOB_BASE_URL = 'https://api.sicoob.com.br/pix/api/v2'
SICOOB_PIX_URL = f'{SICOOB_BASE_URL}/pix'
SICOOB_WEBHOOK_URL = 'https://seuservidor.com/webhook'

# Pega os certificados dos secrets do Fly.io via variáveis de ambiente
SSL_CERT = os.environ.get('SSL_CERT')
SSL_KEY = os.environ.get('SSL_KEY')

if SSL_CERT and SSL_KEY:
    # Se estiver rodando no Fly.io, salva os arquivos temporários no /tmp (mais seguro)
    cert_path = '/tmp/certificado.pem'
    key_path = '/tmp/chave.pem'

    # Só cria os arquivos se não existirem (para evitar reescrita constante)
    if not os.path.exists(cert_path):
        with open(cert_path, 'w') as cert_file:
            cert_file.write(SSL_CERT)

    if not os.path.exists(key_path):
        with open(key_path, 'w') as key_file:
            key_file.write(SSL_KEY)

    SICOOB_CERT_PATH = cert_path
    SICOOB_KEY_PATH = key_path

else:
    # Caso local, usa os arquivos .pem locais
    SICOOB_CERT_PATH = 'certificado.pem'
    SICOOB_KEY_PATH = 'chave.pem'

'''
SICOOB_CLIENT_ID = '6b5b1caf-76ce-4e60-8169-ba7066b30840'
SICOOB_BASE_URL = 'https://api.sicoob.com.br/pix/api/v2'
SICOOB_PIX_URL = f'{SICOOB_BASE_URL}/pix'
SICOOB_CERT_PATH = 'certificado.pem'
SICOOB_KEY_PATH = 'chave.pem'
SICOOB_WEBHOOK_URL = 'https://seuservidor.com/webhook'
'''