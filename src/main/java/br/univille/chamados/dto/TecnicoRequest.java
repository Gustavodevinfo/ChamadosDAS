package br.univille.chamados.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record TecnicoRequest(
        @NotBlank(message = "Nome é obrigatório") String nome,
        @NotBlank(message = "E-mail é obrigatório") @Email(message = "E-mail inválido") String email,
        @NotBlank(message = "Perfil é obrigatório") String perfil // String
) {
}