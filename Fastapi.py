"""
IoT Prompt Injection Lab -- Fevzi Ege Yurtsevenler & Deniz Tektek
Arayüz için SmartHome durumunu dışarı aktaran hafif API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from smarthome import SmartHome

# FastAPI uygulamasını başlatıyoruz
app = FastAPI(title="IoT Lab API")

# Güvenlik ve Bağlantı Ayarları (CORS)
# Next.js arayüzü farklı bir portta (örneğin 3000) çalışacağı için,
# 8000 portunda çalışan bu API'den veri çekebilmesi adına CORS izni veriyoruz.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme ortamı için tüm kaynaklara izin verilir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Akıllı Ev Simülasyon Nesnemiz
# Arayüz bu ev nesnesinin anlık durumunu okuyacak.
home = SmartHome()

@app.get("/api/status")
def get_status():
    """
    Arayüzdeki cihaz kartlarını (Alarm, Kapı, Kamera vb.) beslemek için 
    evin anlık durumunu (snapshot) JSON formatında döner.
    """
    return home.snapshot()

@app.get("/api/logs")
def get_logs():
    """
    Arayüzde bir "Canlı Akış (Live Feed)" veya terminal benzeri bir pencere 
    yapmak istersek diye, en son gerçekleşen 10 işlemi ters sırayla döner.
    (Saldırganın hangi cihazı ne zaman kapattığını anlık görmek için idealdir).
    """
    # home.log listesini ters çevirip (en yeniler üstte), son 10 tanesini alıyoruz
    return list(reversed(home.log))[-10:]