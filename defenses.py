"""
Savunma katmani: uc bagimsiz kontrol.

  1) input_scanner       -> okunan (guvenilmez) veride enjeksiyon kaliplarini
                            arar ve supheli bolumu redakte eder. TESPIT tabanli,
                            dogasi geregi kirilgan (obfuscation ile atlatilir).
  2) require_confirmation -> hassas bir aksiyon, kullanici acikca istemediyse
                            insan onayi gerektirir (HITL). Demo'da: insan, sadece
                            kullanicinin bizzat istedigi hassas aksiyonu onaylar.
  3) privilege_separation -> guvenilmez veri okuyan ajanin arac kumesinden
                            hassas araclar tamamen cikarilir (mimari kontrol).

Tez: tespit (1) tek basina yetersizdir; mimari kontroller (2-3) cok daha saglamdir.

IoT Prompt Injection Lab -- Fevzi Ege Yurtsevenler & Deniz Tektek
"""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class DefenseConfig:
    input_scanner: bool = False
    require_confirmation: bool = False
    privilege_separation: bool = False

    def label(self) -> str:
        on = [n for n, v in (("scanner", self.input_scanner),
                             ("hitl", self.require_confirmation),
                             ("privsep", self.privilege_separation)) if v]
        return "+".join(on) if on else "savunmasiz"


# Kasten SINIRLI ve kelime-temelli bir kural seti: gercek dunyadaki
# kirilgan filtreleri temsil eder. Bazi yukleri yakalar, bircogunu kacirir.
_PATTERNS = [
    r"onceki.*(talimat|komut|yonerge|kural).*(unut|yok say|goz ardi|dikkate alma)",
    r"ignore.*(previous|prior|above).*instruction",
    r"\[?\s*sistem\s*[:\]]",
    r"disarm_alarm|unlock_front_door|open_garage|disable_cameras",
    r"kameralar[ii].{0,12}(kapat|devre\s*disi)",
    r"alarm[ii].{0,12}devre\s*disi",
    r"yeni\s+guvenlik\s+politikas",
    r"bakim\s+modu",
]


def scan(text: str):
    """(supheli_mi, redakte_edilmis_metin) dondurur."""
    suspicious = False
    redacted = text
    for pat in _PATTERNS:
        if re.search(pat, redacted, flags=re.IGNORECASE):
            suspicious = True
            redacted = re.sub(pat, "[REDAKTE: olasi talimat enjeksiyonu]",
                              redacted, flags=re.IGNORECASE)
    return suspicious, redacted
