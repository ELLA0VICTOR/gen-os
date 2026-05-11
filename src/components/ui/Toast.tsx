import { useAppContext } from '../../context/AppContext'
import { Close } from '../icons/Icons'

export function ToastViewport() {
  const { state, dismissToast } = useAppContext()

  return (
    <div className="toast-viewport" aria-live="polite">
      {state.toasts.map((toast) => (
        <div className={`toast toast-${toast.tone}`} key={toast.id}>
          <div>
            <strong>{toast.title}</strong>
            {toast.message && <p>{toast.message}</p>}
          </div>
          <button className="icon-button" type="button" aria-label="Dismiss toast" onClick={() => dismissToast(toast.id)}>
            <Close size={16} />
          </button>
          <span className="toast-progress" />
        </div>
      ))}
    </div>
  )
}
