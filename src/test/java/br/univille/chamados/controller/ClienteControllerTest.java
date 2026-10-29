package br.univille.chamados.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.univille.chamados.dto.ClienteRequest;
import br.univille.chamados.dto.ClienteResponse;
import br.univille.chamados.exception.RecursoNaoEncontradoException;
import br.univille.chamados.exception.RegraNegocioException;
import br.univille.chamados.service.ClienteService;

@WebMvcTest(ClienteController.class)
class ClienteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClienteService service;

    private static final String JSON_VALIDO = """
            {"nome":"Ana Souza","email":"ana@exemplo.com","telefone":"47999999999"}
            """;

    @Test
    void postValidoRetorna201() throws Exception {
        when(service.criar(any(ClienteRequest.class)))
                .thenReturn(new ClienteResponse(1L, "Ana Souza", "ana@exemplo.com", "47999999999"));

        mockMvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/clientes/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("ana@exemplo.com"));
    }

    @Test
    void postComDadosInvalidosRetorna400() throws Exception {
        String invalido = """
                {"nome":"","email":"email-invalido","telefone":"123"}
                """;

        mockMvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON).content(invalido))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Dados inválidos"))
                .andExpect(jsonPath("$.detalhes").isNotEmpty());
    }

    @Test
    void postComEmailDuplicadoRetorna409() throws Exception {
        when(service.criar(any(ClienteRequest.class)))
                .thenThrow(new RegraNegocioException("Já existe cliente com o e-mail ana@exemplo.com"));

        mockMvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void getComIdInexistenteRetorna404() throws Exception {
        when(service.buscar(eq(99999L))).thenThrow(new RecursoNaoEncontradoException("Cliente 99999 não encontrado"));

        mockMvc.perform(get("/clientes/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("Cliente 99999 não encontrado"));
    }

    @Test
    void deleteRetorna204() throws Exception {
        mockMvc.perform(delete("/clientes/1")).andExpect(status().isNoContent());
    }

    @Test
    void deleteDeIdInexistenteRetorna404() throws Exception {
        doThrow(new RecursoNaoEncontradoException("Cliente 7 não encontrado")).when(service).excluir(7L);

        mockMvc.perform(delete("/clientes/7")).andExpect(status().isNotFound());
    }
}
