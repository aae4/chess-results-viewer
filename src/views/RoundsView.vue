<template>
  <div>
    <v-chip-group v-model="selectedRound" mandatory color="primary" class="mb-4">
      <v-chip v-for="roundNum in store.roundsList" :key="roundNum" :value="roundNum" filter>
        Тур {{ roundNum }}
      </v-chip>
    </v-chip-group>
    
    <v-row v-if="currentRoundData">
      <v-col
        v-for="pairing in currentRoundData.pairings"
        :key="pairing.board"
        cols="12"
        md="6"
      >
        <v-card variant="outlined">
          <v-toolbar color="transparent" density="compact">
            <v-toolbar-title class="text-caption font-weight-bold">Доска {{ pairing.board }}</v-toolbar-title>
          </v-toolbar>
          <v-divider></v-divider>
          <v-card-text class="py-4">
            <v-row align="center" no-gutters>
              <v-col class="text-right d-flex justify-end align-center">
                <div>
                  <a href="#" @click.prevent="goToPlayer(pairing.whitePlayer.start_no)" class="player-link text-subtitle-1 font-weight-bold">
                    {{ pairing.white }}
                  </a>
                  <div class="text-caption text-grey">{{ pairing.whitePlayer?.rating }}</div>
                </div>
                <v-icon class="ml-2" size="x-small" :icon="getColorIcon('w')"></v-icon>
              </v-col>
              <v-col cols="auto" class="px-3">
                <v-chip variant="tonal" label>{{ formatResult(pairing.result) }}</v-chip>
              </v-col>
              <v-col class="d-flex align-center">
                <v-icon class="mr-2" size="x-small" :icon="getColorIcon('b')"></v-icon>
                <div>
                  <a href="#" @click.prevent="goToPlayer(pairing.blackPlayer.start_no)" class="player-link text-subtitle-1 font-weight-bold">
                    {{ pairing.black }}
                  </a>
                  <div class="text-caption text-grey">{{ pairing.blackPlayer?.rating }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
          <v-divider v-if="pairing.pgn"></v-divider>
          <v-card-actions v-if="pairing.pgn">
            <v-btn block variant="tonal" color="primary" @click="goToGame(pairing)" prepend-icon="mdi-chess-pawn">
              Смотреть партию
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <v-col v-if="currentRoundData.byePlayer" cols="12" md="6">
        <v-card variant="tonal" class="fill-height">
          <v-card-text class="d-flex align-center justify-center fill-height">
            <v-icon class="mr-2" color="grey">mdi-coffee-outline</v-icon>
            <span class="text-grey">{{ currentRoundData.byePlayer.name }} пропускает тур.</span>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournament';
import { formatResult, getColorIcon } from '@/utils/formatters';

const store = useTournamentStore();
const router = useRouter();

// По умолчанию выбираем первый тур
const selectedRound = ref(1);

const currentRoundData = computed(() => {
  return store.roundsData[selectedRound.value] || null;
});

const goToPlayer = (startNo) => {
  if (startNo) {
    router.push({ name: 'player', params: { start_no: startNo } });
  }
};

const goToGame = (pairing) => {
  // Создаем уникальный ID для партии: "раунд-доска"
  const gameId = `${pairing.round}-${pairing.board}`;
  router.push({ name: 'game', params: { id: gameId } });
};
</script>

<style scoped>
.player-link {
  text-decoration: none;
  color: inherit;
  transition: color 0.2s;
}
.player-link:hover {
  text-decoration: underline;
  color: rgb(var(--v-theme-primary));
}
</style>