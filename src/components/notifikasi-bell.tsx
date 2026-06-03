"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, BellRing, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatTanggal } from "@/lib/format"
import { useRouter } from "next/navigation"

type NotifItem = {
  id: string
  title: string
  message: string
  type: string
  relatedId: string | null
  isRead: boolean
  createdAt: string
}

export function NotifikasiBell({ role }: { role?: string }) {
  const router = useRouter()
  const [list, setList] = useState<NotifItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  const fetchNotif = useCallback(async () => {
    try {
      const res = await fetch("/api/notifikasi")
      if (!res.ok) return
      const json = await res.json()
      setList(json.data)
      setUnread(json.unread)
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotif()
    const interval = setInterval(fetchNotif, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [fetchNotif])

  useEffect(() => {
    const handler = () => {
      fetchNotif()
    }
    window.addEventListener("firebase-push", handler)
    return () => window.removeEventListener("firebase-push", handler)
  }, [fetchNotif])

  async function markRead(ids?: string[]) {
    await fetch("/api/notifikasi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : { all: true }),
    })
    fetchNotif()
  }

  function handleClick(item: NotifItem) {
    if (!item.isRead) markRead([item.id])
    setOpen(false)
    const isAnggota = role === "ANGGOTA"
    if (["SETORAN", "TAGIHAN"].includes(item.type)) {
      router.push(isAnggota ? "/anggota/simpanan" : "/pengurus/simpanan")
    } else if (["PENGAJUAN", "DISETUJUI", "DITOLAK", "DICAIKKAN"].includes(item.type)) {
      if (isAnggota) {
        router.push("/anggota/pinjaman")
      } else {
        router.push(item.relatedId ? `/pengurus/pinjaman/${item.relatedId}` : "/pengurus/pinjaman")
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unread > 0 ? (
            <>
              <BellRing className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread > 99 ? "99+" : unread}
              </span>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-semibold">Notifikasi</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markRead()}>
              <CheckCheck className="mr-1 h-3 w-3" /> Tandai baca
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {list.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi
            </p>
          ) : (
            list.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`w-full border-b px-4 py-3 text-left text-sm transition-colors hover:bg-accent ${!item.isRead ? "bg-accent/50" : ""}`}
                onClick={() => handleClick(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`font-medium ${!item.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                    {item.title}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatTanggal(item.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.message}</p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
