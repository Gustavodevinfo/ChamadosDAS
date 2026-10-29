package br.univille.chamados.dto;

import java.time.LocalDateTime;

import br.univille.chamados.entity.Chamado;
import br.univille.chamados.entity.Prioridade;
import br.univille.chamados.entity.StatusChamado;

public record ChamadoResponse(
        Long id, String titulo, String descricao,
        LocalDateTime dataAbertura, LocalDateTime dataFechamento,
        Prioridade prioridade, StatusChamado status,
        String clienteNome, String categoriaNome, String tecnicoNome) {

    public static ChamadoResponse de(Chamado c) {
        return new ChamadoResponse(
                c.getId(), c.getTitulo(), c.getDescricao(),
                c.getDataAbertura(), c.getDataFechamento(),
                c.getPrioridade(), c.getStatus(),
                c.getCliente().getNome(), c.getCategoria().getNome(),
                c.getTecnico() != null ? c.getTecnico().getNome() : "Não atribuído");
    }
}
