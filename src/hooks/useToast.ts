import { useAppContext } from '../context/AppContext'

export function useToast() {
  const { notify } = useAppContext()
  return notify
}
