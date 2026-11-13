"""Classroom server for The Palace Isn't Safe.

Serves the game and keeps party lobbies in memory.
"""

from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import json
import os
import secrets
import threading
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FILES = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/game.js": ("game.js", "text/javascript; charset=utf-8"),
    "/math.js": ("math.js", "text/javascript; charset=utf-8"),
    "/story.js": ("story.js", "text/javascript; charset=utf-8"),
    "/styles.css": ("styles.css", "text/css; charset=utf-8"),
    "/admin.js": ("admin.js", "text/javascript; charset=utf-8"),
    "/test": ("test.html", "text/html; charset=utf-8"),
    "/test.html": ("test.html", "text/html; charset=utf-8"),
    "/admin": ("admin.html", "text/html; charset=utf-8"),
    "/admin.html": ("admin.html", "text/html; charset=utf-8"),
}
ROLES = {"assassin", "blacksmith", "minstrel", "physician", "soldier"}
ROLE_LABELS = {
    "assassin": "Assassin",
    "blacksmith": "Blacksmith",
    "minstrel": "Minstrel",
    "physician": "Physician",
    "soldier": "Soldier",
}
SCENE_TITLES = [
    "The Royal Palace",
    "The Burning Bazaar",
    "The Legion in the Street",
    "The City Gate",
]
ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
LOCK = threading.Lock()
PARTIES = {}
FIXED_CODES = []
SEATS = 3
MAX_HERO_HP = 4
START_VILLAGERS = 100


def clean_name(value):
    text = " ".join(str(value or "").split()).strip()
    return text[:18]


def empty_party(code):
    return {
        "code": code,
        "hostId": "",
        "members": [],
        "phase": "lobby",
        "revision": 1,
        "game": None,
        "fixed": True,
    }


def reset_party(party):
    party["hostId"] = ""
    party["members"] = []
    party["phase"] = "lobby"
    party["game"] = None
    party["revision"] += 1


def seed_parties():
    codes = [
        "K7MQ", "R4HN", "P8WC", "D2YJ", "M5LS",
        "T9BF", "H3VX", "C6NQ", "W4KP", "J8RD",
        "F2SG", "Y7HM", "B5TC", "L9WK", "S3PJ",
        "N6YD", "Q4MF", "V8BH", "G2XR", "Z5CL",
    ]
    FIXED_CODES[:] = codes
    for code in codes:
        PARTIES[code] = empty_party(code)


def new_code():
    while True:
        code = "".join(secrets.choice(ALPHABET) for _ in range(4))
        if code not in PARTIES:
            return code


def party_summary(party):
    return {
        "code": party["code"],
        "joined": len(party["members"]),
        "seats": SEATS,
        "phase": party["phase"],
    }


def public_party(party):
    return {
        "code": party["code"],
        "hostId": party["hostId"],
        "members": party["members"],
        "phase": party["phase"],
        "revision": party["revision"],
        "game": party["game"],
    }


def member_by_id(party, member_id):
    return next((member for member in party["members"] if member["id"] == member_id), None)


def ms_left(game):
    if not isinstance(game, dict):
        return None
    if game.get("ended"):
        left = game.get("leftAtEnd")
        return max(0, int(left)) if isinstance(left, (int, float)) else 0
    deadline = game.get("deadline")
    if not isinstance(deadline, (int, float)):
        return None
    return max(0, int(deadline - (time.time() * 1000)))


