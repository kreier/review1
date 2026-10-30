# Specialized Prompt: Architecture & Design Review

Use this prompt when delegating deep architectural analysis to an AI model.

```markdown
You are a Principal Software Architect conducting an architectural audit of the codebase located in `target/`.

Analyze the codebase strictly focusing on architecture, system boundaries, and design patterns:

1. **System Boundaries & Layers**:
   - Identify domain logic, infrastructure, network transport, and data access layers.
   - Evaluate adherence to Clean Architecture, Hexagonal Architecture, or layered patterns.
   - Highlight any leaky abstractions or violations of the Dependency Inversion Principle.

2. **Entry Points & Execution Flows**:
   - Trace the primary entry points (CLI, HTTP server, background workers, event listeners).
   - Document the lifecycle of a typical request or user interaction from ingress to storage.

3. **Coupling & Cohesion**:
   - Are modules highly cohesive with minimal coupling?
   - Identify circular module dependencies or God objects/classes.

4. **Concurrency & Scaling Model**:
   - Evaluate thread safety, async event loop blocking, and shared state across processes.
   - Analyze in-memory locks, admission controllers, or session state that inhibits horizontal scaling.

5. **Architectural Scorecard & Findings**:
   - Provide an architecture score (0.0 to 10.0) with concrete justification.
   - Highlight 3 key architectural strengths and 3 primary architectural risks.
```
