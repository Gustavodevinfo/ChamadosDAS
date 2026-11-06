const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = d => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const txt = s => s.replace(/_/g, ' ');
const prox = arr => Math.max(0, ...arr.map(x => x.id)) + 1;
const bp = p => `<span class="badge p-${p}">${p}</span>`;
const bs = s => `<span class="badge s-${s}">${txt(s)}</span>`;
const achar = (lista, id) => DB[lista].find(x => x.id === id);
const nomeDe = (lista, id) => achar(lista, id)?.nome ?? '—';
const nomeTec = id => (id ? nomeDe('tecnicos', id) : 'Não atribuído');
const opts = lista => DB[lista].map(x => [x.id, x.nome]);

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
const USO = { clientes: 'clienteId', tecnicos: 'tecnicoId', categorias: 'categoriaId' };

/* ---------- utilidades de UI ---------- */
function aviso(m) {
  const t = $('#toast'); t.textContent = m; t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 3000);
}
const fechar = () => $('#modal').classList.remove('aberto');

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
  f.onsubmit = e => { e.preventDefault(); onSubmit(Object.fromEntries(new FormData(f))); fechar(); };
}

/* ---------- Dashboard ---------- */
function dashboard() {
  const cont = s => DB.chamados.filter(c => c.status === s).length;
  const recentes = [...DB.chamados].sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura)).slice(0, 5);
  $('#view').innerHTML = `<div class="topo"><h1>Dashboard</h1></div>
    <div class="numeros"><div class="card"><b>${DB.chamados.length}</b><span>Total</span></div>
    ${STATUS.map(s => `<div class="card"><b>${cont(s)}</b><span>${txt(s)}</span></div>`).join('')}</div>
    <div class="card"><h3>Últimos chamados</h3>${tabelaChamados(recentes)}</div>`;
}

function tabelaChamados(lista) {
  return `<table><thead><tr><th>ID</th><th>Título</th><th>Cliente</th><th>Prioridade</th><th>Status</th><th>Técnico</th><th>Abertura</th></tr></thead><tbody>${
    lista.map(c => `<tr><td>${c.id}</td><td><a href="#/chamado/${c.id}">${esc(c.titulo)}</a></td><td>${esc(nomeDe('clientes', c.clienteId))}</td><td>${bp(c.prioridade)}</td><td>${bs(c.status)}</td><td>${esc(nomeTec(c.tecnicoId))}</td><td>${fmt(c.dataAbertura)}</td></tr>`).join('')
    || '<tr><td colspan="7" class="vazio">Nenhum chamado encontrado.</td></tr>'}</tbody></table>`;
}

/* ---------- Lista de chamados ---------- */
function chamados() {
  const f = filtros;
  const l = DB.chamados
    .filter(c => (!f.status || c.status === f.status) && (!f.prioridade || c.prioridade === f.prioridade) && (!f.clienteId || c.clienteId === +f.clienteId))
    .sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura));
  const tp = Math.max(1, Math.ceil(l.length / TAM));
  pagina = Math.min(Math.max(pagina, 0), tp - 1);
  const sel = (k, rotulo, arr) => `<select data-f="${k}"><option value="">${rotulo}</option>${arr.map(([v, t]) => `<option value="${v}" ${String(v) === String(f[k]) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  $('#view').innerHTML = `<div class="topo"><h1>Chamados</h1><button class="btn" data-a="novo-chamado">+ Novo chamado</button></div>
    <div class="card"><div class="filtros">
      ${sel('status', 'Todos os status', STATUS.map(s => [s, txt(s)]))}
      ${sel('prioridade', 'Todas as prioridades', PRIOR.map(p => [p, p]))}
      ${sel('clienteId', 'Todos os clientes', opts('clientes'))}
      <button class="btn sec" data-a="limpar">Limpar</button></div>
      ${tabelaChamados(l.slice(pagina * TAM, pagina * TAM + TAM))}
      <div class="pag"><button class="btn sec" data-a="pag" data-d="-1" ${pagina === 0 ? 'disabled' : ''}>←</button>
      <span>Página ${pagina + 1} de ${tp} (${l.length} chamados)</span>
      <button class="btn sec" data-a="pag" data-d="1" ${pagina >= tp - 1 ? 'disabled' : ''}>→</button></div></div>`;
}

