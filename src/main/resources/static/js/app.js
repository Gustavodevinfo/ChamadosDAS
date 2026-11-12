const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = d => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const txt = s => s.replace(/_/g, ' ');
const bp = p => `<span class="badge p-${p}">${p}</span>`;
const bs = s => `<span class="badge s-${s}">${txt(s)}</span>`;
const opts = lista => lista.map(x => [x.id, x.nome]);

const STATUS = ['ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'FECHADO'];
const PRIOR = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const TRANS = { ABERTO: ['EM_ATENDIMENTO', 'FECHADO'], EM_ATENDIMENTO: ['AGUARDANDO_CLIENTE', 'FECHADO'], AGUARDANDO_CLIENTE: ['EM_ATENDIMENTO', 'FECHADO'], FECHADO: [] };
const TAM = 5;
let filtros = { status: '', prioridade: '', clienteId: '' };
let pagina = 0;

const CRUD = {
  clientes: { titulo: 'Clientes', um: 'cliente', campos: [
    { k: 'nome', l: 'Nome', req: 1, max: 100 },
    { k: 'email', l: 'E-mail', type: 'email', req: 1, max: 120 },
    { k: 'telefone', l: 'Telefone', max: 20 }] },
  tecnicos: { titulo: 'Técnicos', um: 'técnico', campos: [
    { k: 'nome', l: 'Nome', req: 1, max: 100 },
    { k: 'email', l: 'E-mail', type: 'email', req: 1, max: 120 },
    { k: 'perfil', l: 'Perfil', req: 1, opts: [['ADMIN', 'ADMIN'], ['TECNICO', 'TECNICO']] }] },
  categorias: { titulo: 'Categorias', um: 'categoria', campos: [
    { k: 'nome', l: 'Nome', req: 1, max: 100 },
    { k: 'descricao', l: 'Descrição', max: 255 }] }
};

function mensagemDeErro(dados, status) {
  if (!dados) return `Erro ${status} ao falar com a API.`;
  const detalhes = (dados.detalhes || []).join(' | ');
  return detalhes ? `${dados.erro}: ${detalhes}` : dados.erro;
}

async function api(url, { method = 'GET', body } = {}) {
  let resp;
  try {
    resp = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('Não foi possível conectar à API. O back-end está rodando?');
  }
  if (resp.status === 204) return null; 
  const dados = await resp.json().catch(() => null);
  if (!resp.ok) {
    const e = new Error(mensagemDeErro(dados, resp.status));
    e.status = resp.status;
    throw e;
  }
  return dados;
}

const listar = nome => api(`/${nome}`);

function aviso(m) {
  const t = $('#toast'); t.textContent = m; t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 4000);
}
const fechar = () => $('#modal').classList.remove('aberto');

async function tentar(fn) {
  try { return await fn(); } catch (e) { aviso(e.message); }
}

