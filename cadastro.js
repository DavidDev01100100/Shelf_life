/**
 * Cadastro de novos itens protegido por senha.
 *
 * - Os itens novos ficam salvos no localStorage do navegador e são
 *   adicionados ao array global `produtos` (definido em produtos_formatados.js),
 *   então a consulta existente (script.js) os encontra normalmente.
 * - A senha NÃO fica em texto puro: guardamos apenas o hash SHA-256.
 *   Atenção: por ser um site estático (sem servidor), isso é uma barreira
 *   de uso, não segurança real. Veja o README/observações da entrega.
 *
 * Para trocar a senha, gere um novo hash no console do navegador:
 *   crypto.subtle.digest('SHA-256', new TextEncoder().encode('NOVA_SENHA'))
 *     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')))
 * e cole o resultado em SENHA_HASH abaixo.
 */
(function () {
  'use strict';

  const SENHA_HASH = '4b84393185709114058c49590dfb500febcb10dabbd3c12fab54297634da2a7e';
  const STORAGE_KEY = 'shelflife_itens_novos';

  const $ = (id) => document.getElementById(id);

  const modal = $('modalCadastro');
  const formSenha = $('formSenha');
  const formNovoItem = $('formNovoItem');
  const erroSenha = $('erroSenha');
  const erroItem = $('erroItem');
  const okItem = $('okItem');

  // ---------- Utilidades ----------
  function escapeHtml(texto) {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function sha256(texto) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function mostrar(el, mensagem) {
    el.textContent = mensagem;
    el.hidden = false;
  }

  function esconder(...els) {
    els.forEach((el) => {
      el.hidden = true;
      el.textContent = '';
    });
  }

  // ---------- Armazenamento ----------
  function lerSalvos() {
    try {
      const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  }

  function gravarSalvos(lista) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
      return true;
    } catch (e) {
      return false;
    }
  }

  function itemValido(i) {
    return (
      i &&
      Number.isSafeInteger(i.SKU) &&
      typeof i.Descricao === 'string' &&
      Number.isInteger(i.DiasVencer) &&
      i.DiasVencer > 0
    );
  }

  // Carrega os itens cadastrados anteriormente para dentro de `produtos`
  lerSalvos().forEach((item) => {
    const jaExiste = produtos.some((p) => String(p.SKU) === String(item.SKU));
    if (itemValido(item) && !jaExiste) produtos.push(item);
  });

  // ---------- Mostrar/ocultar senha ----------
  const inputSenha = $('senhaCadastro');
  const btnVerSenha = $('btnVerSenha');

  function definirSenhaVisivel(visivel) {
    inputSenha.type = visivel ? 'text' : 'password';
    btnVerSenha.setAttribute('aria-pressed', String(visivel));
    btnVerSenha.setAttribute('aria-label', visivel ? 'Ocultar senha' : 'Mostrar senha');
  }

  btnVerSenha.addEventListener('click', function () {
    definirSenhaVisivel(inputSenha.type === 'password');
    inputSenha.focus();
  });

  // ---------- Modal ----------
  function resetarModal() {
    definirSenhaVisivel(false);
    formSenha.reset();
    formNovoItem.reset();
    esconder(erroSenha, erroItem, okItem);
    formNovoItem.hidden = true;
    formSenha.hidden = false;
  }

  $('btnNovoItem').addEventListener('click', function () {
    resetarModal();
    modal.showModal();
    $('senhaCadastro').focus();
  });

  modal.querySelectorAll('[data-fechar]').forEach((btn) => {
    btn.addEventListener('click', () => modal.close());
  });

  // Sempre que o modal fecha (botão, ESC...), volta a exigir a senha
  modal.addEventListener('close', resetarModal);

  // ---------- Etapa 1: validar senha ----------
  formSenha.addEventListener('submit', async function (event) {
    event.preventDefault();
    esconder(erroSenha);

    if (!window.crypto || !crypto.subtle) {
      mostrar(erroSenha, 'Validação indisponível neste contexto. Abra o site por https ou localhost.');
      return;
    }

    const hashDigitado = await sha256($('senhaCadastro').value);

    if (hashDigitado !== SENHA_HASH) {
      mostrar(erroSenha, 'Senha incorreta.');
      $('senhaCadastro').select();
      return;
    }

    definirSenhaVisivel(false);
    formSenha.reset();
    formSenha.hidden = true;
    formNovoItem.hidden = false;
    $('novoSku').focus();
  });

  // Aceita somente dígitos no SKU
  $('novoSku').addEventListener('input', function (e) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12);
  });

  // ---------- Etapa 2: cadastrar item ----------
  formNovoItem.addEventListener('submit', function (event) {
    event.preventDefault();
    esconder(erroItem, okItem);

    const skuTexto = $('novoSku').value.trim();
    const descricao = $('novaDescricao').value.trim().replace(/\s+/g, ' ');
    const dias = Number($('novosDias').value);

    if (!/^\d{1,12}$/.test(skuTexto) || Number(skuTexto) < 1) {
      return mostrar(erroItem, 'Informe um SKU numérico válido.');
    }
    const sku = Number(skuTexto);

    if (produtos.some((p) => String(p.SKU) === String(sku))) {
      return mostrar(erroItem, 'O SKU ' + sku + ' já está cadastrado.');
    }
    if (descricao.length < 3) {
      return mostrar(erroItem, 'Informe uma descrição com pelo menos 3 caracteres.');
    }
    if (!Number.isInteger(dias) || dias < 1 || dias > 3650) {
      return mostrar(erroItem, 'Informe os dias de shelf life (número inteiro entre 1 e 3650).');
    }

    // Descrição em maiúsculas (padrão da base) e escapada, pois o script.js
    // exibe a descrição via innerHTML.
    const item = {
      SKU: sku,
      Descricao: escapeHtml(descricao.toUpperCase()),
      DiasVencer: dias,
    };

    const salvos = lerSalvos();
    salvos.push(item);
    if (!gravarSalvos(salvos)) {
      return mostrar(erroItem, 'Não foi possível salvar: o armazenamento do navegador está indisponível.');
    }

    produtos.push(item);
    formNovoItem.reset();
    mostrar(okItem, 'Item ' + sku + ' cadastrado com sucesso!');
    $('novoSku').focus();
  });
})();
