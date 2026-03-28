# Skill Creation Skill

**When to use:** Criando um novo conjunto de regras reutilizáveis para o Claude Code seguir ao ser invocado como slash command.

## Rules

1. Sempre criar em `.claude/skills/[skill-name]/SKILL.md` (formato subdiretório, não arquivo solto)
2. Nome do diretório: kebab-case, descritivo e imperativo (ex: `entity-creation`, `controller-builder`)
3. Primeira linha do arquivo: `# [Nome da Skill]` em Title Case
4. Segunda linha: `**When to use:**` — uma frase objetiva descrevendo o trigger exato
5. Seção `## Rules` com lista numerada de regras absolutas (sem exceções implícitas)
6. Seções de exemplos com blocos de código reais do projeto (não inventados)
7. Seção `## Checklist` ao final com itens verificáveis no formato `- [ ]`
8. Registrar no CLAUDE.md em **dois lugares**:
   - Seção `## Available Skills` — bloco descritivo completo
   - Seção `Phase 2: Planning` — adicionar `/skill-name` na lista de skills disponíveis
9. Registrar no MEMORY.md na seção `# Available Skills`

## Estrutura Mínima

```markdown
# Nome da Skill

**When to use:** Quando [trigger exato].

## Rules

1. Regra absoluta
2. Regra absoluta

## [Seção de Exemplo]

[Exemplos com código ou estrutura]

## Checklist

- [ ] Item verificável
- [ ] Item verificável
```

## Exemplo: Skill Simples (só regras)

Uma skill sem exemplos de código — apenas regras e checklist:

```markdown
# Git Workflow Skill

**When to use:** Creating feature branches, making commits, or following merge procedures.

## Rules

1. Protected branches: `main` (production), `develop` (staging) — no direct push
2. Feature branches: `feat/**`, `fix/**`, `chore/**` all from/to `develop`
3. Atomic commits: one logical change per commit
4. Format: `[type]([scope]): [imperative message]`

## Checklist

- [ ] Branch is `feat/**`, `fix/**`, or `chore/**`
- [ ] Each commit is one logical change
- [ ] Commit message follows Conventional Commits format
```

## Exemplo: Skill com Código

Uma skill que define convenções de código — inclui exemplos reais do projeto:

```markdown
# Entity Creation Skill

**When to use:** Creating a new entity class in the domain layer (`core/entity/`).

## Rules

1. Every entity must extend `Entity` from `@root/shared/lib/core/model/entity`
2. `id`, `createdAt`, `updatedAt` in `XCreationFields` are always optional
3. All domain fields are private with `_` prefix

## CreationFields Interface

\`\`\`typescript
export interface AutomationCreationFields {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  workspaceId: string;
  name: string;
}
\`\`\`

## Checklist

- [ ] Entity extends `Entity` from `@root/shared/lib/core/model/entity`
- [ ] `id?`, `createdAt?`, `updatedAt?` are optional in `XCreationFields`
```

## Registro no CLAUDE.md

### Seção `## Available Skills` — formato do bloco

```markdown
### `/skill-name`
**Use when:** [quando usar em uma linha].

Defines:
- [O que a skill define, ponto 1]
- [O que a skill define, ponto 2]
- [Checklist de N itens]

**Invoke:** `/skill-name`
```

### Seção `Phase 2: Planning` — linha de skills disponíveis

Adicionar o novo `/skill-name` na lista existente:

```
Which skills to use (`/controller-builder`, `/e2e-test`, ..., `/skill-name`)
```

## Checklist

- [ ] Arquivo em `.claude/skills/[skill-name]/SKILL.md` (subdiretório, não arquivo solto)
- [ ] Título na primeira linha (`# Nome`)
- [ ] `**When to use:**` na segunda linha
- [ ] Seção `## Rules` com regras numeradas
- [ ] Pelo menos um exemplo de código ou estrutura
- [ ] Seção `## Checklist` ao final
- [ ] Registrado no CLAUDE.md em `## Available Skills` (bloco descritivo)
- [ ] Registrado no CLAUDE.md em `Phase 2: Planning` (lista de skills disponíveis)
- [ ] Registrado no MEMORY.md em `# Available Skills`