function formChamado(id) {
  const it = id ? achar('chamados', id) : {};
  const campos = [
    { k: 'titulo', l: 'Título', req: 1, max: 150 },
    { k: 'descricao', l: 'Descrição', req: 1, type: 'textarea' },
    { k: 'prioridade', l: 'Prioridade', req: 1, opts: PRIOR.map(p => [p, p]) },
    { k: 'clienteId', l: 'Cliente', req: 1, opts: opts('clientes') },
    { k: 'categoriaId', l: 'Categoria', req: 1, opts: opts('categorias') },
    { k: 'tecnicoId', l: 'Técnico (opcional)', opts: opts('tecnicos') }
  ];
  modal(id ? 'Editar chamado' : 'Novo chamado', campos, it, d => {
    const dados = { titulo: d.titulo, descricao: d.descricao, prioridade: d.prioridade, clienteId: +d.clienteId, categoriaId: +d.categoriaId, tecnicoId: d.tecnicoId ? +d.tecnicoId : null };
    if (id) { Object.assign(it, dados); detalhe(id); }
    else {
      DB.chamados.push({ id: prox(DB.chamados), ...dados, status: 'ABERTO', dataAbertura: new Date().toISOString(), dataFechamento: null });
      chamados(); aviso('Chamado criado!');
    }
  });
}

