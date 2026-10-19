package br.univille.chamados.dto;

import jakarta.validation.constraints.NotBlank;

public record ComentarioRequest(
        @NotBlank(message = "Texto é obrigatório") String texto,
        @NotBlank(message = "Autor é obrigatório") String autor) {
}