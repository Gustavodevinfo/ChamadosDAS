package br.univille.chamados.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClienteRequest (
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100, message = "Nome deve ter no maximo 100 caracteres")
    String nome,

    @NotBlank(message = "Email é obrigatório")
    @Size(message = "email é invalido ")
    String email,

    @Size(max = 20, message = "Telefone deve ter no maximo 20 caracteres")
    String telefone)
{}
