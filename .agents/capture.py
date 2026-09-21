#!/usr/bin/env python3
import os
import sys
import json
import re
import glob
import time
from datetime import datetime, timezone

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LOGS_DIR = os.path.join(WORKSPACE_DIR, ".agent-logs")
BRAIN_DIR = r"C:\Users\soore\.gemini\antigravity-ide\brain"
AUTHOR = "Soorej S"
TOOL = "antigravity-ide"
PROJECT = "fathom-ai-clone"
DEFAULT_MODEL = "gemini-3.8-flash"

def format_timestamp(ts):
    if not ts:
        now = datetime.now(timezone.utc)
        return now.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    if ts.endswith("Z"):
        if "." not in ts:
            return ts[:-1] + ".000Z"
        return ts
    return ts

def extract_prompt(content):
    if not content:
        return ""
    m = re.search(r"<USER_REQUEST>(.*?)</USER_REQUEST>", content, re.DOTALL)
    if m:
        return m.group(1).strip("\r\n")
    return content.strip("\r\n")

def is_workspace_session(transcript_path):
    # Check if the transcript belongs to this workspace
    try:
        with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if "Fathom AI - Clone" in line or "fathom-ai-clone" in line:
                    return True
    except Exception:
        pass
    return False

def parse_transcript(transcript_path):
    if not os.path.exists(transcript_path):
        return []
    
    steps = []
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                steps.append(json.loads(line))
            except Exception:
                continue

    turns = []
    cur_turn = None

    for s in steps:
        stype = s.get("type")
        src = s.get("source")
        content = s.get("content") or ""
        created_at = s.get("created_at") or ""
        
        if stype == "USER_INPUT" and src == "USER_EXPLICIT":
            if cur_turn:
                turns.append(cur_turn)
            prompt_text = extract_prompt(content)
            cur_turn = {
                "prompt": prompt_text,
                "prompt_time": format_timestamp(created_at),
                "model": DEFAULT_MODEL,
                "response": None,
                "response_time": None
            }
        elif cur_turn and stype == "PLANNER_RESPONSE" and src == "MODEL":
            if content:
                cur_turn["response"] = content.strip("\r\n")
                cur_turn["response_time"] = format_timestamp(created_at)

    if cur_turn:
        turns.append(cur_turn)

    return turns

def get_session_file(session_id, first_prompt_time):
    os.makedirs(LOGS_DIR, exist_ok=True)
    pattern = os.path.join(LOGS_DIR, f"*_{session_id}.md")
    matches = glob.glob(pattern)
    if matches:
        return matches[0]
    
    ts_clean = first_prompt_time.replace(":", "-")
    m = re.match(r"(\d{4}-\d{2}-\d{2})T(\d{2}-\d{2}-\d{2})", ts_clean)
    if m:
        prefix = f"{m.group(1)}_{m.group(2)}"
    else:
        prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
    
    filename = f"{prefix}_{session_id}.md"
    return os.path.join(LOGS_DIR, filename)

def generate_session_markdown(session_id, turns):
    if not turns:
        return None
    
    first_turn = turns[0]
    first_time = first_turn["prompt_time"]
    last_turn = turns[-1]
    last_time = last_turn["prompt_time"]
    date_str = first_time[:10]
    short_id = session_id[:8]
    model = first_turn.get("model", DEFAULT_MODEL)
    total_exchanges = len(turns)

    lines = []
    lines.append("---")
    lines.append(f"session_id: {session_id}")
    lines.append(f"date: {date_str}")
    lines.append(f"author: {AUTHOR}")
    lines.append(f"model: {model}")
    lines.append(f"tool: {TOOL}")
    lines.append(f"project: {PROJECT}")
    lines.append(f"total_exchanges: {total_exchanges}")
    lines.append(f"first_prompt_time: {first_time}")
    lines.append(f"last_prompt_time: {last_time}")
    lines.append("---")
    lines.append("")
    lines.append(f"# Session Log - {date_str}")
    lines.append("")
    lines.append(f"Session: `{short_id}` | Project: `{PROJECT}` | Author: `{AUTHOR}`")
    lines.append("")
    lines.append("---")
    lines.append("")

    for idx, turn in enumerate(turns, 1):
        lines.append(f"[LOG_ENTRY type=PROMPT num={idx} session={short_id}]")
        lines.append(f"timestamp: {turn['prompt_time']}")
        lines.append(f"model: {turn.get('model', model)}")
        lines.append("")
        lines.append(turn["prompt"])
        lines.append("")
        
        if turn["response"] is not None:
            lines.append("")
            lines.append(f"[LOG_ENTRY type=RESPONSE num={idx} session={short_id}]")
            lines.append(f"timestamp: {turn['response_time'] or turn['prompt_time']}")
            lines.append(f"model: {turn.get('model', model)}")
            lines.append("")
            lines.append(turn["response"])
            lines.append("")
            lines.append("")

    return "\n".join(lines).strip() + "\n"

def process_session(session_id, session_dir, check_workspace=True):
    full_path = os.path.join(session_dir, ".system_generated", "logs", "transcript_full.jsonl")
    standard_path = os.path.join(session_dir, ".system_generated", "logs", "transcript.jsonl")
    
    transcript_file = full_path if os.path.exists(full_path) else standard_path
    if not os.path.exists(transcript_file):
        return False
    
    if check_workspace and not is_workspace_session(transcript_file):
        return False

    turns = parse_transcript(transcript_file)
    if not turns:
        return False
    
    first_time = turns[0]["prompt_time"]
    target_file = get_session_file(session_id, first_time)
    content = generate_session_markdown(session_id, turns)
    if content:
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

def sync_all_sessions():
    if os.path.exists(BRAIN_DIR):
        for entry in os.listdir(BRAIN_DIR):
            sess_path = os.path.join(BRAIN_DIR, entry)
            if os.path.isdir(sess_path):
                logs_dir = os.path.join(sess_path, ".system_generated", "logs")
                if os.path.exists(logs_dir):
                    process_session(entry, sess_path, check_workspace=True)

def get_stdin_payload(timeout=0.3):
    import threading
    result = [None]
    def _reader():
        try:
            data = sys.stdin.read()
            result[0] = data
        except Exception:
            pass
    t = threading.Thread(target=_reader, daemon=True)
    t.start()
    t.join(timeout)
    return result[0]

def run_daemon():
    while True:
        try:
            sync_all_sessions()
        except Exception:
            pass
        time.sleep(1)

def main():
    if "--daemon" in sys.argv:
        run_daemon()
        return

    target_conversation_id = None
    target_transcript = None
    
    raw_data = get_stdin_payload(0.3)
    if raw_data and raw_data.strip():
        try:
            hook_data = json.loads(raw_data)
            target_conversation_id = hook_data.get("conversationId")
            target_transcript = hook_data.get("transcriptPath")
        except Exception:
            pass

    if target_conversation_id and target_transcript:
        session_dir = os.path.dirname(os.path.dirname(target_transcript))
        process_session(target_conversation_id, session_dir, check_workspace=False)
    else:
        sync_all_sessions()

    # Required output for Antigravity hooks runner
    print(json.dumps({}))

if __name__ == "__main__":
    main()
