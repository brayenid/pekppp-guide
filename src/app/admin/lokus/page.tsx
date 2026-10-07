import { db } from '../../../services/db'
import LokusClient from './LokusClient'

export const revalidate = 0

export default async function LokusPage() {
  const units = await db.unit.findMany({ include: { category: true }, orderBy: { name: 'asc' } })
  const categories = await db.category.findMany({ orderBy: { name: 'asc' } })

  return <LokusClient initialUnits={units} categories={categories} />
}
