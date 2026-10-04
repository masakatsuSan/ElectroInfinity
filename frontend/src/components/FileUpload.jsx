import { useState, useCallback } from 'react'
import { X, Image, FileText, Loader2 } from 'lucide-react'

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  pdf: ['application/pdf'],
}

const MAX_SIZES = {
  image: 5 * 1024 * 1024,
  pdf: 10 * 1024 * 1024,
}

export function FileUpload({
  accept = 'image/*',
  maxSizeMB = 5,
  fieldName = 'file',
  value = '',
  onChange,
  disabled = false,
  showPreview = true,
  label = 'Upload File',
  helpText,
}) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const isImage = accept.startsWith('image/')
  const allowedMimes = accept === 'application/pdf' ? ALLOWED_TYPES.pdf : ALLOWED_TYPES.image
  const maxSize = maxSizeMB * 1024 * 1024

  const validateFile = useCallback((f) => {
    if (!allowedMimes.includes(f.type)) {
      setError(`Invalid file type. Allowed: ${allowedMimes.join(', ')}`)
      return false
    }
    if (f.size > maxSize) {
      setError(`File too large. Max size: ${maxSizeMB} MB`)
      return false
    }
    setError('')
    return true
  }, [allowedMimes, maxSize, maxSizeMB])

  const handleFileSelect = useCallback((e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!validateFile(selected)) return

    setFile(selected)
    if (isImage) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(selected)
    } else {
      setPreview('')
    }
    if (onChange) onChange(selected)
  }, [validateFile, isImage, onChange])

  const clearFile = useCallback(() => {
    setFile(null)
    setPreview('')
    setError('')
    if (onChange) onChange(null)
  }, [onChange])

  const createFormData = useCallback(() => {
    const fd = new FormData()
    if (file) fd.append(fieldName, file)
    return fd
  }, [file, fieldName])

  return (
    <div className="w-full">
      <label className="block font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink-muted-80 mb-1">
        {label}
      </label>

      <input
        type="file"
        accept={accept}
        disabled={disabled || uploading}
        onChange={handleFileSelect}
        className="hidden"
        id={`file-upload-${fieldName}`}
        aria-label={label}
      />

      <div
        className={`relative mt-1 border-2 rounded-xl transition-colors cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'
        } ${file ? 'border-primary bg-primary/5' : 'border-divider-soft bg-white'}`}
        onClick={() => !disabled && !uploading && document.getElementById(`file-upload-${fieldName}`).click()}
      >
        {file && showPreview && isImage && preview && (
          <div className="relative aspect-video">
            <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearFile() }}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              aria-label="Remove file"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {file && showPreview && !isImage && (
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="text-red-500" size={28} />
              <div>
                <p className="font-[Inter,system-ui,sans-serif] text-[14px] font-medium text-ink truncate max-w-xs">{file.name}</p>
                <p className="font-[Inter,system-ui,sans-serif] text-[12px] text-ink-muted-80">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearFile() }}
              className="text-red-500 hover:text-red-600 font-medium text-[13px]"
            >
              Remove
            </button>
          </div>
        )}

        {!file && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {isImage ? <Image size={32} className="text-ink-muted-40 mb-2" /> : <FileText size={32} className="text-ink-muted-40 mb-2" />}
            <p className="font-[Inter,system-ui,sans-serif] text-[14px] text-ink-muted-80">{label}</p>
            <p className="font-[Inter,system-ui,sans-serif] text-[12px] text-ink-muted-60 mt-1">
              {accept === 'application/pdf' ? 'PDF files only' : 'JPG, PNG, WebP, GIF'}
              {maxSizeMB && `, max ${maxSizeMB} MB`}
            </p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />
              <p className="font-[Inter,system-ui,sans-serif] text-[13px] text-ink-muted-80">Uploading... {progress}%</p>
              <div className="w-48 h-2 bg-divider-soft rounded-full mt-2 mx-auto overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="font-[Inter,system-ui,sans-serif] text-red-500 text-[13px] mt-2 flex items-center gap-1">
          <X size={12} className="flex-shrink-0" />
          {error}
        </p>
      )}

      {helpText && !error && (
        <p className="font-[Inter,system-ui,sans-serif] text-[12px] text-ink-muted-60 mt-2">{helpText}</p>
      )}

      {value && !file && !uploading && (
        <div className="mt-3 p-3 border border-divider-soft rounded-lg bg-white">
          <p className="font-[Inter,system-ui,sans-serif] text-[12px] text-ink-muted-60 mb-1">Current file:</p>
          {isImage && value && (
            <img src={value} alt="Current" className="h-20 w-auto rounded-lg border border-divider-soft object-cover" />
          )}
          {!isImage && value && (
            <a href={value} target="_blank" rel="noopener noreferrer" className="font-[Inter,system-ui,sans-serif] text-[13px] text-primary hover:underline flex items-center gap-1">
              <FileText size={14} /> View current file
            </a>
          )}
        </div>
      )}

      <input
        type="hidden"
        name={fieldName}
        value={file ? 'uploaded' : (value || '')}
      />
    </div>
  )
}

export function uploadFile(url, file, fieldName, onProgress, signal) {
  const fd = new FormData()
  fd.append(fieldName, file)
  return fetch(url, {
    method: 'POST',
    body: fd,
    credentials: 'include',
    signal,
    onUploadProgress: onProgress,
  })
}