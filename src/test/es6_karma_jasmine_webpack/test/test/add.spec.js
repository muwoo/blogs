/**
 * @author muwoo
 * Date: 2018/8/16
 */
import add from '../../add'

describe("加法函数的测试", function() {
  it("1 加 1 等于 2", function() {
    expect(add(1, 1)).toBe(2);
  });
  it("1 加 1 等于 3", function() {
    expect(add(1, 1)).toBe(3);
  });
});
