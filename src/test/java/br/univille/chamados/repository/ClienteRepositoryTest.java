package br.univille.chamados.repository;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import br.univille.chamados.entity.Cliente;

@DataJpaTest
class ClienteRepositoryTest {

    @Autowired
    private ClienteRepository repository;

    @Test
    void existsByEmailRetornaTrueQuandoEmailExiste() {
        repository.save(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));

        assertTrue(repository.existsByEmail("ana@exemplo.com"));
        assertFalse(repository.existsByEmail("outro@exemplo.com"));
    }

    @Test
    void existsByEmailAndIdNotIgnoraOProprioRegistro() {
        Cliente ana = repository.save(new Cliente("Ana Souza", "ana@exemplo.com", null));
        Cliente bia = repository.save(new Cliente("Bia Lima", "bia@exemplo.com", null));

        // o proprio cliente usando o proprio e-mail nao conta como duplicado
        assertFalse(repository.existsByEmailAndIdNot("ana@exemplo.com", ana.getId()));
        // outro cliente tentando usar o e-mail da Ana conta como duplicado
        assertTrue(repository.existsByEmailAndIdNot("ana@exemplo.com", bia.getId()));
    }

    @Test
    void emailDuplicadoViolaConstraintDeUnicidade() {
        repository.saveAndFlush(new Cliente("Ana Souza", "ana@exemplo.com", null));

        assertThrows(DataIntegrityViolationException.class,
                () -> repository.saveAndFlush(new Cliente("Outra Ana", "ana@exemplo.com", null)));
    }
}
