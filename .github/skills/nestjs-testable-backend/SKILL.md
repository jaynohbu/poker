---
name: nestjs-testable-backend
description: "Use when creating or refactoring NestJS backend code with strict testability rules: function/class body under 50 lines, dependency injection for all dependencies, and unit tests with mocks/stubs for every function."
---

# NestJS Testable Backend Skill

## Goal
Produce backend code that is small, injectable, and unit-test-first.

## Rules
- Keep each function, method, and class implementation under 50 lines.
- Make all dependencies injectable.
- Use interfaces and provider tokens for external dependencies.
- Add or update unit tests for every function or method created or changed.
- Use mocks or stubs for all dependencies in tests.

## Implementation Pattern
1. Define contract interfaces first.
2. Implement service/use-case with constructor injection.
3. Keep controller minimal.
4. Add unit tests for each public method and helper function.
5. Verify no direct AWS SDK calls inside tests.

## Test Pattern
- Arrange: create SUT with mocked dependencies.
- Act: execute one method.
- Assert: result and dependency interactions.
- Cover success, validation failure, and dependency failure.
