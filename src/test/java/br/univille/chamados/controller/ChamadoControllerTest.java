package br.univille.chamados.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.univille.chamados.dto.AlterarStatusRequest;
import br.univille.chamados.dto.PaginaResponse;
import br.univille.chamados.exception.RegraNegocioException;
import br.univille.chamados.service.ChamadoService;

@WebMvcTest(ChamadoController.class)
class ChamadoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ChamadoService service;

    @Test
    void postComPrioridadeInexistenteRetorna400() throws Exception {
        String json = """
                {"titulo":"Sem internet","descricao":"Nao conecta","prioridade":"URGENTE",
                 "clienteId":1,"categoriaId":1}
                """;

        mockMvc.perform(post("/chamados").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postSemCamposObrigatoriosRetorna400() throws Exception {
        mockMvc.perform(post("/chamados").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detalhes").isNotEmpty());
    }

    @Test
    void patchStatusInvalidoRetorna409() throws Exception {
        when(service.alterarStatus(any(), any(AlterarStatusRequest.class)))
                .thenThrow(new RegraNegocioException("Transição de status inválida: ABERTO -> AGUARDANDO_CLIENTE"));

        mockMvc.perform(patch("/chamados/1/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"AGUARDANDO_CLIENTE\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void patchStatusSemCorpoValidoRetorna400() throws Exception {
        mockMvc.perform(patch("/chamados/1/status").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getComFiltrosRetorna200() throws Exception {
        when(service.listar(any(), any(), any(), any()))
                .thenReturn(new PaginaResponse<>(List.of(), 0, 10, 0, 0));

        mockMvc.perform(get("/chamados?status=ABERTO&prioridade=ALTA&clienteId=1&page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(0));
    }

    @Test
    void getComStatusInexistenteRetorna400() throws Exception {
        mockMvc.perform(get("/chamados?status=XYZ")).andExpect(status().isBadRequest());
    }
}
