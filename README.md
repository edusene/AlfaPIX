# alfaPIX

*alfaPIX* é uma aplicação web desenvolvida para facilitar a geração e confirmação de pagamentos via *PIX* utilizando a *API do Sicoob*. Criado para agilizar o processo de recebimento no momento da entrega, o sistema oferece rapidez e segurança nas transações financeiras.

## 🔗 Acesso ao Projeto

Acesse a aplicação em produção:

*[https://alfapix.fly.dev](https://alfapix.fly.dev)*

## 🧪 Modo de Visualização (Demo)

Você pode testar a aplicação com as seguintes credenciais:

- *Usuário:* teste  
- *Senha:* 1234

> Esse modo é apenas para fins de demonstração. As funcionalidades de cobrança e confirmação estão disponíveis apenas para usuários autorizados.

## 👥 Acesso Real

O acesso completo ao sistema é exclusivo para entregadores cadastrados, que podem gerar cobranças personalizadas e confirmar pagamentos via Pix em tempo real.

## 🚀 Funcionalidades

- Autenticação de entregadores  
- Geração de cobranças via PIX (Sicoob)  
- Exibição instantânea de QR Code para pagamento  
- Confirmação automática de transações em tempo real  
- Interface responsiva, otimizada para uso em campo

## 🛠️ Tecnologias Utilizadas

- *Frontend:* HTML, CSS, JavaScript  
- *Backend:* Python (Flask)  
- *Banco de Dados:* [Supabase](https://supabase.io/)  
- *API de Pagamento:* PIX via Sicoob  
- *Deploy:* Fly.io

## ⚙️ Como Rodar Localmente

1. Clone o repositório:

   ```bash
   git clone https://github.com/edusene/alfaPIX.git
   cd alfaPIX

2. Crie e ative um ambiente virtual:

python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate


3. Instale as dependências:

pip install -r requirements.txt


4. Configure as variáveis de ambiente (.env) com suas credenciais:

Supabase URL e chave pública

Dados da API do Sicoob

Secret key do Flask

Usuário/senha do modo demo (se desejar)



5. Execute a aplicação:

flask run



Acesse localmente em http://localhost:5000.

📄 Licença

Este projeto está sob a licença MIT.