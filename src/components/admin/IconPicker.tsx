"use client";

import { useState, useRef, useEffect, type ComponentType } from "react";
import {
  Check,
  ChevronDown,
  Search,
  UtensilsCrossed,
  Coffee,
  BedDouble,
  Bus,
  Bike,
  MapPin,
  Gamepad2,
  Footprints,
  Waves,
  Tent,
  Mountain,
  Sun,
  Trophy,
  Music,
  Paintbrush,
  GraduationCap,
  Languages,
  Heart,
  ShieldCheck,
  Users,
  Baby,
  Dog,
  Sparkles,
  Star,
  Flame,
  Wifi,
  ParkingCircle,
  Accessibility,
  Stethoscope,
  Palette,
  Drama,
  BookOpen,
  Swords,
  Dumbbell,
  TreePine,
  Flower2,
  Bath,
  Soup,
  Pizza,
  Apple,
  Salad,
  Car,
  Plane,
  Train,
  Camera,
  Gift,
  Calendar,
  Clock,
  Key,
  Phone,
  Mail,
  ExternalLink,
  Home,
  School,
  Beaker,
  Microscope,
  Globe,
  Target,
  Brush,
  Scissors,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed, Coffee, Soup, Pizza, Apple, Salad,
  BedDouble, Bath, Home, Wifi, ParkingCircle,
  Bus, Bike, Car, Plane, Train, Footprints,
  MapPin, Globe, Tent, Mountain, TreePine, Flower2, Sun, Waves,
  Gamepad2, Music, Paintbrush, Drama, Palette, Brush, Scissors, Camera,
  GraduationCap, School, Languages, BookOpen, Beaker, Microscope,
  Trophy, Dumbbell, Swords, Target,
  Heart, ShieldCheck, Stethoscope, Accessibility,
  Users, Baby, Dog,
  Sparkles, Star, Flame, Gift,
  Calendar, Clock, Key, Phone, Mail, ExternalLink,
};

const DEFAULT_ORDER: string[] = [
  "UtensilsCrossed", "Soup", "Pizza", "Apple", "Salad", "Coffee",
  "BedDouble", "Home", "Bath", "Wifi", "ParkingCircle",
  "Bus", "Car", "Bike", "Plane", "Train", "Footprints",
  "MapPin", "Tent", "Mountain", "TreePine", "Flower2", "Sun", "Waves", "Globe",
  "Gamepad2", "Music", "Drama", "Paintbrush", "Palette", "Brush", "Camera",
  "GraduationCap", "School", "Languages", "BookOpen", "Beaker", "Microscope",
  "Trophy", "Dumbbell", "Swords", "Target",
  "Heart", "ShieldCheck", "Stethoscope", "Accessibility",
  "Users", "Baby", "Dog",
  "Sparkles", "Star", "Flame", "Gift",
  "Calendar", "Clock", "Key", "Phone", "Mail", "ExternalLink",
];

export function iconByName(name: string): LucideIcon | null {
  return ICON_MAP[name] ?? null;
}

export function IconPreview({ name, className }: { name: string; className?: string }) {
  const Icon = iconByName(name);
  if (!Icon) return null;
  return <Icon className={className} />;
}

interface IconPickerProps {
  value?: string;
  onChange: (name: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const Current: ComponentType<{ className?: string }> = value ? (ICON_MAP[value] ?? Sparkles) : Sparkles;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? DEFAULT_ORDER.filter((name) => name.toLowerCase().includes(q))
    : DEFAULT_ORDER;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-800 hover:border-gray-300 transition-colors"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <Current className="h-4 w-4 text-gray-700" />
        </span>
        <span className="flex-1 text-left font-medium">{value || "Elegir icono"}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar icono…"
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="grid max-h-64 grid-cols-8 gap-1.5 overflow-y-auto p-3">
            {filtered.map((name) => {
              const Icon = ICON_MAP[name];
              const selected = value === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  title={name}
                  className={`relative flex aspect-square items-center justify-center rounded-lg transition-colors ${
                    selected ? "bg-emerald-50 ring-2 ring-emerald-500" : "hover:bg-gray-100"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${selected ? "text-emerald-700" : "text-gray-700"}`} />
                  {selected && <Check className="absolute -right-0.5 -top-0.5 h-3 w-3 text-emerald-600" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-8 py-6 text-center text-[12px] text-gray-400">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
