package br.univille.chamados.dto;

import br.univille.chamados.entity.StatusChamado;
import jakarta.validation.constraints.NotNull;

public record AtualizarStatusRequest(
        @NotNull(message = "O novo status é obrigatório") StatusChamado status) {
}