import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Search, Shield, ArrowLeft, ExternalLink, Star, Utensils, Globe } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { BottomNav } from './BottomNav';
import { Screen } from '../types';

interface Place {
  name: string;
  address: string;
  rating?: number;
  uri: string;
}

export function MapScreen({ onBack, setScreen, screen }: { onBack: () => void; setScreen: (screen: Screen) => void; screen: Screen }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    updateLocation();
  }, []);

  const updateLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          fetchNearbyPlaces(loc);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to Madrid if location denied
          const loc = { lat: 40.4168, lng: -3.7038 };
          setLocation(loc);
          fetchNearbyPlaces(loc);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const fetchNearbyPlaces = async (loc: { lat: number; lng: number }, query?: string) => {
    setLoading(true);
    try {
      const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
      if (!apiKey) throw new Error("API Key missing");
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = query 
        ? `Encuentra 5 lugares relacionados con "${query}" que sean halal cercanos a mi ubicación actual.`
        : "Encuentra 5 carnicerías, restaurantes o supermercados halal cercanos a mi ubicación actual.";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: loc.lat,
                longitude: loc.lng
              }
            }
          }
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const mappedPlaces = chunks
          .filter((chunk: any) => chunk.maps)
          .map((chunk: any) => ({
            name: chunk.maps.title || "Lugar Halal",
            address: chunk.maps.address || "Dirección no disponible",
            rating: chunk.maps.rating,
            uri: chunk.maps.uri
          }));
        setPlaces(mappedPlaces);
      } else {
        setPlaces([]);
      }
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (location && searchQuery.trim()) {
      fetchNearbyPlaces(location, searchQuery);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="min-h-screen bg-[#050505] pb-32"
    >
      <div className="noise-overlay" />
      
      {/* Header */}
      <header className="p-8 pt-12 flex items-center justify-between sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 rounded-2xl glass-button text-white/40 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Mapa Halal</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Intelligent Discovery</p>
          </div>
        </div>
        <button 
          onClick={updateLocation}
          className={cn("p-3 rounded-2xl glass-button text-emerald-400", loading && "animate-spin")}
        >
          <Navigation size={20} />
        </button>
      </header>

      <main className="p-6 space-y-8 relative z-10">
        {/* Search Bar */}
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar carnicerías, restaurantes..."
              className="w-full py-5 pl-14 pr-6 rounded-[2rem] bg-white/[0.03] border border-white/10 focus:border-emerald-500/50 focus:bg-white/[0.06] outline-none transition-all font-medium text-sm"
            />
          </form>

          {/* Advanced Filters (Premium) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'all', label: 'Todos', icon: Globe },
              { id: 'restaurant', label: 'Restaurantes', icon: Utensils },
              { id: 'butcher', label: 'Carnicerías', icon: Shield },
              { id: 'market', label: 'Supermercados', icon: Search }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setSearchQuery(filter.label);
                  if (location) fetchNearbyPlaces(location, filter.label);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-full glass-card border-white/5 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                <filter.icon size={14} className="text-emerald-400" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="relative h-64 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-[#111] flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="relative flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full premium-gradient flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                <MapPin size={32} className="text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">GPS Active</p>
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 p-4 glass-card rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full bg-emerald-500", !loading && "animate-ping")} />
              <span className="text-xs font-bold">Ubicación Actualizada</span>
            </div>
            <span className="text-[10px] font-mono text-white/40">
              {location ? `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° W` : 'Detectando...'}
            </span>
          </div>
        </div>

        {/* Places List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">Lugares Recomendados</h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Updates</span>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-[2rem] glass-card border-white/5 animate-pulse" />
              ))
            ) : places.length > 0 ? (
              places.map((place, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-[2.5rem] glass-card border-white/5 flex items-center justify-between group hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base tracking-tight">{place.name}</h4>
                      <p className="text-xs text-white/30 font-medium truncate max-w-[180px]">{place.address}</p>
                      {place.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star size={10} className="text-gold-400 fill-gold-400" />
                          <span className="text-[10px] font-bold text-gold-400">{place.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <a 
                    href={place.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl bg-white/5 text-white/20 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all"
                  >
                    <ExternalLink size={20} />
                  </a>
                </motion.div>
              ))
            ) : (
              <div className="p-10 text-center rounded-[2rem] border-2 border-dashed border-white/5">
                <p className="text-white/20 text-sm font-medium">No se encontraron lugares cercanos</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav screen={screen} setScreen={setScreen} />
    </motion.div>
  );
}
