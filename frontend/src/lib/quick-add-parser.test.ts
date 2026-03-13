import { describe, expect, it } from "vitest";

import { parseQuickAddText } from "./quick-add-parser";

const referenceDate = new Date(2026, 2, 13, 9, 0, 0);

describe("parseQuickAddText", () => {
  it("keeps legacy token syntax working", () => {
    const parsed = parseQuickAddText("Update metrics /work @tomorrow !high", [], {
      referenceDate,
    });

    expect(parsed.title).toBe("Update metrics");
    expect(parsed.tagQuery).toBe("work");
    expect(parsed.priority).toBe("HIGH");
    expect(parsed.deadline).toBe("2026-03-14T23:59");
    expect(parsed.deadlineConfidence).toBe("HIGH");
  });

  it("parses accented Vietnamese sentence with explicit time", () => {
    const parsed = parseQuickAddText("Học tiếng Anh lúc 8h tối mai", [], {
      referenceDate,
    });

    expect(parsed.title).toBe("Học tiếng Anh");
    expect(parsed.deadline).toBe("2026-03-14T20:00");
    expect(parsed.deadlineConfidence).toBe("HIGH");
  });

  it("removes trailing 'nay' in phrases like 4h chieu nay", () => {
    const parsed = parseQuickAddText("học tiếng anh 4h chiều nay", [], {
      referenceDate,
    });

    expect(parsed.title).toBe("học tiếng anh");
    expect(parsed.deadline).toBe("2026-03-13T16:00");
    expect(parsed.deadlineConfidence).toBe("HIGH");
  });

  it("parses weekday phrases with explicit time", () => {
    const parsed = parseQuickAddText("Nộp báo cáo thứ 2 tuần sau 9h sáng", [], {
      referenceDate,
    });

    expect(parsed.title).toBe("Nộp báo cáo");
    expect(parsed.deadline).toBe("2026-03-16T09:00");
    expect(parsed.deadlineConfidence).toBe("HIGH");
  });

  it("parses fuzzy time phrases and marks them medium confidence", () => {
    const parsed = parseQuickAddText("Hop team dau gio chieu mai", [], {
      referenceDate,
    });

    expect(parsed.title).toBe("Hop team");
    expect(parsed.deadline).toBe("2026-03-14T13:00");
    expect(parsed.deadlineConfidence).toBe("MEDIUM");
  });

  it("parses weekend phrases without forcing explicit time", () => {
    const parsed = parseQuickAddText("Chuẩn bị demo cuối tuần", [], {
      referenceDate,
    });

    expect(parsed.title).toBe("Chuẩn bị demo");
    expect(parsed.deadline).toBe("2026-03-14T23:59");
    expect(parsed.deadlineConfidence).toBe("MEDIUM");
  });

  it("avoids false positives for titles with numbers only", () => {
    const parsed = parseQuickAddText("Mua 2 cuốn sách", [], {
      referenceDate,
    });

    expect(parsed.title).toBe("Mua 2 cuốn sách");
    expect(parsed.deadline).toBeNull();
    expect(parsed.deadlineConfidence).toBeNull();
  });

  it("parses relative day offsets like 3 ngay nua", () => {
    const parsed = parseQuickAddText("Gửi proposal 3 ngày nữa", [], {
      referenceDate,
    });

    expect(parsed.title).toBe("Gửi proposal");
    expect(parsed.deadline).toBe("2026-03-16T23:59");
    expect(parsed.deadlineConfidence).toBe("MEDIUM");
  });

  it("parses next weekday phrases like thu 6 toi", () => {
    const parsed = parseQuickAddText("Review sprint thứ 6 tới 7h tối", [], {
      referenceDate,
    });

    expect(parsed.title).toBe("Review sprint");
    expect(parsed.deadline).toBe("2026-03-20T19:00");
    expect(parsed.deadlineConfidence).toBe("HIGH");
  });

  it("parses end-of-month phrases", () => {
    const parsed = parseQuickAddText("Hoàn tất KPI cuối tháng", [], {
      referenceDate,
    });

    expect(parsed.title).toBe("Hoàn tất KPI");
    expect(parsed.deadline).toBe("2026-03-31T23:59");
    expect(parsed.deadlineConfidence).toBe("MEDIUM");
  });

  it("parses after-work phrases as fuzzy evening deadlines", () => {
    const parsed = parseQuickAddText("Đi siêu thị sau giờ làm", [], {
      referenceDate,
    });

    expect(parsed.title).toBe("Đi siêu thị");
    expect(parsed.deadline).toBe("2026-03-13T18:00");
    expect(parsed.deadlineConfidence).toBe("MEDIUM");
  });
});