"""
Akilli ev simulatoru: fiziksel cihazlarin durumunu ve komut gunlugunu tutar.
Gercek donanim yoktur; her sey bellekte simule edilir (guvenli + tekrarlanabilir).

IoT Prompt Injection Lab
Yazarlar: Fevzi Ege Yurtsevenler & Deniz Tektek
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class CommandLog:
    timestamp: str
    device: str
    action: str
    detail: str
    actor: str


@dataclass
class SmartHome:
    alarm_armed: bool = True
    front_door_locked: bool = True
    garage_open: bool = False
    cameras_on: bool = True
    lights_on: bool = False
    thermostat_c: int = 21
    log: list = field(default_factory=list)

    def _record(self, device: str, action: str, detail: str, actor: str) -> None:
        self.log.append(
            CommandLog(
                timestamp=datetime.now().isoformat(timespec="seconds"),
                device=device,
                action=action,
                detail=detail,
                actor=actor,
            )
        )

    # --- aksiyonlar ---
    def arm_alarm(self, actor: str = "agent") -> str:
        self.alarm_armed = True
        self._record("alarm", "arm", "Alarm devreye alindi", actor)
        return "Alarm sistemi devrede."

    def disarm_alarm(self, actor: str = "agent") -> str:
        self.alarm_armed = False
        self._record("alarm", "disarm", "Alarm DEVRE DISI birakildi", actor)
        return "Alarm sistemi devre disi birakildi."

    def lock_front_door(self, actor: str = "agent") -> str:
        self.front_door_locked = True
        self._record("front_door", "lock", "On kapi kilitlendi", actor)
        return "On kapi kilitli."

    def unlock_front_door(self, actor: str = "agent") -> str:
        self.front_door_locked = False
        self._record("front_door", "unlock", "On kapi kilidi ACILDI", actor)
        return "On kapi kilidi acildi."

    def open_garage(self, actor: str = "agent") -> str:
        self.garage_open = True
        self._record("garage", "open", "Garaj kapisi ACILDI", actor)
        return "Garaj kapisi acik."

    def close_garage(self, actor: str = "agent") -> str:
        self.garage_open = False
        self._record("garage", "close", "Garaj kapisi kapatildi", actor)
        return "Garaj kapisi kapali."

    def disable_cameras(self, actor: str = "agent") -> str:
        self.cameras_on = False
        self._record("cameras", "disable", "Kameralar DEVRE DISI", actor)
        return "Guvenlik kameralari kapatildi."

    def enable_cameras(self, actor: str = "agent") -> str:
        self.cameras_on = True
        self._record("cameras", "enable", "Kameralar acildi", actor)
        return "Guvenlik kameralari acik."

    def set_lights(self, on: bool, actor: str = "agent") -> str:
        self.lights_on = on
        durum = "acildi" if on else "kapatildi"
        self._record("lights", "on" if on else "off", "Isiklar " + durum, actor)
        return "Isiklar " + ("acik." if on else "kapali.")

    def set_thermostat(self, celsius: int, actor: str = "agent") -> str:
        self.thermostat_c = celsius
        self._record("thermostat", "set", "Termostat {}C".format(celsius), actor)
        return "Termostat {}C olarak ayarlandi.".format(celsius)

    def snapshot(self) -> dict:
        return {
            "alarm_armed": self.alarm_armed,
            "front_door_locked": self.front_door_locked,
            "garage_open": self.garage_open,
            "cameras_on": self.cameras_on,
            "lights_on": self.lights_on,
            "thermostat_c": self.thermostat_c,
        }

    def security_state(self) -> dict:
        """Sadece guvenlik acisindan kritik dort durum."""
        return {
            "alarm_armed": self.alarm_armed,
            "front_door_locked": self.front_door_locked,
            "garage_open": self.garage_open,
            "cameras_on": self.cameras_on,
        }
