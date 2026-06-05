import assert from "node:assert/strict";
import test from "node:test";
import {
  BUILDER_ROLE_NAME,
  WELCOME_CHANNEL_NAME,
  buildAssignRoleRequest,
} from "./worker.js";

test("uses the existing Discord server names", () => {
  assert.equal(BUILDER_ROLE_NAME, "Builder");
  assert.equal(WELCOME_CHANNEL_NAME, "witaj");
});

test("assign role request does not send an unsupported JSON body", () => {
  assert.deepEqual(buildAssignRoleRequest(), { method: "PUT" });
});
