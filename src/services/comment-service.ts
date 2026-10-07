// src/services/comment-service.ts
// Service Layer for Threaded Indicator Comments (Evaluator & OPD Communication)
import { db } from './db'

export class CommentService {
  /**
   * Menambahkan komentar baru atau membalas thread diskusi pada indikator penilaian tertentu.
   * Digunakan sebagai ruang komunikasi dan klarifikasi antara Evaluator dan Tim OPD.
   * @param params.evaluationScoreId ID dari skor indikator yang dikomentari.
   * @param params.authorId ID pengguna pembuat komentar.
   * @param params.message Isi pesan komentar.
   * @param params.parentId ID komentar induk (opsional, diisi jika membalas komentar tertentu).
   * @returns Entitas komentar yang baru dibuat beserta data relasi author dan replies.
   */
  static async addComment({
    evaluationScoreId,
    authorId,
    message,
    parentId
  }: {
    evaluationScoreId: string
    authorId: string
    message: string
    parentId?: string
  }) {
    return db.indicatorComment.create({
      data: {
        evaluationScoreId,
        authorId,
        message,
        parentId
      },
      include: {
        author: true,
        replies: {
          include: { author: true }
        }
      }
    })
  }

  /**
   * Mengambil seluruh hierarki thread komentar untuk satu skor indikator.
   * Hanya memuat komentar tingkat atas (top-level) beserta seluruh rantai balasan di dalamnya.
   * @param evaluationScoreId ID dari skor indikator terkait.
   * @returns Daftar komentar terurut dari yang terbaru beserta balasan berurutan kronologis.
   */
  static async getCommentsForScore(evaluationScoreId: string) {
    return db.indicatorComment.findMany({
      where: {
        evaluationScoreId,
        parentId: null // Top-level comments only, replies included recursively
      },
      include: {
        author: true,
        replies: {
          include: { author: true },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Mengubah status penyelesaian (resolve) dari sebuah thread diskusi indikator.
   * Menandai apakah catatan/klarifikasi dari evaluator telah terselesaikan atau masih terbuka.
   * @param commentId ID komentar yang akan diubah statusnya.
   * @param isResolved Status penyelesaian baru (true jika selesai/ditutup, false jika dibuka kembali).
   * @returns Data komentar yang telah diperbarui.
   */
  static async toggleResolve(commentId: string, isResolved: boolean) {
    return db.indicatorComment.update({
      where: { id: commentId },
      data: { isResolved }
    })
  }
}
