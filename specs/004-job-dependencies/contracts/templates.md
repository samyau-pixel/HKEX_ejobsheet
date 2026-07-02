# API Contracts: Templates

## POST /api/templates
Create or update a jobsheet template. Request body includes jobs with dependency metadata.

Request (partial):

{
  "id": "optional",
  "title": "",
  "jobs": [
    {
      "id": "",
      "title": "",
      "order": 1,
      "timeDependency": "2026-07-02T14:30:00Z", // optional
      "prerequisiteJobIds": ["job-1", "job-2"] // optional
    }
  ]
}

Responses:
- 200 OK: saved template
- 400 Bad Request: validation error (e.g., circular dependency detected)

