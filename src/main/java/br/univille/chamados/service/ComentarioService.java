package br.univille.chamados.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import br.univille.chamados.dto.ComentarioRequest;
import br.univille.chamados.dto.ComentarioResponse;
import br.univille.chamados.entity.Chamado;
import br.univille.chamados.entity.Comentario;
import br.univille.chamados.exception.RecursoNaoEncontradoException;
import br.univille.chamados.repository.ChamadoRepository;
import br.univille.chamados.repository.ComentarioRepository;

@Service
public class ComentarioService {
    private final ComentarioRepository repository;
    private final ChamadoRepository chamadoRepository;

    public ComentarioService(ComentarioRepository repository, ChamadoRepository chamadoRepository) {
        this.repository = repository;
        this.chamadoRepository = chamadoRepository;
    }

    @Transactional
    public ComentarioResponse criar(Long chamadoId, ComentarioRequest dto) {
        Chamado chamado = chamadoRepository.findById(chamadoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Chamado não encontrado"));

        Comentario comentario = new Comentario(dto.texto(), dto.autor(), chamado);
        Comentario salvo = repository.save(comentario);
        return ComentarioResponse.de(salvo);
    }

    @Transactional(readOnly = true)
    public List<ComentarioResponse> listarPorChamado(Long chamadoId) {
        if (!chamadoRepository.existsById(chamadoId)) {
            throw new RecursoNaoEncontradoException("Chamado não encontrado");
        }
        return repository.findByChamadoIdOrderByDataAsc(chamadoId).stream().map(ComentarioResponse::de).toList();
    }
}