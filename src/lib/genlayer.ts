import { createClient } from 'genlayer-js'
import { testnetBradbury } from 'genlayer-js/chains'
import { TransactionStatus, ExecutionResult } from 'genlayer-js/types'

export const GENOS_CONTRACT_ADDRESS = import.meta.env.VITE_GENOS_CONTRACT_ADDRESS || ''
export const GENOS_ESCROW_ADDRESS = import.meta.env.VITE_GENOS_ESCROW_ADDRESS || ''
export const GENLAYER_RPC_URL = import.meta.env.VITE_GENLAYER_RPC_URL || 'https://rpc-bradbury.genlayer.com'
export const BRADBURY_NETWORK_NAME = 'testnetBradbury'
export const BRADBURY_CHAIN_ID_HEX = '0x107d'

const BRADBURY_CHAIN_PARAMS = {
  chainId: BRADBURY_CHAIN_ID_HEX,
  chainName: 'GenLayer Bradbury Testnet',
  rpcUrls: ['https://rpc-bradbury.genlayer.com'],
  nativeCurrency: {
    name: 'GEN Token',
    symbol: 'GEN',
    decimals: 18,
  },
  blockExplorerUrls: ['https://explorer-bradbury.genlayer.com'],
}

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
  on?: (event: string, callback: (...args: unknown[]) => void) => void
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void
}

function walletErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    return String(record.message ?? record.shortMessage ?? record.details ?? record.reason ?? JSON.stringify(record))
  }
  return String(error)
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

export function getReadClient() {
  return createClient({
    chain: testnetBradbury,
    endpoint: GENLAYER_RPC_URL,
  })
}

export function getWriteClient(account: `0x${string}`, provider: EthereumProvider) {
  return createClient({
    chain: testnetBradbury,
    endpoint: GENLAYER_RPC_URL,
    account,
    provider,
  })
}

export function ensureContractsConfigured() {
  if (!GENOS_CONTRACT_ADDRESS || !GENOS_ESCROW_ADDRESS) {
    throw new Error('Bradbury contract addresses are not configured')
  }
}

export function normalizeResult<T = unknown>(value: unknown): T {
  if (typeof value === 'bigint') {
    const numberValue = Number(value)
    return (Number.isSafeInteger(numberValue) ? numberValue : value.toString()) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeResult(item)) as T
  }

  if (value instanceof Map) {
    return Object.fromEntries(Array.from(value.entries(), ([key, entry]) => [key, normalizeResult(entry)])) as T
  }

  if (typeof value === 'string') {
    const match = value.match(/^Address\("(.+)"\)$/)
    return (match ? match[1] : value) as T
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeResult(entry)])) as T
  }

  return value as T
}

export function parseGenToWei(value: string) {
  const cleaned = value.trim()
  if (!/^\d+(\.\d{1,18})?$/.test(cleaned)) {
    throw new Error('GEN amount must be a positive number with up to 18 decimals')
  }

  const [whole, fraction = ''] = cleaned.split('.')
  const wholeWei = BigInt(whole) * 1_000_000_000_000_000_000n
  const fractionWei = BigInt(fraction.padEnd(18, '0'))
  const total = wholeWei + fractionWei

  if (total <= 0n) {
    throw new Error('GEN amount must be greater than zero')
  }

  return total
}

async function requestBradburyNetwork(provider: EthereumProvider) {
  try {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [BRADBURY_CHAIN_PARAMS],
    })
  } catch (error) {
    const message = walletErrorMessage(error)
    if (!message.toLowerCase().includes('already') && !message.toLowerCase().includes('exists')) {
      console.warn('Unable to add Bradbury network automatically:', message)
    }
  }

  await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: BRADBURY_CHAIN_ID_HEX }],
  })
}

export async function readGenOS<T = unknown>(functionName: string, args: unknown[] = []) {
  ensureContractsConfigured()
  const result = await getReadClient().readContract({
    address: GENOS_CONTRACT_ADDRESS,
    functionName,
    args,
    stateStatus: 'accepted',
  })
  return normalizeResult<T>(result)
}

export async function readEscrow<T = unknown>(functionName: string, args: unknown[] = []) {
  ensureContractsConfigured()
  const result = await getReadClient().readContract({
    address: GENOS_ESCROW_ADDRESS,
    functionName,
    args,
    stateStatus: 'accepted',
  })
  return normalizeResult<T>(result)
}

export async function connectBradburyWallet() {
  const provider = window.ethereum
  if (!provider) {
    throw new Error('No browser wallet found. Install MetaMask or another EIP-1193 wallet.')
  }

  await requestBradburyNetwork(provider)

  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[]
  const account = accounts?.[0] as `0x${string}` | undefined
  if (!account) {
    throw new Error('Wallet did not return an address')
  }

  return { account, provider }
}

export async function writeGenOS(
  account: `0x${string}`,
  provider: EthereumProvider,
  functionName: string,
  args: unknown[] = [],
  value?: bigint,
) {
  ensureContractsConfigured()
  const client = getWriteClient(account, provider)
  return client.writeContract({
    address: GENOS_CONTRACT_ADDRESS,
    functionName,
    args,
    ...(value !== undefined ? { value } : {}),
  })
}

export async function writeEscrow(
  account: `0x${string}`,
  provider: EthereumProvider,
  functionName: string,
  args: unknown[] = [],
  value?: bigint,
) {
  ensureContractsConfigured()
  const client = getWriteClient(account, provider)
  return client.writeContract({
    address: GENOS_ESCROW_ADDRESS,
    functionName,
    args,
    ...(value !== undefined ? { value } : {}),
  })
}

export async function waitForAccepted(hash: `0x${string}`) {
  const receipt = await getReadClient().waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    fullTransaction: false,
  })

  if (receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_ERROR) {
    throw new Error('Transaction finalized but contract execution failed')
  }

  return receipt
}
