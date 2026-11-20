import { describe, expect, it } from "vitest";
import { readConfig } from "./config.ts";

describe("readConfig", () => {
  it("reads the plugin token and website from the environment", () => {
    expect(
      readConfig({
        CRISP_TOKEN_IDENTIFIER: "id",
        CRISP_TOKEN_KEY: "key",
        CRISP_WEBSITE_ID: "site",
      }),
    ).toEqual({ identifier: "id", key: "key", websiteId: "site" });
  });

  it("names missing variables without echoing any values", () => {
    expect(() => readConfig({ CRISP_TOKEN_KEY: "secret-value" })).toThrow(
      "Missing or empty environment variables: CRISP_TOKEN_IDENTIFIER, CRISP_WEBSITE_ID",
    );
  });
});
