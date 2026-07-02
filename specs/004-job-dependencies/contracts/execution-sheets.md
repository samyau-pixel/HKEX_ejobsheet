# API Contracts: Execution Sheets

## POST /api/executions - Clone template
Clones a template into an execution jobsheet, returning execution job ids and copied dependency metadata.

Request:
{ "templateId": "..." }

Response (partial):
{
  "executionId": "...",
  "jobs": [
    { "id": "exec-1", "templateJobId": "t1", "prerequisiteJobIds": ["exec-2"] }
  ]
}

## POST /api/executions/:executionId/jobs/:jobId/complete
Attempts to mark a job complete. Server validates dependencies (time + job status).

Response:
- 200 OK: job marked complete
- 400 Bad Request: dependencies not met — response includes `reason` and list of unmet prerequisites

