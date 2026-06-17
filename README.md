# API NestJS + Prisma — Meu projeto de estudos (IFSP Caraguatatuba)

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Licença-MIT-green" />
</p>

<p align="center">
  <i>Projeto desenvolvido durante as aulas técnicas do IFSP – Campus Caraguatatuba</i>
</p>

---

## Oi, eu sou a Camilly

Esse repositório é o resultado prático das aulas de backend do curso técnico do IFSP – Campus Caraguatatuba. A ideia aqui não é só "rodar o código e pronto" — é entender **por que** cada peça existe: por que separar em módulos, por que usar DTOs, por que o Prisma facilita (e muito) a vida com banco de dados.

Documentei tudo do jeito que eu mesma gostaria de ter lido quando comecei: sem economizar explicação, mas também sem academiquês.

> Se você também é aluna ou aluno e caiu aqui pesquisando, espero que esse README te ajude a entender o projeto rapidinho.

---

## Sumário

- [O que é esse projeto](#o-que-é-esse-projeto)
- [O que eu aprendi construindo isso](#o-que-eu-aprendi-construindo-isso)
- [Tecnologias usadas](#tecnologias-usadas)
- [Como rodar com Docker](#como-rodar-com-docker)
- [Banco de dados](#banco-de-dados)
- [Como rodar localmente](#como-rodar-localmente-sem-docker)
- [Testes](#testes)
- [Créditos](#créditos)

---

## O que é esse projeto

É uma **API backend completa em NestJS**, construída seguindo boas práticas modernas de engenharia de software — nada de "código que funciona e ninguém entende depois".

Ela serve como base prática para as aulas técnicas do IFSP, cobrindo desde a arquitetura do backend até a integração com banco de dados via Docker.

---

## O que eu aprendi construindo isso

Ao longo do projeto fui treinando, na prática:

- Construção de **APIs REST** com NestJS
- Arquitetura baseada em **módulos, controllers e services**
- **Injeção de dependência** (e por que isso facilita testes e manutenção)
- ORM com **Prisma**
- Validação de dados com **DTOs e Pipes**
- Autenticação com **JWT**
- **Upload de arquivos**
- Documentação automática com **Swagger**
- Testes automatizados com **Jest**
- Boas práticas de código (princípios **SOLID**)

---



## Tecnologias usadas

- Node.js 24.x
- NestJS
- TypeScript
- Prisma ORM
- Docker

---

## Como rodar com Docker

A forma mais rápida de testar o projeto sem precisar instalar nada além do Docker:

```bash
docker compose up --build
```

Depois acesse: **http://localhost:4000**

---

## Banco de dados

Por padrão, o projeto está configurado para usar um banco **externo**:

```env
DATABASE_URL=mysql://root:senha@host.docker.internal:3306/nome_do_banco
```

### Quer subir o MySQL junto, dentro do Docker?

Adicione isso ao seu `docker-compose.yml`:

```yaml
services:
  db:
    image: mysql:8
    container_name: mysql-nest
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: nest_prisma
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

E ajuste a variável de ambiente para apontar pro serviço do banco (não mais pro `host.docker.internal`):

```env
DATABASE_URL=mysql://root:root@db:3306/nest_prisma
```

> Dica: o nome `db` ali precisa ser exatamente igual ao nome do serviço que você colocou no `docker-compose.yml`.

---

## Como rodar localmente (sem Docker)

```bash
npm install
npm run start:dev
```

---

## Testes

```bash
npm run test       # testes unitários
npm run test:e2e   # testes end-to-end
npm run test:cov   # cobertura de testes
```

---


## Créditos

Projeto e documentação adaptada por **Camilly**, aluna do IFSP – Campus Caraguatatuba (Técnico em Informática para Internet).

Crédito especial ao **professor Denny Azevedo**, que deu essas aulas e ensinou todo o conteúdo que tornou esse projeto possível.

---

## Licença

Distribuído sob a licença **MIT**.

---

