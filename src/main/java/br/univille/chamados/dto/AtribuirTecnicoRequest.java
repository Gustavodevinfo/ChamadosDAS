package br.univille.chamados.dto;

import jakarta.validation.constraints.NotNull;

public record AtribuirTecnicoRequest(
        @NotNull(message = "ID do técnico é obrigatório") Long tecnicoId) {
}
