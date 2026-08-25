import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertSafeCatalogReset } from "./reset";

describe("assertSafeCatalogReset", () => {
  it("allows local catalog resets against local database URLs", () => {
    assert.doesNotThrow(() => assertSafeCatalogReset({ nodeEnv: "development", databaseUrl: "postgres://user:pass@localhost:5432/anistic_dev" }));
    assert.doesNotThrow(() => assertSafeCatalogReset({ nodeEnv: undefined, databaseUrl: "postgres://user:pass@localhost:5432/anistic" }));
  });

  it("rejects production and non-local reset targets", () => {
    assert.throws(() => assertSafeCatalogReset({ nodeEnv: "production", databaseUrl: "postgres://user:pass@localhost:5432/anistic_dev" }), /production/i);
    assert.throws(() => assertSafeCatalogReset({ nodeEnv: "development", databaseUrl: "postgres://user:pass@db.example.com:5432/anistic" }), /local/i);
  });
});
