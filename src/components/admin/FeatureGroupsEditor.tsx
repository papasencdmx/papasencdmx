"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { IconPicker, IconPreview } from "./IconPicker";

interface FeatureRow {
  id: string;
  group_name: string;
  icon_name: string;
  items: string[];
  sort_order: number;
}

interface FeatureGroupsEditorProps {
  eventId: string;
  token: string;
}

export function FeatureGroupsEditor({ eventId, token }: FeatureGroupsEditorProps) {
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newIcon, setNewIcon] = useState("Sparkles");
  const [newName, setNewName] = useState("");
  const [newItems, setNewItems] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editIcon, setEditIcon] = useState("");
  const [editName, setEditName] = useState("");
  const [editItems, setEditItems] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/features`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFeatures((data.features || []) as FeatureRow[]);
    } finally {
      setLoading(false);
    }
  }, [eventId, token]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const createFeature = async () => {
    if (!newName.trim() || !newIcon) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/features`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          group_name: newName.trim(),
          icon_name: newIcon,
          items: newItems,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewItems("");
        setNewIcon("Sparkles");
        setCreating(false);
        fetchFeatures();
      }
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (f: FeatureRow) => {
    setEditId(f.id);
    setEditIcon(f.icon_name);
    setEditName(f.group_name);
    setEditItems((f.items || []).join("\n"));
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditIcon("");
    setEditName("");
    setEditItems("");
  };

  const saveEdit = async () => {
    if (!editId) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/features`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          group_name: editName.trim(),
          icon_name: editIcon,
          items: editItems,
        }),
      });
      if (res.ok) {
        cancelEdit();
        fetchFeatures();
      }
    } finally {
      setEditSaving(false);
    }
  };

  const deleteFeature = async (id: string) => {
    if (!confirm("¿Eliminar este grupo?")) return;
    await fetch(`/api/admin/events/${eventId}/features?featureId=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchFeatures();
  };

  const moveFeature = async (feature: FeatureRow, dir: -1 | 1) => {
    const idx = features.findIndex((f) => f.id === feature.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= features.length) return;
    const other = features[swapIdx];
    await Promise.all([
      fetch(`/api/admin/events/${eventId}/features`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: feature.id, sort_order: other.sort_order }),
      }),
      fetch(`/api/admin/events/${eventId}/features`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: other.id, sort_order: feature.sort_order }),
      }),
    ]);
    fetchFeatures();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800">¿Qué incluye?</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Grupos de características (comidas, transporte, actividades…). Aparecen en la página pública como bloques desplegables.
          </p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir grupo
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando grupos…
        </div>
      )}

      {creating && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-500">
              Nuevo grupo
            </p>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="text-gray-400 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <IconPicker value={newIcon} onChange={setNewIcon} />
            <input
              type="text"
              placeholder="Nombre del grupo (ej. Comidas incluidas)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
          <textarea
            rows={4}
            placeholder="Un elemento por línea&#10;Ej: Comida casera&#10;Menús vegetarianos&#10;Agua y fruta incluidas"
            value={newItems}
            onChange={(e) => setNewItems(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={createFeature}
              disabled={saving || !newName.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar grupo
            </button>
          </div>
        </div>
      )}

      {!loading && features.length === 0 && !creating && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
          <p className="text-[13px] text-gray-500">
            Sin grupos todavía. Pulsa <span className="font-semibold">+ Añadir grupo</span> para empezar.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {features.map((f, i) => {
          const editing = editId === f.id;
          return (
            <div
              key={f.id}
              className="rounded-2xl border border-gray-200 bg-white p-3"
            >
              {editing ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                    <IconPicker value={editIcon} onChange={setEditIcon} />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={editItems}
                    onChange={(e) => setEditItems(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={editSaving || !editName.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                    >
                      {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Guardar cambios
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                    <IconPreview name={f.icon_name} className="h-5 w-5 text-gray-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{f.group_name}</p>
                      <span className="text-[11px] font-medium text-gray-500">
                        {f.items?.length || 0} elemento{(f.items?.length || 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                    {f.items && f.items.length > 0 && (
                      <p className="mt-0.5 text-[12px] text-gray-500 truncate">
                        {f.items.join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveFeature(f, -1)}
                      disabled={i === 0}
                      className="h-7 w-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors flex items-center justify-center"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFeature(f, 1)}
                      disabled={i === features.length - 1}
                      className="h-7 w-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors flex items-center justify-center"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(f)}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFeature(f.id)}
                      className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
