"use client";

import {
  Video,
  Calendar,
  Sparkles,
  Plug,
  Database,
  Radio,
} from "lucide-react";

interface WorkspaceIntegrationsProps {
  onStartCall?(): void;
  onViewUpcoming?(): void;
}

export function WorkspaceIntegrations({
  onStartCall,
  onViewUpcoming,
}: WorkspaceIntegrationsProps) {
  const conferencing = [
    {
      name: "Zoom",
      description: "External meeting capture simulated in browser",
      status: "Not connected",
      detail: "Browser Test Call available",
      action: "Test Call",
      onAction: onStartCall,
    },
    {
      name: "Google Meet",
      description: "External meeting capture simulated in browser",
      status: "Not connected",
      detail: "Browser Test Call available",
      action: "Test Call",
      onAction: onStartCall,
    },
    {
      name: "Microsoft Teams",
      description: "External meeting capture simulated in browser",
      status: "Not connected",
      detail: "Browser Test Call available",
      action: "Test Call",
      onAction: onStartCall,
    },
  ];

  const calendars = [
    {
      name: "Google Calendar",
      description: "Sync scheduled calls and arm Notetaker automatically",
      status: "Preview",
      detail: "Demo calendar active with 3 seeded sessions",
      action: "View schedule",
      onAction: onViewUpcoming,
    },
    {
      name: "Microsoft Outlook",
      description: "Sync scheduled calls and arm Notetaker automatically",
      status: "Preview",
      detail: "Demo schedule synchronized",
      action: "View schedule",
      onAction: onViewUpcoming,
    },
  ];

  const apps = [
    {
      name: "Claude by Anthropic",
      description: "Ask questions and retrieve intelligence across session transcripts",
      status: "Preview",
      detail: "In-app meeting Q&A ready",
    },
    {
      name: "ChatGPT by OpenAI",
      description: "Ask questions and retrieve intelligence across session transcripts",
      status: "Preview",
      detail: "In-app meeting Q&A ready",
    },
    {
      name: "Slack",
      description: "Publish meeting briefs, decision takeaways, and moment clips to team channels",
      status: "Not connected",
      detail: "Integration preview only",
    },
    {
      name: "Salesforce CRM",
      description: "Sync participant interactions, call summaries, and deals to customer records",
      status: "Not connected",
      detail: "Integration preview only",
    },
    {
      name: "HubSpot",
      description: "Keep deal conversations and action items attached to CRM contacts",
      status: "Not connected",
      detail: "Integration preview only",
    },
    {
      name: "Zapier",
      description: "Automate custom triggers and push session artifacts to 5,000+ apps",
      status: "Not connected",
      detail: "Integration preview only",
    },
    {
      name: "Task Manager (Linear, Asana, Jira)",
      description: "Export action items directly to your issue tracker and project boards",
      status: "Not connected",
      detail: "Integration preview only",
    },
  ];

  const infrastructure = [
    {
      name: "PostgreSQL Database",
      description: "Relational persistence for sessions, transcripts, action items, moments, and playlists",
      status: "Connected",
      detail: "Neon serverless PostgreSQL",
    },
    {
      name: "Relay Intelligence API",
      description: "High-performance REST API routing workspace search, Q&A retrieval, and state",
      status: "Connected",
      detail: "Active · 34 test suites passing",
    },
  ];

  return (
    <div className="integrations-container">
      {/* Video Conferencing */}
      <section className="preference-card">
        <h2>
          <Video size={20} />
          Video conferencing
        </h2>
        <p>
          External conferencing capture is simulated safely within the browser sandbox.
          Start a browser Test Call to verify recording consent, live transcription, and
          intelligence generation.
        </p>
        <div className="integration-list">
          {conferencing.map((item) => (
            <div className="integration-row" key={item.name}>
              <div className="integration-icon">
                <Radio size={18} />
              </div>
              <div className="integration-info">
                <div className="integration-title-line">
                  <strong>{item.name}</strong>
                  <span className="tag">{item.status}</span>
                </div>
                <p>{item.description} · <span className="muted">{item.detail}</span></p>
              </div>
              {item.action && item.onAction && (
                <button
                  type="button"
                  className="secondary small"
                  onClick={item.onAction}
                >
                  {item.action}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Calendar */}
      <section className="preference-card">
        <h2>
          <Calendar size={20} />
          Calendars & scheduled sessions
        </h2>
        <p>
          Connect work calendars to automatically discover upcoming meetings, arm the
          Notetaker based on your auto-record policy, and join calls with one click.
        </p>
        <div className="integration-list">
          {calendars.map((item) => (
            <div className="integration-row" key={item.name}>
              <div className="integration-icon">
                <Calendar size={18} />
              </div>
              <div className="integration-info">
                <div className="integration-title-line">
                  <strong>{item.name}</strong>
                  <span className="tag status-preview">{item.status}</span>
                </div>
                <p>{item.description} · <span className="muted">{item.detail}</span></p>
              </div>
              {item.action && item.onAction && (
                <button
                  type="button"
                  className="secondary small"
                  onClick={item.onAction}
                >
                  {item.action}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Connected Apps */}
      <section className="preference-card">
        <h2>
          <Plug size={20} />
          Connected apps & intelligence
        </h2>
        <p>
          Integration previews only. No external accounts are connected and no private
          meeting data is transmitted off-device without explicit user authorization.
        </p>
        <div className="integration-list">
          {apps.map((item) => (
            <div className="integration-row" key={item.name}>
              <div className="integration-icon">
                {item.name.includes("Claude") || item.name.includes("ChatGPT") ? (
                  <Sparkles size={18} />
                ) : (
                  <Plug size={18} />
                )}
              </div>
              <div className="integration-info">
                <div className="integration-title-line">
                  <strong>{item.name}</strong>
                  <span
                    className={`tag ${
                      item.status === "Connected"
                        ? "status-connected"
                        : item.status === "Preview"
                          ? "status-preview"
                          : ""
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p>{item.description} · <span className="muted">{item.detail}</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Database & Infrastructure */}
      <section className="preference-card">
        <h2>
          <Database size={20} />
          Data persistence & API
        </h2>
        <p>
          Relay stores your conversations, moments, playlists, trackers, and preferences
          in PostgreSQL via Neon. Data remains stable across refreshes and restarts.
        </p>
        <div className="integration-list">
          {infrastructure.map((item) => (
            <div className="integration-row" key={item.name}>
              <div className="integration-icon">
                <Database size={18} />
              </div>
              <div className="integration-info">
                <div className="integration-title-line">
                  <strong>{item.name}</strong>
                  <span className="tag status-connected">
                    <span className="status-dot" />
                    {item.status}
                  </span>
                </div>
                <p>{item.description} · <span className="muted">{item.detail}</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
