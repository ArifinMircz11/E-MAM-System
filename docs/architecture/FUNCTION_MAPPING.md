# FUNCTION_MAPPING

This document maps the functions used from Legacy Repositories to their consumers, along with the Modern Repository replacement and its risk level (Phase 1B).

| Legacy Repository | Function | Consumer | Replacement | Risk Level |
|---|---|---|---|---|
| `systemRepository` | `getAbout()`, etc. | `useAboutContent` | `src/database/repositories/systemRepository` (needs creation/migration) | P3 |
| `authRepository` | `getCurrentUser()`, etc. | `useAppInitialization` | `AuthRepository` | P0 |
| `user.repository` | CRUD operations | `user.service` | `userRepository` | P0 |
| `MessageRepository` | `send()`, `getConversation()`, etc. | `useMessages`, `useConversation`, `MessagingService` | `messageRepository` | P1 |

*Note: Further analysis will be needed to map each individual function signature as the migration begins, but these are the active dependencies identified.*
