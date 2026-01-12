export interface PekpppImage {
  url: string
  caption: string
}

export interface PekpppIndikator {
  id: string
  aspek: string
  pertanyaan: string
  buktiDukung: string
  images: PekpppImage[]
}
