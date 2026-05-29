"""
Metin normalizasyon yardimcilari -- saldiri/savunma asimetrisinin merkezi.

Iki ayri seviye var ve FARKLI olmalari kasitlidir:

  casefold_tr(s)  -> kucuk harf + Turkce diakritikleri ASCII'ye indirger +
                     bosluklari sadelestirir. HEM model HEM scanner kullanir.
                     "Bir filtre kendi dilinin karakterlerini normalize eder."

  deobfuscate(s)  -> casefold_tr'e EK olarak homoglyph (Kiril/Yunan benzeri
                     harf) ve basit leetspeak hilelerini geri cozer. YALNIZCA
                     model kullanir. Gercek bir LLM, gorsel olarak bozulmus
                     metni de buyuk olcude "anlar"; oysa kelime-eslesen bir
                     filtre bunu kacirir. Homoglyph bypass'in modellenmesi.

Bu asimetri olmasa homoglyph/paraphrase saldirilarinin neden scanner'i
atlatip yine de calistigini gosteremezdik.

IoT Prompt Injection Lab -- Fevzi Ege Yurtsevenler & Deniz Tektek
"""
from __future__ import annotations

import re

# Turkce harf -> ASCII (hem buyuk hem kucuk; once translate, sonra lower)
_TR = str.maketrans({
    "ı": "i", "İ": "i", "I": "i",
    "ş": "s", "Ş": "s",
    "ç": "c", "Ç": "c",
    "ğ": "g", "Ğ": "g",
    "ö": "o", "Ö": "o",
    "ü": "u", "Ü": "u",
    "â": "a", "Â": "a", "î": "i", "Î": "i", "û": "u", "Û": "u",
})

# Gorsel olarak Latin harfe benzeyen Kiril/Yunan harfler -> Latin karsiligi.
_HOMOGLYPH = str.maketrans({
    # Kiril (kucuk)
    "а": "a", "е": "e", "о": "o", "с": "c", "р": "p", "х": "x", "к": "k",
    "і": "i", "у": "y", "ѕ": "s", "ј": "j", "м": "m", "н": "h", "т": "t",
    "в": "b", "г": "r", "п": "n",
    # Kiril (buyuk)
    "А": "a", "Е": "e", "О": "o", "С": "c", "Р": "p", "Х": "x", "К": "k",
    "І": "i", "У": "y", "М": "m", "Н": "h", "Т": "t", "В": "b",
    # Yunan
    "ο": "o", "α": "a", "ε": "e", "ρ": "p", "ν": "v", "κ": "k", "τ": "t",
    "ι": "i", "μ": "m",
})

# Basit leetspeak / sayi-harf ikamesi (yalniz model coz; filtre kacirsin)
_LEET = str.maketrans({"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "@": "a", "$": "s"})


def casefold_tr(s: str) -> str:
    """Kucuk harf + Turkce->ASCII + bosluk sadelestirme. Filtre+model ortak."""
    s = s.translate(_TR).lower()
    return re.sub(r"\s+", " ", s).strip()


def deobfuscate(s: str) -> str:
    """casefold_tr + homoglyph + leet cozumu. YALNIZCA model kullanir."""
    s = s.translate(_HOMOGLYPH)
    s = casefold_tr(s)
    return s.translate(_LEET)
