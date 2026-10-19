package br.univille.chamados.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ChamadoRequest(
        @NotBlank(message = "Título é obrigatório") String titulo,
        @NotBlank(message = "Descrição é obrigatória") String descricao,
        @NotBlank(message = "Prioridade é obrigatória") String prioridade, // String
        @NotNull(message = "ID do cliente é obrigatório") Long clienteId,
        @NotNull(message = "ID da categoria é obrigatório") Long categoriaId,
        Long tecnicoId) {
}