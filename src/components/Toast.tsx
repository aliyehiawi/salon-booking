'use client'

type ToastProps = {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  const base = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 border px-4 py-3 rounded shadow-lg transition-all ${base[type]}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-black">
          ✕
        </button>
      </div>
    </div>
  )
}
