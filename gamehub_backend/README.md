# GameHub Backend

General-purpose NestJS backend with RealWorld-compatible article contracts.

## API Contracts

Base URL prefix: `/api`

### GET `/api/articles`
Query parameters:
- `limit` (optional, default: `10`)
- `offset` (optional, default: `0`)

Response:
```json
{
  "articles": [
    {
      "slug": "how-to-learn-javascript-efficiently",
      "title": "How to Learn JavaScript Efficiently",
      "description": "A comprehensive guide...",
      "body": "Learning JavaScript...",
      "tagList": ["javascript", "webdev"],
      "createdAt": "2026-09-19T00:00:00.000Z",
      "author": {
        "username": "johndoe",
        "image": ""
      }
    }
  ],
  "articlesCount": 1
}
```

### GET `/api/articles/:slug`
Response:
```json
{
  "article": {
    "slug": "how-to-learn-javascript-efficiently",
    "title": "How to Learn JavaScript Efficiently",
    "description": "A comprehensive guide...",
    "body": "Learning JavaScript...",
    "tagList": ["javascript", "webdev"],
    "createdAt": "2026-09-19T00:00:00.000Z",
    "author": {
      "username": "johndoe",
      "image": ""
    }
  }
}
```

Not found response:
```json
{
  "errors": {
    "body": ["Article not found: some-slug"]
  }
}
```

## Local Development

```bash
npm install
npm run start:dev
```

## Tests

```bash
npm run test
npm run test:e2e
```

## Docker Deployment

This project includes DynamoDB Local and backend container setup.

```bash
docker compose up --build
```

Containers:
- `gamehub_dynamodb` on port `8000`
- `gamehub_backend` on port `3000`

Environment variables used by backend:
- `AWS_REGION`
- `DYNAMODB_ENDPOINT`
- `ARTICLES_TABLE_NAME`
- `DYNAMODB_INIT` (`true` to auto-create table)

## AWS SAM Infrastructure + Deployment

This repository now includes a full SAM setup for deploying backend code and infrastructure together.

### Included

- `template.yaml`: Lambda + API Gateway (HTTP API) + DynamoDB table
- `src/lambda.ts`: Lambda runtime entry for NestJS
- `Makefile`: SAM build rule for `BackendFunction`
- `scripts/sam-setup.sh`: one-time guided setup
- `scripts/sam-deploy.sh`: repeatable deploy for code changes

### One-Time Setup

```bash
npm install
npm run sam:setup
```

What `sam:setup` does:

1. `sam build` for Lambda artifact
2. `sam deploy --guided` to create stack and `samconfig.toml`

### Deploy After Code Changes

```bash
npm run sam:deploy
```

What `sam:deploy` does:

1. Rebuilds artifacts via `sam build`
2. Deploys latest code + template updates via `sam deploy`

### Deploy Lambda Code Only (No Infra Changes)

Use this when only backend code changed and you do not want CloudFormation/template updates.

```bash
AWS_REGION=us-west-2 npm run lambda:deploy-code
```

Optional overrides:

- `STACK_NAME` (default: `gamehub-service`)
- `FUNCTION_NAME` (if you want to bypass stack lookup)

### Backfill Existing Article Localizations

To pre-generate missing `en` / `ja` article content for all stored posts:

```bash
npm run articles:backfill-localizations
```

Optional environment overrides:

- `AWS_REGION`
- `ARTICLES_TABLE_NAME`
- `API_BASE_URL`
- `LANGUAGES` (default: `en ja`)

What `lambda:deploy-code` does:

1. Builds NestJS (`npm run build`)
2. Packs `dist` + production dependencies into a zip
3. Runs `aws lambda update-function-code`
4. Waits until function update completes

### Key Parameters / Env

- `EnvironmentName` (SAM parameter, default `dev`)
- `CorsOrigins` (SAM parameter)
- `ARTICLES_TABLE_NAME` (wired to provisioned DynamoDB table)
- `BlogImagesBucket`
- `BlogImagesRegion`
- `BlogImagesPublicBaseUrl`
- `BlogTranslateRegion`
