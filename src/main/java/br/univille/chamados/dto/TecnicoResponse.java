package br.univille.chamados.dto;

import br.univille.chamados.entity.Perfil;
import br.univille.chamados.entity.Tecnico;

public record TecnicoResponse(Long id, String nome, String email, Perfil perfil) {
    public static TecnicoResponse de(Tecnico t) {
        return new TecnicoResponse(t.getId(), t.getNome(), t.getEmail(), t.getPerfil());
    }
}
