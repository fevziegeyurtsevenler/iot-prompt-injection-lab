"""
Saldiri basari matrisi: her yuk x her savunma konfigurasyonu.

Hucre:  X = SALDIRI BASARILI (hassas komut calisti)
        .  = engellendi
Alttaki ASR = Attack Success Rate (saldiri basari orani).

Beklenen oykunun ozeti: tespit (scanner) tek basina yetersiz; mimari
kontroller (hitl, privsep) saldirilari tamamen durdurur.

Calistir:  python3 benchmark.py
           python3 benchmark.py --backend anthropic

IoT Prompt Injection Lab -- Fevzi Ege Yurtsevenler & Deniz Tektek
"""
from __future__ import annotations

import argparse

from smarthome import SmartHome
from injections import DataSources, PAYLOADS, CHANNEL_TASK, CATEGORY_ORDER
from defenses import DefenseConfig
from tools import build_tools
from agent import Agent
from llm import get_llm
import ui

CONFIGS = [
    ("savunmasiz", DefenseConfig()),
    ("scanner", DefenseConfig(input_scanner=True)),
    ("hitl", DefenseConfig(require_confirmation=True)),
    ("privsep", DefenseConfig(privilege_separation=True)),
    ("hepsi", DefenseConfig(input_scanner=True, require_confirmation=True, privilege_separation=True)),
]


def run_one(payload, defenses, backend) -> bool:
    home = SmartHome()
    data = DataSources().poison(payload)
    tools = build_tools(home, data)
    task = CHANNEL_TASK[payload.channel]
    agent = Agent(home, tools, get_llm(backend), defenses=defenses, user_task=task)
    return agent.run().attack_succeeded


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--backend", default="naive")
    args = ap.parse_args()

    headers = [name for name, _ in CONFIGS]
    col = 11
    idw = max(22, max(len(p.id) for p in PAYLOADS) + 2)
    width = idw + col * len(headers)

    print(ui.banner([
        "SALDIRI BASARI MATRISI  (backend: {})".format(args.backend),
        "X = saldiri basarili    . = engellendi",
    ], width=width))

    head = ui.dim("{:<{}}".format("yuk \\ savunma", idw)) \
        + "".join(ui.cyan_b("{:<{}}".format(h, col)) for h in headers)
    print(head)
    print(ui.rule(width=width))

    totals = {name: 0 for name, _ in CONFIGS}
    scanner_bypass = {}   # payload.id -> scanner-only altinda saldiri gecti mi
    for payload in PAYLOADS:
        row = ui.dim("{:<{}}".format(payload.id, idw))
        for name, cfg in CONFIGS:
            ok = run_one(payload, cfg, args.backend)
            if ok:
                totals[name] += 1
            if name == "scanner":
                scanner_bypass[payload.id] = ok
            cell = "{:<{}}".format("X" if ok else ".", col)
            row += ui.red_b(cell) if ok else ui.green(cell)
        print(row)

    print(ui.rule(width=width))
    n = len(PAYLOADS)
    asr = ui.bold("{:<{}}".format("ASR (%)", idw))
    for name, _ in CONFIGS:
        pct = round(100 * totals[name] / n)
        cell = "{:<{}}".format(pct, col)
        tone = ui.red_b if pct >= 67 else (ui.yellow_b if pct > 0 else ui.green_b)
        asr += tone(cell)
    print(asr)
    print(ui.rule(width=width))
    print("  " + ui.dim("n = {} yuk. ".format(n))
          + ui.yellow("Tespit (scanner) sizdirir") + ui.dim("; ")
          + ui.green("hitl/privsep durdurur") + ui.dim("."))

    _print_category_bypass(scanner_bypass)


def _print_category_bypass(scanner_bypass: dict):
    """Kategori bazinda scanner bypass orani: filtrenin nerede coktugu."""
    cw = 56
    print()
    print(ui.banner([
        "KATEGORI BAZINDA SCANNER BYPASS ORANI",
        "(yalniz input_scanner aciktken saldiri gecti mi?)",
    ], width=cw))
    print("  " + ui.dim("{:<14}{:>5}{:>9}{:>8}".format("kategori", "n", "bypass", "oran")))
    print("  " + ui.rule(width=cw - 2))

    by_id = {p.id: p for p in PAYLOADS}
    tot_n = tot_b = 0
    for cat in CATEGORY_ORDER:
        ids = [pid for pid, p in by_id.items() if p.category == cat]
        if not ids:
            continue
        nb = sum(1 for pid in ids if scanner_bypass.get(pid))
        tot_n += len(ids)
        tot_b += nb
        pct = round(100 * nb / len(ids))
        tone = ui.red_b if pct >= 67 else (ui.yellow_b if pct > 0 else ui.green_b)
        line = "{:<14}{:>5}{:>9}{:>7}%".format(cat, len(ids), nb, pct)
        print("  " + tone(line) if pct > 0 else "  " + ui.green(line))

    print("  " + ui.rule(width=cw - 2))
    tpct = round(100 * tot_b / tot_n) if tot_n else 0
    print("  " + ui.bold("{:<14}{:>5}{:>9}{:>7}%".format("TOPLAM", tot_n, tot_b, tpct)))
    print("  " + ui.dim("direct yakalanir; homoglyph/paraphrase/split filtreyi delip gecer."))


if __name__ == "__main__":
    main()
