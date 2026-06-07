"use client"

/**
 * @file src/components/ui/data-table-search.tsx
 * @description Komponen UI dasar (reusable): data-table-search.
 */

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

type FilterOption = {
  value: string
  label: string
}

type Props = {
  searchValue: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  searchPlaceholder?: string
  filterValue?: string
  onFilterChange?: (value: string) => void
  filterOptions?: FilterOption[]
  filterPlaceholder?: string
  children?: React.ReactNode
}

export function DataTableSearch({
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = "Cari...",
  filterValue,
  onFilterChange,
  filterOptions,
  filterPlaceholder = "Semua",
  children,
}: Props) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="w-full sm:flex-1">
        <Label htmlFor="table-search" className="sr-only">
          {searchPlaceholder}
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="table-search"
            placeholder={searchPlaceholder}
            className="pl-10"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>
      </div>
      {filterOptions && onFilterChange && (
        <div className="w-full sm:w-40">
          <Select value={filterValue} onValueChange={onFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder={filterPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {children}
    </div>
  )
}
