# goal-app

### Generating Model Objects
`npx openapi-typescript ./shared/openapi.yaml --output ./shared/api-types.ts`

`cd server && oapi-codegen -generate types -o models/models.go ../shared/openapi.yaml`