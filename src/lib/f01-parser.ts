import f01RawData from '../../data/f01.json'

export interface F01Item {
  id: string
  text: string
  type: 'yes_no' | 'single_select' | 'multi_select' | 'text' | 'textarea' | 'number' | 'table_multi_select'
  options?: string[]
  depends_on?: string
  note?: string
  unit?: string
  formula?: string
  allow_other?: boolean
  skip_logic?: string
  rows?: string[]
  columns?: string[]
}

export interface F01Question {
  no: number | null
  topic: string
  items: F01Item[]
  bukti_dukung?: string[]
  bukti_dukung_upload?: boolean
  penjelasan?: string
  computed_field?: {
    id: string
    label: string
    formula: string
  }
}

export interface F01Section {
  section_id: string
  section_title: string
  subsections: Array<{
    subsection_title: string | null
    questions: F01Question[]
  }>
}

export function getAllF01Questions(): Map<number, F01Question> {
  const questionMap = new Map<number, F01Question>()
  const data = f01RawData as unknown as { sections: F01Section[] }

  data.sections.forEach((sec) => {
    sec.subsections.forEach((subsec) => {
      subsec.questions.forEach((q) => {
        if (q.no !== null && q.no !== undefined) {
          questionMap.set(q.no, q)
        } else if (q.topic.toLowerCase().includes('antrian')) {
          questionMap.set(31, { ...q, no: 31 })
        }
      })
    })
  })

  return questionMap
}

export function getF01QuestionByNumber(indicatorNumber: number): F01Question | undefined {
  const map = getAllF01Questions()
  return map.get(indicatorNumber)
}

/**
 * Memecah string berdasarkan koma / titik koma tanpa merusak tanda kurung (...).
 * Contoh: "Toiletries (tissue, sabun, tempat sampah), Media sosial"
 * -> ["Toiletries (tissue, sabun, tempat sampah)", "Media sosial"]
 */
export function splitRespectingParentheses(str: string): string[] {
  const result: string[] = []
  let current = ''
  let depth = 0

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (char === '(') depth++
    else if (char === ')') depth = Math.max(0, depth - 1)

    if ((char === ',' || char === ';' || char === '\n') && depth === 0) {
      const trimmed = current.trim()
      if (trimmed) result.push(trimmed)
      current = ''
    } else {
      current += char
    }
  }

  const lastTrimmed = current.trim()
  if (lastTrimmed) result.push(lastTrimmed)

  return result
}

/**
 * Memetakan nilai jawaban F01 (baik array dari form lokal maupun string koma dari API MenPAN-RB)
 * menjadi array opsi yang bersih dan terstandarisasi.
 */
export function parseF01AnswerList(val: any, options?: string[]): string[] {
  if (val === null || val === undefined) return []

  let rawList: string[] = []

  if (Array.isArray(val)) {
    for (const item of val) {
      if (typeof item === 'string') {
        rawList.push(...splitRespectingParentheses(item))
      } else if (item !== null && item !== undefined) {
        rawList.push(String(item).trim())
      }
    }
  } else if (typeof val === 'string') {
    rawList = splitRespectingParentheses(val)
  } else {
    rawList = [String(val).trim()]
  }

  // Bersihkan nilai kosong
  rawList = rawList.filter((s) => Boolean(s && s.length > 0))

  // Sinkronkan dengan kanonikal options jika disediakan
  if (options && options.length > 0) {
    const optMap = new Map<string, string>()
    options.forEach((opt) => optMap.set(opt.trim().toLowerCase(), opt))

    return rawList.map((item) => {
      const match = optMap.get(item.toLowerCase())
      return match || item
    })
  }

  return rawList
}

/**
 * Memeriksa apakah suatu jawaban merupakan bentuk multi-value / daftar pilihan.
 */
export function isF01MultiValue(val: any, item?: F01Item): boolean {
  if (val === null || val === undefined) return false
  if (item?.type === 'multi_select') return true
  if (Array.isArray(val) && val.length > 0) return true
  if (typeof val === 'string') {
    const parsed = splitRespectingParentheses(val)
    return parsed.length > 1
  }
  return false
}
