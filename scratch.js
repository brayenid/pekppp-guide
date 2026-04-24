const fs = require('fs');
let file = fs.readFileSync('src/pages/Arsip.tsx', 'utf8');

const dataRegex = /const DATA = \{\s*meta:[\s\S]*?\]\s*\}/m;
file = file.replace(dataRegex, 'const DATA: Record<string, any> = DATA_JSON;');

const importRegex = /import \* as XLSX from 'xlsx'/;
file = file.replace(importRegex, 'import * as XLSX from \'xlsx\'\nimport { FileText, Building2, ClipboardList, MapPin, Hospital, Download, ChevronDown, BarChart, Info, X, Search } from \'lucide-react\'\nimport DATA_JSON from \'../data/arsip.json\'');

file = file.replace(/icon: '📑'/g, 'icon: <FileText size={18} />');
file = file.replace(/icon: '🏛️'/g, 'icon: <Building2 size={18} />');
file = file.replace(/icon: '📋'/g, 'icon: <ClipboardList size={18} />');
file = file.replace(/icon: '📍'/g, 'icon: <MapPin size={18} />');
file = file.replace(/icon: '🏥'/g, 'icon: <Hospital size={18} />');

file = file.replace(/⬇ Ekspor Excel <span className="opacity-50">▾<\/span>/g, '<Download size={16} /> Ekspor Excel <ChevronDown size={14} className="opacity-50" />');
file = file.replace(/<span className="text-xl">📊<\/span>/g, '<span className="text-xl"><BarChart size={20} /><\/span>');
file = file.replace(/ℹ Keterangan/g, '<Info size={16} /> Keterangan');

file = file.replace(/const countFields = \(rows\) =>/g, 'const countFields = (rows: any[]) =>');
file = file.replace(/const completionScore = \(row\) =>/g, 'const completionScore = (row: any) =>');
file = file.replace(/const scoreColor = \(s\) =>/g, 'const scoreColor = (s: number) =>');
file = file.replace(/function exportToExcel\(scope\)/g, 'function exportToExcel(scope: string)');
file = file.replace(/function ExportDropdown\(\{ activeTab \}\)/g, 'function ExportDropdown({ activeTab }: { activeTab: string })');
file = file.replace(/function CheckBadge\(\{ checked, kolom \}\)/g, 'function CheckBadge({ checked, kolom }: { checked: boolean; kolom: string })');
file = file.replace(/function StatBar\(\{ label, count, total, color \}\)/g, 'function StatBar({ label, count, total, color }: { label: string; count: number; total: number; color: string })');
file = file.replace(/function DataRow\(\{ row, index \}\)/g, 'function DataRow({ row, index }: { row: any; index: number })');
file = file.replace(/function DataTable\(\{ rows, searchQuery \}\)/g, 'function DataTable({ rows, searchQuery }: { rows: any[]; searchQuery: string })');
file = file.replace(/function AllDataRow\(\{ row, index, kelompok \}\)/g, 'function AllDataRow({ row, index, kelompok }: { row: any; index: number; kelompok: string })');
file = file.replace(/function AllDataTable\(\{ searchQuery \}\)/g, 'function AllDataTable({ searchQuery }: { searchQuery: string })');

file = file.replace(/const KOLOM_COLORS = \{/g, 'const KOLOM_COLORS: Record<string, string> = {');
file = file.replace(/const KOLOM_LABEL = \{/g, 'const KOLOM_LABEL: Record<string, string> = {');

// Add Search Icon
file = file.replace(
  '<input\n                type="text"\n                placeholder="Cari nama unit..."',
  '<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />\n              <input\n                type="text"\n                placeholder="Cari nama unit..."'
);
file = file.replace(/pl-4 pr-9/, 'pl-10 pr-9');
file = file.replace(/✕/g, '<X size={14} />');

fs.writeFileSync('src/pages/Arsip.tsx', file);
console.log('Replacements done.');
