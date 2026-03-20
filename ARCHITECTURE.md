```mermaid
  graph TD;
      A[Client] -->|Request| B[Server];
      B --> C[Database];
      B -->|Response| A;
```