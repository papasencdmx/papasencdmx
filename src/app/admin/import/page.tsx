"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ChevronDown,
    Eye,
    EyeOff,
    FileText,
} from "lucide-react";
import { parseCSVFile, mapCSVRowToListing, getCSVColumns, CSV_FIELD_MAP, CORE_VISIBLE_FIELDS } from "@/lib/importUtils";

type Step = "config" | "field-select" | "preview" | "importing" | "done";

interface ImportRow {
    data: Record<string, unknown>;
    raw: Record<string, string>;
    isExisting: boolean;
    selected: boolean;
}

interface FieldConfig {
    csvColumn: string;
    dbField: string;
    visible: boolean;
}

// ── Feature toggle: set to true to enable import tool ──
const IMPORT_ENABLED = false;

export default function ImportPage() {
    const [step, setStep] = useState<Step>("config");
    const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
    const [zones, setZones] = useState<Array<{ id: string; name: string; slug: string }>>([]);
    const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; slug: string; category_id: string }>>([]);
    const [cityId, setCityId] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubcategory, setSelectedSubcategory] = useState("");
    const [fileName, setFileName] = useState("");
    const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
    const [progress, setProgress] = useState({ created: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [] as Array<{ row: number; message: string }> });
    const [importError, setImportError] = useState("");
    const [descStatus, setDescStatus] = useState<"idle" | "loading" | "done">("idle");
    const [descResult, setDescResult] = useState({ updated: 0, notFound: 0, errors: 0 });

    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

    useEffect(() => {
        if (!token) return;
        fetch("/api/admin/import/meta", { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((data) => { setCategories(data.categories || []); setZones(data.zones || []); setSubcategories(data.subcategories || []); setCityId(data.cityId || ""); })
            .catch(() => { });
    }, [token]);

    const onDrop = useCallback(async (files: File[]) => {
        const file = files[0];
        if (!file) return;
        setFileName(file.name);
        try {
            const parsed = await parseCSVFile<Record<string, string>>(file);
            if (parsed.length === 0) return;
            setRawRows(parsed);

            // Detect columns and build field configs
            const columns = getCSVColumns(parsed);
            const configs: FieldConfig[] = columns
                .filter((col) => {
                    // Skip columns we always ignore
                    const skip = ["national_phone", "short_address", "primary_type", "business_status", "google_maps_url", "place_resource_name", "price_level"];
                    return !skip.includes(col);
                })
                .map((col) => {
                    const dbField = CSV_FIELD_MAP[col] || col;
                    return {
                        csvColumn: col,
                        dbField,
                        visible: CORE_VISIBLE_FIELDS.has(dbField),
                    };
                });
            setFieldConfigs(configs);
            setStep("field-select");
        } catch (err) { console.error("Parse error:", err); }
    }, []);

    const proceedToPreview = async () => {
        const zoneMap = new Map<string, string>();
        zones.forEach((z) => {
            zoneMap.set(z.slug, z.id);
            zoneMap.set(z.name, z.id); // Also map by name for Google Maps data
        });

        const subcategoryMap = new Map<string, string>();
        subcategories.filter((s) => s.category_id === selectedCategory).forEach((s) => {
            // Store with normalized keys (lowercase, no accents) for accent-insensitive matching
            const normName = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const normSlug = s.slug.toLowerCase();
            subcategoryMap.set(normName, s.id);
            subcategoryMap.set(normSlug, s.id);
        });

        const mapped = rawRows.map((raw) => ({
            data: mapCSVRowToListing(raw, cityId, selectedCategory, zoneMap, selectedSubcategory || undefined, subcategoryMap),
            raw,
            isExisting: false,
            selected: true,
        }));

        // Store hidden fields in section_content
        const hiddenFields = fieldConfigs.filter((f) => !f.visible).map((f) => f.dbField);
        if (hiddenFields.length > 0) {
            mapped.forEach((r) => {
                const sc = (r.data.section_content as Record<string, unknown>) || {};
                sc.hidden_fields = hiddenFields;
                r.data.section_content = sc;
            });
        }

        // Check for existing listings by slug and place_id
        const slugs = mapped.map((r) => r.data.slug as string);
        const placeIds = mapped.map((r) => (r.data.google_place_id as string) || "").filter(Boolean);

        try {
            const res = await fetch("/api/admin/import/check", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ slugs, categoryId: selectedCategory, cityId, placeIds }),
            });
            if (res.ok) {
                const { existingSlugs, existingPlaceIds } = await res.json();
                const existingSlugSet = new Set(existingSlugs || []);
                const placeIdMap = existingPlaceIds || {};
                mapped.forEach((r) => {
                    const slug = r.data.slug as string;
                    const placeId = r.data.google_place_id as string;
                    r.isExisting = existingSlugSet.has(slug) || !!(placeId && placeId in placeIdMap);
                });
            }
        } catch { /* proceed without check */ }

        setRows(mapped);
        setStep("preview");
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "text/csv": [".csv"] }, maxFiles: 1, disabled: !selectedCategory || !cityId });

    if (!IMPORT_ENABLED) {
        return (
            <div className="max-w-lg mx-auto text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Importacion desactivada</h2>
                <p className="text-sm text-gray-400">Esta herramienta esta temporalmente desactivada durante el desarrollo.</p>
            </div>
        );
    }

    const toggleRow = (idx: number) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, selected: !r.selected } : r)));
    const selectAll = () => setRows((prev) => prev.map((r) => ({ ...r, selected: true })));
    const selectNewOnly = () => setRows((prev) => prev.map((r) => ({ ...r, selected: !r.isExisting })));
    const selectExistingOnly = () => setRows((prev) => prev.map((r) => ({ ...r, selected: r.isExisting })));
    const deselectAll = () => setRows((prev) => prev.map((r) => ({ ...r, selected: false })));

    const selectedCount = rows.filter((r) => r.selected).length;
    const newCount = rows.filter((r) => !r.isExisting).length;
    const existingCount = rows.filter((r) => r.isExisting).length;

    const toggleFieldVisibility = (idx: number) => {
        setFieldConfigs((prev) => prev.map((f, i) => (i === idx ? { ...f, visible: !f.visible } : f)));
    };
    const setAllVisible = (visible: boolean) => {
        setFieldConfigs((prev) => prev.map((f) => ({ ...f, visible })));
    };

    const handleImport = async () => {
        const selected = rows.filter((r) => r.selected);
        if (selected.length === 0) return;
        setStep("importing");
        setImportError("");
        try {
            const res = await fetch("/api/admin/import", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ listings: selected.map((r) => r.data), categoryId: selectedCategory, cityId }) });
            const result = await res.json();
            if (res.ok) { setProgress({ created: result.created || 0, updated: result.updated || 0, skipped: result.skipped || 0, errors: result.errors?.length || 0, errorDetails: result.errors || [] }); setStep("done"); }
            else { setImportError(result.error || "Import failed"); setStep("preview"); }
        } catch { setImportError("Error de conexion"); setStep("preview"); }
    };

    const handleReset = () => { setStep("config"); setRows([]); setRawRows([]); setFieldConfigs([]); setFileName(""); setProgress({ created: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [] }); setImportError(""); setSelectedSubcategory(""); };

    // ─── Done ───
    if (step === "done") {
        return (
            <div className="max-w-lg mx-auto text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Importacion completada</h2>
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="bg-emerald-50 rounded-xl px-5 py-3 text-center">
                        <p className="text-xl font-bold text-emerald-600">{progress.created}</p>
                        <p className="text-[10px] text-emerald-500 uppercase font-semibold">Creados</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl px-5 py-3 text-center">
                        <p className="text-xl font-bold text-amber-600">{progress.updated}</p>
                        <p className="text-[10px] text-amber-500 uppercase font-semibold">Actualizados</p>
                    </div>
                    {progress.skipped > 0 && (
                        <div className="bg-blue-50 rounded-xl px-5 py-3 text-center">
                            <p className="text-xl font-bold text-blue-600">{progress.skipped}</p>
                            <p className="text-[10px] text-blue-500 uppercase font-semibold">Ya existen</p>
                        </div>
                    )}
                    {progress.errors > 0 && (
                        <div className="bg-red-50 rounded-xl px-5 py-3 text-center">
                            <p className="text-xl font-bold text-red-600">{progress.errors}</p>
                            <p className="text-[10px] text-red-500 uppercase font-semibold">Errores</p>
                        </div>
                    )}
                </div>
                {progress.errorDetails.length > 0 && (
                    <div className="bg-red-50 rounded-xl border border-red-100 p-4 mb-8 text-left max-h-48 overflow-y-auto">
                        <p className="text-xs font-bold text-red-600 mb-2">Detalle de errores:</p>
                        {progress.errorDetails.map((e, i) => (
                            <p key={i} className="text-xs text-red-500 mb-1 truncate">• {e.message}</p>
                        ))}
                    </div>
                )}
                <button onClick={handleReset} className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm" style={{ background: "linear-gradient(135deg, #34D399, #10B981)" }}>
                    Nueva importacion
                </button>
            </div>
        );
    }

    // ─── Importing ───
    if (step === "importing") {
        return (
            <div className="max-w-lg mx-auto text-center py-20">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-6" />
                <h2 className="text-lg font-bold text-gray-800 mb-1">Importando...</h2>
                <p className="text-sm text-gray-400">Procesando {selectedCount} listings</p>
            </div>
        );
    }

    // ─── Preview ───
    if (step === "preview") {
        return (
            <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Vista previa <span className="text-gray-400 font-normal text-sm">({rows.length})</span></h2>
                        <p className="text-xs text-gray-400 mt-0.5">{fileName} · <span className="text-emerald-600">{newCount} nuevos</span> · <span className="text-amber-600">{existingCount} existentes</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setStep("field-select")} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all">← Campos</button>
                        <button onClick={handleReset} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all">Cancelar</button>
                        <button onClick={handleImport} disabled={selectedCount === 0} className="rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-30 shadow-sm" style={{ background: "linear-gradient(135deg, #34D399, #10B981)" }}>
                            Importar {selectedCount}
                        </button>
                    </div>
                </div>

                {importError && <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-500 mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{importError}</div>}

                <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={selectAll} className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 transition-all">Todos</button>
                    <button onClick={selectNewOnly} className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-100 transition-all">Nuevos ({newCount})</button>
                    <button onClick={selectExistingOnly} className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-100 transition-all">Existentes ({existingCount})</button>
                    <button onClick={deselectAll} className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-all">Ninguno</button>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #F0F0F0" }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
                                    <th className="px-3 py-3 text-left text-gray-400 font-semibold w-10">&#10003;</th>
                                    <th className="px-3 py-3 text-left text-gray-400 font-semibold">Estado</th>
                                    <th className="px-3 py-3 text-left text-gray-400 font-semibold">Nombre</th>
                                    <th className="px-3 py-3 text-left text-gray-400 font-semibold">Slug</th>
                                    <th className="px-3 py-3 text-left text-gray-400 font-semibold">Telefono</th>
                                    <th className="px-3 py-3 text-left text-gray-400 font-semibold">Web</th>
                                    <th className="px-3 py-3 text-left text-gray-400 font-semibold">Place ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={idx} onClick={() => toggleRow(idx)} className={`cursor-pointer transition-colors ${row.selected ? "bg-white" : "bg-gray-50/50 opacity-50"} hover:bg-emerald-50/30`} style={{ borderBottom: "1px solid #F5F5F5" }}>
                                        <td className="px-3 py-2.5"><input type="checkbox" checked={row.selected} onChange={() => toggleRow(idx)} className="rounded accent-emerald-500" /></td>
                                        <td className="px-3 py-2.5">
                                            {row.isExisting ? (
                                                <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-600">Existe</span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Nuevo</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-800 font-medium max-w-[200px] truncate">{row.data.name as string}</td>
                                        <td className="px-3 py-2.5 text-gray-400 max-w-[150px] truncate">{row.data.slug as string}</td>
                                        <td className="px-3 py-2.5 text-gray-400">{(row.data.phone as string) || "—"}</td>
                                        <td className="px-3 py-2.5 text-gray-400 max-w-[150px] truncate">{(row.data.website as string) || "—"}</td>
                                        <td className="px-3 py-2.5 text-gray-400 max-w-[100px] truncate">{(row.data.google_place_id as string) || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Field Select ───
    if (step === "field-select") {
        const visibleCount = fieldConfigs.filter((f) => f.visible).length;
        return (
            <div className="max-w-3xl">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Campos detectados <span className="text-gray-400 font-normal text-sm">({fieldConfigs.length})</span></h2>
                        <p className="text-xs text-gray-400 mt-0.5">{fileName} · {rawRows.length} filas · {visibleCount} campos visibles</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleReset} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all">← Volver</button>
                        <button onClick={proceedToPreview} className="rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm" style={{ background: "linear-gradient(135deg, #34D399, #10B981)" }}>
                            Continuar →
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 mb-4">
                    <button onClick={() => setAllVisible(true)} className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-100 transition-all flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Todos visibles
                    </button>
                    <button onClick={() => setAllVisible(false)} className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-300 transition-all flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Ninguno visible
                    </button>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #F0F0F0" }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
                                    <th className="px-4 py-3 text-left text-gray-400 font-semibold">Columna CSV</th>
                                    <th className="px-4 py-3 text-left text-gray-400 font-semibold">→ Campo BD</th>
                                    <th className="px-4 py-3 text-left text-gray-400 font-semibold">Ejemplo</th>
                                    <th className="px-4 py-3 text-center text-gray-400 font-semibold w-24">Visible</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fieldConfigs.map((fc, idx) => {
                                    const example = rawRows[0]?.[fc.csvColumn] || "";
                                    return (
                                        <tr key={fc.csvColumn} className="hover:bg-gray-50/50 transition-colors" style={{ borderBottom: "1px solid #F5F5F5" }}>
                                            <td className="px-4 py-2.5 font-mono text-gray-700">{fc.csvColumn}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="inline-flex rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                                                    {fc.dbField}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-400 max-w-[200px] truncate">{example || "—"}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                <button
                                                    onClick={() => toggleFieldVisibility(idx)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                                        fc.visible
                                                            ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
                                                            : "bg-gray-50 border border-gray-200 text-gray-400"
                                                    }`}
                                                >
                                                    {fc.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    {fc.visible ? "Si" : "No"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-xs text-gray-400 mt-4">
                    Todos los datos se importan siempre. Los campos marcados como &quot;No visible&quot; se guardan pero no se muestran en la pagina publica.
                </p>
            </div>
        );
    }

    // ─── Config ───
    return (
        <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Importar Listings</h2>
            <p className="text-sm text-gray-400 mb-8">Sube un archivo CSV para anadir o actualizar listings.</p>

            <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 mb-2">Categoria *</label>
                <div className="relative">
                    <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory(""); }} className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all pr-10">
                        <option value="">Selecciona una categoria</option>
                        {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {selectedCategory && subcategories.filter((s) => s.category_id === selectedCategory).length > 0 && (
                <div className="mb-6">
                    <label className="block text-xs font-semibold text-gray-500 mb-2">Subcategoria (opcional)</label>
                    <div className="relative">
                        <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all pr-10">
                            <option value="">Sin subcategoria</option>
                            {subcategories.filter((s) => s.category_id === selectedCategory).map((sub) => (<option key={sub.id} value={sub.id}>{sub.name}</option>))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            )}

            <div {...getRootProps()} className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer bg-white ${!selectedCategory ? "border-gray-100 opacity-40 cursor-not-allowed" : isDragActive ? "border-emerald-400 bg-emerald-50/30" : "border-gray-200 hover:border-gray-300"}`}>
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-emerald-500" />
                </div>
                {isDragActive ? (
                    <p className="text-sm text-emerald-600 font-medium">Suelta el archivo aqui...</p>
                ) : (
                    <>
                        <p className="text-sm text-gray-600 font-medium mb-1">Arrastra un CSV o <span className="text-emerald-600 font-semibold">haz clic para subir</span></p>
                        <p className="text-xs text-gray-400">Soporta Google Maps export y formato personalizado</p>
                    </>
                )}
            </div>

            {!selectedCategory && <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />Selecciona una categoria primero</p>}

            {/* ─── Description Updater ─── */}
            <div className="mt-12 pt-8" style={{ borderTop: "1px solid #F0F0F0" }}>
                <h2 className="text-lg font-bold text-gray-800 mb-1">Actualizar Descripciones</h2>
                <p className="text-sm text-gray-400 mb-6">Sube un CSV con columnas <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">place_id</code> y <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">description</code> para actualizar descripciones por Google Place ID.</p>

                {descStatus === "done" ? (
                    <div className="bg-white rounded-2xl p-6 text-center shadow-sm" style={{ border: "1px solid #F0F0F0" }}>
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <div className="bg-emerald-50 rounded-xl px-4 py-2 text-center">
                                <p className="text-lg font-bold text-emerald-600">{descResult.updated}</p>
                                <p className="text-[10px] text-emerald-500 uppercase font-semibold">Actualizados</p>
                            </div>
                            {descResult.notFound > 0 && (
                                <div className="bg-amber-50 rounded-xl px-4 py-2 text-center">
                                    <p className="text-lg font-bold text-amber-600">{descResult.notFound}</p>
                                    <p className="text-[10px] text-amber-500 uppercase font-semibold">No encontrados</p>
                                </div>
                            )}
                            {descResult.errors > 0 && (
                                <div className="bg-red-50 rounded-xl px-4 py-2 text-center">
                                    <p className="text-lg font-bold text-red-600">{descResult.errors}</p>
                                    <p className="text-[10px] text-red-500 uppercase font-semibold">Errores</p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setDescStatus("idle")} className="text-xs text-gray-400 hover:text-gray-600">Subir otro</button>
                    </div>
                ) : descStatus === "loading" ? (
                    <div className="bg-white rounded-2xl p-6 text-center shadow-sm" style={{ border: "1px solid #F0F0F0" }}>
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Actualizando descripciones...</p>
                    </div>
                ) : (
                    <label className="block rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 p-8 text-center transition-all cursor-pointer bg-white">
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setDescStatus("loading");
                                try {
                                    const parsed = await parseCSVFile<Record<string, string>>(file);
                                    const rows = parsed
                                        .filter((r) => (r.place_id || r.google_place_id) && (r.description || r.descripcion))
                                        .map((r) => ({
                                            place_id: r.place_id || r.google_place_id,
                                            description: r.description || r.descripcion,
                                        }));

                                    if (rows.length === 0) {
                                        setDescStatus("idle");
                                        return;
                                    }

                                    const res = await fetch("/api/admin/import/descriptions", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                        body: JSON.stringify({ rows }),
                                    });
                                    const result = await res.json();
                                    setDescResult({ updated: result.updated || 0, notFound: result.notFound || 0, errors: result.errors?.length || 0 });
                                    setDescStatus("done");
                                } catch {
                                    setDescStatus("idle");
                                }
                                e.target.value = "";
                            }}
                        />
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-1">Arrastra un CSV o <span className="text-blue-600 font-semibold">haz clic para subir</span></p>
                        <p className="text-xs text-gray-400">Solo actualiza el campo descripcion por place_id</p>
                    </label>
                )}
            </div>
        </div>
    );
}
