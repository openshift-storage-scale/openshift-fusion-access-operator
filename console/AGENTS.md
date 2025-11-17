# Agents

## Development guidelines

### Code organization

This project follows the **MVVM (Model-View-ViewModel) pattern** adapted for React. The codebase is organized into three main layers under the `src/` directory:

- **`data/`** - Data layer
- **`domain/`** - Domain layer (optional, for complex business logic)
- **`ui/`** - UI layer

This architecture is based on the principles outlined in the [Flutter app architecture guide](https://docs.flutter.dev/app-architecture/guide). **Despite the reference to Flutter, all generated code MUST be idiomatic React code** that follows these architectural principles.

#### Data Layer (`src/data/`)

The data layer is responsible for data access and management:

- **`services/`** - Services wrap API endpoints and external data sources. They expose asynchronous operations (e.g., `Promise` objects) and hold no state. There should be one service class per data source (e.g., REST endpoints, Kubernetes API calls).
- **`repositories/`** - Repositories expose data streams and state to the rest of the application. They typically use React hooks (e.g., `useK8sWatchResource`) and wrap services. Repositories expose normalized data models and handle data loading states. A repository can use multiple services, and multiple repositories can use the same service.
- **`models/`** - Contains data model definitions, including GroupVersionKind (GVK) definitions for Kubernetes resources.

**Key principles:**
- Services should never be aware of repositories or view models
- Repositories should never be aware of each other
- Repositories expose data through React hooks that return objects with `loaded`, `error`, and data properties

#### Domain Layer (`src/domain/`)

The domain layer contains business logic and use-cases:

- **`use-cases/`** - Use-cases encapsulate complex business logic that would otherwise clutter view models. They are implemented as React hooks and are used when:
  - Logic requires merging data from multiple repositories
  - Logic is exceedingly complex
  - Logic will be reused by different view models
- **`models/`** - Contains domain models that represent business concepts (e.g., `Lun`, `Route`).

**Key principles:**
- Use-cases depend on repositories (not services directly)
- Use-cases can depend on multiple repositories
- Use-cases are optional - only add them when needed to reduce complexity in view models
- View models can access repositories directly for simple cases, or use-cases for complex logic

#### UI Layer (`src/ui/`)

The UI layer contains the presentation logic and React components:

- **`view-models/`** - View models prepare data for views and handle UI-specific logic. They are implemented as React hooks that:
  - Consume repositories and/or use-cases
  - Transform data for presentation
  - Handle form state and validation
  - Manage UI interactions
- **`views/`** - React components that render the UI. Views should be as presentational as possible and consume view models to get data and event handlers.
- **`services/`** - UI-specific services (e.g., localization, theming).

**Key principles:**
- Views should be presentational and consume view models
- View models can use multiple repositories and/or use-cases
- View models handle UI-specific concerns (form validation, loading states, error handling)
- Views should not directly access repositories or services

#### Architecture Flow

```
Views → View Models → Use-cases (optional) → Repositories → Services → External APIs
```

**Example flow:**
1. A View component calls a View Model hook
2. The View Model may use a Use-case hook for complex business logic
3. The Use-case or View Model uses Repository hooks to access data
4. Repositories use Services to make API calls
5. Data flows back up through the layers

**Important:** When generating code, always produce idiomatic React code (using hooks, functional components, TypeScript) while adhering to these architectural principles.

### PR instructions
- Follow the [Conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) style for commit messages.
- Always sign-off commits using `git commit -s` flag.
- Always run `npm run i18n` to verify localized strings are up-to-date.
- Lint and format code before commiting using `npm run lint` and `npm run format` respectively.
