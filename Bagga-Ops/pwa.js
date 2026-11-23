/* Bagga Ops — ligação ao Firebase, entrada com código de acesso e registo da PWA */
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const limpa = s => String(s || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');

  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));

  function ecra(html) { const app = $('#app'); app.dataset.v = 'login'; app.innerHTML = `<div class="card" style="max-width:420px;margin:30px auto;padding:22px">${html}</div>`; }
  function erro(msg) { const e = $('#lg-err'); if (e) { e.textContent = msg; e.hidden = false; } }

  window.APP_READY = (async () => {
    const cfg = window.FIREBASE_CONFIG || {};
    if (!window.firebase || !cfg.apiKey || cfg.apiKey === 'COLA_AQUI') {
      ecra(`<h2 style="margin-top:0">Falta configurar</h2><p class="muted">Abre o ficheiro <b>config.js</b> e cola a configuração do teu projeto Firebase.</p>`);
      return new Promise(() => {});
    }
    firebase.initializeApp(cfg);
    const auth = firebase.auth(), fs = firebase.firestore();
    try { await fs.enablePersistence({ synchronizeTabs: true }); } catch (e) {}
    ecra('<div class="loading">A ligar…</div>');
    try { if (!auth.currentUser) await auth.signInAnonymously(); }
    catch (e) { ecra(`<h2 style="margin-top:0">Não foi possível ligar</h2><p class="muted">Confirma a ligação à internet. Se o erro continuar, ativa o início de sessão <b>Anónimo</b> no Firebase (Authentication).</p><p class="muted" style="font-size:12px">${esc(e.code || e.message)}</p>`); return new Promise(() => {}); }
    const uid = auth.currentUser.uid;

    async function sessaoValida() {
      const s = await fs.doc('sessoes/' + uid).get().catch(() => null);
      if (!s || !s.exists) return null;
      const c = await fs.doc('codigos/' + s.data().codigo).get().catch(() => null);
      if (!c || !c.exists) return null;
      return { ...s.data(), papel: c.data().papel, nomeCodigo: c.data().nome, lojaId: c.data().lojaId || null };
    }
    let sess = await sessaoValida();
    if (!sess) {
      const inst = await fs.doc('config/instalado').get().catch(() => null);
      sess = await new Promise(resolve => {
        if (!inst || !inst.exists) {
          ecra(`<h2 style="margin-top:0">Configuração inicial</h2>
            <p class="muted" style="margin-top:-6px">Cria o teu código de responsável. É com ele que entras e que geres os códigos das lojas.</p>
            <label class="f">O teu nome</label><input type="text" id="lg-n" placeholder="Nome e apelido">
            <label class="f">Código de responsável (mín. 6 letras/números)</label><input type="text" id="lg-c" placeholder="ex.: VALTER-2026" autocapitalize="characters">
            <div class="aviso" id="lg-err" hidden style="margin-top:10px"></div>
            <div class="row mt"><span class="sp"></span><button class="btn pri" id="lg-ok">Começar</button></div>`);
          $('#lg-ok').onclick = async () => {
            const nome = $('#lg-n').value.trim(), cod = limpa($('#lg-c').value);
            if (!nome) return erro('Escreve o teu nome.');
            if (cod.length < 6) return erro('O código tem de ter pelo menos 6 letras ou números.');
            $('#lg-ok').disabled = true;
            try {
              const b = fs.batch(); const agora = new Date().toISOString();
              b.set(fs.doc('codigos/' + cod), { papel: 'admin', nome: 'Responsável · ' + nome, criadoEm: agora });
              b.set(fs.doc('config/instalado'), { em: agora });
              b.set(fs.doc('sessoes/' + uid), { codigo: cod, nome, em: agora });
              await b.commit();
              resolve(await sessaoValida());
            } catch (e) { $('#lg-ok').disabled = false; erro('Não foi possível guardar (' + (e.code || e.message) + '). Confirma as regras do Firestore.'); }
          };
        } else {
          ecra(`<h2 style="margin-top:0">Bagga Ops</h2>
            <p class="muted" style="margin-top:-6px">Introduz o código de acesso que recebeste do teu responsável.</p>
            <label class="f">Código de acesso</label><input type="text" id="lg-c" placeholder="ex.: K7QM-3XPA" autocapitalize="characters" style="font-family:monospace;font-size:18px;letter-spacing:.06em">
            <label class="f">O teu nome</label><input type="text" id="lg-n" placeholder="Nome e apelido">
            <div class="aviso" id="lg-err" hidden style="margin-top:10px"></div>
            <div class="row mt"><span class="sp"></span><button class="btn pri" id="lg-ok">Entrar</button></div>`);
          const go = async () => {
            const cod = limpa($('#lg-c').value), nome = $('#lg-n').value.trim();
            if (!cod) return erro('Escreve o código.');
            if (!nome) return erro('Escreve o teu nome.');
            $('#lg-ok').disabled = true;
            try {
              const c = await fs.doc('codigos/' + cod).get();
              if (!c.exists) { $('#lg-ok').disabled = false; return erro('Código inválido. Confirma com o teu responsável.'); }
              await fs.doc('sessoes/' + uid).set({ codigo: cod, nome, em: new Date().toISOString() });
              resolve(await sessaoValida());
            } catch (e) { $('#lg-ok').disabled = false; erro('Não foi possível entrar (' + (e.code || e.message) + ').'); }
          };
          $('#lg-ok').onclick = go;
          $('#lg-c').addEventListener('keydown', e => { if (e.key === 'Enter') $('#lg-n').focus(); });
          $('#lg-n').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        }
      });
    }
    const admin = sess.papel === 'admin';
    window.SAIR = async () => { try { await fs.doc('sessoes/' + uid).delete(); } catch (e) {} try { await auth.signOut(); } catch (e) {} location.reload(); };
    const cacheNomes = {};
    const user = {
      id: async () => uid,
      isOwner: async () => admin,
      canEdit: async () => admin,
      can: async () => true,
      me: async () => ({ name: sess.nome }),
      search: async () => [],
      profiles: async ids => {
        const out = {};
        await Promise.all(ids.map(async id => {
          if (!(id in cacheNomes)) { try { const d = await fs.doc('sessoes/' + id).get(); cacheNomes[id] = d.exists ? (d.data().nome || '') : ''; } catch (e) { cacheNomes[id] = ''; } }
          out[id] = { name: cacheNomes[id] };
        }));
        return out;
      },
    };
    window.PWA_INFO = { uid, codigo: sess.codigo, papel: sess.papel, nome: sess.nome, lojaId: sess.lojaId, fs };
    window.APP = { use: async n => n === 'db' ? fs : n === 'user' ? user : null };
  })();
})();
