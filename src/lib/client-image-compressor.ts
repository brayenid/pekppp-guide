/**
 * Client-side file compressor helper.
 * - Untuk file Gambar (JPG, PNG, WEBP): di-resize cerdas (maks. 1920px) dan dikompresi kualitasnya menggunakan HTML5 Canvas
 * - Untuk file PDF: dikompresi di sisi server via pdf-lib stream & metadata optimization
 */

export interface CompressionResult {
  file: File
  compressed: boolean
  originalSize: number
  compressedSize: number
  ratio: number
}

/**
 * Kompres gambar di browser sebelum dikirim ke server.
 * Menghasilkan file gambar yang jauh lebih kecil tanpa menurunkan keterbacaan teks/dokumen.
 */
export async function compressImageClient(file: File, maxDimension = 1920, quality = 0.8): Promise<File> {
  // Hanya proses jika file adalah gambar raster
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Downscale proporsional jika melebihi batas resolusi
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        // Gambar ulang di canvas
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        // Konversi ke format webp atau jpeg untuk kompresi terbaik
        const targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Jika hasil kompresi malah lebih besar, pertahankan file asli
              resolve(file)
            } else {
              const compressedFile = new File([blob], file.name, {
                type: blob.type || targetMime,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            }
          },
          targetMime,
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}
