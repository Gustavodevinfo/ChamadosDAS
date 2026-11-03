package br.univille.chamados.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.univille.chamados.entity.Comentario;

public interface ComentarioRepository extends JpaRepository<Comentario, Long> {
    List<Comentario> findByChamadoIdOrderByDataAsc(Long chamadoId);
}
