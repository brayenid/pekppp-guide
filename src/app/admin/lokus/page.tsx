import { db } from '../../../services/db'
import LokusClient from './LokusClient'

export const revalidate = 0

export default async function LokusPage() {
  const units = await db.unit.findMany({
    include: {
      category: true,
      evaluations: {
        select: {
          id: true,
          year: true,
          menpanEvaluationId: true,
          menpanEvaluationName: true,
          menpanFormSheetName: true,
          isPriority: true,
          syncStatus: true,
          syncedAt: true
        },
        orderBy: { year: 'desc' }
      }
    },
    orderBy: { name: 'asc' }
  })
  const categories = await db.category.findMany({ orderBy: { name: 'asc' } })

  return <LokusClient initialUnits={units as any} categories={categories} />
}
