package br.univille.chamados.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import br.univille.chamados.entity.Categoria;
import br.univille.chamados.entity.Chamado;
import br.univille.chamados.entity.Cliente;
import br.univille.chamados.entity.Comentario;
import br.univille.chamados.entity.Prioridade;
import br.univille.chamados.entity.StatusChamado;

@DataJpaTest
class ChamadoRepositoryTest {

    @Autowired
    private ChamadoRepository chamadoRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private CategoriaRepository categoriaRepository;
    @Autowired
    private ComentarioRepository comentarioRepository;

    private Cliente ana;
    private Cliente bia;
    private Categoria categoria;

    @BeforeEach
    void preparar() {
        ana = clienteRepository.save(new Cliente("Ana", "ana@exemplo.com", null));
        bia = clienteRepository.save(new Cliente("Bia", "bia@exemplo.com", null));
        categoria = categoriaRepository.save(new Categoria("Rede", "Problemas de rede"));

        criar("Sem internet", Prioridade.ALTA, StatusChamado.ABERTO, ana);
        criar("Impressora", Prioridade.BAIXA, StatusChamado.EM_ATENDIMENTO, ana);
        criar("Servidor fora", Prioridade.CRITICA, StatusChamado.ABERTO, bia);
    }

    private Chamado criar(String titulo, Prioridade prioridade, StatusChamado status, Cliente cliente) {
        Chamado c = new Chamado(titulo, "descricao", prioridade, cliente, categoria);
        c.setStatus(status);
        return chamadoRepository.save(c);
    }

    @Test
    void semFiltrosRetornaTodos() {
        Page<Chamado> pagina = chamadoRepository.findAll(
                ChamadoSpecification.comFiltros(null, null, null), PageRequest.of(0, 10));

        assertEquals(3, pagina.getTotalElements());
    }

    @Test
    void filtraPorStatus() {
        Page<Chamado> pagina = chamadoRepository.findAll(
                ChamadoSpecification.comFiltros(StatusChamado.ABERTO, null, null), PageRequest.of(0, 10));

        assertEquals(2, pagina.getTotalElements());
    }

    @Test
    void filtraPorClienteEPrioridade() {
        Page<Chamado> pagina = chamadoRepository.findAll(
                ChamadoSpecification.comFiltros(null, Prioridade.ALTA, ana.getId()), PageRequest.of(0, 10));

        assertEquals(1, pagina.getTotalElements());
        assertEquals("Sem internet", pagina.getContent().get(0).getTitulo());
    }

    @Test
    void combinacaoSemResultadoRetornaVazio() {
        Page<Chamado> pagina = chamadoRepository.findAll(
                ChamadoSpecification.comFiltros(StatusChamado.FECHADO, Prioridade.CRITICA, bia.getId()),
                PageRequest.of(0, 10));

        assertEquals(0, pagina.getTotalElements());
    }

    @Test
    void paginaEOrdena() {
        Page<Chamado> pagina = chamadoRepository.findAll(
                ChamadoSpecification.comFiltros(null, null, null),
                PageRequest.of(0, 2, Sort.by("titulo").ascending()));

        assertEquals(3, pagina.getTotalElements());
        assertEquals(2, pagina.getTotalPages());
        assertEquals(2, pagina.getContent().size());
        assertEquals("Impressora", pagina.getContent().get(0).getTitulo());
    }

    @Test
    void comentariosVoltamOrdenadosPelaData() {
        Chamado chamado = criar("Com comentarios", Prioridade.MEDIA, StatusChamado.ABERTO, ana);
        Comentario segundo = new Comentario("segundo", "tecnico", chamado);
        segundo.setData(segundo.getData().plusMinutes(5));
        Comentario primeiro = new Comentario("primeiro", "tecnico", chamado);

        comentarioRepository.save(segundo);
        comentarioRepository.save(primeiro);

        var lista = comentarioRepository.findByChamadoIdOrderByDataAsc(chamado.getId());
        assertEquals("primeiro", lista.get(0).getTexto());
        assertEquals("segundo", lista.get(1).getTexto());
    }
}
