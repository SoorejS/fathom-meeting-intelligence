import { Playlist } from "@/types/playlist";

export const SEEDED_PLAYLISTS: Playlist[] = [
  {
    id: "pl_customer_pain",
    title: "Customer Pain Points & Delight Reel",
    description: "Key customer quotes from Acme Corp and HealthSync calls highlighting quick adoption, time savings, and feature requests.",
    createdAt: "2026-09-19T16:00:00Z",
    updatedAt: "2026-09-19T16:30:00Z",
    items: [
      {
        id: "clip_acme_1",
        meetingId: "m_acme_onboarding",
        highlightId: "h_acme_1",
        order: 0,
        addedAt: "2026-09-19T16:05:00Z",
      },
      {
        id: "clip_acme_3",
        meetingId: "m_acme_onboarding",
        highlightId: "h_acme_3",
        order: 1,
        addedAt: "2026-09-19T16:10:00Z",
      },
      {
        id: "clip_hs_1",
        meetingId: "m_healthsync_feedback",
        highlightId: "h_hs_1",
        order: 2,
        addedAt: "2026-09-19T16:15:00Z",
      },
      {
        id: "clip_hs_2",
        meetingId: "m_healthsync_feedback",
        highlightId: "h_hs_2",
        order: 3,
        addedAt: "2026-09-19T16:20:00Z",
      },
    ],
  },
  {
    id: "pl_q4_milestones",
    title: "Q4 Product & Engineering Milestones",
    description: "Launch readiness takeaways on November 12th launch, caching latency, and expansion deals.",
    createdAt: "2026-09-19T17:00:00Z",
    updatedAt: "2026-09-19T17:45:00Z",
    items: [
      {
        id: "clip_prod_1",
        meetingId: "m_prod_strategy",
        highlightId: "h_prod_1",
        order: 0,
        addedAt: "2026-09-19T17:05:00Z",
      },
      {
        id: "clip_prod_2",
        meetingId: "m_prod_strategy",
        highlightId: "h_prod_2",
        order: 1,
        addedAt: "2026-09-19T17:10:00Z",
      },
      {
        id: "clip_eng_1",
        meetingId: "m_eng_standup",
        highlightId: "h_eng_1",
        order: 2,
        addedAt: "2026-09-19T17:15:00Z",
      },
      {
        id: "clip_fin_1",
        meetingId: "m_fintech_sales",
        highlightId: "h_fin_1",
        order: 3,
        addedAt: "2026-09-19T17:20:00Z",
      },
    ],
  },
];
