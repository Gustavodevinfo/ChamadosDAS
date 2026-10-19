package br.univille.chamados.dto;

import br.univille.chamados.entity.Cliente;
import jakarta.validation.constraints.NotBlank;

public record ClienteResponse(Long id, String nome, String email, String telefone) {
    public static ClienteResponse(Cliente c) {
        return new ClienteResponse(c.getId(), c.getNome(), c.getEmail(), c.getTelefone())
    }
}
