# Bagga Ops — app de apoio às lojas (PWA)

Fotos diárias, inventários, quebras de caixa, equipamentos e palamenta.
Funciona no telemóvel como uma app, **sem conta Claude**: cada loja entra com um código.

---

## 1. Firebase (dados e fotos) — uma vez, ~15 min

1. Entra em https://console.firebase.google.com com a tua conta Google e carrega em **Criar projeto** → nome `bagga-ops` → podes desligar o Google Analytics → **Criar**.
2. **Authentication** → **Começar** → separador **Método de início de sessão** → **Anónimo** → **Ativar** → **Guardar**.
3. **Firestore Database** → **Criar base de dados** → localização **europe-west1 (Bélgica)** → **Iniciar no modo de produção** → **Criar**.
4. Ainda no Firestore, separador **Regras**: apaga tudo, cola o conteúdo do ficheiro `firestore.rules` e carrega em **Publicar**.
5. Roda dentada ⚙ → **Definições do projeto** → em "As tuas apps" carrega no ícone **</>** (Web) → alcunha `bagga-ops` → **Registar app**.
   Aparece um bloco `const firebaseConfig = { apiKey: "...", ... }`. Copia esses 6 valores para o ficheiro **`config.js`**, no lugar de cada `COLA_AQUI`.

> Não é preciso ativar o *Storage*: as fotos ficam guardadas na própria base de dados, comprimidas.

## 2. GitHub (onde a app fica alojada)

1. No teu repositório `bagga-ops`, carrega em **Add file → Upload files**.
2. Arrasta **todos os ficheiros desta pasta** (incluindo o `config.js` já preenchido) e carrega em **Commit changes**.
3. **Settings → Pages** → em *Source* escolhe **Deploy from a branch** → branch **main**, pasta **/ (root)** → **Save**.
4. Passado ~1 minuto aparece o link, do género `https://O-TEU-UTILIZADOR.github.io/bagga-ops/`.
5. No Firebase: **Authentication → Definições → Domínios autorizados → Adicionar domínio** → `O-TEU-UTILIZADOR.github.io`.

## 3. Primeira entrada (tu)

1. Abre o link. Aparece **Configuração inicial**: escreve o teu nome e cria o teu **código de responsável** (ex.: `VALTER-2026`). Guarda-o bem.
2. **Configurar → Importar dados**: cola os dados copiados na versão Claude (Configurar → *Exportar todos os dados* → *Copiar dados*) e carrega em **Importar**.
3. **Configurar → Códigos de acesso**: cria um código para cada loja (ex.: "Loja Gaia", tipo *Loja*, loja *Gaia*). Envia a cada loja o seu código.

## 4. Nas lojas

1. Abrir o link no telemóvel da loja.
2. **iPhone (Safari):** Partilhar → *Adicionar ao ecrã principal*. **Android (Chrome):** menu ⋮ → *Adicionar ao ecrã principal* / *Instalar app*.
3. Abrir a app pelo ícone, escrever o **código da loja** e o nome. Fica guardado; não volta a pedir.

---

## Notas

- **Segurança:** só entra quem tem um código válido. Apagar um código (Configurar) desliga logo todos os telemóveis que o usam. Os gastos e o Configurar só aparecem com código de responsável.
- **Custos:** o plano gratuito do Firebase (Spark) chega para as 11 lojas. Não pede cartão. O limite é 1 GB de dados (fotos incluídas) — dá para vários meses de fotos diárias.
- **Atualizar a app:** substitui o `index.html` (ou outros ficheiros) no GitHub com *Add file → Upload files*. No `sw.js`, sobe o número da versão (`bagga-ops-v2`, …) para os telemóveis apanharem a versão nova.
- **Não apagues nem partilhes** o `config.js` com outras pessoas fora da Bagga: tem os dados de ligação ao teu projeto (não é uma palavra-passe, mas é a porta de entrada).
