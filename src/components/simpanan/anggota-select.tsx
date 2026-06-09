"use client"

/**
 * @file src/components/simpanan/anggota-select.tsx
 * @description Komponen presentasional / interaktif: anggota-select.
 */

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cariAnggota, getAnggotaBasic } from "@/actions/simpanan"
import { ChevronDown } from "lucide-react"

type Anggota = {
  id: string
  noAnggota: string
  nama: string
}

type Props = {
  value?: string
  onChange?: (id: string) => void
  name?: string
  required?: boolean
}

export function AnggotaSelect({ value, onChange, name, required }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Anggota[]>([])
  const [selected, setSelected] = useState<Anggota | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!value) return
    getAnggotaBasic(value)
      .then((a) => {
        if (a) setSelected(a)
      })
      .catch((err) => {
        console.error("Failed to fetch anggota basic:", err)
      })
  }, [value])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query || query.length < 1) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const data = await cariAnggota(query)
        setResults(data)
      } catch (err) {
        console.error("Failed to search anggota:", err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelect(anggota: Anggota) {
    setSelected(anggota)
    setQuery("")
    setResults([])
    setOpen(false)
    onChange?.(anggota.id)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    if (selected) {
      setSelected(null)
      onChange?.("")
    }
    setOpen(true)
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label htmlFor="anggota-search">Anggota *</Label>

      {selected ? (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <span>
            <span className="font-mono">{selected.noAnggota}</span>
            {" — "}
            <span>{selected.nama}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setSelected(null)
              onChange?.("")
            }}
            className="text-xs text-muted-foreground underline"
          >
            Ganti
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            id="anggota-search"
            ref={inputRef}
            placeholder="Cari no anggota atau nama..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {results.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleSelect(a)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span className="font-mono text-xs text-muted-foreground">{a.noAnggota}</span>
              <span>{a.nama}</span>
            </button>
          ))}
        </div>
      )}

      {open && query.length > 0 && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full rounded-md border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-md">
          Anggota tidak ditemukan
        </div>
      )}

      <input type="hidden" name={name} value={selected?.id ?? value ?? ""} required={required} />
    </div>
  )
}
