package br.univille.chamados.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import br.univille.chamados.dto.TecnicoRequest;
import br.univille.chamados.dto.TecnicoResponse;
import br.univille.chamados.entity.Tecnico;
import br.univille.chamados.exception.RecursoNaoEncontradoException;
import br.univille.chamados.exception.RegraNegocioException;
import br.univille.chamados.repository.TecnicoRepository;

@Service
public class TecnicoService {
    private final TecnicoRepository repository;

    public TecnicoService(TecnicoRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public TecnicoResponse criar(TecnicoRequest dto) {
        if (repository.existsByEmail(dto.email())) {
            throw new RegraNegocioException("Já existe um técnico com esse e-mail.");
        }
        Tecnico salvo = repository.save(new Tecnico(dto.nome(), dto.email(), dto.perfil()));
        return TecnicoResponse.de(salvo);
    }

    @Transactional(readOnly = true)
    public List<TecnicoResponse> listar() {
        return repository.findAll().stream().map(TecnicoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public TecnicoResponse buscar(Long id) {
        return TecnicoResponse.de(buscarEntity(id));
    }

    @Transactional
    public TecnicoResponse atualizar(Long id, TecnicoRequest dto) {
        Tecnico tecnico = buscarEntity(id);
        if (repository.existsByEmailAndIdNot(dto.email(), id)) {
            throw new RegraNegocioException("Já existe um técnico com esse e-mail.");
        }
        tecnico.setNome(dto.nome());
        tecnico.setEmail(dto.email());
        tecnico.setPerfil(dto.perfil());
        return TecnicoResponse.de(tecnico);
    }

    @Transactional
    public void excluir(Long id) {
        repository.delete(buscarEntity(id));
    }

    private Tecnico buscarEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Técnico " + id + " não encontrado"));
    }
}