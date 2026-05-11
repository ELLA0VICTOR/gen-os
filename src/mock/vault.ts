import type { VaultState } from './types'

export const vault: VaultState = {
  address: '0xE4C21bdaA3e6c6419bC008DDC78E022E13f5a110',
  escrowContract: '0x0Baa3BDc2dB507aD9C340FC4374F268aA6317A5c',
  network: 'Bradbury',
  balance: 48200,
  authorizedAgents: [
    '0x8A340271fE75c6bAB65A36d6625Ff9A432fF8421',
    '0xB17Bd8E81370dd19aF4bE4c339d2012d9B544fB2',
    '0xC8E8dAdDfae44DE0917cfD11599B9dC4bB8A0C28',
  ],
  transactions: [
    {
      id: 'tx-001',
      type: 'Deposit',
      amount: 10000,
      counterparty: '0x28E7C6DFe94c9F11aD05A8C35B49e091B2d73051',
      txHash: '0x73a36d98c1bfa72621bd8942211826b92a3D6E20dA310e64ba2a612764fdb2ca',
      time: '2026-05-11T07:33:00Z',
    },
    {
      id: 'tx-002',
      type: 'Release',
      amount: 420,
      counterparty: '0xa75dcA59ED62725D85B16458f28bD4d61D48E534',
      txHash: '0x19bc08fb21f4c1ce8d09918dbd761440315791C227fdbe93864e23efa01a2e31',
      time: '2026-05-10T21:02:00Z',
    },
    {
      id: 'tx-003',
      type: 'Hold',
      amount: 1400,
      counterparty: '0x294dB55CfAf9f5d3fC9dFFd580289CF50A4A2f2c',
      txHash: '0x7cddf19e33d2f09f1773235c15ec7B514ee0380363b7400b1bd4011d4479a0a',
      time: '2026-05-10T17:30:00Z',
    },
    {
      id: 'tx-004',
      type: 'Withdrawal',
      amount: 2500,
      counterparty: '0x69D9aC03F02e83d18E5f2E936b5C58123615A026',
      txHash: '0xe0221982482e9bc785bd40e8119966F3577d66a8c315410A23cd71eC25bc2910',
      time: '2026-05-08T14:18:00Z',
    },
  ],
}
