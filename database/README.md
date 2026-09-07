# Database

PostgreSQL is the transactional source of truth for the Autonomous AI Agency.

## Layout

```text
database/
├── migrations/
│   └── 0001_initial_schema.sql
└── seeds/
    └── 0001_roles.sql
```

## Local development

Create a PostgreSQL database named `autonomous_ai_agency`, set `DATABASE_URL`, and apply migrations in filename order.

The application should never silently create production tables at runtime.

## Migration rules

1. Use forward-only migrations for shared environments.
2. Review destructive changes separately.
3. Keep seed data deterministic and secret-free.
4. Test migrations against a clean database in CI.
5. Back up production before risky schema changes.
