import type { Chain, Ucs03Channel, UserAddresses } from "$lib/types"
import type { FormFields } from "$lib/components/TransferFrom/transfer/raw-intents.ts"
import { fromHex } from "viem"
import {
  bech32AddressToHex,
  bech32ToBech32Address,
  getChannelInfo,
  isValidBech32Address
} from "@unionlabs/client"
import type { Intents, QuoteResponse } from "$lib/components/TransferFrom/transfer/types.ts"
import type { Balances } from "$lib/stores/balances.ts"
import type { Result } from "neverthrow"
import type { TokenInfos } from "$lib/stores/tokens.ts"

export const createIntents = (
  rawIntents: FormFields,
  balances: Balances,
  userAddress: UserAddresses,
  chains: Array<Chain>,
  ucs03channels: Array<Ucs03Channel>,
  tokenInfos: TokenInfos,
  quoteToken: Result<QuoteResponse, Error> | null
): Intents => {
  // Source Chain
  const sourceChain = chains.find(chain => chain.chain_id === rawIntents.source) ?? null

  // Destination Chain
  const destinationChain = chains.find(chain => chain.chain_id === rawIntents.destination) ?? null

  // Channel
  const channel =
    rawIntents.source && rawIntents.destination
      ? getChannelInfo(rawIntents.source, rawIntents.destination, ucs03channels)
      : null

  // Receiver
  const receiver =
    destinationChain && rawIntents.receiver
      ? destinationChain.rpc_type === "cosmos" && isValidBech32Address(rawIntents.receiver)
        ? bech32AddressToHex({ address: rawIntents.receiver })
        : rawIntents.receiver
      : rawIntents.receiver

  // UCS03 Address
  const ucs03address =
    sourceChain && channel?.source_port_id
      ? sourceChain.rpc_type === "cosmos"
        ? fromHex(`0x${channel.source_port_id}`, "string")
        : `0x${channel.source_port_id}`
      : null

  const baseTokens = sourceChain
    ? sourceChain.tokens
        .map(token => {
          const balance = balances[rawIntents.source]?.[token.denom]
          return {
            denom: token.denom,
            balance: balance?.kind === "balance" ? (balance.amount ?? "0") : "0"
          }
        })
        .sort((a, b) => {
          const balanceA = BigInt(a.balance)
          const balanceB = BigInt(b.balance)
          return balanceB > balanceA ? 1 : balanceB < balanceA ? -1 : 0
        })
    : []

  const baseToken =
    rawIntents.asset && sourceChain
      ? (baseTokens.find(token => token.denom === rawIntents.asset) ?? null)
      : null

  const tokenInfo =
    sourceChain && baseToken?.denom ? tokenInfos[sourceChain.chain_id]?.[baseToken.denom] : null
  const baseTokenInfo = (tokenInfo?.kind === "tokenInfo" ? tokenInfo.info : null) ?? null

  const quoteTokenDenom = quoteToken
    ? quoteToken.isErr()
      ? null
      : quoteToken.value.type === "NO_QUOTE_AVAILABLE"
        ? "NO_QUOTE_AVAILABLE"
        : quoteToken.value.quote_token
    : null
  console.log("quoteTokenDenom", quoteTokenDenom)

  // Own Wallet
  const ownWallet = (() => {
    if (!destinationChain) return null

    switch (destinationChain.rpc_type) {
      case "evm": {
        if (!userAddress.evm) return null
        return userAddress.evm.canonical
      }
      case "cosmos": {
        if (!userAddress.cosmos) return null
        return bech32ToBech32Address({
          address: userAddress.cosmos.canonical,
          toPrefix: destinationChain.addr_prefix
        })
      }
      case "aptos": {
        return userAddress.aptos?.canonical ?? null
      }
      default:
        return null
    }
  })()

  return {
    sourceChain,
    destinationChain,
    baseTokens,
    baseToken,
    baseTokenInfo,
    channel,
    receiver,
    ucs03address,
    amount: rawIntents.amount,
    ownWallet,
    quoteToken: quoteTokenDenom
  }
}
