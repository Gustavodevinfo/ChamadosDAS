package br.univille.chamados.dto;

import br.univille.chamados.entity.Prioridade;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChamadoRequest(
        @NotBlank(message = "Título é obrigatório")
        @Size(max = 150, message = "Título deve ter no máximo 150 caracteres")
        String titulo,

        @NotBlank(message = "Descrição é obrigatória")
        String descricao,

        @NotNull(message = "Prioridade é obrigatória")
        Prioridade prioridade,

        @NotNull(message = "ID do cliente é obrigatório")
        Long clienteId,

        @NotNull(message = "ID da categoria é obrigatório")
        Long categoriaId,

        Long tecnicoId) {
}
