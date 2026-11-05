import React from 'react'

export type IconProps = React.SVGProps<SVGSVGElement>

/**
 * 1. Tahun Penilaian PEKPPP (calendar-blank-duotone)
 */
export function CalendarBlankDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="M216 48v40H40V48a8 8 0 0 1 8-8h160a8 8 0 0 1 8 8" opacity=".2" />
      <path d="M208 32h-24v-8a8 8 0 0 0-16 0v8H88v-8a8 8 0 0 0-16 0v8H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16M72 48v8a8 8 0 0 0 16 0v-8h80v8a8 8 0 0 0 16 0v-8h24v32H48V48Zm136 160H48V96h160z" />
    </svg>
  )
}

/**
 * 2. Master Lokus / Evaluasi Lokus (building-duotone)
 */
export function BuildingDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="M200 24v208h-48v-48h-48v48H56V24Z" opacity=".2" />
      <path d="M232 224h-24V32h8a8 8 0 0 0 0-16H40a8 8 0 0 0 0 16h8v192H24a8 8 0 0 0 0 16h208a8 8 0 0 0 0-16M64 32h128v192h-32v-40a8 8 0 0 0-8-8h-48a8 8 0 0 0-8 8v40H64Zm80 192h-32v-32h32ZM88 64a8 8 0 0 1 8-8h16a8 8 0 0 1 0 16H96a8 8 0 0 1-8-8m48 0a8 8 0 0 1 8-8h16a8 8 0 0 1 0 16h-16a8 8 0 0 1-8-8m-48 40a8 8 0 0 1 8-8h16a8 8 0 0 1 0 16H96a8 8 0 0 1-8-8m48 0a8 8 0 0 1 8-8h16a8 8 0 0 1 0 16h-16a8 8 0 0 1-8-8m-48 40a8 8 0 0 1 8-8h16a8 8 0 0 1 0 16H96a8 8 0 0 1-8-8m48 0a8 8 0 0 1 8-8h16a8 8 0 0 1 0 16h-16a8 8 0 0 1-8-8" />
    </svg>
  )
}

/**
 * 3. Master Bukti Dukung (archive-duotone)
 */
export function ArchiveDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="M216 96v96a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V96Z" opacity=".2" />
      <path d="M224 48H32a16 16 0 0 0-16 16v24a16 16 0 0 0 16 16v88a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16v-88a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16m-16 144H48v-88h160Zm16-104H32V64h192zM96 136a8 8 0 0 1 8-8h48a8 8 0 0 1 0 16h-48a8 8 0 0 1-8-8" />
    </svg>
  )
}

/**
 * 4. Master Panduan Bukti (files-duotone)
 */
export function FilesDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="M208 72v112a8 8 0 0 1-8 8h-24v-88l-40-40H80V40a8 8 0 0 1 8-8h80Z" opacity=".2" />
      <path d="m213.66 66.34l-40-40A8 8 0 0 0 168 24H88a16 16 0 0 0-16 16v16H56a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h112a16 16 0 0 0 16-16v-16h16a16 16 0 0 0 16-16V72a8 8 0 0 0-2.34-5.66M168 216H56V72h76.69L168 107.31zm32-32h-16v-80a8 8 0 0 0-2.34-5.66l-40-40A8 8 0 0 0 136 56H88V40h76.69L200 75.31Zm-56-32a8 8 0 0 1-8 8H88a8 8 0 0 1 0-16h48a8 8 0 0 1 8 8m0 32a8 8 0 0 1-8 8H88a8 8 0 0 1 0-16h48a8 8 0 0 1 8 8" />
    </svg>
  )
}

/**
 * 5. Aturan Bukti Dukung (gavel-duotone)
 */
export function GavelDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="m149.66 45.66l-64 64a8 8 0 0 1-11.32 0l-16-16a8 8 0 0 1 0-11.32l64-64a8 8 0 0 1 11.32 0l16 16a8 8 0 0 1 0 11.32m88 76.68l-16-16a8 8 0 0 0-11.32 0l-64 64a8 8 0 0 0 0 11.32l16 16a8 8 0 0 0 11.32 0l64-64a8 8 0 0 0 0-11.32" opacity=".2" />
      <path d="m243.32 116.69l-16-16a16 16 0 0 0-20.84-1.53l-49.64-49.64a16 16 0 0 0-1.52-20.84l-16-16a16 16 0 0 0-22.63 0l-64 64a16 16 0 0 0 0 22.63l16 16a16 16 0 0 0 20.83 1.52l7.17 7.17l-65.38 65.38a25 25 0 0 0 35.32 35.32L132 159.32l7.17 7.16a16 16 0 0 0 1.52 20.84l16 16a16 16 0 0 0 22.63 0l64-64a16 16 0 0 0 0-22.63M80 104L64 88l64-64l16 16ZM55.32 213.38a9 9 0 0 1-12.69 0a9 9 0 0 1 0-12.68L108 135.32L120.69 148ZM101 105.66L145.66 61L195 110.34L150.35 155ZM168 192l-16-16l4-4l56-56l4-4l16 16Z" />
    </svg>
  )
}

/**
 * 6. Manajemen Akun (users-duotone)
 */
export function UsersDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="M136 108a52 52 0 1 1-52-52a52 52 0 0 1 52 52" opacity=".2" />
      <path d="M117.25 157.92a60 60 0 1 0-66.5 0a95.83 95.83 0 0 0-47.22 37.71a8 8 0 1 0 13.4 8.74a80 80 0 0 1 134.14 0a8 8 0 0 0 13.4-8.74a95.83 95.83 0 0 0-47.22-37.71M40 108a44 44 0 1 1 44 44a44.05 44.05 0 0 1-44-44m210.14 98.7a8 8 0 0 1-11.07-2.33A79.83 79.83 0 0 0 172 168a8 8 0 0 1 0-16a44 44 0 1 0-16.34-84.87a8 8 0 1 1-5.94-14.85a60 60 0 0 1 55.53 105.64a95.83 95.83 0 0 1 47.22 37.71a8 8 0 0 1-2.33 11.07" />
    </svg>
  )
}

