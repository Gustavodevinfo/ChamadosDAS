package br.univille.chamados.dto;

import br.univille.chamados.entity.StatusChamado;
import jakarta.validation.constraints.NotNull;

public record AlterarStatusRequest(
        @NotNull(message = "Status é obrigatório") StatusChamado status) {
}
