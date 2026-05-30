import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer"

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica", fontWeight: "normal" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: "#1a56db",
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a56db",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  card: {
    border: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottom: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
  },
  photoPlaceholder: {
    width: 60,
    height: 75,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    border: 1,
    borderColor: "#d1d5db",
  },
  photoText: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
  body: {
    flexDirection: "row",
    gap: 20,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: 90,
    fontSize: 10,
    color: "#6b7280",
  },
  value: {
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  barcodePlaceholder: {
    width: 120,
    height: 30,
    backgroundColor: "#f9fafb",
    border: 1,
    borderColor: "#d1d5db",
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  barcodeText: {
    fontSize: 7,
    color: "#9ca3af",
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    paddingTop: 12,
    borderTop: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 8,
    color: "#9ca3af",
  },
})

type KartuAnggotaProps = {
  nama: string
  noAnggota: string
  nik: string
  alamat: string
  pekerjaan: string | null
  foto: string | null
  tglMasuk: string
}

export function KartuAnggota({ nama, noAnggota, nik, alamat, pekerjaan, foto, tglMasuk }: KartuAnggotaProps) {
  const date = new Date(tglMasuk).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>KOPERASI DAMPAK</Text>
          <Text style={styles.subtitle}>KARTU TANDA ANGGOTA</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Data Anggota</Text>
            {foto ? (
              <Image src={foto} style={styles.photoPlaceholder} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoText}>FOTO</Text>
              </View>
            )}
          </View>

          <View style={styles.body}>
            <View style={styles.leftColumn}>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>No Anggota</Text>
                <Text style={styles.value}>{noAnggota}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>NIK</Text>
                <Text style={styles.value}>{nik}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Nama</Text>
                <Text style={styles.value}>{nama}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Pekerjaan</Text>
                <Text style={styles.value}>{pekerjaan ?? "-"}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Alamat</Text>
                <Text style={styles.value}>{alamat}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Tgl Masuk</Text>
                <Text style={styles.value}>{date}</Text>
              </View>
            </View>
          </View>

          <View style={styles.barcodePlaceholder}>
            <Text style={styles.barcodeText}>[ KODE ANGGOTA ]</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Dokumen ini sah dan diterbitkan oleh Koperasi Dampak. Berlaku selama status anggota masih aktif.
        </Text>
      </Page>
    </Document>
  )
}
