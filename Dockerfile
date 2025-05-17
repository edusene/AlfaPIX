# Etapa 1: Escolher a imagem base do Python
FROM python:3.10-slim

# Etapa 2: Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Etapa 3: Copiar o arquivo de dependências (requirements.txt)
COPY requirements.txt .

# Etapa 4: Instalar as dependências listadas no requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Etapa 5: Copiar o restante dos arquivos do seu projeto para dentro do contêiner
COPY . .

# Defina a variável de ambiente para a porta
ENV PORT=8080

# Comando para rodar o Flask com Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]







