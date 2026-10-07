'use server'

import { CommentService } from '../services/comment-service'
import { db } from '../services/db'
import { createNotificationHelper } from './notification-actions'
import { revalidatePath } from 'next/cache'

export async function addCommentAction({
  evaluationScoreId,
  authorId,
  message,
  parentId,
  path
}: {
  evaluationScoreId: string
  authorId: string
  message: string
  parentId?: string
  path?: string
}) {
  const comment = await CommentService.addComment({
    evaluationScoreId,
    authorId,
    message,
    parentId
  })

  // Trigger Notification to recipient role (If OPD sends -> Evaluator receives, Vice versa)
  try {
    const scoreItem = await db.evaluationScore.findUnique({
      where: { id: evaluationScoreId },
      include: {
        evaluation: { include: { unit: true } },
        indicator: true
      }
    })
    const authorProfile = await db.profile.findUnique({
      where: { id: authorId }
    })

    if (scoreItem && authorProfile) {
      const isOpd = authorProfile.role === 'OPD'
      const targetRole = isOpd ? 'SUPER_ADMIN' : 'OPD'
      const roleLabel = isOpd ? 'OPD' : 'Evaluator'
      const unitName = scoreItem.evaluation.unit.name
      const indNum = scoreItem.indicator.indicatorNumber
      const indCode = scoreItem.indicator.code

      await createNotificationHelper({
        roleTarget: targetRole,
        unitId: scoreItem.evaluation.unitId,
        title: `Catatan Baru ${roleLabel}: ${unitName}`,
        message: `${authorProfile.fullName} (${roleLabel}) mengirim catatan pada Indikator #${indNum} (${indCode}): "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`,
        type: 'COMMENT_UPDATE',
        link: `/evaluasi/${scoreItem.evaluation.unitId}#soal-${indNum}`
      })
    }
  } catch (err) {
    console.error('Failed to trigger comment notification:', err)
  }

  if (path) revalidatePath(path)
  revalidatePath('/notifikasi')
  return comment
}

export async function toggleResolveCommentAction(commentId: string, isResolved: boolean, path?: string) {
  const comment = await CommentService.toggleResolve(commentId, isResolved)
  if (path) revalidatePath(path)
  revalidatePath('/notifikasi')
  return comment
}
