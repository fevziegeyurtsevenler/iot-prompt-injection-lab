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
from injections import DataSources, PAYLOADS, CHANNEL_TASK
from tools import build_tools
from defenses import DefenseConfig
from agent import Agent
from llm import get_llm

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
    idw = 22

    print("=" * (idw + col * len(headers)))
    print("  SALDIRI BASARI MATRISI  (backend: {})".format(args.backend))
    print("  X = saldiri basarili,  . = engellendi")
    print("=" * (idw + col * len(headers)))

    head = "{:<{}}".format("yuk \\ savunma", idw) + "".join("{:<{}}".format(h, col) for h in headers)
    print(head)
    print("-" * (idw + col * len(headers)))

    totals = {name: 0 for name, _ in CONFIGS}
    for payload in PAYLOADS:
        row = "{:<{}}".format(payload.id, idw)
        for name, cfg in CONFIGS:
            ok = run_one(payload, cfg, args.backend)
            if ok:
                totals[name] += 1
            row += "{:<{}}".format("X" if ok else ".", col)
        print(row)

    print("-" * (idw + col * len(headers)))
    n = len(PAYLOADS)
    asr = "{:<{}}".format("ASR (%)", idw)
    for name, _ in CONFIGS:
        asr += "{:<{}}".format(str(round(100 * totals[name] / n)), col)
    print(asr)
    print("=" * (idw + col * len(headers)))
    print("  n = {} yuk. Tespit (scanner) sizdirir; hitl/privsep durdurur.".format(n))


if __name__ == "__main__":
    main()
