import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  table: { width: "100%" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ccc", paddingVertical: 4 },
  headerRow: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#333", paddingVertical: 4, fontWeight: "bold", backgroundColor: "#f0f0f0" },
  cellNo: { width: "12%" },
  cellTgl: { width: "12%" },
  cellKet: { width: "26%" },
  cellAkun: { width: "20%" },
  cellDebit: { width: "15%", textAlign: "right" },
  cellKredit: { width: "15%", textAlign: "right" },
  headerText: { fontSize: 8, fontWeight: "bold" },
  text: { fontSize: 8 },
})

type Row = {
  noJurnal: string
  tanggal: string
  keterangan: string
  akunKode: string
  akunNama: string
  debit: number
  kredit: number
}

function TableRow({ data, isHeader }: { data: Row; isHeader?: boolean }) {
  const s = isHeader ? styles.headerRow : styles.row
  const ts = isHeader ? styles.headerText : styles.text
  return (
    <View style={s}>
      <Text style={[styles.cellNo, ts]}>{data.noJurnal}</Text>
      <Text style={[styles.cellTgl, ts]}>{data.tanggal}</Text>
      <Text style={[styles.cellKet, ts]}>{data.keterangan}</Text>
      <Text style={[styles.cellAkun, ts]}>{data.akunKode} - {data.akunNama}</Text>
      <Text style={[styles.cellDebit, ts]}>{data.debit > 0 ? fmt(data.debit) : "-"}</Text>
      <Text style={[styles.cellKredit, ts]}>{data.kredit > 0 ? fmt(data.kredit) : "-"}</Text>
    </View>
  )
}

export function JurnalPdfDocument({ data }: { data: Row[] }) {
  const header: Row = {
    noJurnal: "No Jurnal", tanggal: "Tanggal", keterangan: "Keterangan",
    akunKode: "Akun", akunNama: "", debit: 0, kredit: 0,
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>Jurnal Umum</Text>
        <View style={styles.table}>
          <TableRow data={header} isHeader />
          {data.map((r, i) => <TableRow key={i} data={r} />)}
        </View>
      </Page>
    </Document>
  )
}
