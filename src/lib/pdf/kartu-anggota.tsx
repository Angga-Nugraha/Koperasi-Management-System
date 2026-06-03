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
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#f5f5f5",
  },
  card: {
    width: "85.6mm",
    height: "54mm",
    alignSelf: "center",
    marginTop: 60,
    borderRadius: 8,
    overflow: "hidden",
  },
  redSection: {
    flex: 1,
    backgroundColor: "#dc2626",
    padding: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  logo: {
    width: 28,
    height: 28,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImg: {
    width: 24,
    height: 24,
  },
  headerText: {
    fontSize: 7,
    color: "white",
  },
  headerTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 6,
    color: "#fca5a5",
    fontWeight: "medium",
  },
  bodyRow: {
    flexDirection: "row",
    gap: 8,
  },
  photoContainer: {
    width: 48,
    height: 64,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  photo: {
    width: 48,
    height: 64,
    borderRadius: 4,
  },
  photoPlaceholderText: {
    fontSize: 6,
    color: "#fca5a5",
  },
  infoColumn: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 5.5,
    color: "#fca5a5",
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 7,
    fontWeight: "bold",
    color: "white",
    marginBottom: 2,
  },
  fieldValueSmall: {
    fontSize: 6,
    fontWeight: "medium",
    color: "white",
    marginBottom: 2,
  },
  noAnggota: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "white",
    marginBottom: 2,
  },
  nama: {
    fontSize: 8,
    fontWeight: "bold",
    color: "white",
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    gap: 6,
  },
  halfCol: {
    flex: 1,
  },
  whiteSection: {
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomText: {
    fontSize: 5.5,
    color: "#6b7280",
  },
})

type Props = {
  nama: string
  noAnggota: string
  nik: string
  alamat: string
  pekerjaan: string | null
  foto: string | null
  tglMasuk: string
  namaKoperasi: string
  logo: string | null
}

export function KartuAnggota({ nama, noAnggota, nik, alamat, pekerjaan, foto, tglMasuk, namaKoperasi, logo }: Props) {
  const date = new Date(tglMasuk).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          <View style={styles.redSection}>
            <View style={styles.headerRow}>
              {logo && (
                <View style={[styles.logo, { borderRadius: 14 }]}>
                  <Image src={logo} style={styles.logoImg} />
                </View>
              )}
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>{namaKoperasi}</Text>
                <Text style={styles.headerSub}>KARTU TANDA ANGGOTA</Text>
              </View>
            </View>

            <View style={styles.bodyRow}>
              <View style={styles.photoContainer}>
                {foto ? (
                  <Image src={foto} style={styles.photo} />
                ) : (
                  <Text style={styles.photoPlaceholderText}>FOTO</Text>
                )}
              </View>

              <View style={styles.infoColumn}>
                <Text style={{ fontSize: 5.5, color: "#fca5a5" }}>No Anggota</Text>
                <Text style={styles.noAnggota}>{noAnggota}</Text>

                <Text style={styles.fieldLabel}>Nama</Text>
                <Text style={styles.nama}>{nama}</Text>

                <View style={styles.row}>
                  <View style={styles.halfCol}>
                    <Text style={styles.fieldLabel}>NIK</Text>
                    <Text style={styles.fieldValueSmall}>{nik}</Text>
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={styles.fieldLabel}>Pekerjaan</Text>
                    <Text style={styles.fieldValueSmall}>{pekerjaan || "-"}</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Alamat</Text>
                <Text style={styles.fieldValueSmall}>{alamat}</Text>
              </View>
            </View>
          </View>

          <View style={styles.whiteSection}>
            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Tgl Masuk: {date}</Text>
              <Text style={styles.bottomText}>Berlaku selama aktif</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
