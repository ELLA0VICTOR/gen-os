import { useAppContext } from '../context/AppContext'

export function useWallet() {
  const { state, connectWallet, disconnectWallet } = useAppContext()

  return {
    address: state.walletAddress,
    network: state.network,
    connected: Boolean(state.walletAddress),
    connectWallet,
    disconnectWallet,
  }
}
