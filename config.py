import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env, se estiver em desenvolvimento local
load_dotenv()

# Verifica o ambiente (pode ser "production" ou "development")
ENV = os.getenv("FLASK_ENV", "development")  # Por padrão, assume que é desenvolvimento

# Configurações de SICOOB
SICOOB_CLIENT_ID = '6b5b1caf-76ce-4e60-8169-ba7066b30840'
SICOOB_BASE_URL = 'https://api.sicoob.com.br/pix/api/v2'
SICOOB_PIX_URL = f'{SICOOB_BASE_URL}/pix'

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

# Configurações do Supabase
if ENV == "development":
    # Se for desenvolvimento, carrega o Supabase a partir do .env
    SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://localhost:8000')  # URL local para testes
    SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', 'dev-local-token')  # Token local para testes
else:
    # Em produção (Fly.io), usa as variáveis de ambiente configuradas no Fly.io
    SUPABASE_URL = os.environ.get('SUPABASE_URL')  # Deveria estar configurado no Fly.io
    SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')  # Deveria estar configurado no Fly.io

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("As variáveis de ambiente do Supabase não estão configuradas no Fly.io!")
    
# Configurações do ambiente
ENV = os.environ.get('ENV', 'production')

# Carrega credenciais do usuário DEMO
USER_DEMO = os.environ.get('DEMO_USER')
PASS_DEMO = os.environ.get('DEMO_PASS')

if not USER_DEMO or not PASS_DEMO:
    print("⚠️ Aviso: Credenciais DEMO não configuradas.")

# Carrega credenciais do usuário principal
USER = os.environ.get('USER')
PASS = os.environ.get('PASS')

if not USER or not PASS:
    raise ValueError("❌ As variáveis de ambiente USER e PASS não estão configuradas corretamente!")
