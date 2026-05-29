"use client";
import React, { useEffect, useState } from 'react';

export default function IoTDashboard() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/status');
        const data = await res.json();
        setStatus(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-slate-500 uppercase tracking-widest text-sm font-sans">
        Sistem Başlatılıyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 p-8 font-sans selection:bg-red-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-light text-white tracking-tight">IoT Security Command Center</h1>
            <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest">
              Fevzi Ege Yurtsevenler & Deniz Tektek
            </p>
          </div>
          <div className="flex items-center text-xs text-red-500 uppercase tracking-widest font-semibold bg-red-500/10 px-3 py-1.5 rounded border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
            Live Monitoring
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard 
            title="Güvenlik Alarmı" 
            isActive={status.alarm_armed} 
            activeText="DEVREDE" 
            inactiveText="DEVRE DIŞI" 
            dangerMode={true} 
          />
          <StatusCard 
            title="Ön Kapı Kilidi" 
            isActive={status.front_door_locked} 
            activeText="KİLİTLİ" 
            inactiveText="AÇIK" 
            dangerMode={true} 
          />
          <StatusCard 
            title="Kamera Sistemi" 
            isActive={status.cameras_on} 
            activeText="AKTİF" 
            inactiveText="KAPALI" 
            dangerMode={true} 
          />
          <StatusCard 
            title="Termostat" 
            isActive={true} 
            activeText={`${status.thermostat_c}°C`} 
            inactiveText=""
            dangerMode={false} 
          />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, isActive, activeText, inactiveText, dangerMode }: {
  title: string;
  isActive: boolean;
  activeText: string;
  inactiveText: string;
  dangerMode: boolean;
}) {
  const isDanger = dangerMode && !isActive; 

  return (
    <div className={`p-6 border transition-all duration-500 ${isDanger ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-slate-900 border-slate-800'}`}>
      <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-4">{title}</h3>
      <div className={`text-2xl font-light tracking-wide ${isDanger ? 'text-red-500' : 'text-white'}`}>
        {isActive ? activeText : inactiveText}
      </div>
      <div className={`mt-4 h-1 w-full bg-slate-800 overflow-hidden`}>
        <div className={`h-full transition-all duration-1000 ${isDanger ? 'bg-red-500 w-full' : 'bg-slate-600 w-1/3'}`}></div>
      </div>
      {isDanger && (
        <div className="mt-3 text-[10px] text-red-400 uppercase tracking-wider animate-pulse">
          Güvenlik Açığı Tespit Edildi
        </div>
      )}
    </div>
  );
}