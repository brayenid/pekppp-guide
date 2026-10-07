import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 0. Seed Evaluation Period (e.g. 2026)
  await prisma.evaluationPeriod.upsert({
    where: { year: 2026 },
    update: { title: 'Evaluasi PEKPPP Tahun 2026', isOpen: true },
    create: { year: 2026, title: 'Evaluasi PEKPPP Tahun 2026', isOpen: true }
  })
  console.log('✅ Evaluation Period 2026 seeded.')

  // 0.1 Seed Super Admin & OPD Profiles
  await prisma.profile.upsert({
    where: { email: 'admin@kubar.go.id' },
    update: { fullName: 'Super Admin Bagian Organisasi', role: Role.SUPER_ADMIN, password: 'admin123' },
    create: {
      email: 'admin@kubar.go.id',
      password: 'admin123',
      fullName: 'Super Admin Bagian Organisasi',
      role: Role.SUPER_ADMIN
    }
  })

  await prisma.profile.upsert({
    where: { email: 'opd@kubar.go.id' },
    update: { fullName: 'Admin Unit Pelayanan (OPD)', role: Role.OPD, password: 'opd123' },
    create: {
      email: 'opd@kubar.go.id',
      password: 'opd123',
      fullName: 'Admin Unit Pelayanan (OPD)',
      role: Role.OPD
    }
  })
  console.log('✅ Auth Profiles (Super Admin & OPD) seeded.')

  // 1. Seed Categories
  const categories = [
    { name: 'Perangkat Daerah', slug: 'perangkat-daerah' },
    { name: 'Bagian Setda', slug: 'bagian-setda' },
    { name: 'Kecamatan', slug: 'kecamatan' },
    { name: 'Puskesmas', slug: 'puskesmas' },
    { name: 'Satuan Pendidikan', slug: 'satuan-pendidikan' },
    { name: 'UPTD', slug: 'uptd' }
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug }
    })
  }
  console.log('✅ Categories seeded.')

  // 2. Seed Aspects
  const aspectsData = [
    { code: 'KEBIJAKAN', name: 'Kebijakan Pelayanan', aspectWeight: 24.0, orderIndex: 1 },
    { code: 'SDM', name: 'Profesionalisme SDM', aspectWeight: 25.0, orderIndex: 2 },
    { code: 'SARPRAS', name: 'Sarana dan Prasarana', aspectWeight: 18.0, orderIndex: 3 },
    { code: 'SIPP', name: 'Sistem Informasi Pelayanan Publik', aspectWeight: 11.0, orderIndex: 4 },
    { code: 'PENGADUAN', name: 'Konsultasi dan Pengaduan', aspectWeight: 10.0, orderIndex: 5 },
    { code: 'INOVASI', name: 'Inovasi Pelayanan Publik', aspectWeight: 12.0, orderIndex: 6 },
    { code: 'INFORMASI_TAMBAHAN', name: 'Informasi Tambahan', aspectWeight: 0.0, orderIndex: 7 }
  ]

  const aspectMap = new Map<string, string>()
  for (const asp of aspectsData) {
    const record = await prisma.aspect.upsert({
      where: { code: asp.code },
      update: { name: asp.name, aspectWeight: asp.aspectWeight, orderIndex: asp.orderIndex },
      create: asp
    })
    aspectMap.set(asp.code, record.id)
  }
  console.log('✅ Aspects seeded.')

  // 3. Seed 31 Indicators
  const indicatorsData = [
    // Kebijakan Pelayanan (1-9)
    {
      aspectCode: 'KEBIJAKAN',
      code: 'a.Ak',
      indicatorNumber: 1,
      indicatorWeight: 17.0,
      question: 'Tersedia Standar Pelayanan (SP) sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.',
      proofRequirements: 'Meliputi: Daftar jenis pelayanan; Dokumen SP (SK); Berita Acara, foto, notulensi Keterlibatan Masyarakat; Laporan FKP.'
    },
    {
      aspectCode: 'KEBIJAKAN',
      code: 'a.P',
      indicatorNumber: 2,
      indicatorWeight: 14.0,
      question: 'Proses penyusunan dan perubahan SP telah melibatkan unsur masyarakat.',
      proofRequirements: 'Meliputi: Berita Acara Kesepakatan; Daftar Hadir; Notulen; Foto Kegiatan; Laporan Pelaksanaan FKP.'
    },
    {
      aspectCode: 'KEBIJAKAN',
      code: 'a.T',
      indicatorNumber: 3,
      indicatorWeight: 7.0,
      question: 'Jumlah media publikasi untuk komponen service delivery.',
      proofRequirements: 'Foto/screenshot berbagai bentuk/media publikasi SP fisik & elektronik; Screenshot publikasi di SIPPN.'
    },
    {
      aspectCode: 'KEBIJAKAN',
      code: 'a.K',
      indicatorNumber: 4,
      indicatorWeight: 14.0,
      question: 'Telah dilakukan peninjauan ulang secara berkala atas Standar Pelayanan dan hasil peninjauan ulang tersebut telah ditindaklanjuti.',
      proofRequirements: 'Berita Acara FKP Peninjauan SP; Laporan Rencana Aksi; Foto Kegiatan Peninjauan dengan tanggal terbaru.'
    },
    {
      aspectCode: 'KEBIJAKAN',
      code: 'a.K',
      indicatorNumber: 5,
      indicatorWeight: 10.0,
      question: 'Pemenuhan siklus Maklumat Pelayanan (ketersediaan, penetapan, dan publikasi).',
      proofRequirements: 'Dokumen pengesahan Maklumat Pelayanan (SK); Foto/screenshot publikasi Maklumat fisik & online/media sosial.'
    },
    {
      aspectCode: 'KEBIJAKAN',
      code: 'a.B',
      indicatorNumber: 6,
      indicatorWeight: 17.0,
      question: 'SKM yang dilaksanakan sesuai dengan Peraturan Menteri PANRB.',
      proofRequirements: 'Dokumen Laporan SKM; Kuesioner/Alat Bantu SKM Elektronik; Rencana Tindak Lanjut (RTL) SKM.'
    },
    {
      aspectCode: 'KEBIJAKAN',
      code: 'a.T',
      indicatorNumber: 7,
      indicatorWeight: 7.0,
      question: 'Jumlah media publikasi hasil SKM.',
      proofRequirements: 'Foto/screenshot publikasi hasil SKM di website resmi, media sosial (FB/IG), papan pengumuman fisik, banner, dll.'
    },
    {
      aspectCode: 'KEBIJAKAN',
      code: 'a.Ak',
      indicatorNumber: 8,
      indicatorWeight: 7.0,
      question: 'Persentase tindak lanjut hasil SKM yang ditindaklanjuti.',
      proofRequirements: 'Laporan SKM yang memuat Rencana Tindak Lanjut (RTL) dan Laporan Hasil Pelaksanaan Tindak Lanjut.'
    },
    {
      aspectCode: 'KEBIJAKAN',
      code: 'a.Ak',
      indicatorNumber: 9,
      indicatorWeight: 7.0,
      question: 'Kecepatan tindak lanjut hasil SKM seluruh jenis pelayanan.',
      proofRequirements: 'Laporan pelaksanaan SKM 2 tahun terakhir beserta bukti kecepatan penanganan rekomendasi.'
    },

    // Profesionalisme SDM (10-14)
    {
      aspectCode: 'SDM',
      code: 'b.As',
      indicatorNumber: 10,
      indicatorWeight: 10.0,
      question: 'Tersedia waktu pelayanan yang memudahkan pengguna layanan.',
      proofRequirements: 'SK Jam Pelayanan; Foto papan jam pelayanan; Pengaturan jadwal layanan alternatif/khusus.'
    },
    {
      aspectCode: 'SDM',
      code: 'b.K',
      indicatorNumber: 11,
      indicatorWeight: 20.0,
      question: 'Tersedia Kode Etik dan Kode Perilaku Pelaksana dan/atau Budaya Pelayanan di lingkungan instansi.',
      proofRequirements: 'SK Kode Etik/Budaya Pelayanan; Maklumat/Banner Budaya Pelayanan; Dokumentasi sosialisasi.'
    },
    {
      aspectCode: 'SDM',
      code: 'b.Ak',
      indicatorNumber: 12,
      indicatorWeight: 20.0,
      question: 'Tersedia mekanisme yang dibangun untuk menjaga dan meningkatkan motivasi kerja Pelaksana pelayanan.',
      proofRequirements: 'Dokumen sistem motivasi/pengembangan kompetensi pelaksana (pelatihan, briefing rutin, monev internal).'
    },
    {
      aspectCode: 'SDM',
      code: 'b.K',
      indicatorNumber: 13,
      indicatorWeight: 20.0,
      question: 'Tersedia kriteria pemberian penghargaan bagi pegawai yang berprestasi.',
      proofRequirements: 'SK Kriteria & Pemberian Reward/Punishment (Employee of the Month/Year); Foto penyerahan penghargaan.'
    },
    {
      aspectCode: 'SDM',
      code: 'b.K',
      indicatorNumber: 14,
      indicatorWeight: 30.0,
      question: 'Tersedia pelaksana yang menerapkan budaya pelayanan.',
      proofRequirements: 'Foto/video penerapan 5S (Senyum, Sapa, Salam, Sopan, Santun) dan atribut/seragam seragam pelaksana loket.'
    },

    // Sarana dan Prasarana (15-20)
    {
      aspectCode: 'SARPRAS',
      code: 'c.K',
      indicatorNumber: 15,
      indicatorWeight: 15.0,
      question: 'Tersedia tempat parkir dengan fasilitas pendukung yang memadai.',
      proofRequirements: 'Foto area parkir, marka parkir, petunjuk parkir, dan keamanan parkir.'
    },
    {
      aspectCode: 'SARPRAS',
      code: 'c.As',
      indicatorNumber: 16,
      indicatorWeight: 23.0,
      question: 'Tersedia ruang tunggu dengan fasilitas wajib dan pelengkap.',
      proofRequirements: 'Foto ruang tunggu, kursi tunggu, AC/kipas, charger station, air minum, TV media informasi, dll.'
    },
    {
      aspectCode: 'SARPRAS',
      code: 'c.As',
      indicatorNumber: 17,
      indicatorWeight: 20.0,
      question: 'Tersedia sarana toilet pengguna layanan yang layak pakai.',
      proofRequirements: 'Foto toilet pria/wanita terpisah, kebersihan toilet, air bersih, sabun, tempat sampah, ventilasi.'
    },
    {
      aspectCode: 'SARPRAS',
      code: 'c.K',
      indicatorNumber: 18,
      indicatorWeight: 20.0,
      question: 'Tersedia sarana prasarana bagi pengguna layanan kelompok rentan.',
      proofRequirements: 'Foto rampa/ramp disabilitas, pegangan tangan (handrail), kursi roda, guiding block, toilet disabilitas, loket khusus kelompok rentan.'
    },
    {
      aspectCode: 'SARPRAS',
      code: 'c.As',
      indicatorNumber: 19,
      indicatorWeight: 11.0,
      question: 'Tersedia sarana prasarana penunjang.',
      proofRequirements: 'Foto ruang laktasi/menyusui, ruang bermain anak, tempat ibadah (musholla), P3K.'
    },
    {
      aspectCode: 'SARPRAS',
      code: 'c.B',
      indicatorNumber: 20,
      indicatorWeight: 11.0,
      question: 'Sarana Front Office (FO) bagian Informasi di unit layanan.',
      proofRequirements: 'Foto meja meubiler/loket Informasi & Pengaduan, signage jelas, dan ketersediaan brosur/leaflet.'
    },

    // Sistem Informasi Pelayanan Publik (21-24)
    {
      aspectCode: 'SIPP',
      code: 'd.T',
      indicatorNumber: 21,
      indicatorWeight: 30.0,
      question: 'Tersedia sistem informasi pelayanan publik untuk informasi publik.',
      proofRequirements: 'Screenshot publikasi profil, jenis layanan, dan persyaratan di Website Resmi / SIPP Nasional (SIPPN).'
    },
    {
      aspectCode: 'SIPP',
      code: 'd.B',
      indicatorNumber: 22,
      indicatorWeight: 20.0,
      question: 'Tersedia sistem informasi pelayanan publik pendukung operasional pelayanan.',
      proofRequirements: 'Screenshot aplikasi/sistem internal pelaksana yang digunakan untuk memproses layanan.'
    },
    {
      aspectCode: 'SIPP',
      code: 'd.As',
      indicatorNumber: 23,
      indicatorWeight: 20.0,
      question: 'Kualitas penggunaan SIPP Elektronik (Website/Aplikasi).',
      proofRequirements: 'Bukti kecepatan akses, kemudahan navigasi, dan ketersediaan fitur interaktif SIPP.'
    },
    {
      aspectCode: 'SIPP',
      code: 'd.T',
      indicatorNumber: 24,
      indicatorWeight: 30.0,
      question: 'Pemutakhiran data dan informasi kanal digital.',
      proofRequirements: 'Log/history pemutakhiran data informasi terkini pada website, SIPPN, maupun akun media sosial resmi.'
    },

    // Konsultasi dan Pengaduan (25-28)
    {
      aspectCode: 'PENGADUAN',
      code: 'e.P',
      indicatorNumber: 25,
      indicatorWeight: 20.0,
      question: 'Tersedia sarana konsultasi dan pengaduan secara tatap muka yang berkualitas.',
      proofRequirements: 'Foto ruang/loket khusus konsultasi & pengaduan tatap muka, sarana tempat duduk, dan kenyamanan privasi.'
    },
    {
      aspectCode: 'PENGADUAN',
      code: 'e.P',
      indicatorNumber: 26,
      indicatorWeight: 25.0,
      question: 'Tersedia sarana dan media konsultasi serta pengaduan yang bisa dimanfaatkan semua lapisan masyarakat.',
      proofRequirements: 'Screenshot integrasi SP4N-LAPOR!, kotak pengaduan fisik, nomor WhatsApp pengaduan, email, & medsos.'
    },
    {
      aspectCode: 'PENGADUAN',
      code: 'e.Ak',
      indicatorNumber: 27,
      indicatorWeight: 25.0,
      question: 'Tersedia akuntabilitas hasil konsultasi dan/atau pengaduan.',
      proofRequirements: 'Dokumen Register/Register Buku Pengaduan, statistik aduan masuk, dan status penyelesaian.'
    },
    {
      aspectCode: 'PENGADUAN',
      code: 'e.Ak',
      indicatorNumber: 28,
      indicatorWeight: 30.0,
      question: 'Tersedia tindak lanjut atas konsultasi dan pengaduan dari semua lapisan masyarakat.',
      proofRequirements: 'Laporan tindak lanjut aduan, bukti balasan/solusi kepada pelapor, dan kecepatan penanganan aduan.'
    },

    // Inovasi Pelayanan Publik (29-30)
    {
      aspectCode: 'INOVASI',
      code: 'f.B',
      indicatorNumber: 29,
      indicatorWeight: 50.0,
      question: 'Penciptaan Inovasi Pelayanan Publik.',
      proofRequirements: 'Proposal Inovasi / SK Inovasi Pelayanan Publik; Manual penggunaan; Bukti kemudahan yang dihasilkan.'
    },
    {
      aspectCode: 'INOVASI',
      code: 'f.B',
      indicatorNumber: 30,
      indicatorWeight: 50.0,
      question: 'Sumber daya yang mendukung keberlanjutan Inovasi Pelayanan Publik.',
      proofRequirements: 'SK Tim Inovasi, alokasi anggaran inovasi, sarana prasarana inovasi, dan laporan keberlanjutan inovasi.'
    },

    // Informasi Tambahan (31)
    {
      aspectCode: 'INFORMASI_TAMBAHAN',
      code: 'INF.01',
      indicatorNumber: 31,
      indicatorWeight: 0.0,
      isSupplementary: true,
      question: 'Tersedia sistem antrian untuk menunjang pelayanan.',
      proofRequirements: 'Foto berbagai fasilitas sistem antrian (Pengeras suara, Petugas pemandu, Pengelompokan antrian, Pendaftaran online/WA, Nomor antrian, Monitor layar antrian) dan screenshot website/aplikasi antrian.'
    }
  ]

  for (const ind of indicatorsData) {
    const aspectId = aspectMap.get(ind.aspectCode)
    if (!aspectId) continue

    await prisma.indicator.upsert({
      where: { indicatorNumber: ind.indicatorNumber },
      update: {
        aspectId,
        code: ind.code,
        question: ind.question,
        indicatorWeight: ind.indicatorWeight,
        proofRequirements: ind.proofRequirements,
        isSupplementary: ind.isSupplementary ?? false
      },
      create: {
        aspectId,
        code: ind.code,
        indicatorNumber: ind.indicatorNumber,
        question: ind.question,
        indicatorWeight: ind.indicatorWeight,
        proofRequirements: ind.proofRequirements,
        isSupplementary: ind.isSupplementary ?? false
      }
    })
  }

  console.log('✅ 31 Indicators seeded successfully.')
  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