const campoHtml = (c, v = '') => `<label>${c.l}${c.req ? ' *' : ''}${
  c.opts
    ? `<select name="${c.k}" ${c.req ? 'required' : ''}><option value="">${c.req ? 'Selecione…' : '— nenhum —'}</option>${c.opts.map(([a, b]) => `<option value="${a}" ${String(a) === String(v ?? '') ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>`
    : c.type === 'textarea'
      ? `<textarea name="${c.k}" rows="4" ${c.req ? 'required' : ''}>${esc(v)}</textarea>`
      : `<input name="${c.k}" type="${c.type || 'text'}" value="${esc(v)}" maxlength="${c.max || 150}" ${c.req ? 'required' : ''}>`
}</label>`;

function modal(titulo, campos, valores, onSubmit) {
  $('#modal').innerHTML = `<div class="caixa"><h3>${titulo}</h3><form>${campos.map(c => campoHtml(c, valores[c.k])).join('')}
    <div class="acoes"><button type="button" class="btn sec" data-a="fechar">Cancelar</button><button class="btn">Salvar</button></div></form></div>`;
  $('#modal').classList.add('aberto');
  const f = $('#modal form');
  f.onsubmit = async e => {
    e.preventDefault();
    try {
      await onSubmit(Object.fromEntries(new FormData(f)));
      fechar();
    } catch (err) {
      aviso(err.message); 
    }
  };
}

async function dashboard() {

  const [recentes, ...porStatus] = await Promise.all([
    api('/chamados?size=5&sort=dataAbertura,desc'),
    ...STATUS.map(s => api(`/chamados?status=${s}&size=1`))
  ]);
  $('#view').innerHTML = `<div class="topo"><h1>Dashboard</h1></div>
    <div class="numeros"><div class="card"><b>${recentes.totalElementos}</b><span>Total</span></div>
    ${STATUS.map((s, i) => `<div class="card"><b>${porStatus[i].totalElementos}</b><span>${txt(s)}</span></div>`).join('')}</div>
    <div class="card"><h3>Últimos chamados</h3>${tabelaChamados(recentes.conteudo)}</div>`;
}

function tabelaChamados(lista) {
  return `<table><thead><tr><th>ID</th><th>Título</th><th>Cliente</th><th>Prioridade</th><th>Status</th><th>Técnico</th><th>Abertura</th></tr></thead><tbody>${
    lista.map(c => `<tr><td>${c.id}</td><td><a href="#/chamado/${c.id}">${esc(c.titulo)}</a></td><td>${esc(c.clienteNome)}</td><td>${bp(c.prioridade)}</td><td>${bs(c.status)}</td><td>${esc(c.tecnicoNome)}</td><td>${fmt(c.dataAbertura)}</td></tr>`).join('')
    || '<tr><td colspan="7" class="vazio">Nenhum chamado encontrado.</td></tr>'}</tbody></table>`;
}

async function chamados() {
  const params = new URLSearchParams({ page: pagina, size: TAM, sort: 'dataAbertura,desc' });
  for (const [k, v] of Object.entries(filtros)) if (v) params.set(k, v);

  const [resp, clientes] = await Promise.all([api(`/chamados?${params}`), listar('clientes')]);

  if (resp.totalPaginas > 0 && pagina >= resp.totalPaginas) { pagina = resp.totalPaginas - 1; return chamados(); }

  const tp = Math.max(1, resp.totalPaginas);
  const f = filtros;
  const sel = (k, rotulo, arr) => `<select data-f="${k}"><option value="">${rotulo}</option>${arr.map(([v, t]) => `<option value="${v}" ${String(v) === String(f[k]) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  $('#view').innerHTML = `<div class="topo"><h1>Chamados</h1><button class="btn" data-a="novo-chamado">+ Novo chamado</button></div>
    <div class="card"><div class="filtros">
      ${sel('status', 'Todos os status', STATUS.map(s => [s, txt(s)]))}
      ${sel('prioridade', 'Todas as prioridades', PRIOR.map(p => [p, p]))}
      ${sel('clienteId', 'Todos os clientes', opts(clientes))}
      <button class="btn sec" data-a="limpar">Limpar</button></div>
      ${tabelaChamados(resp.conteudo)}
      <div class="pag"><button class="btn sec" data-a="pag" data-d="-1" ${pagina === 0 ? 'disabled' : ''}>←</button>
      <span>Página ${pagina + 1} de ${tp} (${resp.totalElementos} chamados)</span>
      <button class="btn sec" data-a="pag" data-d="1" ${pagina >= tp - 1 ? 'disabled' : ''}>→</button></div></div>`;
}

async function formChamado(id) {
  const [it, clientes, categorias, tecnicos] = await Promise.all([
    id ? api(`/chamados/${id}`) : {},
    listar('clientes'), listar('categorias'), listar('tecnicos')
  ]);
  const campos = [
    { k: 'titulo', l: 'Título', req: 1, max: 150 },
    { k: 'descricao', l: 'Descrição', req: 1, type: 'textarea' },
    { k: 'prioridade', l: 'Prioridade', req: 1, opts: PRIOR.map(p => [p, p]) },
    { k: 'clienteId', l: 'Cliente', req: 1, opts: opts(clientes) },
    { k: 'categoriaId', l: 'Categoria', req: 1, opts: opts(categorias) },
    { k: 'tecnicoId', l: 'Técnico (opcional)', opts: opts(tecnicos) }
  ];
  modal(id ? 'Editar chamado' : 'Novo chamado', campos, it, async d => {
    const dados = { titulo: d.titulo, descricao: d.descricao, prioridade: d.prioridade, clienteId: +d.clienteId, categoriaId: +d.categoriaId, tecnicoId: d.tecnicoId ? +d.tecnicoId : null };
    if (id) {
      await api(`/chamados/${id}`, { method: 'PUT', body: dados });
      aviso('Chamado atualizado!');
      await detalhe(id);
    } else {
      await api('/chamados', { method: 'POST', body: dados });
      aviso('Chamado criado!');
      await chamados();
    }
  });
}

async function detalhe(id) {
  let c, coms, tecnicos;
  try {
    [c, coms, tecnicos] = await Promise.all([api(`/chamados/${id}`), api(`/chamados/${id}/comentarios`), listar('tecnicos')]);
  } catch (e) {
    if (e.status === 404) { location.hash = '#/chamados'; }
    throw e;
  }
  const fechado = c.status === 'FECHADO';
  $('#view').innerHTML = `<a href="#/chamados" class="voltar">← Voltar</a>
    <div class="topo"><h1>#${c.id} ${esc(c.titulo)}</h1><div>${bp(c.prioridade)}${bs(c.status)}</div></div>
    <div class="grade">
      <div class="card"><h3>Descrição</h3><p>${esc(c.descricao)}</p>
        <dl><dt>Cliente</dt><dd>${esc(c.clienteNome)}</dd>
        <dt>Categoria</dt><dd>${esc(c.categoriaNome)}</dd>
        <dt>Técnico</dt><dd>${esc(c.tecnicoNome)}</dd>
        <dt>Aberto em</dt><dd>${fmt(c.dataAbertura)}</dd>
        <dt>Fechado em</dt><dd>${fmt(c.dataFechamento)}</dd></dl></div>
      <div class="card"><h3>Ações</h3>
        <div class="acoes-linha">${TRANS[c.status].map(s => `<button class="btn sec" data-a="status" data-id="${id}" data-s="${s}">→ ${txt(s)}</button>`).join('') || '<span class="vazio">Chamado fechado: não pode ser alterado.</span>'}</div>
        <form id="fat" class="inline"><select name="t" required><option value="">Atribuir técnico…</option>${opts(tecnicos).map(([v, t]) => `<option value="${v}" ${v === c.tecnicoId ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select><button class="btn" ${fechado ? 'disabled' : ''}>Atribuir</button></form>
        <div class="acoes-linha" style="margin-top:14px"><button class="btn sec" data-a="editar-chamado" data-id="${id}" ${fechado ? 'disabled' : ''}>Editar</button>
        <button class="btn sec" data-a="excluir-chamado" data-id="${id}">Excluir</button></div></div>
    </div>
    <div class="card"><h3>Comentários (${coms.length})</h3>
      ${coms.map(m => `<div class="coment"><small><b>${esc(m.autor)}</b> · ${fmt(m.data)}</small><br>${esc(m.texto)}</div>`).join('') || '<p class="vazio">Sem comentários.</p>'}
      <form id="fcom"><label>Autor *<input name="autor" required maxlength="100"></label><label>Comentário *<textarea name="texto" rows="3" required></textarea></label><button class="btn">Comentar</button></form></div>`;

  $('#fat').onsubmit = e => {
    e.preventDefault();
    const tecnicoId = +e.target.t.value;
    tentar(async () => {
      await api(`/chamados/${id}/atribuir`, { method: 'PATCH', body: { tecnicoId } });
      await detalhe(id);
    });
  };
  $('#fcom').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    tentar(async () => {
      await api(`/chamados/${id}/comentarios`, { method: 'POST', body: { autor: d.autor, texto: d.texto } });
      await detalhe(id);
    });
  };
}

async function mudarStatus(id, status) {
  await api(`/chamados/${id}/status`, { method: 'PATCH', body: { status } });
  await detalhe(id);
}

async function crud(nome) {
  const c = CRUD[nome];
  const itens = await listar(nome);
  $('#view').innerHTML = `<div class="topo"><h1>${c.titulo}</h1><button class="btn" data-a="novo" data-n="${nome}">+ Novo</button></div>
    <div class="card"><table><thead><tr><th>ID</th>${c.campos.map(x => `<th>${x.l}</th>`).join('')}<th></th></tr></thead><tbody>${
      itens.map(i => `<tr><td>${i.id}</td>${c.campos.map(x => `<td>${esc(i[x.k])}</td>`).join('')}<td><button class="link" data-a="ed" data-n="${nome}" data-id="${i.id}">Editar</button><button class="link perigo" data-a="ex" data-n="${nome}" data-id="${i.id}">Excluir</button></td></tr>`).join('')
      || '<tr><td colspan="9" class="vazio">Nenhum registro.</td></tr>'}</tbody></table></div>`;
}

async function formCrud(nome, id) {
  const c = CRUD[nome];
  const it = id ? await api(`/${nome}/${id}`) : {};
  modal((id ? 'Editar ' : 'Novo ') + c.um, c.campos, it, async d => {
    await api(id ? `/${nome}/${id}` : `/${nome}`, { method: id ? 'PUT' : 'POST', body: d });
    await crud(nome);
    aviso('Salvo!');
  });
}

async function excluirCrud(nome, id) {
  if (!confirm('Excluir este registro?')) return;
  await api(`/${nome}/${id}`, { method: 'DELETE' }); 
  await crud(nome);
}

const ACOES = {
  fechar,
  'novo-chamado': () => formChamado(),
  'editar-chamado': b => formChamado(+b.dataset.id),
  'excluir-chamado': async b => {
    if (!confirm('Excluir este chamado?')) return;
    await api(`/chamados/${b.dataset.id}`, { method: 'DELETE' });
    location.hash = '#/chamados';
  },
  status: b => mudarStatus(+b.dataset.id, b.dataset.s),
  pag: b => { pagina = Math.max(0, pagina + +b.dataset.d); return chamados(); },
  limpar: () => { filtros = { status: '', prioridade: '', clienteId: '' }; pagina = 0; return chamados(); },
  novo: b => formCrud(b.dataset.n),
  ed: b => formCrud(b.dataset.n, +b.dataset.id),
  ex: b => excluirCrud(b.dataset.n, +b.dataset.id)
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (b) tentar(() => ACOES[b.dataset.a]?.(b));
  if (e.target.id === 'modal') fechar();
});
document.addEventListener('change', e => {
  const k = e.target.dataset.f;
  if (k) { filtros[k] = e.target.value; pagina = 0; tentar(chamados); }
});

function rota() {
  fechar();
  const [r, id] = (location.hash || '#/dashboard').slice(2).split('/');
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('ativo', a.dataset.r === (r === 'chamado' ? 'chamados' : r)));
  if (r === 'chamado') return tentar(() => detalhe(+id));
  if (CRUD[r]) return tentar(() => crud(r));
  if (r === 'chamados') return tentar(chamados);
  tentar(dashboard);
}
window.addEventListener('hashchange', rota);
rota();