<script lang="ts">
import { Button } from "$lib/components/ui/button"
import type { RawIntentsStore } from "$lib/components/TransferFrom/transfer/raw-intents.ts"
import Token from "$lib/components/token.svelte"
import type { Intents } from "$lib/components/TransferFrom/transfer/types.ts"
import type { Chain } from "$lib/types.ts"

interface Props {
  rawIntents: RawIntentsStore
  intents: Intents
  validation: any
  chains: Array<Chain>
  onSelectAsset: () => void
}

export let rawIntents: Props["rawIntents"]
export let intents: Props["intents"]
export let validation: Props["validation"]
export let chains: Props["chains"]
export let onSelectAsset: Props["onSelectAsset"]
</script>

<div class="flex flex-col w-full gap-2">
  <Button
          disabled={!intents.sourceChain}
          type="button"
          size="sm"
          variant="outline"
          class="border-2 font-bold"
          on:click={onSelectAsset}
  >
    {#if $rawIntents.asset}
      {#key $rawIntents.asset}
        <Token highlightEnabled={false} showWrapping={false} {chains} chainId={$rawIntents.source}
               denom={$rawIntents.asset}/>
      {/key}
    {:else}
      Select Asset
    {/if}
  </Button>
  {#if validation.errors.asset}
    <p class="text-red-500 text-xs">{validation.errors.asset}</p>
  {/if}
</div>
