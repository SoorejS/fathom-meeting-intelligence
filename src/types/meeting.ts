export interface Participant {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar?: string;
  initials: string;
  color: string;
}

export interface TranscriptSegment {
  id: string;
  meetingId: string;
  speaker: string;
  speakerRole?: string;
  speakerAvatar?: string;
  speakerInitials?: string;
  speakerColor?: string;
  timestamp: number; // in seconds
  timestampFormatted: string; // e.g. "02:15"
  text: string;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  text: string;
  owner: string;
  ownerAvatar?: string;
  ownerInitials?: string;
  ownerColor?: string;
  status: "open" | "completed";
  dueDate?: string;
  sourceTimestamp: number;
  sourceTimestampFormatted: string;
}

export type HighlightType = "Highlight" | "Positive Reaction" | "Needs Review" | "Feedback";

export interface Highlight {
  id: string;
  meetingId: string;
  timestamp: number;
  timestampFormatted: string;
  type: HighlightType;
  text: string;
  creator: string;
  creatorAvatar?: string;
  creatorColor?: string;
}

export interface SummarySection {
  title: string;
  overview: string;
  keyPoints: string[];
  decisions: string[];
  nextSteps: string[];
}

export type SummaryTemplateKey = "default" | "executive" | "sales" | "engineering";

export interface SummaryTemplates {
  default: SummarySection;
  executive: SummarySection;
  sales: SummarySection;
  engineering: SummarySection;
}

export interface AiQnAItem {
  question: string;
  answer: string;
  citationTimestamp?: number;
  citationFormatted?: string;
  contextSnippet?: string;
}

export interface Meeting {
  testCall?: TestCallDescriptor;
  id: string;
  title: string;
  date: string;
  dateFormatted: string;
  duration: number; // in seconds
  durationFormatted: string;
  thumbnail: string;
  videoSampleUrl?: string;
  category: "Product" | "Client" | "Engineering" | "Sales" | "Hiring" | "Customer";
  participants: Participant[];
  summary: SummaryTemplates;
  transcript: TranscriptSegment[];
  actionItems: ActionItem[];
  highlights: Highlight[];
  aiQnA: AiQnAItem[];
}

export interface TestCallDescriptor {
  version: 1;
  id: string;
  title: string;
  date: string;
  duration: number;
  captureMode: "microphone" | "simulated";
  hasLocalAudio: boolean;
}
