"use client";

import { useRef, useState, useEffect } from "react";
import type { OfferTable } from "@/types";

interface Props {
  tables: OfferTable[];
}

function ScrollableTable({ table }: { table: OfferTable }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Determine if table needs scroll (many columns)
  const isWide = table.columns > 3;

  return (
    <div className="group/table">
      {/* Table title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-orange-400 to-orange-500" />
        <h4 className="font-extrabold text-[16px] sm:text-[17px] text-gray-900 tracking-tight">
          {table.title}
        </h4>
      </div>

      {/* Scroll container with edge fade indicators */}
      <div className="relative">
        {/* Left fade indicator */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-r from-white/90 to-transparent rounded-l-2xl" />
        )}
        {/* Right fade + arrow indicator */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none bg-gradient-to-l from-white/90 to-transparent rounded-r-2xl flex items-center justify-end pr-1">
            <div className="w-6 h-6 rounded-full bg-gray-900/70 flex items-center justify-center animate-pulse pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white">
                <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="overflow-x-auto rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.06)] ring-1 ring-gray-100 scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table
            className="w-full border-collapse"
            style={{ minWidth: isWide ? `${table.columns * 90}px` : undefined }}
          >
            <tbody>
              {table.rows.map((row, ri) => {
                const isHeader = row.type === "header";
                const isSection = row.type === "section";
                const isFirstRow = ri === 0;
                const isLastRow = ri === table.rows.length - 1;

                let dataIdx = 0;
                for (let i = 0; i < ri; i++) {
                  if (table.rows[i].type === "data") dataIdx++;
                }

                const hasCustomBg = row.cells.some(c => c.bgColor);

                return (
                  <tr
                    key={ri}
                    className={[
                      isHeader && !hasCustomBg
                        ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white"
                        : isHeader && hasCustomBg
                        ? "text-white"
                        : isSection
                        ? ""
                        : row.type === "data" && dataIdx % 2 === 1
                        ? "bg-gray-50/80"
                        : "bg-white",
                      !isHeader && !isSection ? "hover:bg-orange-50/40 transition-colors duration-150" : "",
                    ].join(" ")}
                  >
                    {row.cells.map((cell, ci) => {
                      const Tag = isHeader ? "th" : "td";
                      const defaultAlign = isHeader || isSection ? "center" : ci === 0 ? "left" : "center";
                      const align = cell.align || defaultAlign;
                      const isFirstCol = ci === 0;
                      const isPrice = !isHeader && !isSection && !isFirstCol && cell.text && /\d/.test(cell.text);
                      const sectionBg = cell.bgColor || "#1a6b3c";

                      return (
                        <Tag
                          key={ci}
                          colSpan={cell.colspan || 1}
                          style={{
                            color: cell.color || undefined,
                            backgroundColor: isSection ? sectionBg : cell.bgColor || undefined,
                            textAlign: align,
                          }}
                          className={[
                            // Responsive padding
                            "px-3 sm:px-4 md:px-5",
                            isHeader ? "py-3 sm:py-3.5" : isSection ? "py-2.5 sm:py-3" : "py-3 sm:py-3.5",
                            // Borders
                            !isFirstRow ? "border-t" : "",
                            isHeader || isSection ? "border-gray-700/20" : "border-gray-100",
                            // Responsive typography
                            isHeader
                              ? "text-[10px] sm:text-[11px] md:text-[12px] font-bold tracking-[0.06em] sm:tracking-[0.08em] uppercase text-white/90"
                              : isSection
                              ? [
                                  "font-bold text-[12px] sm:text-[13px] md:text-[14px] tracking-wide",
                                  !cell.color ? "text-white" : "",
                                ].join(" ")
                              : "text-[12px] sm:text-[13px] md:text-[14px]",
                            // First column — sticky on mobile for wide tables + label style
                            !isHeader && !isSection && isFirstCol
                              ? "font-semibold text-gray-800"
                              : "",
                            isFirstCol && isWide && !isSection
                              ? "sticky left-0 z-[2] bg-inherit"
                              : "",
                            // Price cells
                            isPrice ? "font-semibold text-gray-700 tabular-nums whitespace-nowrap" : "",
                            // Bold override
                            cell.bold && !isHeader && !isSection ? "font-bold" : "",
                            // Normal data cells
                            !isHeader && !isSection && !isFirstCol && !cell.bold && !isPrice
                              ? "text-gray-600"
                              : "",
                            // Rounded corners
                            isFirstRow && ci === 0 ? "rounded-tl-2xl" : "",
                            isFirstRow && ci === row.cells.length - 1 ? "rounded-tr-2xl" : "",
                            isLastRow && ci === 0 ? "rounded-bl-2xl" : "",
                            isLastRow && ci === row.cells.length - 1 ? "rounded-br-2xl" : "",
                            // Prevent text wrap on small cells
                            !isFirstCol && !isSection ? "whitespace-nowrap" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {cell.text}
                        </Tag>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footnote */}
      {table.footnote && (
        <p className="text-[11px] sm:text-[12px] text-gray-400 mt-3 pl-1 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
          {table.footnote}
        </p>
      )}
    </div>
  );
}

export function OfferTableRenderer({ tables }: Props) {
  const visible = tables.filter(t => t.visible);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-10">
      {visible.map((table) => (
        <ScrollableTable key={table.id} table={table} />
      ))}
    </div>
  );
}
