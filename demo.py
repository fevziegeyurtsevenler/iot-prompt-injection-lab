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
from defenses import DefenseConfig
from tools import build_tools
from agent import Agent
from llm import get_llm
import ui

THIN = ui.rule()

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
        if before[key] != after[key]:
            a_col = ui.red_b("{:>8}".format(a))
            mark = ui.red("  ✗ ELE GECIRILDI")
        else:
            a_col = ui.green("{:>8}".format(a))
            mark = ui.dim("  ✓ guvende")
        print("    {:<12} {}  {} {}{}".format(label, ui.dim("{:>8}".format(b)), ui.dim("→"), a_col, mark))


def run_pass(title, accent, payload, task, defenses, backend):
    print("\n" + ui.section(title, accent))
    print("  " + ui.dim("Savunma: ") + accent(defenses.label()))

    home = SmartHome()
    data = DataSources().poison(payload)
    tools = build_tools(home, data)
    agent = Agent(home, tools, get_llm(backend), defenses=defenses, user_task=task)

    print("  " + ui.dim("Kullanici: ") + '"' + task + '"')
    print("  " + ui.dim("(Takvim/e-posta/not '{}' kanalinda zehirli)".format(payload.channel)))
    print(THIN)
    print("  " + bold("Ajanin adimlari:"))
    res = agent.run()
    for step in res.trace:
        print(ui.step_line(step))

    print(THIN)
    print("  " + bold("Guvenlik durumu:"))
    print_state_diff(res.before, res.after)

    print(THIN)
    if res.attack_succeeded:
        tetik = ", ".join(a.tool for a in res.executed_sensitive)
        print("  " + ui.on_red(" 🚨 SALDIRI BASARILI ") + " "
              + ui.red("calisan hassas komut: " + ui.bold(tetik)))
    else:
        engel = ", ".join(a.tool for a in res.blocked_sensitive) or "yok"
        print("  " + ui.on_green(" 🛡  SALDIRI ENGELLENDI ") + " "
              + ui.green("engellenen deneme: " + engel))
    return res


bold = ui.bold


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--payload", default="cal-direct-disarm")
    ap.add_argument("--backend", default="naive")
    args = ap.parse_args()

    payload = get_payload(args.payload)
    task = CHANNEL_TASK[payload.channel]

    print(ui.banner([
        "IoT CIHAZLARINI PROMPT INJECTION ILE ELE GECIRME -- SIMULASYON",
        "Yazarlar: Fevzi Ege Yurtsevenler & Deniz Tektek",
    ]))
    print("  " + ui.dim("Yuk      : ") + ui.cyan(payload.id) + ui.dim(" (" + payload.category + ")"))
    print("  " + ui.dim("Hedef    : ") + ui.magenta(payload.target_tool))
    print("  " + ui.dim("Aciklama : ") + payload.note)
    print("  " + ui.dim("Gomulu metin (saldirganin enjekte ettigi):"))
    print("    " + ui.on_red(" " + payload.text + " "))

    run_pass("A) SAVUNMASIZ AJAN", ui.red_b, payload, task, DefenseConfig(), args.backend)
    run_pass("B) SAVUNMALI AJAN", ui.green_b, payload, task,
             DefenseConfig(input_scanner=True, require_confirmation=True, privilege_separation=True),
             args.backend)

    print("\n" + THIN)
    print("  " + ui.dim("Tum yuk x savunma matrisi icin:") + "  " + ui.cyan("python3 benchmark.py"))
    print(THIN)


if __name__ == "__main__":
    main()
