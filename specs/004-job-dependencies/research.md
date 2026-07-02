# Research: Job Dependencies

## Decisions

- Times: store datetimes in UTC in the DB; convert to user's locale on the frontend.
- Cycle detection: detect circular job dependency graphs at template-save using DFS/topological check and reject save with explanatory error.
- Representation: store `prerequisiteJobIds` as an ordered array of TemplateJob IDs (UUID or integer depending on existing model).

## Alternatives considered

- Using a separate dependency edge table vs storing ids on the job record: chosen to store IDs on the job record for simplicity and because sheet sizes are small.

## Rationale

- Simplicity and compatibility with the existing SQLite single-file setup.
- Avoids additional join complexity for small job graphs; trade-off is easier read/write and simpler cloning semantics.

**Research complete**
