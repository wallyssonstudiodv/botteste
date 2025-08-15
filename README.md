# WhatsApp Bot - Gerenciador de Anúncios

Bot WhatsApp com painel PHP para criar, editar e enviar anúncios automaticamente para grupos selecionados. O bot respeita um intervalo de 2 horas por grupo e suporta texto, imagem e vídeo.

---

## **Funcionalidades**

- Conexão via WhatsApp usando Baileys  
- Login via QR Code no terminal do Termux  
- Painel PHP 100% mobile-friendly (modo noturno azul/vermelho)  
- Criar, editar e ativar/desativar anúncios  
- Cada anúncio pode ter texto, imagem ou vídeo  
- Lista de grupos disponíveis para envio  
- Disparo automático ao receber qualquer mensagem nos grupos selecionados  
- Intervalo de 2 horas por grupo entre envios  
- Encerrar sessão para reconectar WhatsApp  

---

## **Requisitos**

- Android com Termux instalado  
- PHP  
- Node.js  
- Git (opcional, para clonar projeto)  

---

## **Instalação no Termux**

1. Atualizar e instalar pacotes necessários:

```bash
pkg update && pkg upgrade -y
pkg install php nodejs git wget -y
```

2. Criar diretório do projeto:

```bash
mkdir botteste
cd botteste
```

3. Colocar **todos os arquivos do projeto** (`index.php`, `login.php`, `logout.php`, `bot.js`, `login.js`, `anuncios.json`, `grupos.json`, `package.json`) na pasta do projeto.

4. Instalar dependências Node.js:

```bash
npm install
```

---

## **Configuração inicial**

1. Rodar login e escanear QR Code:

```bash
npm run login
```

> O QR Code será exibido no terminal do Termux. Escaneie com o WhatsApp para conectar.

2. Após conectar, iniciar o bot automático:

```bash
npm start
```

3. Rodar servidor PHP para painel de gerenciamento:

```bash
php -S 0.0.0.0:8080
```

- Acesse no navegador do celular: `http://127.0.0.1:8080/index.php`

---

## **Como usar**

1. No painel PHP:
   - Criar novos anúncios (título, mensagem e link de mídia opcional)  
   - Ativar ou desativar anúncios  
   - Visualizar anúncios existentes  
   - Visualizar grupos disponíveis  

2. O bot dispara anúncios automaticamente ao **receber mensagens nos grupos selecionados**, respeitando **intervalo de 2 horas por grupo**.

3. Para encerrar a sessão e reconectar WhatsApp, clique em **Encerrar Sessão** no painel PHP.

---

## **Estrutura de arquivos**

```
botteste/
├── anuncios.json      # Armazena anúncios criados
├── grupos.json        # Lista de grupos monitorados
├── index.php          # Painel principal
├── login.php          # Página de login WhatsApp
├── logout.php         # Encerrar sessão
├── bot.js             # Bot automático com intervalo de 2h
├── login.js           # Gera QR Code no Termux
├── package.json       # Dependências Node.js e scripts
```

---

## **Customização**

- Alterar intervalo de envio por grupo: edite `INTERVALO` em `bot.js`  
- Adicionar novos grupos: edite `grupos.json` com ID e nome do grupo  
- Estilo do painel: CSS inline nos arquivos PHP, modo noturno azul/vermelho  

---

## **Observações**

- Cada grupo tem controle **separado de 2 horas**  
- Suporta envio de **texto, imagens (.jpg, .png, .gif) e vídeos (.mp4, .mov, .webm)**  
- É recomendado usar **Termux com `termux-wake-lock`** para manter o bot ativo