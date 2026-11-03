# Sistema de Chamados — DAS (Univille)

API REST em camadas (Controller → Service → Repository → Entity, com DTOs e tratamento global de exceções).
Java 21 · Spring Boot · Maven · Spring Web · Spring Data JPA · H2 · Bean Validation.

## Como executar

```bash
./mvnw spring-boot:run
./mvnw clean test
```

- API: http://localhost:8080
- Console H2: http://localhost:8080/h2-console — JDBC URL `jdbc:h2:mem:chamadosdb`, usuário `sa`, senha em branco.
- PostgreSQL (opcional): `./mvnw spring-boot:run -Dspring-boot.run.profiles=postgres`
  (variáveis `DB_URL`, `DB_USER`, `DB_PASSWORD`; padrão `jdbc:postgresql://localhost:5432/chamados`).

## Estrutura

```
src/main/java/br/univille/chamados
├── controller   # rotas HTTP e códigos de resposta
├── dto          # contrato de entrada/saída da API
├── entity       # mapeamento objeto-relacional (+ enums Prioridade, StatusChamado, Perfil)
├── exception    # exceções de domínio e GlobalExceptionHandler
├── repository   # acesso a dados (Spring Data JPA)
└── service      # regras de negócio e transações
```

## Rotas

| Método             | Rota                         | Sucesso                           |
| ------------------ | ---------------------------- | --------------------------------- |
| POST / GET         | `/clientes`                  | 201 / 200                         |
| GET / PUT / DELETE | `/clientes/{id}`             | 200 / 200 / 204                   |
| GET                | `/clientes/{id}/chamados`    | 200 (paginado)                    |
| POST / GET         | `/categorias`                | 201 / 200                         |
| GET / PUT / DELETE | `/categorias/{id}`           | 200 / 200 / 204                   |
| POST / GET         | `/tecnicos`                  | 201 / 200                         |
| GET / PUT / DELETE | `/tecnicos/{id}`             | 200 / 200 / 204                   |
| POST / GET         | `/chamados`                  | 201 / 200 (paginado, com filtros) |
| GET / PUT / DELETE | `/chamados/{id}`             | 200 / 200 / 204                   |
| PATCH              | `/chamados/{id}/atribuir`    | 200                               |
| PATCH              | `/chamados/{id}/status`      | 200                               |
| POST / GET         | `/chamados/{id}/comentarios` | 201 / 200                         |

Erros: `400` dados inválidos · `404` recurso inexistente · `409` regra de negócio violada / registro em uso.

## Regras de negócio dos chamados

- Todo chamado nasce `ABERTO` e `dataAbertura` é preenchida automaticamente.
- Transições de status permitidas:
  `ABERTO → EM_ATENDIMENTO | FECHADO` · `EM_ATENDIMENTO → AGUARDANDO_CLIENTE | FECHADO` · `AGUARDANDO_CLIENTE → EM_ATENDIMENTO | FECHADO`.
- Ao fechar, `dataFechamento` é preenchida. Chamado `FECHADO` não pode ser alterado nem receber técnico (409).
- Prioridades: `BAIXA`, `MEDIA`, `ALTA`, `CRITICA`. Perfis de técnico: `ADMIN`, `TECNICO`.

## Exemplos de teste (curl)

```bash
# cliente
curl -i -X POST http://localhost:8080/clientes -H "Content-Type: application/json" \
  -d '{"nome":"Ana Souza","email":"ana@exemplo.com","telefone":"47999999999"}'

# categoria e técnico
curl -i -X POST http://localhost:8080/categorias -H "Content-Type: application/json" \
  -d '{"nome":"Rede","descricao":"Problemas de rede"}'
curl -i -X POST http://localhost:8080/tecnicos -H "Content-Type: application/json" \
  -d '{"nome":"Carlos","email":"carlos@exemplo.com","perfil":"TECNICO"}'

# chamado
curl -i -X POST http://localhost:8080/chamados -H "Content-Type: application/json" \
  -d '{"titulo":"Sem internet","descricao":"Não conecta","prioridade":"ALTA","clienteId":1,"categoriaId":1}'

# atribuir técnico e alterar status
curl -i -X PATCH http://localhost:8080/chamados/1/atribuir -H "Content-Type: application/json" -d '{"tecnicoId":1}'
curl -i -X PATCH http://localhost:8080/chamados/1/status   -H "Content-Type: application/json" -d '{"status":"EM_ATENDIMENTO"}'

# comentário
curl -i -X POST http://localhost:8080/chamados/1/comentarios -H "Content-Type: application/json" \
  -d '{"texto":"Cabo trocado","autor":"Carlos"}'

# filtros, paginação e ordenação
curl "http://localhost:8080/chamados?status=ABERTO&prioridade=ALTA&clienteId=1"
curl "http://localhost:8080/chamados?page=0&size=5&sort=dataAbertura,desc"
curl "http://localhost:8080/clientes/1/chamados"
```

Resposta paginada: `{ "conteudo": [...], "pagina": 0, "tamanho": 10, "totalElementos": 1, "totalPaginas": 1 }`.