def format_clock(ms):
    if ms is None:
        return "—"
    total = max(0, int(ms) // 1000)
    return f"{total // 60}:{total % 60:02d}"


def hero_rows(game, role):
    log = game.get("log") if isinstance(game, dict) else None
    if not isinstance(log, list):
        return []
    return [row for row in log if isinstance(row, dict) and row.get("role") == role and not row.get("aftermath")]


def student_from_member(party, member, game):
    role = member.get("role")
    rows = hero_rows(game, role) if game else []
    correct = sum(1 for row in rows if row.get("correct"))
    wins = sum(1 for row in rows if row.get("success"))
    names = (game or {}).get("names") if isinstance(game, dict) else {}
    hp_map = (game or {}).get("hp") if isinstance(game, dict) else {}
    name = member.get("name") or (names or {}).get(role) or "—"
    hp = MAX_HERO_HP
    if isinstance(hp_map, dict) and role in hp_map and isinstance(hp_map[role], (int, float)):
        hp = max(0, int(hp_map[role]))
    phase = party["phase"]
    beat = (game or {}).get("beat") if isinstance(game, dict) else ""
    ended = bool((game or {}).get("ended")) if isinstance(game, dict) else False
    dead = ended and (game or {}).get("endReason") == "defeat" and (
        ((game or {}).get("obituary") or {}).get("role") == role or hp <= 0
    )
    if phase == "lobby":
        status = "In lobby"
    elif dead or hp <= 0:
        status = "Fallen"
    elif ended or phase == "summary":
        status = "Finished"
    elif beat:
        status = beat.replace("-", " ").title()
    else:
        status = "Playing"
    step = int((game or {}).get("step") or 0) if isinstance(game, dict) else 0
    scene = SCENE_TITLES[step] if 0 <= step < len(SCENE_TITLES) else f"Scene {step + 1}"
    return {
        "id": member.get("id"),
        "name": name,
        "role": role,
        "roleLabel": ROLE_LABELS.get(role, role),
        "party": party["code"],
        "host": bool(member.get("host")),
        "hp": hp,
        "maxHp": MAX_HERO_HP,
        "mathCorrect": correct,
        "mathAttempts": len(rows),
        "checksPassed": wins,
        "scene": scene if phase != "lobby" else "—",
        "sceneIndex": step + 1 if phase != "lobby" else 0,
        "sceneTotal": len(SCENE_TITLES),
        "status": status,
        "phase": phase,
    }


def party_admin_row(party):
    game = party.get("game") if isinstance(party.get("game"), dict) else None
    members = party.get("members") or []
    step = int(game.get("step") or 0) if game else 0
    beat = game.get("beat") if game else ""
    ended = bool(game.get("ended")) if game else False
    villagers = START_VILLAGERS
    if game and isinstance(game.get("villagers"), (int, float)):
        villagers = int(game["villagers"])
    log = game.get("log") if game and isinstance(game.get("log"), list) else []
    hero_log = [row for row in log if isinstance(row, dict) and not row.get("aftermath")]
    math_correct = sum(1 for row in hero_log if row.get("correct"))
    checks_passed = sum(1 for row in hero_log if row.get("success"))
    left = ms_left(game)
    if party["phase"] == "lobby":
        progress = "Lobby"
    elif ended or party["phase"] == "summary":
        reason = (game or {}).get("endReason") or "done"
        progress = f"Summary ({reason})"
    else:
        scene = SCENE_TITLES[step] if 0 <= step < len(SCENE_TITLES) else f"Scene {step + 1}"
        progress = f"{scene} · {(beat or 'play').replace('-', ' ')}"
    return {
        "code": party["code"],
        "phase": party["phase"],
        "joined": len(members),
        "seats": SEATS,
        "members": [
            {
                "name": member.get("name"),
                "role": member.get("role"),
                "roleLabel": ROLE_LABELS.get(member.get("role"), member.get("role")),
                "host": bool(member.get("host")),
            }
            for member in members
        ],
        "progress": progress,
        "scene": SCENE_TITLES[step] if game and 0 <= step < len(SCENE_TITLES) else "—",
        "beat": beat or "—",
        "villagers": villagers if party["phase"] != "lobby" else None,
        "villagersLost": (START_VILLAGERS - villagers) if party["phase"] != "lobby" else None,
        "mathCorrect": math_correct,
        "mathAttempts": len(hero_log),
        "checksPassed": checks_passed,
        "timer": format_clock(left) if party["phase"] != "lobby" else "—",
        "timerMs": left,
        "ended": ended,
        "endReason": (game or {}).get("endReason") if game else None,
        "active": len(members) > 0,
    }


def admin_snapshot():
    parties = []
    students = []
    for code in FIXED_CODES:
        party = PARTIES.get(code)
        if not party:
            continue
        row = party_admin_row(party)
        parties.append(row)
        game = party.get("game") if isinstance(party.get("game"), dict) else None
        for member in party.get("members") or []:
            students.append(student_from_member(party, member, game))
    active_parties = sum(1 for row in parties if row["active"])
    playing = sum(1 for row in parties if row["phase"] in ("play", "summary"))
    return {
        "updatedAt": int(time.time() * 1000),
        "totals": {
            "students": len(students),
            "activeParties": active_parties,
            "playingParties": playing,
            "emptyParties": len(parties) - active_parties,
            "partySlots": len(parties),
        },
        "parties": parties,
        "students": students,
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args))

    def send_json(self, status, payload):
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length > 200_000:
            return None
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return None
        return data if isinstance(data, dict) else None

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/api/health", "/health"):
            self.send_json(200, {"ok": True})
            return
        if path == "/api/parties":
            with LOCK:
                payload = {"parties": [party_summary(PARTIES[code]) for code in FIXED_CODES if code in PARTIES]}
            self.send_json(200, payload)
            return
        if path == "/api/admin":
            with LOCK:
                payload = admin_snapshot()
            self.send_json(200, payload)
            return
        if path.startswith("/api/parties/"):
            code = path.removeprefix("/api/parties/").upper()
            with LOCK:
                party = PARTIES.get(code)
                if not party:
                    self.send_json(404, {"error": "No party uses that code."})
                    return
                self.send_json(200, public_party(party))
            return
        if path.startswith("/dice/"):
            name = path.removeprefix("/dice/")
            allowed = {f"d{number}.png" for number in range(1, 21)} | {"button.png"}
            file = ROOT / "dice" / name
            if name in allowed and file.is_file():
                body = file.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)
                return
        if path.startswith("/assets/"):
            name = path.removeprefix("/assets/")
            allowed = {"gravestone.jpg"}
            file = ROOT / "assets" / name
            if name in allowed and file.is_file():
                body = file.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "image/jpeg")
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)
                return
        item = FILES.get(path)
        if not item:
            self.send_error(404)
            return
        name, content_type = item
        body = (ROOT / name).read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        body = self.read_json()
        if body is None:
            self.send_json(400, {"error": "Send the party details as JSON."})
            return
        if path == "/api/parties":
            self.create_party(body)
            return
        if path.startswith("/api/parties/") and path.endswith("/join"):
            code = path.removeprefix("/api/parties/").removesuffix("/join").strip("/").upper()
            self.join_party(code, body)
            return
        if path.startswith("/api/parties/") and path.endswith("/start"):
            code = path.removeprefix("/api/parties/").removesuffix("/start").strip("/").upper()
            self.start_party(code, body)
            return
        if path.startswith("/api/parties/") and path.endswith("/state"):
            code = path.removeprefix("/api/parties/").removesuffix("/state").strip("/").upper()
            self.update_state(code, body)
            return
        if path.startswith("/api/parties/") and path.endswith("/leave"):
            code = path.removeprefix("/api/parties/").removesuffix("/leave").strip("/").upper()
            self.leave_party(code, body)
            return
        self.send_json(404, {"error": "That party action does not exist."})

    def create_party(self, body):
        name = clean_name(body.get("name"))
        role = body.get("role")
        if not name or role not in ROLES:
            self.send_json(400, {"error": "Enter your name and choose one role."})
            return
        member = {"id": uuid.uuid4().hex, "name": name, "role": role, "host": True}
        with LOCK:
            code = new_code()
            party = {
                "code": code,
                "hostId": member["id"],
                "members": [member],
                "phase": "lobby",
                "revision": 1,
                "game": None,
            }
            PARTIES[code] = party
            payload = public_party(party)
        payload["memberId"] = member["id"]
        self.send_json(201, payload)

    def join_party(self, code, body):
        name = clean_name(body.get("name"))
        role = body.get("role")
        if not name or role not in ROLES:
            self.send_json(400, {"error": "Enter your name and choose one open role."})
            return
        with LOCK:
            party = PARTIES.get(code)
            if not party:
                self.send_json(404, {"error": "No party uses that code."})
                return
            if party["phase"] != "lobby":
                self.send_json(409, {"error": "That party has already started."})
                return
            if len(party["members"]) >= SEATS:
                self.send_json(409, {"error": "That party is already full."})
                return
            if any(member["role"] == role for member in party["members"]):
                self.send_json(409, {"error": "Someone already took that role."})
                return
            host = len(party["members"]) == 0
            member = {"id": uuid.uuid4().hex, "name": name, "role": role, "host": host}
            if host:
                party["hostId"] = member["id"]
            party["members"].append(member)
            party["revision"] += 1
            payload = public_party(party)
        payload["memberId"] = member["id"]
        self.send_json(200, payload)

    def start_party(self, code, body):
        game = body.get("game")
        with LOCK:
            party = PARTIES.get(code)
            if not party:
                self.send_json(404, {"error": "No party uses that code."})
                return
            member = member_by_id(party, body.get("memberId"))
            if not member or not member["host"]:
                self.send_json(403, {"error": "Only the host can begin."})
                return
            if party["phase"] != "lobby":
                self.send_json(409, {"error": "That party has already started."})
                return
            if not 2 <= len(party["members"]) <= SEATS or not isinstance(game, dict):
                self.send_json(400, {"error": "A party needs 2 or 3 people before it begins."})
                return
            party["phase"] = "play"
            party["game"] = game
            party["revision"] += 1
            payload = public_party(party)
        self.send_json(200, payload)

    def update_state(self, code, body):
        game = body.get("game")
        phase = body.get("phase")
        with LOCK:
            party = PARTIES.get(code)
            if not party:
                self.send_json(404, {"error": "No party uses that code."})
                return
            member = member_by_id(party, body.get("memberId"))
            if not member:
                self.send_json(403, {"error": "You are not in this party."})
                return
            if body.get("phase") == "lobby" and member["host"] and party["phase"] == "summary":
                party["phase"] = "lobby"
                party["game"] = None
                party["revision"] += 1
                self.send_json(200, public_party(party))
                return
            if party["phase"] not in ("play", "summary") or not isinstance(game, dict):
                self.send_json(409, public_party(party))
                return
            if body.get("revision") != party["revision"]:
                self.send_json(409, public_party(party))
                return
            if phase in ("play", "summary"):
                party["phase"] = phase
            party["game"] = game
            party["revision"] += 1
            payload = public_party(party)
        self.send_json(200, payload)

    def leave_party(self, code, body):
        with LOCK:
            party = PARTIES.get(code)
            if not party:
                self.send_json(200, {"ok": True})
                return
            member = member_by_id(party, body.get("memberId"))
            if not member:
                self.send_json(200, {"ok": True})
                return
            if member["host"] or len(party["members"]) == 1:
                if party.get("fixed"):
                    reset_party(party)
                else:
                    del PARTIES[code]
            else:
                party["members"] = [item for item in party["members"] if item["id"] != member["id"]]
                party["revision"] += 1
        self.send_json(200, {"ok": True})


def main():
    seed_parties()
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8765"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"Party server at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
