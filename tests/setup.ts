import "@testing-library/jest-dom";

process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'mock-project-id';
process.env.NEXT_PUBLIC_SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';


// Never use a developer's hosted credentials in unit tests.
process.env.TURSO_DATABASE_URL = "libsql://unit-tests.invalid";
process.env.TURSO_AUTH_TOKEN = "unit-test-token";
