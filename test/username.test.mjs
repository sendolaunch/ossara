// Headless rules test for hero usernames. Run: node test/username.test.mjs
import { validateUsername, usernameKey, USERNAME_RE } from "../src/sim/username.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));

// valid
for (const n of ["Warden", "ab_c", "x-y_9", "ABCDEFghij012345" /*16*/, "a1b"]) {
  ok(validateUsername(n).ok, `valid: "${n}"`);
}
// invalid
ok(!validateUsername("ab").ok, "too short");
ok(!validateUsername("a".repeat(17)).ok, "too long");
ok(!validateUsername("bad name").ok, "space rejected");
ok(!validateUsername("oops!").ok, "punctuation rejected");
ok(!validateUsername("emoji😀x").ok, "emoji rejected");
ok(!validateUsername("  ").ok, "blank rejected");
ok(!validateUsername("Admin").ok, "reserved (case-insensitive)");
ok(!validateUsername("OSSARA").ok, "reserved brand");

// normalization: trims, key is lowercased
{
  const r = validateUsername("  Warden  ");
  ok(r.ok && r.value === "Warden", "trims surrounding space");
  ok(r.key === "warden", "key is lowercased");
}
ok(usernameKey("FooBar") === "foobar", "usernameKey lowercases");

// regex matches the DB CHECK shape
ok(USERNAME_RE.test("Good_1") && !USERNAME_RE.test("no"), "regex sanity");

console.log(`username: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
