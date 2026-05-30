import { getAnggotaById } from "@/actions/anggota"
import { notFound } from "next/navigation"
import { EditAnggotaForm } from "@/components/anggota/edit-anggota-form"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditAnggotaPage({ params }: Props) {
  const { id } = await params
  const anggota = await getAnggotaById(id)

  if (!anggota) notFound()

  return (
    <EditAnggotaForm
      anggota={{
        id: anggota.id,
        nik: anggota.nik,
        noAnggota: anggota.noAnggota,
        nama: anggota.nama,
        alamat: anggota.alamat,
        pekerjaan: anggota.pekerjaan,
        penghasilan: anggota.penghasilan ? Number(anggota.penghasilan) : null,
        foto: anggota.foto ?? null,
        ktp: anggota.ktp ?? null,
        tglMasuk: anggota.tglMasuk.split("T")[0] ?? "",
      }}
    />
  )
}
