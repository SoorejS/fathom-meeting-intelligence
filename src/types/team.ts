export type MeetingVisibility = "personal" | "team";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}
