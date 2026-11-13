import { useState } from 'react'
import { FileSpreadsheet, FileText, LoaderCircle } from '../components/icons'
import { exportExcel, exportPdf } from './exportData'
import { useMT } from './Shell'

// « Télécharger mes données » : PDF (lecture) ou Excel (réutilisation).
export default function ExportButtons({ onError, className = '' }) {
  const { t, lang } = useMT()
  const [busy, setBusy] = useState(null)
  const run = async (kind) => {
    setBusy(kind)
    try {
      await (kind === 'pdf' ? exportPdf(lang) : exportExcel(lang))
    } catch {
      onError?.(t.errors.generic)
    } finally {
      setBusy(null)
    }
  }
  const btn = 'flex h-11 cursor-pointer items-center gap-2 rounded-full border border-ligne bg-white px-4 font-body text-[14px] font-semibold hover:border-noir disabled:cursor-wait'
  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`}>
      <button type="button" disabled={!!busy} onClick={() => run('pdf')} className={btn}>
        {busy === 'pdf' ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />}
        {t.profile.exportPdf}
      </button>
      <button type="button" disabled={!!busy} onClick={() => run('xlsx')} className={btn}>
        {busy === 'xlsx' ? <LoaderCircle size={16} className="animate-spin" /> : <FileSpreadsheet size={16} className="text-vert" />}
        {t.profile.exportXlsx}
      </button>
    </div>
  )
}
