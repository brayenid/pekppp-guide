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
