import { TeamMember, MeetingVisibility } from "../types/team";
import { Meeting } from "../types/meeting";

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "tm_you", name: "Demo Reviewer (You)", role: "Workspace Admin", initials: "S", color: "bg-[#e85a38]" },
  { id: "tm_sarah", name: "Sarah Chen", role: "VP of Engineering", initials: "SC", color: "bg-blue-600" },
  { id: "tm_alex", name: "Alex Rivera", role: "Head of Product", initials: "AR", color: "bg-cyan-500" },
  { id: "tm_marcus", name: "Marcus Vance", role: "Head of Growth", initials: "MV", color: "bg-emerald-500" },
  { id: "tm_elena", name: "Elena Rostova", role: "Lead Product Designer", initials: "ER", color: "bg-purple-500" },
];

export function getMeetingOwner(meetingId: string): TeamMember {
  switch (meetingId) {
    case "m_prod_strategy":
      return TEAM_MEMBERS[2]; // Alex Rivera
    case "m_eng_standup":
      return TEAM_MEMBERS[1]; // Sarah Chen
    case "m_fintech_demo":
      return TEAM_MEMBERS[3]; // Marcus Vance
    case "m_acme_onboarding":
      return TEAM_MEMBERS[0]; // Demo Reviewer (You)
    case "m_hiring_eng":
      return TEAM_MEMBERS[1]; // Sarah Chen
    case "m_healthsync_feedback":
      return TEAM_MEMBERS[4]; // Elena Rostova
    default:
      return TEAM_MEMBERS[0]; // Demo Reviewer (You)
  }
}

export function getDefaultMeetingVisibility(meetingId: string): MeetingVisibility {
  if (meetingId === "m_acme_onboarding" || meetingId.startsWith("test_call_")) {
    return "personal";
  }
  return "team";
}

export function filterMeetingsByTeammate(
  meetings: Meeting[],
  teammateName: string,
  visibilities: Record<string, MeetingVisibility>
): Meeting[] {
  if (!teammateName || teammateName === "All") {
    // Only return team-visible meetings for Team Calls
    return meetings.filter(
      (m) => (visibilities[m.id] || getDefaultMeetingVisibility(m.id)) === "team"
    );
  }

  return meetings.filter((m) => {
    const isTeam = (visibilities[m.id] || getDefaultMeetingVisibility(m.id)) === "team";
    if (!isTeam) return false;

    const owner = getMeetingOwner(m.id);
    const isOwner = owner.name === teammateName;
    const isAttendee = m.participants.some((p) => p.name === teammateName);
    return isOwner || isAttendee;
  });
}
