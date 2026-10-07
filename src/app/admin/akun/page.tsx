import { db } from '../../../services/db'
import AkunClient from './AkunClient'

export const revalidate = 0

export default async function AkunPage() {
  const profiles = await db.profile.findMany({
    include: { userUnits: { include: { unit: true } } },
    orderBy: { createdAt: 'desc' }
  })
  const allUnits = await db.unit.findMany({ orderBy: { name: 'asc' } })

  return <AkunClient initialProfiles={profiles} allUnits={allUnits} />
}
