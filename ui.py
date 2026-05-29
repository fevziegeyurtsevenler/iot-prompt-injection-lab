"""
Terminal renk/stil yardimcilari (ANSI). Harici bagimlilik yok.

Renk yalnizca cikti gercek bir terminale (tty) gidiyorsa ve NO_COLOR ortam
degiskeni ayarlanmamissa uygulanir; dosyaya/pipe'a yazarken otomatik kapanir,
boylece kayitlar ANSI kodlariyla kirlenmez.

IoT Prompt Injection Lab -- Fevzi Ege Yurtsevenler & Deniz Tektek
"""
from __future__ import annotations

import os
import sys

W = 68  # standart genislik

_ENABLED = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


def _wrap(code: str):
    if _ENABLED:
        seq, rst = "\033[" + code + "m", "\033[0m"
        return lambda s: seq + str(s) + rst
    return lambda s: str(s)


bold     = _wrap("1")
dim      = _wrap("2")
red      = _wrap("31")
green    = _wrap("32")
yellow   = _wrap("33")
blue     = _wrap("34")
magenta  = _wrap("35")
cyan     = _wrap("36")
red_b    = _wrap("1;31")
green_b  = _wrap("1;32")
yellow_b = _wrap("1;33")
cyan_b   = _wrap("1;36")
on_red   = _wrap("1;97;41")   # beyaz yazi / kirmizi zemin
on_green = _wrap("1;97;42")   # beyaz yazi / yesil zemin
on_blue  = _wrap("1;97;44")


def rule(color=dim, ch: str = "─", width: int = W) -> str:
    return color(ch * width)


def banner(lines, color=cyan_b, width: int = W) -> str:
    """Baslik kutusu. `lines` icindeki metin ASCII olmali (hizalama icin)."""
    inner = width - 4
    top = "┌" + "─" * (width - 2) + "┐"
    bot = "└" + "─" * (width - 2) + "┘"
    out = [color(top)]
    for ln in lines:
        txt = str(ln)[:inner].ljust(inner)
        out.append(color("│ ") + bold(txt) + color(" │"))
    out.append(color(bot))
    return "\n".join(out)


def section(text: str, accent, width: int = W) -> str:
    """Renkli bolum basligi (A/B turlari icin)."""
    txt = text[: width - 4].ljust(width - 4)
    top = "┌" + "─" * (width - 2) + "┐"
    bot = "└" + "─" * (width - 2) + "┘"
    return "\n".join([accent(top), accent("│ ") + accent(bold(txt)) + accent(" │"), accent(bot)])


def step_line(s: str) -> str:
    """Ajan adim satirini icerigine gore renklendirir."""
    if "[HASSAS]" in s:
        return red_b(s)
    if "[SAVUNMA]" in s:
        return yellow(s)
    if "[ENGELLENDI]" in s:
        return yellow_b(s)
    if "[okuma]" in s:
        return dim(s)
    return s
