<script setup lang="ts">
import { Building2, Plus, Trash2 } from '@lucide/vue'
import type { GasStation } from '@/types/refueling'

interface Props {
  stations: GasStation[]
}

defineProps<Props>()

const emit = defineEmits<{
  openStationModal: []
  removeGasStation: [id: number, label: string]
}>()
</script>

<template>
  <section class="management-panel">
    <div class="section-heading compact-heading">
      <div>
        <p class="eyebrow">АЗС</p>
        <h2>{{ stations.length }} записей</h2>
      </div>
    </div>
    <div class="station-list compact-station-list">
      <article v-for="station in stations" :key="station.id">
        <div class="station-icon"><Building2 :size="21" /></div>
        <div class="station-main"><h2>{{ station.company || station.name }}</h2><p>{{ station.name }}<template v-if="station.number"> · №{{ station.number }}</template></p></div>
        <span class="station-address">{{ station.address || 'Адрес не указан' }}</span>
        <button class="icon-button danger" title="Удалить АЗС" @click="emit('removeGasStation', station.id, station.name)"><Trash2 :size="17" /></button>
      </article>
      <button class="add-row" @click="emit('openStationModal')"><Plus :size="20" />Добавить АЗС</button>
    </div>
  </section>
</template>
