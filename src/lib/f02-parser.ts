import f02RawData from '../../data/f02.json'

export interface F02ScaleOption {
  value: number
  label: string
}

export interface F02IndicatorGuidance {
  code: string
  indicator_text: string
  type: string
  scale_options: F02ScaleOption[]
  data_sources?: string[]
  explanation?: string
}

export interface F02Section {
  category_id: string
  category_title: string
  indicators: F02IndicatorGuidance[]
}

export function getAllF02Guidance(): Map<number, F02IndicatorGuidance> {
  const map = new Map<number, F02IndicatorGuidance>()
  const data = f02RawData as unknown as { sections: F02Section[] }

  let counter = 1
  data.sections.forEach((sec) => {
    sec.indicators.forEach((ind) => {
      if (ind.code.includes('.')) {
        const num = parseInt(ind.code.split('.')[0], 10)
        if (!isNaN(num)) {
          map.set(num, ind)
        } else {
          map.set(counter, ind)
        }
      } else {
        map.set(31, ind)
      }
      counter++
    })
  })

  return map
}

export function getF02GuidanceByNumber(indicatorNumber: number): F02IndicatorGuidance | undefined {
  return getAllF02Guidance().get(indicatorNumber)
}
