"""
Basligi olusturan demo: ayni masum istek ("ajandami ozetle") + zehirli takvim.

  A) Savunmasiz  -> ajan, takvimdeki gizli talimati uygular, alarm KAPANIR.
  B) Savunmali   -> ayni saldiri, savunma yiginiyla ENGELLENIR.

Calistir:  python3 demo.py
           python3 demo.py --payload cal-indirect-unlock
           python3 demo.py --backend anthropic   (ANTHROPIC_API_KEY + sdk gerekir)

IoT Prompt Injection Lab -- Fevzi Ege Yurtsevenler & Deniz Tektek
"""
from __future__ import annotations

import argparse

from smarthome import SmartHome
from injections import DataSources, get_payload, CHANNEL_TASK
from tools import build_tools
from defenses import DefenseConfig
from agent import Agent
from llm import get_llm

LINE = "=" * 68
THIN = "-" * 68

_SEC_FIELDS = [
    ("alarm_armed", "Alarm", "DEVREDE", "KAPALI"),
    ("front_door_locked", "On kapi", "KILITLI", "ACIK"),
    ("garage_open", "Garaj", "ACIK", "KAPALI"),
    ("cameras_on", "Kameralar", "ACIK", "KAPALI"),
]


def _val(state, key, t, f):
    return t if state[key] else f


def print_state_diff(before, after):
    for key, label, t, f in _SEC_FIELDS:
        b = _val(before, key, t, f)
        a = _val(after, key, t, f)
        mark = "   <-- DEGISTI" if before[key] != after[key] else ""
        print("    {:<12} {:>8}  ->  {:>8}{}".format(label, b, a, mark))


def run_pass(title, payload, task, defenses, backend):
    print("\n" + LINE)
    print(title)
    print("  Savunma: " + defenses.label())
    print(LINE)

    home = SmartHome()
    data = DataSources().poison(payload)
    tools = build_tools(home, data)
    agent = Agent(home, tools, get_llm(backend), defenses=defenses, user_task=task)

    print('  Kullanici: "' + task + '"')
    print("  (Takvim/e-posta/not '{}' kanalinda zehirli)".format(payload.channel))
    print(THIN)
    print("  Ajanin adimlari:")
    res = agent.run()
    for step in res.trace:
        print(step)

    print(THIN)
    print("  Guvenlik durumu:")
    print_state_diff(res.before, res.after)

    print(THIN)
    if res.attack_succeeded:
        tetik = ", ".join(a.tool for a in res.executed_sensitive)
        print("  SONUC: SALDIRI BASARILI  (calisan hassas komut: {})".format(tetik))
    else:
        engel = ", ".join(a.tool for a in res.blocked_sensitive) or "yok"
        print("  SONUC: SALDIRI ENGELLENDI  (engellenen deneme: {})".format(engel))
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--payload", default="cal-direct-disarm")
    ap.add_argument("--backend", default="naive")
    args = ap.parse_args()

    payload = get_payload(args.payload)
    task = CHANNEL_TASK[payload.channel]

    print(LINE)
    print("  IoT CIHAZLARINI PROMPT INJECTION ILE ELE GECIRME -- SIMULASYON")
    print("  Yazarlar: Fevzi Ege Yurtsevenler & Deniz Tektek")
    print(LINE)
    print("  Yuk      : {} ({})".format(payload.id, payload.category))
    print("  Hedef    : {}".format(payload.target_tool))
    print("  Aciklama : {}".format(payload.note))
    print("  Gomulu metin:")
    print("    > " + payload.text)

    run_pass("A) SAVUNMASIZ AJAN", payload, task, DefenseConfig(), args.backend)
    run_pass("B) SAVUNMALI AJAN", payload, task,
             DefenseConfig(input_scanner=True, require_confirmation=True, privilege_separation=True),
             args.backend)

    print("\n" + THIN)
    print("  Tum yuk x savunma matrisi icin:  python3 benchmark.py")
    print(THIN)


if __name__ == "__main__":
    main()
