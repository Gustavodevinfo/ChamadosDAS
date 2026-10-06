package br.univille.chamados.repository;

import br.univille.chamados.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository {

    boolean existsByEmail(String email);
    boolean existsByEmailAndidNot(String email, Long id);
}
