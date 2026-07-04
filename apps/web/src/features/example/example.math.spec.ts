import { addOne } from "./example.math";

describe("addOne", () => {
  it("adds one to a number", () => {
    expect(addOne(1)).toBe(2);
  });
});
