import { SummaryTemplateKey } from "./meeting";

export interface CustomHighlightType {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  order: number;
}

export interface WorkspaceSettings {
  recording: {
    autoRecordMode: "all" | "external" | "internal" | "manual";
    consentPreference: "required" | "remember" | "disabled";
    botDisplayName: string;
  };
  summaries: {
    defaultTemplate: SummaryTemplateKey;
    autoExtractActions: boolean;
  };
  highlights: {
    types: CustomHighlightType[];
  };
  sharing: {
    defaultVisibility: "private" | "team" | "public";
  };
}
