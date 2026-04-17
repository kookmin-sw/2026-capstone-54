import { getNotifiableUrl } from "../getNotifiableUrl";

describe("getNotifiableUrl", () => {
  it("returns null when notifiableType is null", () => {
    expect(getNotifiableUrl(null, "uuid-1")).toBeNull();
  });

  it("returns null when notifiableId is null", () => {
    expect(getNotifiableUrl("resumes.resume", null)).toBeNull();
  });

  it("returns null when both arguments are null", () => {
    expect(getNotifiableUrl(null, null)).toBeNull();
  });

  it("maps 'resumes.resume' to /resume/:id", () => {
    expect(getNotifiableUrl("resumes.resume", "uuid-abc")).toBe("/resume/uuid-abc");
  });

  it("maps 'interviews.interviewsession' to /interview/session/:id/report", () => {
    expect(getNotifiableUrl("interviews.interviewsession", "uuid-def")).toBe(
      "/interview/session/uuid-def/report"
    );
  });

  it("maps 'job_descriptions.userjobdescription' to /jd/:id", () => {
    expect(getNotifiableUrl("job_descriptions.userjobdescription", "uuid-ghi")).toBe(
      "/jd/uuid-ghi"
    );
  });

  it("returns null for an unknown notifiableType", () => {
    expect(getNotifiableUrl("unknown.model", "uuid-xyz")).toBeNull();
  });

  it("includes the exact id in the generated URL", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(getNotifiableUrl("resumes.resume", id)).toBe(`/resume/${id}`);
  });
});
