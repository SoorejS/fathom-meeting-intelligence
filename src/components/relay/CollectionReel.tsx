"use client";
import { useEffect, useState } from "react";
import type { Meeting } from "@/types/meeting";
import type { Playlist } from "@/types/playlist";
import { resolvePlaylistClips } from "@/services/playlistService";
import { formatTime } from "@/lib/testCallMeeting";
import { Dialog } from "./Dialog";
export function CollectionReel({
  list,
  meetings,
  onClose,
  onOpen,
}: {
  list: Playlist;
  meetings: Meeting[];
  onClose(): void;
  onOpen(id: string, time: number): void;
}) {
  const clips = resolvePlaylistClips(list, meetings),
    [index, setIndex] = useState(0),
    [elapsed, setElapsed] = useState(0),
    [paused, setPaused] = useState(false);
  const clip = clips[index],
    duration = clip
      ? Math.max(
          1,
          Math.min(
            15,
            (meetings.find((m) => m.id === clip.meetingId)?.duration || 0) -
              clip.timestamp,
          ),
        )
      : 1;
  useEffect(() => {
    if (paused || !clip) return;
    const timer = setTimeout(() => {
      if (elapsed + 1 >= duration) {
        if (index + 1 < clips.length) {
          setIndex(index + 1);
          setElapsed(0);
        } else {
          setElapsed(duration);
          setPaused(true);
        }
      } else setElapsed(elapsed + 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [paused, clip, elapsed, duration, index, clips.length]);
  return (
    <Dialog title={list.title + " · Reel"} onClose={onClose}>
      {clip ? (
        <>
          <p className="eyebrow">
            Simulated reel · {index + 1} of {clips.length}
          </p>
          <h3>{clip.meetingTitle}</h3>
          <p>{clip.highlightText}</p>
          <p>
            {formatTime(clip.timestamp + elapsed)} · {clip.highlightType}
          </p>
          <progress value={elapsed} max={duration} />
          <div className="button-row">
            <button
              className="secondary"
              disabled={!index}
              onClick={() => {
                setIndex(index - 1);
                setElapsed(0);
              }}
            >
              Previous
            </button>
            <button
              className="primary"
              onClick={() => {
                if (elapsed >= duration) {
                  setIndex(0);
                  setElapsed(0);
                }
                setPaused(!paused);
              }}
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              className="secondary"
              disabled={index === clips.length - 1}
              onClick={() => {
                setIndex(index + 1);
                setElapsed(0);
              }}
            >
              Next
            </button>
            <button
              className="text-button"
              onClick={() => {
                onOpen(clip.meetingId, clip.timestamp + elapsed);
                onClose();
              }}
            >
              Open source session
            </button>
          </div>
        </>
      ) : (
        <p>No available moments in this collection.</p>
      )}
    </Dialog>
  );
}
