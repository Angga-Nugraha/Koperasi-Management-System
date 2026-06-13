"use client"

/**
 * @file src/app/pengurus/users/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog, type ConfirmData } from "@/components/ui/confirm-dialog"
import {
  getUserList,
  createUser,
  updateUser,
  resetPassword,
  toggleUserActive,
  getAnggotaTanpaUser,
  getAllowedRoles,
} from "@/actions/users"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  Search,
  Plus,
  Shield,
  Pencil,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react"

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  PENGURUS: "Pengurus",
  BENDAHARA: "Bendahara",
  PENGAWAS: "Pengawas",
  ANGGOTA: "Anggota",
}

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ADMIN: "destructive",
  PENGURUS: "default",
  BENDAHARA: "secondary",
  PENGAWAS: "outline",
  ANGGOTA: "secondary",
}

type UserItem = Awaited<ReturnType<typeof getUserList>>["users"][number]
type AnggotaItem = Awaited<ReturnType<typeof getAnggotaTanpaUser>>[number]

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [anggotaList, setAnggotaList] = useState<AnggotaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10
  const [availableRoles, setAvailableRoles] = useState<string[]>([])

  const [confirm, setConfirm] = useState<ConfirmData>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    anggotaId: "",
  })
  const [createError, setCreateError] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    id: "",
    email: "",
    role: "",
    isActive: true,
    anggotaId: "",
  })
  const [editError, setEditError] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  const [resetOpen, setResetOpen] = useState(false)
  const [resetUserId, setResetUserId] = useState("")
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" })
  const [resetError, setResetError] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const loadUsers = useCallback(
    async function loadUsers() {
      setLoading(true)
      try {
        const result = await getUserList(search || undefined, page, pageSize)
        setUsers(result.users)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    },
    [page, search],
  )

  async function loadAnggota(includeId?: string) {
    try {
      const result = await getAnggotaTanpaUser(includeId)
      setAnggotaList(result)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const id = setTimeout(() => loadUsers(), 0)
    return () => clearTimeout(id)
  }, [loadUsers])

  useEffect(() => {
    getAllowedRoles()
      .then(setAvailableRoles)
      .catch(() => {})
  }, [])

  const defaultRole = availableRoles[0] ?? ""

  function openCreate() {
    setCreateForm({
      email: "",
      password: "",
      confirmPassword: "",
      role: defaultRole,
      anggotaId: "",
    })
    setCreateError("")
    loadAnggota()
    setCreateOpen(true)
  }

  function openEdit(user: UserItem) {
    setEditForm({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      anggotaId: user.anggotaId ?? "",
    })
    setEditError("")
    loadAnggota(user.anggotaId ?? undefined)
    setEditOpen(true)
  }

  function openReset(userId: string) {
    setResetUserId(userId)
    setResetForm({ password: "", confirmPassword: "" })
    setResetError("")
    setResetOpen(true)
  }

  async function handleCreate() {
    if (createForm.password !== createForm.confirmPassword) {
      setCreateError("Password tidak cocok")
      return
    }
    setConfirm(null)
    setCreateLoading(true)
    setCreateError("")
    try {
      await createUser({
        email: createForm.email,
        password: createForm.password,
        confirmPassword: createForm.confirmPassword,
        role: createForm.role as "ADMIN" | "PENGURUS" | "BENDAHARA" | "PENGAWAS" | "ANGGOTA",
        anggotaId: createForm.anggotaId || null,
      })
      setCreateOpen(false)
      loadUsers()
    } catch (e) {
      setCreateError((e as Error).message)
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleEdit() {
    setConfirm(null)
    setEditLoading(true)
    setEditError("")
    try {
      await updateUser({
        id: editForm.id,
        email: editForm.email,
        role: editForm.role as "ADMIN" | "PENGURUS" | "BENDAHARA" | "PENGAWAS" | "ANGGOTA",
        isActive: editForm.isActive,
        anggotaId: editForm.anggotaId || null,
      })
      setEditOpen(false)
      loadUsers()
    } catch (e) {
      setEditError((e as Error).message)
    } finally {
      setEditLoading(false)
    }
  }

  async function handleReset() {
    if (resetForm.password !== resetForm.confirmPassword) {
      setResetError("Password tidak cocok")
      return
    }
    setConfirm(null)
    setResetLoading(true)
    setResetError("")
    try {
      await resetPassword({
        userId: resetUserId,
        password: resetForm.password,
        confirmPassword: resetForm.confirmPassword,
      })
      setResetOpen(false)
    } catch (e) {
      setResetError((e as Error).message)
    } finally {
      setResetLoading(false)
    }
  }

  async function handleToggle(userId: string) {
    try {
      const result = await toggleUserActive(userId)
      if (result?.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: result.isActive } : u)),
        )
      }
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Manajemen Users" description="Kelola akun pengguna sistem" />
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Anggota</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Memuat...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Tidak ada user
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_VARIANT[u.role] ?? "secondary"}>
                          <Shield className="mr-1 h-3 w-3" />
                          {ROLE_LABEL[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={u.isActive} onCheckedChange={() => handleToggle(u.id)} />
                          <span
                            className={`text-xs ${u.isActive ? "text-primary" : "text-muted-foreground"}`}
                          >
                            {u.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.anggota ? `${u.anggota.nama} (${u.anggota.noAnggota})` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openReset(u.id)}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DataTablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="user@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={createForm.confirmPassword}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, confirmPassword: e.target.value })
                  }
                  placeholder="Ulangi password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm({ ...createForm, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r] ?? r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link Anggota (opsional)</Label>
              <Select
                value={createForm.anggotaId}
                onValueChange={(v) => setCreateForm({ ...createForm, anggotaId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Tanpa anggota —</SelectItem>
                  {anggotaList.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nama} ({a.noAnggota})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() =>
                setConfirm({
                  title: "Tambah User",
                  desc: `Buat user ${createForm.email} dengan role ${ROLE_LABEL[createForm.role] ?? createForm.role}?`,
                  onConfirm: handleCreate,
                })
              }
              disabled={createLoading}
            >
              {createLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm({ ...editForm, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r] ?? r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })}
              />
              <Label>{editForm.isActive ? "Aktif" : "Nonaktif"}</Label>
            </div>
            <div className="space-y-2">
              <Label>Link Anggota (opsional)</Label>
              <Select
                value={editForm.anggotaId || "__none__"}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, anggotaId: v === "__none__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Tanpa anggota —</SelectItem>
                  {anggotaList.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nama} ({a.noAnggota})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() =>
                setConfirm({
                  title: "Edit User",
                  desc: `Simpan perubahan user ${editForm.email}?`,
                  onConfirm: handleEdit,
                })
              }
              disabled={editLoading}
            >
              {editLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <div className="relative">
                <Input
                  type={showResetPassword ? "text" : "password"}
                  value={resetForm.password}
                  onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi Password</Label>
              <div className="relative">
                <Input
                  type={showResetConfirm ? "text" : "password"}
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  placeholder="Ulangi password"
                />
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(!showResetConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showResetConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {resetError && <p className="text-sm text-destructive">{resetError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() =>
                setConfirm({
                  title: "Reset Password",
                  desc: "Reset password user ini?",
                  onConfirm: handleReset,
                })
              }
              disabled={resetLoading}
            >
              {resetLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
    </div>
  )
}
