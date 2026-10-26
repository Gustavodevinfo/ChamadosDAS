package br.univille.chamados.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import br.univille.chamados.entity.Chamado;

public interface ChamadoRepository extends JpaRepository<Chamado, Long> {
}