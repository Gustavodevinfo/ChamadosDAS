package br.univille.chamados.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.univille.chamados.dto.AlterarStatusRequest;
import br.univille.chamados.dto.AtribuirTecnicoRequest;
import br.univille.chamados.dto.ChamadoRequest;
import br.univille.chamados.dto.ChamadoResponse;
import br.univille.chamados.dto.PaginaResponse;
import br.univille.chamados.entity.Categoria;
import br.univille.chamados.entity.Chamado;
import br.univille.chamados.entity.Cliente;
import br.univille.chamados.entity.Prioridade;
import br.univille.chamados.entity.StatusChamado;
import br.univille.chamados.entity.Tecnico;
import br.univille.chamados.exception.RecursoNaoEncontradoException;
import br.univille.chamados.exception.RegraNegocioException;
import br.univille.chamados.repository.CategoriaRepository;
import br.univille.chamados.repository.ChamadoRepository;
import br.univille.chamados.repository.ChamadoSpecification;
import br.univille.chamados.repository.ClienteRepository;
import br.univille.chamados.repository.TecnicoRepository;

@Service
public class ChamadoService {

    private final ChamadoRepository repository;
    private final ClienteRepository clienteRepository;
    private final CategoriaRepository categoriaRepository;
    private final TecnicoRepository tecnicoRepository;

    public ChamadoService(ChamadoRepository repository,
            ClienteRepository clienteRepository,
            CategoriaRepository categoriaRepository,
            TecnicoRepository tecnicoRepository) {
        this.repository = repository;
        this.clienteRepository = clienteRepository;
        this.categoriaRepository = categoriaRepository;
        this.tecnicoRepository = tecnicoRepository;
    }

    @Transactional
    public ChamadoResponse criar(ChamadoRequest dto) {
        Cliente cliente = buscarCliente(dto.clienteId());
        Categoria categoria = buscarCategoria(dto.categoriaId());

        Chamado chamado = new Chamado(dto.titulo(), dto.descricao(), dto.prioridade(), cliente, categoria);

        if (dto.tecnicoId() != null) {
            chamado.setTecnico(buscarTecnico(dto.tecnicoId()));
        }

        Chamado salvo = repository.save(chamado);
        return ChamadoResponse.de(salvo);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ChamadoResponse> listar(StatusChamado status, Prioridade prioridade,
            Long clienteId, Pageable pageable) {
        return PaginaResponse.de(
                repository.findAll(ChamadoSpecification.comFiltros(status, prioridade, clienteId), pageable)
                        .map(ChamadoResponse::de));
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ChamadoResponse> listarPorCliente(Long clienteId, Pageable pageable) {
        if (!clienteRepository.existsById(clienteId)) {
            throw new RecursoNaoEncontradoException("Cliente " + clienteId + " não encontrado");
        }
        return listar(null, null, clienteId, pageable);
    }

    @Transactional(readOnly = true)
    public ChamadoResponse buscar(Long id) {
        return ChamadoResponse.de(buscarEntity(id));
    }

    @Transactional
    public ChamadoResponse atualizar(Long id, ChamadoRequest dto) {
        Chamado chamado = buscarEntity(id);

        if (chamado.getStatus() == StatusChamado.FECHADO) {
            throw new RegraNegocioException("Não é possível alterar um chamado que já está FECHADO.");
        }

        chamado.setTitulo(dto.titulo());
        chamado.setDescricao(dto.descricao());
        chamado.setPrioridade(dto.prioridade());
        chamado.setCliente(buscarCliente(dto.clienteId()));
        chamado.setCategoria(buscarCategoria(dto.categoriaId()));
        chamado.setTecnico(dto.tecnicoId() != null ? buscarTecnico(dto.tecnicoId()) : null);

        return ChamadoResponse.de(chamado);
    }

    @Transactional
    public ChamadoResponse atribuir(Long id, AtribuirTecnicoRequest dto) {
        Chamado chamado = buscarEntity(id);

        if (chamado.getStatus() == StatusChamado.FECHADO) {
            throw new RegraNegocioException("Não é possível atribuir técnico a um chamado FECHADO.");
        }

        chamado.setTecnico(buscarTecnico(dto.tecnicoId()));
        return ChamadoResponse.de(chamado);
    }

    @Transactional
    public ChamadoResponse alterarStatus(Long id, AlterarStatusRequest dto) {
        Chamado chamado = buscarEntity(id);
        StatusChamado atual = chamado.getStatus();
        StatusChamado novo = dto.status();

        if (atual == StatusChamado.FECHADO) {
            throw new RegraNegocioException("Não é possível alterar um chamado que já está FECHADO.");
        }
        if (!atual.podeIrPara(novo)) {
            throw new RegraNegocioException("Transição de status inválida: " + atual + " -> " + novo);
        }

        chamado.setStatus(novo);
        if (novo == StatusChamado.FECHADO) {
            chamado.setDataFechamento(LocalDateTime.now());
        }
        return ChamadoResponse.de(chamado);
    }

    @Transactional
    public void excluir(Long id) {
        repository.delete(buscarEntity(id));
    }

    private Chamado buscarEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Chamado " + id + " não encontrado"));
    }

    private Cliente buscarCliente(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado com o ID: " + id));
    }

    private Categoria buscarCategoria(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada com o ID: " + id));
    }

    private Tecnico buscarTecnico(Long id) {
        return tecnicoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Técnico não encontrado com o ID: " + id));
    }
}
