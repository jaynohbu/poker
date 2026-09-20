# Backend Coding Guardrails

Apply these rules to all backend work in this workspace.

## Mandatory Rules
- Keep each function, method, and class implementation under 50 lines.
- Use dependency injection for all dependencies.
- Do not instantiate infrastructure dependencies directly inside domain or application logic.
- Add unit tests for all functions and methods touched or created.
- In unit tests, inject dependencies with mock or stub objects.

## NestJS Conventions
- Prefer constructor injection with interfaces via provider tokens.
- Keep controllers thin and delegate logic to services/use-cases.
- Keep business logic out of modules and controllers.

## Testing Conventions
- Use Jest.
- Arrange-Act-Assert structure.
- Mock external systems (DynamoDB, network, filesystem, clock, random).
- Do not call real AWS in unit tests.

## Delivery Checklist
- Function and class sizes checked (< 50 lines).
- Dependencies injectable.
- Unit tests added and passing.
- No hidden singleton dependencies.