/**
 * 7. Pengaturan & Konteks AI (sparkle-duotone)
 */
export function SparkleDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="M192 128a64 64 0 0 1-64 64a64 64 0 0 1-64-64a64 64 0 0 1 64-64a64 64 0 0 1 64 64Z" opacity=".2" />
      <path d="M208 128a80.09 80.09 0 0 0-72-79.6V24a8 8 0 0 0-16 0v24.4A80.09 80.09 0 0 0 48 128a80.09 80.09 0 0 0 72 79.6V232a8 8 0 0 0 16 0v-24.4a80.09 80.09 0 0 0 72-79.6m-80 64a64.07 64.07 0 0 1-64-64a64.07 64.07 0 0 1 64-64a64.07 64.07 0 0 1 64 64a64.07 64.07 0 0 1-64 64" />
    </svg>
  )
}

/**
 * 8. Pengaturan API (code-block-duotone)
 */
export function CodeBlockDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="M152 32v64a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16V32a16 16 0 0 1 16-16h104a16 16 0 0 1 16 16" opacity=".2" />
      <path d="m58.34 101.66l-32-32a8 8 0 0 1 0-11.32l32-32a8 8 0 0 1 11.32 11.32L43.31 64l26.35 26.34a8 8 0 0 1-11.32 11.32m40 0a8 8 0 0 0 11.32 0l32-32a8 8 0 0 0 0-11.32l-32-32a8 8 0 0 0-11.32 11.32L124.69 64L98.34 90.34a8 8 0 0 0 0 11.32M200 40h-24a8 8 0 0 0 0 16h24v144H56v-64a8 8 0 0 0-16 0v64a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16" />
    </svg>
  )
}

/**
 * 9. Dokumentasi & Spec API (book-bookmark-duotone)
 */
export function BookBookmarkDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="M208 32v160H72a24 24 0 0 0-24 24V56a24 24 0 0 1 24-24h40v96l32-24l32 24V32Z" opacity=".2" />
      <path d="M208 24H72a32 32 0 0 0-32 32v168a8 8 0 0 0 8 8h144a8 8 0 0 0 0-16H56a16 16 0 0 1 16-16h136a8 8 0 0 0 8-8V32a8 8 0 0 0-8-8m-88 16h48v72l-19.21-14.4a8 8 0 0 0-9.6 0L120 112Zm80 144H72a31.8 31.8 0 0 0-16 4.29V56a16 16 0 0 1 16-16h32v88a8 8 0 0 0 12.8 6.4L144 114l27.21 20.4A8 8 0 0 0 176 136a8.1 8.1 0 0 0 3.58-.84A8 8 0 0 0 184 128V40h16Z" />
    </svg>
  )
}

/**
 * 10. Media Manager & Pustaka Berkas (folder-notch-duotone)
 */
export function FolderNotchDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="M216 88v120a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V88Z" opacity=".2" />
      <path d="M216 72h-84.69L104 44.69A15.86 15.86 0 0 0 92.69 40H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h168a16 16 0 0 0 16-16V88a16 16 0 0 0-16-16m0 128H40V56h52.69l27.31 27.31A15.86 15.86 0 0 0 131.31 88H216Z" />
    </svg>
  )
}

/**
 * 11. Artikel & Kabar Berita (newspaper-duotone)
 */
export function NewspaperDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="M192 48v144H40a16 16 0 0 1-16-16V48Z" opacity=".2" />
      <path d="M224 88V56a16 16 0 0 0-16-16H40a24 24 0 0 0-24 24v128a32 32 0 0 0 32 32h160a24 24 0 0 0 24-24v-8a24 24 0 0 0-8-17.58V88ZM40 56h152v120H48a31.8 31.8 0 0 0-16 4.29V64a8 8 0 0 1 8-8m168 136a8 8 0 0 1-8 8H48a16 16 0 0 1-16-16a15.86 15.86 0 0 1 8-13.88a31.88 31.88 0 0 0 8 1.88h152a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8m0-32h-8V56h8ZM72 88h88a8 8 0 0 1 0 16H72a8 8 0 0 1 0-16m0 32h88a8 8 0 0 1 0 16H72a8 8 0 0 1 0-16" />
    </svg>
  )
}

/**
 * 12. Notifikasi & Broadcast (bell-ringing-duotone)
 */
export function BellDuotoneIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className} {...props}>
      <path d="M216 176H40a8 8 0 0 1-7-12l23-38.33V96a72 72 0 0 1 144 0v29.67l23 38.33a8 8 0 0 1-7 12" opacity=".2" />
      <path d="M221.78 160.71L200 124.42V96a72 72 0 0 0-64-71.55V16a8 8 0 0 0-16 0v8.45A72 72 0 0 0 56 96v28.42l-21.78 36.29A16 16 0 0 0 47.93 184H96a32 32 0 0 0 64 0h48.07a16 16 0 0 0 13.71-23.29M128 200a16 16 0 0 1-14.9-10.15a32.06 32.06 0 0 0 29.8 0A16 16 0 0 1 128 200m79.93-32H47.93L69.53 132A8 8 0 0 0 72 127.42V96a56 56 0 0 1 112 0v31.42a8 8 0 0 0 2.47 4.58Z" />
    </svg>
  )
}

