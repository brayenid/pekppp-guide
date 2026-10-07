// src/core/interfaces/ai-analyzer.interface.ts
// SOKET TAHAP 3: Interface Abstraksi untuk AI Document Pre-Evaluation & Auditor Copilot

export type AiAnalysisStatusType = 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface AiFindingItem {
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO'
  message: string
}

export interface AiDocumentInsights {
  completenessScore: number // 0 - 100
  documentTitleDetected?: string
  detectedDate?: string
  hasValidSignature?: boolean
  hasOfficialStamp?: boolean
  findings: AiFindingItem[]
  suggestedF02Score?: number // Rekomendasi skor awal 0 - 5
  rubricAlignmentSummary?: string
  analyzedAt: string
}

export interface IAiDocumentAnalyzer {
  analyzeDocument(params: {
    fileUrl: string
    aspectCode: string
    slotKey: string
    slotTitle: string
    guidelineDescription?: string
  }): Promise<AiDocumentInsights>
}
