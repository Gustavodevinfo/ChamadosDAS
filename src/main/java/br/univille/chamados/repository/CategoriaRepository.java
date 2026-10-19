package br.univille.chamados.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import br.univille.chamados.entity.Categoria;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    boolean existsByNome(String nome);
}