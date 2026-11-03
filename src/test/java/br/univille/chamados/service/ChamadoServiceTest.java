package br.univille.chamados.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import br.univille.chamados.dto.AlterarStatusRequest;
import br.univille.chamados.dto.AtribuirTecnicoRequest;
import br.univille.chamados.dto.ChamadoResponse;
import br.univille.chamados.entity.Categoria;
import br.univille.chamados.entity.Chamado;
import br.univille.chamados.entity.Cliente;
import br.univille.chamados.entity.Perfil;
import br.univille.chamados.entity.Prioridade;
import br.univille.chamados.entity.StatusChamado;
import br.univille.chamados.entity.Tecnico;
import br.univille.chamados.exception.RecursoNaoEncontradoException;
import br.univille.chamados.exception.RegraNegocioException;
import br.univille.chamados.repository.CategoriaRepository;
import br.univille.chamados.repository.ChamadoRepository;
import br.univille.chamados.repository.ClienteRepository;
import br.univille.chamados.repository.TecnicoRepository;

/** Teste unitario das regras de negocio (sem Spring, repositorios simulados com Mockito). */
class ChamadoServiceTest {

    private ChamadoRepository chamadoRepository;
    private TecnicoRepository tecnicoRepository;
    private ChamadoService service;

    @BeforeEach
    void preparar() {
        chamadoRepository = mock(ChamadoRepository.class);
        tecnicoRepository = mock(TecnicoRepository.class);
        service = new ChamadoService(chamadoRepository, mock(ClienteRepository.class),
                mock(CategoriaRepository.class), tecnicoRepository);
    }

    private Chamado chamadoComStatus(StatusChamado status) {
        Chamado c = new Chamado("Sem internet", "Nao conecta", Prioridade.ALTA,
                new Cliente("Ana", "ana@exemplo.com", null), new Categoria("Rede", null));
        c.setStatus(status);
        when(chamadoRepository.findById(1L)).thenReturn(Optional.of(c));
        return c;
    }

    @Test
    void chamadoNovoNasceAbertoComDataDeAbertura() {
        Chamado c = new Chamado("t", "d", Prioridade.BAIXA,
                new Cliente("Ana", "ana@exemplo.com", null), new Categoria("Rede", null));

        assertEquals(StatusChamado.ABERTO, c.getStatus());
        assertNotNull(c.getDataAbertura());
        assertNull(c.getDataFechamento());
    }

    @Test
    void transicaoValidaAlteraOStatus() {
        chamadoComStatus(StatusChamado.ABERTO);

        ChamadoResponse resposta = service.alterarStatus(1L, new AlterarStatusRequest(StatusChamado.EM_ATENDIMENTO));

        assertEquals(StatusChamado.EM_ATENDIMENTO, resposta.status());
        assertNull(resposta.dataFechamento());
    }

    @Test
    void transicaoInvalidaLancaRegraDeNegocio() {
        chamadoComStatus(StatusChamado.ABERTO);

        assertThrows(RegraNegocioException.class,
                () -> service.alterarStatus(1L, new AlterarStatusRequest(StatusChamado.AGUARDANDO_CLIENTE)));
    }

    @Test
    void fecharPreencheDataFechamento() {
        chamadoComStatus(StatusChamado.EM_ATENDIMENTO);

        ChamadoResponse resposta = service.alterarStatus(1L, new AlterarStatusRequest(StatusChamado.FECHADO));

        assertEquals(StatusChamado.FECHADO, resposta.status());
        assertNotNull(resposta.dataFechamento());
    }

    @Test
    void chamadoFechadoNaoMudaDeStatus() {
        chamadoComStatus(StatusChamado.FECHADO);

        assertThrows(RegraNegocioException.class,
                () -> service.alterarStatus(1L, new AlterarStatusRequest(StatusChamado.ABERTO)));
    }

    @Test
    void naoAtribuiTecnicoAChamadoFechado() {
        chamadoComStatus(StatusChamado.FECHADO);

        assertThrows(RegraNegocioException.class,
                () -> service.atribuir(1L, new AtribuirTecnicoRequest(5L)));
    }

    @Test
    void atribuiTecnicoQuandoChamadoEstaAberto() {
        chamadoComStatus(StatusChamado.ABERTO);
        when(tecnicoRepository.findById(5L))
                .thenReturn(Optional.of(new Tecnico("Carlos", "carlos@exemplo.com", Perfil.TECNICO)));

        ChamadoResponse resposta = service.atribuir(1L, new AtribuirTecnicoRequest(5L));

        assertEquals("Carlos", resposta.tecnicoNome());
    }

    @Test
    void atribuirTecnicoInexistenteLanca404() {
        chamadoComStatus(StatusChamado.ABERTO);
        when(tecnicoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class,
                () -> service.atribuir(1L, new AtribuirTecnicoRequest(99L)));
    }

    @Test
    void buscarChamadoInexistenteLanca404() {
        when(chamadoRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () -> service.buscar(404L));
    }
}
