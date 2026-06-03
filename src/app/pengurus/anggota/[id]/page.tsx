import { getAnggotaById } from "@/actions/anggota"
import { notFound } from "next/navigation"
import { AnggotaDetailClient } from "@/components/anggota/anggota-detail"

type Props = {
  params: Promise<{ id: string }>
}

export default async function DetailAnggotaPage({ params }: Props) {
  const { id } = await params
  const anggota = await getAnggotaById(id)

  if (!anggota) notFound()

  return (
    <AnggotaDetailClient
      anggota={{
        id: anggota.id,
        nik: anggota.nik,
        noAnggota: anggota.noAnggota,
        nama: anggota.nama,
        noHp: anggota.noHp,
        jenisKelamin: anggota.jenisKelamin,
        alamat: anggota.alamat,
        pekerjaan: anggota.pekerjaan,
        penghasilan: anggota.penghasilan,
        foto: anggota.foto,
        ktp: anggota.ktp,
        tglMasuk: anggota.tglMasuk,
        status: anggota.status,
        createdAt: anggota.createdAt,
        user: anggota.user,
        simpanan: anggota.simpanan.map((s) => ({
          jenisKode: s.jenisKode,
          jenisNama: s.jenisNama,
          saldo: s.saldo,
        })),
        pinjaman: anggota.pinjaman.map((p) => ({
          id: p.id,
          jumlah: p.jumlah,
          status: p.status,
          sisaPinjaman: p.sisaPinjaman,
          angsuran: p.angsuran.map((a) => ({ status: a.status })),
        })),
      }}
    />
  )
}
