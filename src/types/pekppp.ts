// src/types/pekppp.ts
export interface PekpppImage {
  url: string
  caption: string
}

export interface PekpppIndikator {
  id: string
  aspek: string // Misal: "Kebijakan Pelayanan"
  pertanyaan: string
  buktiDukung: string
  images: PekpppImage[]
}
