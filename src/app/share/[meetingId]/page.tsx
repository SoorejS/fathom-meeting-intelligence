import { SEEDED_MEETINGS } from "@/data/seededMeetings";
import { MeetingWorkspace } from "@/components/MeetingWorkspace";

export function generateStaticParams() {
  return SEEDED_MEETINGS.map(meeting => ({ meetingId: meeting.id }));
}
export default async function SharedMeeting({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  return <MeetingWorkspace sharedMeetingId={meetingId} />;
}