/* ---------- Detalhe do chamado ---------- */
function detalhe(id) {
  const c = achar('chamados', id);
  if (!c) { location.hash = '#/chamados'; return; }
  const fechado = c.status === 'FECHADO';
  const coms = DB.comentarios.filter(x => x.chamadoId === id);
  $('#view').innerHTML = `<a href="#/chamados" class="voltar">← Voltar</a>
    <div class="topo"><h1>#${c.id} ${esc(c.titulo)}</h1><div>${bp(c.prioridade)}${bs(c.status)}</div></div>
    <div class="grade">
      <div class="card"><h3>Descrição</h3><p>${esc(c.descricao)}</p>
        <dl><dt>Cliente</dt><dd>${esc(nomeDe('clientes', c.clienteId))}</dd>
        <dt>Categoria</dt><dd>${esc(nomeDe('categorias', c.categoriaId))}</dd>
        <dt>Técnico</dt><dd>${esc(nomeTec(c.tecnicoId))}</dd>
        <dt>Aberto em</dt><dd>${fmt(c.dataAbertura)}</dd>
        <dt>Fechado em</dt><dd>${fmt(c.dataFechamento)}</dd></dl></div>
      <div class="card"><h3>Ações</h3>
        <div class="acoes-linha">${TRANS[c.status].map(s => `<button class="btn sec" data-a="status" data-id="${id}" data-s="${s}">→ ${txt(s)}</button>`).join('') || '<span class="vazio">Chamado fechado: não pode ser alterado.</span>'}</div>
        <form id="fat" class="inline"><select name="t" required><option value="">Atribuir técnico…</option>${opts('tecnicos').map(([v, t]) => `<option value="${v}" ${v === c.tecnicoId ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select><button class="btn" ${fechado ? 'disabled' : ''}>Atribuir</button></form>
        <div class="acoes-linha" style="margin-top:14px"><button class="btn sec" data-a="editar-chamado" data-id="${id}" ${fechado ? 'disabled' : ''}>Editar</button>
        <button class="btn sec" data-a="excluir-chamado" data-id="${id}">Excluir</button></div></div>
    </div>
    <div class="card"><h3>Comentários (${coms.length})</h3>
      ${coms.map(m => `<div class="coment"><small><b>${esc(m.autor)}</b> · ${fmt(m.data)}</small><br>${esc(m.texto)}</div>`).join('') || '<p class="vazio">Sem comentários.</p>'}
      <form id="fcom"><label>Autor *<input name="autor" required></label><label>Comentário *<textarea name="texto" rows="3" required></textarea></label><button class="btn">Comentar</button></form></div>`;
  $('#fat').onsubmit = e => {
    e.preventDefault();
    if (fechado) return aviso('Chamado fechado não pode receber técnico (409).');
    c.tecnicoId = +e.target.t.value; detalhe(id);
  };
  $('#fcom').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    DB.comentarios.push({ id: prox(DB.comentarios), chamadoId: id, autor: d.autor, texto: d.texto, data: new Date().toISOString() });
    detalhe(id);
  };
}

function mudarStatus(id, s) {
  const c = achar('chamados', id);
  if (!TRANS[c.status].includes(s)) return aviso('Transição de status não permitida (409).');
  c.status = s;
  if (s === 'FECHADO') c.dataFechamento = new Date().toISOString();
  detalhe(id);
}

/* ---------- CRUD genérico (clientes, técnicos, categorias) ---------- */
function crud(nome) {
  const c = CRUD[nome];
  $('#view').innerHTML = `<div class="topo"><h1>${c.titulo}</h1><button class="btn" data-a="novo" data-n="${nome}">+ Novo</button></div>
    <div class="card"><table><thead><tr><th>ID</th>${c.campos.map(x => `<th>${x.l}</th>`).join('')}<th></th></tr></thead><tbody>${
      DB[nome].map(i => `<tr><td>${i.id}</td>${c.campos.map(x => `<td>${esc(i[x.k])}</td>`).join('')}<td><button class="link" data-a="ed" data-n="${nome}" data-id="${i.id}">Editar</button><button class="link perigo" data-a="ex" data-n="${nome}" data-id="${i.id}">Excluir</button></td></tr>`).join('')
      || '<tr><td colspan="9" class="vazio">Nenhum registro.</td></tr>'}</tbody></table></div>`;
}

function formCrud(nome, id) {
  const c = CRUD[nome], it = id ? achar(nome, id) : {};
  modal((id ? 'Editar ' : 'Novo ') + c.um, c.campos, it, d => {
    if (id) Object.assign(it, d); else DB[nome].push({ id: prox(DB[nome]), ...d });
    crud(nome); aviso('Salvo!');
  });
}

function excluirCrud(nome, id) {
  if (DB.chamados.some(ch => ch[USO[nome]] === id)) return aviso('Não é possível excluir: registro em uso por chamados (409).');
  if (!confirm('Excluir este registro?')) return;
  DB[nome] = DB[nome].filter(x => x.id !== id);
  crud(nome);
}

/* ---------- Cliques e filtros (delegação de eventos) ---------- */
const ACOES = {
  fechar,
  'novo-chamado': () => formChamado(),
  'editar-chamado': b => formChamado(+b.dataset.id),
  'excluir-chamado': b => {
    if (!confirm('Excluir este chamado?')) return;
    DB.chamados = DB.chamados.filter(x => x.id !== +b.dataset.id);
    DB.comentarios = DB.comentarios.filter(x => x.chamadoId !== +b.dataset.id);
    location.hash = '#/chamados';
  },
  status: b => mudarStatus(+b.dataset.id, b.dataset.s),
  pag: b => { pagina += +b.dataset.d; chamados(); },
  limpar: () => { filtros = { status: '', prioridade: '', clienteId: '' }; pagina = 0; chamados(); },
  novo: b => formCrud(b.dataset.n),
  ed: b => formCrud(b.dataset.n, +b.dataset.id),
  ex: b => excluirCrud(b.dataset.n, +b.dataset.id)
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (b) ACOES[b.dataset.a]?.(b);
  if (e.target.id === 'modal') fechar();
});
document.addEventListener('change', e => {
  const k = e.target.dataset.f;
  if (k) { filtros[k] = e.target.value; pagina = 0; chamados(); }
});

/* ---------- Roteador por hash (#/chamados, #/chamado/3 ...) ---------- */
function rota() {
  fechar();
  const [r, id] = (location.hash || '#/dashboard').slice(2).split('/');
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('ativo', a.dataset.r === (r === 'chamado' ? 'chamados' : r)));
  if (r === 'chamado') return detalhe(+id);
  if (CRUD[r]) return crud(r);
  if (r === 'chamados') return chamados();
  dashboard();
}
window.addEventListener('hashchange', rota);
rota();