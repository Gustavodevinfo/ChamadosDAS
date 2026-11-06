// Dados de mentira. Na integração futura, isto vira chamadas fetch() à API.
const DB = {
  clientes: [
    { id: 1, nome: 'Maria Silva', email: 'maria@email.com', telefone: '(47) 99999-0001' },
    { id: 2, nome: 'João Pereira', email: 'joao@email.com', telefone: '(47) 99999-0002' },
    { id: 3, nome: 'Ana Souza', email: 'ana@email.com', telefone: '' }
  ],
  tecnicos: [
    { id: 1, nome: 'Carlos Lima', email: 'carlos@das.com', perfil: 'ADMIN' },
    { id: 2, nome: 'Paula Rocha', email: 'paula@das.com', perfil: 'TECNICO' },
    { id: 3, nome: 'Rafael Dias', email: 'rafael@das.com', perfil: 'TECNICO' }
  ],
  categorias: [
    { id: 1, nome: 'Hardware', descricao: 'Problemas com equipamentos' },
    { id: 2, nome: 'Software', descricao: 'Instalação e erros de programas' },
    { id: 3, nome: 'Rede', descricao: 'Internet, Wi-Fi e VPN' }
  ],
  chamados: [
    { id: 1, titulo: 'Computador não liga', descricao: 'Ao apertar o botão nada acontece.', prioridade: 'ALTA', status: 'ABERTO', clienteId: 1, categoriaId: 1, tecnicoId: null, dataAbertura: '2026-11-01T09:00:00', dataFechamento: null },
    { id: 2, titulo: 'Erro ao abrir o Excel', descricao: 'Mensagem de arquivo corrompido.', prioridade: 'MEDIA', status: 'EM_ATENDIMENTO', clienteId: 2, categoriaId: 2, tecnicoId: 2, dataAbertura: '2026-11-01T10:30:00', dataFechamento: null },
    { id: 3, titulo: 'Wi-Fi caindo toda hora', descricao: 'A conexão cai a cada 10 minutos.', prioridade: 'CRITICA', status: 'AGUARDANDO_CLIENTE', clienteId: 3, categoriaId: 3, tecnicoId: 3, dataAbertura: '2026-11-02T08:15:00', dataFechamento: null },
    { id: 4, titulo: 'Instalar antivírus', descricao: 'Preciso do antivírus na máquina nova.', prioridade: 'BAIXA', status: 'FECHADO', clienteId: 1, categoriaId: 2, tecnicoId: 2, dataAbertura: '2026-10-28T14:00:00', dataFechamento: '2026-10-29T09:00:00' },
    { id: 5, titulo: 'Monitor piscando', descricao: 'A tela pisca em intervalos curtos.', prioridade: 'MEDIA', status: 'ABERTO', clienteId: 2, categoriaId: 1, tecnicoId: null, dataAbertura: '2026-11-03T11:00:00', dataFechamento: null },
    { id: 6, titulo: 'VPN não conecta', descricao: 'Erro de autenticação na VPN.', prioridade: 'ALTA', status: 'EM_ATENDIMENTO', clienteId: 3, categoriaId: 3, tecnicoId: 1, dataAbertura: '2026-11-03T15:20:00', dataFechamento: null },
    { id: 7, titulo: 'Impressora sem toner', descricao: 'Trocar o toner da impressora do 2º andar.', prioridade: 'BAIXA', status: 'ABERTO', clienteId: 1, categoriaId: 1, tecnicoId: null, dataAbertura: '2026-11-04T09:40:00', dataFechamento: null }
  ],
  comentarios: [
    { id: 1, chamadoId: 2, autor: 'Paula Rocha', texto: 'Vou tentar recuperar o arquivo.', data: '2026-11-01T11:00:00' },
    { id: 2, chamadoId: 3, autor: 'Rafael Dias', texto: 'Pode me informar o modelo do roteador?', data: '2026-11-02T09:00:00' }
  ]
};