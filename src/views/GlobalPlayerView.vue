<template>
  <div>
    <div v-if="store.isLoading && !profile">
      <!-- Skeleton для Hero-секции -->
      <v-card class="mb-6">
        <v-card-text class="d-flex flex-column flex-sm-row align-center pa-6">
          <v-skeleton-loader type="avatar" class="mr-sm-6 mb-4 mb-sm-0"></v-skeleton-loader>
          <div class="flex-grow-1">
            <v-skeleton-loader type="heading"></v-skeleton-loader>
            <v-skeleton-loader type="text" max-width="150"></v-skeleton-loader>
          </div>
        </v-card-text>
      </v-card>
      <!-- Skeleton для вкладок и контента -->
      <v-skeleton-loader type="heading" max-width="400" class="mx-auto mb-6"></v-skeleton-loader>
      <v-row>
        <v-col cols="12" md="4">
          <v-skeleton-loader type="heading, list-item-three-line"></v-skeleton-loader>
        </v-col>
        <v-col cols="12" md="8">
          <v-skeleton-loader type="image"></v-skeleton-loader>
        </v-col>
      </v-row>
    </div>
    
    <!-- Состояние ошибки -->
    <v-alert v-else-if="store.error" type="error" prominent border="start" icon="mdi-alert-decagram-outline">
      <div class="text-h6">Ошибка загрузки</div>
      <div>Не удалось загрузить профиль игрока: {{ store.error }}</div>
    </v-alert>

    <!-- Основной контент -->
    <div v-else-if="profile">
      <!-- "Hero" Секция -->
      <v-card class="mb-6">
        <v-card-text class="pa-4 pa-sm-6">
          <div class="d-flex flex-column flex-sm-row align-center">
            <!-- ЛЕВАЯ КОЛОНКА: ИДЕНТИФИКАЦИЯ -->
            <div class="d-flex align-center flex-grow-1">
              <v-btn
                v-if="!smAndDown"
                icon="mdi-arrow-left"
                variant="text"
                class="mr-4"
                @click="router.back()"
              ></v-btn>
              <v-avatar color="primary" size="64" class="mr-4 elevation-2">
                <span class="text-h4 font-weight-light">{{ getInitials(profile.canonical_name) }}</span>
              </v-avatar>
              <div>
                <h1 class="text-h5 font-weight-bold">{{ profile.canonical_name }}</h1>
                <div class="text-subtitle-1 text-medium-emphasis d-flex align-center flex-wrap">
                  <v-icon start size="small">mdi-flag</v-icon>
                  <span>{{ profile.federation }}</span>
                  <div v-if="fideProfileUrl || ruChessProfileUrl" class="ml-4">
                    <v-chip v-if="fideProfileUrl" :href="fideProfileUrl" target="_blank" size="small" prepend-icon="mdi-open-in-new" class="mr-2">FIDE</v-chip>
                    <v-chip v-if="ruChessProfileUrl" :href="ruChessProfileUrl" target="_blank" size="small" prepend-icon="mdi-open-in-new">ФШР</v-chip>
                  </div>
                </div>
              </div>
            </div>

            <v-divider class="my-4" v-if="smAndDown"></v-divider>

            <!-- ПРАВАЯ КОЛОНКА: РЕЗУЛЬТАТЫ -->
            <div class="d-flex justify-center ga-4">
              <div class="text-center px-2">
                <div class="text-caption">Последний рейтинг</div>
                <div class="text-h5 font-weight-bold text-primary">{{ store.keyMetrics.latestRating || 'N/A' }}</div>
              </div>
              <v-divider vertical></v-divider>
              <div class="text-center px-2">
                <div class="text-caption">Пиковый рейтинг</div>
                <div class="text-h5 font-weight-bold text-primary">{{ store.keyMetrics.peakRating || 'N/A' }}</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- ======================================================= -->
      <!-- =========== СЛЕДУЮЩАЯ ИГРА ============================ -->
      <!-- ======================================================= -->
      <v-card v-if="store.nextGame" class="mb-6" elevation="3" border>
        <v-card-item>
          <template #prepend>
            <v-icon color="primary" icon="mdi-chess-queen" size="large"></v-icon>
          </template>
          <v-card-title>Следующая партия</v-card-title>
          <v-card-subtitle>{{ store.nextGame.tournament_name }}</v-card-subtitle>
          <template #append>
            <v-chip color="primary" variant="flat" size="small">Тур {{ store.nextGame.round }}</v-chip>
          </template>
        </v-card-item>

        <v-divider></v-divider>

        <v-card-text>
          <div class="d-flex flex-column flex-sm-row align-center justify-space-between ga-4">
            <!-- ВАШ ЦВЕТ -->
            <div class="d-flex align-center ga-3">
              <div class="text-center">
                <div class="text-caption text-medium-emphasis mb-1">Ваш цвет</div>
                <v-sheet 
                  :color="store.nextGame.color === 'w' ? 'white' : 'black'" 
                  :class="store.nextGame.color === 'w' ? 'text-black' : 'text-white'"
                  class="d-flex align-center justify-center rounded-circle border"
                  width="50" height="50" elevation="2"
                >
                  <v-icon size="30">{{ store.nextGame.color === 'w' ? 'mdi-chess-pawn' : 'mdi-chess-pawn' }}</v-icon>
                </v-sheet>
              </div>
              <div>
                <div class="font-weight-bold text-h6">vs</div>
              </div>
            </div>

            <!-- СОПЕРНИК -->
            <div class="flex-grow-1 text-center text-sm-left">
               <div class="text-caption text-medium-emphasis">Соперник</div>
               <div class="text-h6 font-weight-bold">{{ store.nextGame.opponent_name }}</div>
               <div class="text-body-2 text-medium-emphasis" v-if="store.nextGame.opponent_rating">
                 Рейтинг: {{ store.nextGame.opponent_rating }}
               </div>
            </div>

            <!-- ИНФО О МАТЧЕ -->
            <div class="text-center text-sm-right">
              <div class="mb-1"><v-icon start size="small">mdi-table-furniture</v-icon> Доска {{ store.nextGame.board }}</div>
              <div class="mb-2" v-if="store.nextGame.game_date"><v-icon start size="small">mdi-calendar</v-icon> {{ store.nextGame.game_date }}</div>
              <v-btn 
                variant="outlined" 
                color="primary" 
                size="small"
                append-icon="mdi-arrow-right"
                @click="goToTournament(store.nextGame.tournament_id)"
              >
                В турнир
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- ======================================================= -->
      <!-- =========== СТАТУСНАЯ КАРТОЧКА ======================== -->
      <!-- ======================================================= -->
      <!-- Показываем эту карточку, только если НЕТ следующей игры, чтобы не дублировать инфо -->
      <v-card v-else-if="playerStatus.visible" class="mb-6 card-hover" :color="playerStatus.color" :variant="playerStatus.variant">
        <v-card-text>
          <div class="d-flex align-center">
            <v-icon class="mr-3" :icon="playerStatus.icon" size="24"></v-icon>
            <div class="flex-grow-1">
              <div class="font-weight-bold">{{ playerStatus.title }}</div>
              <div class="text-caption">{{ playerStatus.subtitle }}</div>
            </div>
            <v-btn
              :to="{ name: 'Standings', params: { tournamentId: playerStatus.tournamentId } }"
              variant="outlined"
              size="small"
              append-icon="mdi-arrow-right"
            >
              Перейти
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Система вкладок -->
      <v-sheet class="sticky-tabs" elevation="2">
        <v-tabs v-model="tab" color="primary" :align-tabs="smAndDown ? 'center' : 'start'" show-arrows>
          <v-tab value="overview"><v-icon start>mdi-chart-line</v-icon>Обзор</v-tab>
          <v-tab value="analytics"><v-icon start>mdi-magnify-scan</v-icon>Статистика</v-tab>
          <v-tab value="h2h"><v-icon start>mdi-sword-cross</v-icon>Соперники</v-tab>
          <v-tab value="history"><v-icon start>mdi-history</v-icon>История</v-tab>
        </v-tabs>
      </v-sheet>

    <v-window v-model="tab" :touch="false" class="pa-1 mt-6">
        <!-- ВКЛАДКА "ОБЗОР" -->
        <v-window-item value="overview">
          <v-row>
            <v-col cols="12" md="4">
              <v-card class="fill-height card-hover">
                <v-card-item><v-card-title>Карьерные достижения</v-card-title></v-card-item>
                <v-card-text>
                  <v-row>
                    <v-col cols="6" class="text-center"><v-icon color="amber" size="40">mdi-trophy-variant</v-icon><div class="text-h5 font-weight-bold mt-1">{{ store.careerStats.gold }}</div><div class="text-caption">Золото</div></v-col>
                    <v-col cols="6" class="text-center"><v-icon color="blue-grey-lighten-2" size="40">mdi-trophy-variant</v-icon><div class="text-h5 font-weight-bold mt-1">{{ store.careerStats.silver }}</div><div class="text-caption">Серебро</div></v-col>
                    <v-col cols="6" class="text-center"><v-icon color="brown-lighten-2" size="40">mdi-trophy-variant</v-icon><div class="text-h5 font-weight-bold mt-1">{{ store.careerStats.bronze }}</div><div class="text-caption">Бронза</div></v-col>
                    <v-col cols="6" class="text-center"><v-icon color="primary" size="40">mdi-tournament</v-icon><div class="text-h5 font-weight-bold mt-1">{{ store.careerStats.tournaments }}</div><div class="text-caption">Турниры</div></v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="8">
              <v-card class="fill-height card-hover">
                <v-card-item><v-card-title>График рейтинга</v-card-title><v-card-subtitle>Динамика за всю карьеру</v-card-subtitle></v-card-item>
                <v-card-text>
                  <RatingChart v-if="!store.isLoading && store.ratingHistory.datasets[0]?.data.length > 0" :chart-data="store.ratingHistory" :aspect-ratio="smAndDown ? 1 : 1.5" />
                  <div v-else class="fill-height d-flex flex-column align-center justify-center text-medium-emphasis ga-4 pa-4"><v-icon size="48">mdi-chart-gantt</v-icon><span>Нет данных для построения графика.</span></div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>
        
        <!-- ВКЛАДКА "СТАТИСТИКА" -->
        <v-window-item value="analytics">
          <div v-if="store.isLoadingAnalytics" class="text-center pa-10"><v-progress-circular indeterminate></v-progress-circular></div>
          <v-row v-else>
            <!-- ЛЕВЫЙ СТОЛБЕЦ -->
            <v-col cols="12" lg="5">
              <v-card class="mb-6 card-hover">
                <v-card-item><v-card-title>Результативность</v-card-title></v-card-item>
                <v-card-text class="d-flex justify-space-around align-center text-center">
                  <div class="pa-2">
                    <v-progress-circular :model-value="store.careerPerformanceStats.total.winPercent" :size="90" :width="8" color="primary"><span class="text-h6 font-weight-bold">{{ store.careerPerformanceStats.total.winPercent }}%</span></v-progress-circular>
                    <div class="text-caption mt-2">Процент побед</div>
                  </div>
                  <div><div class="text-h4 font-weight-bold">{{ store.careerPerformanceStats.total.w }}</div><div class="text-caption">Побед</div></div>
                  <div><div class="text-h4 font-weight-bold">{{ store.careerPerformanceStats.total.total }}</div><div class="text-caption">Партий</div></div>
                </v-card-text>
                <v-divider></v-divider>
                <v-list class="py-0" lines="two">
                  <v-list-item>
                    <template #prepend>
                      <div class="color-indicator-large bg-white border mr-4"></div>
                    </template>
                    <v-list-item-title class="font-weight-bold">Белыми: {{ store.careerPerformanceStats.white.score }} / {{ store.careerPerformanceStats.white.total }}</v-list-item-title>
                    <v-list-item-subtitle>{{ store.careerPerformanceStats.white.winPercent }}% побед</v-list-item-subtitle>
                    <template #append><div class="d-flex ga-1"><v-chip color="success" size="small" label>+{{ store.careerPerformanceStats.white.w }}</v-chip><v-chip size="small" label>={{ store.careerPerformanceStats.white.d }}</v-chip><v-chip color="error" size="small" label>-{{ store.careerPerformanceStats.white.l }}</v-chip></div></template>
                  </v-list-item>
                  <v-divider></v-divider>
                  <v-list-item>
                    <template #prepend>
                      <div class="color-indicator-large bg-black border mr-4"></div>
                    </template>
                    <v-list-item-title class="font-weight-bold">Черными: {{ store.careerPerformanceStats.black.score }} / {{ store.careerPerformanceStats.black.total }}</v-list-item-title>
                    <v-list-item-subtitle>{{ store.careerPerformanceStats.black.winPercent }}% побед</v-list-item-subtitle>
                    <template #append><div class="d-flex ga-1"><v-chip color="success" size="small" label>+{{ store.careerPerformanceStats.black.w }}</v-chip><v-chip size="small" label>={{ store.careerPerformanceStats.black.d }}</v-chip><v-chip color="error" size="small" label>-{{ store.careerPerformanceStats.black.l }}</v-chip></div></template>
                  </v-list-item>
                </v-list>
              </v-card>
              <v-card class="card-hover">
                <v-card-item>
                  <v-card-title>Дебютный репертуар</v-card-title>
                  <template #append>
                    <v-tabs v-model="openingTab" density="compact" color="primary">
                      <v-tab value="white" min-width="50">
                        <div class="color-indicator-small bg-white border"></div>
                      </v-tab>
                      <v-tab value="black" min-width="50">
                        <div class="color-indicator-small bg-black border"></div>
                      </v-tab>
                    </v-tabs>
                  </template>
                </v-card-item>
                <v-window v-model="openingTab">
                  <v-window-item value="white">
                     <v-list v-if="processedOpenings.white.length" density="compact" class="py-0">
                       <v-list-item v-for="op in processedOpenings.white.slice(0,5)" :key="op.eco" :title="op.name" :subtitle="op.eco"><template #append><v-chip label size="small" variant="tonal">{{ op.score }}/{{ op.count }} ({{ op.percent }}%)</v-chip></template></v-list-item>
                     </v-list>
                     <div v-else class="pa-4 text-center text-medium-emphasis d-flex flex-column ga-2 align-center"><v-icon size="32">mdi-book-open-variant</v-icon><span>Нет данных по дебютам белыми.</span></div>
                  </v-window-item>
                  <v-window-item value="black">
                     <v-list v-if="processedOpenings.black.length" density="compact" class="py-0">
                       <v-list-item v-for="op in processedOpenings.black.slice(0,5)" :key="op.eco" :title="op.name" :subtitle="op.eco"><template #append><v-chip label size="small" variant="tonal">{{ op.score }}/{{ op.count }} ({{ op.percent }}%)</v-chip></template></v-list-item>
                     </v-list>
                     <div v-else class="pa-4 text-center text-medium-emphasis d-flex flex-column ga-2 align-center"><v-icon size="32">mdi-book-open-variant</v-icon><span>Нет данных по дебютам черными.</span></div>
                  </v-window-item>
                </v-window>
              </v-card>
            </v-col>

            <!-- ПРАВЫЙ СТОЛБЕЦ -->
            <v-col cols="12" lg="7">
            <v-card class="mb-6 card-hover">
              <v-card-item><v-card-title>Результаты против оппонентов</v-card-title></v-card-item>
              <v-list class="py-0">
                <v-list-item prepend-icon="mdi-arrow-up-bold-circle">
                  <v-list-item-title>Против игроков сильнее</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-progress-linear class="my-2" :model-value="store.processedOpponentStats.vs_stronger.percent" color="primary" height="8" rounded></v-progress-linear>
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="stat-numbers text-right">
                      <div class="font-weight-bold">{{ store.processedOpponentStats.vs_stronger.score }} / {{ store.processedOpponentStats.vs_stronger.total }}</div>
                      <div class="text-caption text-medium-emphasis">{{ store.processedOpponentStats.vs_stronger.percent }}%</div>
                    </div>
                  </template>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item prepend-icon="mdi-equal-box">
                  <v-list-item-title>Против равных по силе</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-progress-linear class="my-2" :model-value="store.processedOpponentStats.vs_equal.percent" color="secondary" height="8" rounded></v-progress-linear>
                  </v-list-item-subtitle>
                   <template #append>
                    <div class="stat-numbers text-right">
                      <div class="font-weight-bold">{{ store.processedOpponentStats.vs_equal.score }} / {{ store.processedOpponentStats.vs_equal.total }}</div>
                      <div class="text-caption text-medium-emphasis">{{ store.processedOpponentStats.vs_equal.percent }}%</div>
                    </div>
                  </template>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item prepend-icon="mdi-arrow-down-bold-circle">
                  <v-list-item-title>Против игроков слабее</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-progress-linear class="my-2" :model-value="store.processedOpponentStats.vs_weaker.percent" color="primary" height="8" rounded></v-progress-linear>
                  </v-list-item-subtitle>
                   <template #append>
                    <div class="stat-numbers text-right">
                      <div class="font-weight-bold">{{ store.processedOpponentStats.vs_weaker.score }} / {{ store.processedOpponentStats.vs_weaker.total }}</div>
                      <div class="text-caption text-medium-emphasis">{{ store.processedOpponentStats.vs_weaker.percent }}%</div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
            <v-card class="mb-6 card-hover">
              <v-card-item><v-card-title>Динамика в турнире</v-card-title></v-card-item>
              <v-list class="py-0">
                <v-list-item prepend-icon="mdi-numeric-1-box-multiple-outline">
                  <v-list-item-title>Начало</v-list-item-title>
                  <v-list-item-subtitle><v-progress-linear class="my-2" :model-value="store.performanceByRounds.opening.percent" color="primary" height="8" rounded></v-progress-linear></v-list-item-subtitle>
                  <template #append>
                    <div class="stat-numbers text-right">
                      <div class="font-weight-bold">{{ store.performanceByRounds.opening.score }} / {{ store.performanceByRounds.opening.total }}</div>
                      <div class="text-caption text-medium-emphasis">{{ store.performanceByRounds.opening.percent }}%</div>
                    </div>
                  </template>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item prepend-icon="mdi-numeric-2-box-multiple-outline">
                  <v-list-item-title>Середина</v-list-item-title>
                  <v-list-item-subtitle><v-progress-linear class="my-2" :model-value="store.performanceByRounds.middlegame.percent" color="secondary" height="8" rounded></v-progress-linear></v-list-item-subtitle>
                  <template #append>
                    <div class="stat-numbers text-right">
                      <div class="font-weight-bold">{{ store.performanceByRounds.middlegame.score }} / {{ store.performanceByRounds.middlegame.total }}</div>
                      <div class="text-caption text-medium-emphasis">{{ store.performanceByRounds.middlegame.percent }}%</div>
                    </div>
                  </template>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item prepend-icon="mdi-numeric-3-box-multiple-outline">
                  <v-list-item-title>Финиш</v-list-item-title>
                  <v-list-item-subtitle><v-progress-linear class="my-2" :model-value="store.performanceByRounds.endgame.percent" color="primary" height="8" rounded></v-progress-linear></v-list-item-subtitle>
                  <template #append>
                    <div class="stat-numbers text-right">
                      <div class="font-weight-bold">{{ store.performanceByRounds.endgame.score }} / {{ store.performanceByRounds.endgame.total }}</div>
                      <div class="text-caption text-medium-emphasis">{{ store.performanceByRounds.endgame.percent }}%</div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
              <v-card class="card-hover">
                <v-card-item><v-card-title>Ключевые партии</v-card-title></v-card-item>
                <v-list lines="two" class="py-0">
                  <v-list-item v-if="store.notableResults.bestWin" class="list-item-hover" @click="goToGame(store.notableResults.bestWin)">
                    <template #prepend><v-icon color="success" size="x-large" class="mr-4">mdi-arrow-up-circle-outline</v-icon></template>
                    <v-list-item-title>Лучшая победа</v-list-item-title>
                    <v-list-item-subtitle>Против <strong>{{ store.notableResults.bestWin.opponent_name }}</strong> ({{ store.notableResults.bestWin.opponent_rating }})</v-list-item-subtitle>
                  </v-list-item>
                  <v-divider v-if="store.notableResults.bestWin && store.notableResults.worstLoss"></v-divider>
                  <v-list-item v-if="store.notableResults.worstLoss" class="list-item-hover" @click="goToGame(store.notableResults.worstLoss)">
                    <template #prepend><v-icon color="error" size="x-large" class="mr-4">mdi-alert-octagon-outline</v-icon></template>
                    <v-list-item-title>Самое обидное поражение</v-list-item-title>
                    <v-list-item-subtitle>Против <strong>{{ store.notableResults.worstLoss.opponent_name }}</strong> ({{ store.notableResults.worstLoss.opponent_rating }})</v-list-item-subtitle>
                  </v-list-item>
                   <div v-if="!store.notableResults.bestWin && !store.notableResults.worstLoss" class="pa-4 text-center text-medium-emphasis d-flex flex-column ga-2 align-center"><v-icon size="32">mdi-chess-pawn</v-icon><span>Нет данных по ключевым партиям.</span></div>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>
        
        <!-- ======================================================= -->
        <!-- ======== ВКЛАДКА "СОПЕРНИКИ" (H2H) ==================== -->
        <!-- ======================================================= -->
        <v-window-item value="h2h">
           <div v-if="store.isLoadingAnalytics" class="text-center pa-10"><v-progress-circular indeterminate></v-progress-circular></div>
           <v-card v-else class="card-hover">
             <v-toolbar flat>
               <v-toolbar-title>Личные встречи</v-toolbar-title>
               <v-spacer></v-spacer>
               <v-text-field v-model="h2hSearch" prepend-inner-icon="mdi-magnify" label="Поиск..." hide-details density="compact" style="max-width: 300px;"></v-text-field>
             </v-toolbar>
             
             <!-- Показываем таблицу ТОЛЬКО на десктопе -->
             <v-data-table
                v-if="!smAndDown"
                :headers="h2hHeaders"
                :items="store.processedH2HStats"
                :search="h2hSearch"
                item-value="opponent_id"
                hover
                @click:row="(_, { item }) => goToOpponentProfile(item.opponent_id)"
             >
              <template #item.opponent_name="{ item }"><div class="font-weight-bold">{{ item.opponent_name }}</div></template>
              <template #item.score="{ item }"><div class="d-flex justify-center ga-1"><v-chip color="success" size="small" label>+{{ item.wins }}</v-chip><v-chip size="small" label>={{ item.draws }}</v-chip><v-chip color="error" size="small" label>-{{ item.losses }}</v-chip></div></template>
             </v-data-table>

             <!-- Показываем список на МОБИЛЬНЫХ -->
             <v-list v-else lines="two">
               <template v-for="(item, index) in store.processedH2HStats.filter(i => i.opponent_name.toLowerCase().includes(h2hSearch.toLowerCase()))" :key="item.opponent_id">
                 <v-list-item @click="goToOpponentProfile(item.opponent_id)">
                   <v-list-item-title class="font-weight-bold">{{ item.opponent_name }}</v-list-item-title>
                   <v-list-item-subtitle>Всего партий: {{ item.total_games }}</v-list-item-subtitle>
                   <template #append>
                     <div class="d-flex ga-1">
                       <v-chip color="success" size="small" label>+{{ item.wins }}</v-chip>
                       <v-chip size="small" label>={{ item.draws }}</v-chip>
                       <v-chip color="error" size="small" label>-{{ item.losses }}</v-chip>
                     </div>
                   </template>
                 </v-list-item>
                 <v-divider v-if="index < store.processedH2HStats.length - 1"></v-divider>
               </template>
             </v-list>
           </v-card>
        </v-window-item>

        <!-- ======================================================= -->
        <!-- ======== ВКЛАДКА "ИСТОРИЯ" ============================ -->
        <!-- ======================================================= -->
        <v-window-item value="history">
          <v-card class="card-hover">
            <v-card-title class="pa-4">История турниров</v-card-title>
            
            <!-- Таблица только для десктопа -->
            <v-data-table
              v-if="!smAndDown"
              :headers="historyHeaders"
              :items="sortedPlayerCareer"
              item-value="tournament_id"
              density="comfortable"
              hover
              @click:row="(_, { item }) => goToTournament(item.tournament_id)"
            >
              <template #item.tournament_name="{ item }"><div>{{ item.tournament_name }}</div><div class="text-caption text-medium-emphasis">{{ item.start_date }}</div></template>
              <template #item.final_rank="{ item }"><v-chip v-if="item.final_rank <= 3" :color="getPodiumColor(item.final_rank)" label size="small" class="font-weight-bold"><v-icon start>mdi-trophy</v-icon> {{ item.final_rank }}</v-chip><span v-else>{{ item.final_rank }}</span></template>
              <template #item.rating_change="{ item }"><span :class="getRatingChangeColor(item.rating_change)">{{ formatRatingChange(item.rating_change) }}</span></template>
            </v-data-table>

            <!-- Cписок для МОБИЛЬНЫХ -->
            <v-list v-else lines="three">
              <template v-for="(item, index) in sortedPlayerCareer" :key="item.tournament_id">
                <v-list-item @click="goToTournament(item.tournament_id)">
                  <v-list-item-title class="wrap-text font-weight-bold mb-1">{{ item.tournament_name }}</v-list-item-title>
                  <v-list-item-subtitle class="d-flex justify-space-between align-center">
                    <span>{{ item.start_date }}</span>
                    <v-chip v-if="item.final_rank <= 3" :color="getPodiumColor(item.final_rank)" label size="small" class="font-weight-bold"><v-icon start>mdi-trophy</v-icon>Место: {{ item.final_rank }}</v-chip>
                    <span v-else>Место: {{ item.final_rank }}</span>
                  </v-list-item-subtitle>
                   <v-list-item-subtitle class="d-flex justify-space-between align-center mt-1">
                      <span>Рейтинг: {{ item.rating_at_tournament }}</span>
                      <span :class="getRatingChangeColor(item.rating_change)">{{ formatRatingChange(item.rating_change) }}</span>
                   </v-list-item-subtitle>
                </v-list-item>
                <v-divider v-if="index < store.playerCareer.length - 1"></v-divider>
              </template>
            </v-list>
          </v-card>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '@/stores/playerStore';
import { useDisplay } from 'vuetify';
import { getInitials } from '@/utils/formatters';
import { getEcoDatabase } from '@/services/ecoDatabase';
import { useTournamentStore } from '@/stores/tournamentStore';
import RatingChart from '@/components/RatingChart.vue';

// --- PROPS & STORE ---
const props = defineProps({ playerId: { type: [String, Number], required: true }});
const store = usePlayerStore();
const tournamentStore = useTournamentStore();
const router = useRouter();
const { smAndDown } = useDisplay();

// --- STATE ---
const tab = ref('overview');
const openingTab = ref('white');
const h2hSearch = ref('');
const ecoDb = ref(null);

// --- COMPUTED ---
const profile = computed(() => store.playerProfile);

const sortedPlayerCareer = computed(() => {
  return [...store.playerCareer].reverse();
});

const fideProfileUrl = computed(() => {
  const fideId = store.playerProfile?.fide_id;
  return fideId ? `https://ratings.fide.com/profile/${fideId}` : null;
});

const ruChessProfileUrl = computed(() => {
  const ruChessId = store.playerProfile?.national_id; // Предполагаем, что national_id - это ID ФШР
  return ruChessId ? `https://ratings.ruchess.ru/people/${ruChessId}` : null;
});

const playerStatus = computed(() => {
  const participation = store.participationInCurrentTournament;
  const current = tournamentStore.currentTournament;

  // Если игрок участвует в текущем событии
  if (participation && current) {
    return {
      visible: true,
      title: "Сейчас участвует",
      subtitle: current.name,
      icon: "mdi-play-circle",
      color: "primary",
      variant: "tonal",
      tournamentId: current.id,
    };
  }

  // Если не участвует, показываем последнее участие
  const career = store.playerCareer;
  if (career && career.length > 0) {
    const lastTournament = career[career.length - 1]; // Карьера отсортирована по дате
    return {
      visible: true,
      title: "Последнее участие",
      subtitle: lastTournament.tournament_name,
      icon: "mdi-history",
      color: undefined,
      variant: "outlined",
      tournamentId: lastTournament.tournament_id,
    };
  }
  
  // Если нет данных, ничего не показываем
  return { visible: false };
});

const processedOpenings = computed(() => {
  const openings = { white: [], black: [] };
  if (!store.openingStats || !ecoDb.value) return openings;
  const ecoCodeToNameMap = Object.values(ecoDb.value).reduce((acc, { e, n }) => {
    if (!acc[e]) { acc[e] = n; }
    return acc;
  }, {});
  const grouped = store.openingStats.reduce((acc, stat) => {
    const key = `${stat.eco_code}-${stat.player_color}`;
    if (!acc[key]) {
      acc[key] = { eco: stat.eco_code, name: ecoCodeToNameMap[stat.eco_code] || stat.eco_code, color: stat.player_color, count: 0, wins: 0, draws: 0 };
    }
    acc[key].count += stat.games_count;
    acc[key].wins += stat.wins;
    acc[key].draws += stat.draws;
    return acc;
  }, {});
  Object.values(grouped).forEach(op => {
    op.score = op.wins + op.draws * 0.5;
    op.percent = Math.round((op.score / op.count) * 100);
    if (op.color === 'w') openings.white.push(op);
    else openings.black.push(op);
  });
  openings.white.sort((a,b) => b.count - a.count || b.score - a.score);
  openings.black.sort((a,b) => b.count - a.count || b.score - a.score);
  return openings;
});

// --- HEADERS for DATA TABLES ---
const historyHeaders = [
  { title: 'Турнир', key: 'tournament_name', sortable: false },
  { title: 'Место', key: 'final_rank', align: 'center' },
  { title: 'Очки', key: 'score', align: 'center' },
  { title: 'Рейтинг', key: 'rating_at_tournament', align: 'center' },
  { title: '+/-', key: 'rating_change', align: 'center' },
];

const h2hHeaders = [
  { title: 'Соперник', key: 'opponent_name' },
  { title: 'Счет (+/=/-)', key: 'score', align: 'center', sortable: false },
  { title: 'Всего партий', key: 'total_games', align: 'center' },
];

// --- WATCHERS & LIFECYCLE ---
watch(() => props.playerId, (newId) => {
  if (newId) {
    tab.value = 'overview';
    store.clearPlayerData();
    store.fetchPlayerData(newId);
  }
}, { immediate: true });

watch(tab, (newTab) => {
  if (newTab === 'analytics' && !store.opponentStats) {
    store.fetchPlayerAnalytics(props.playerId);
    if (!ecoDb.value) {
      getEcoDatabase().then(db => ecoDb.value = db);
    }
  }
  if (newTab === 'h2h' && !store.h2hStats) {
    store.fetchPlayerH2H(props.playerId);
  }
});

onUnmounted(() => {
  store.clearPlayerData();
});

// --- METHODS / HELPERS ---
const goToTournament = (tournamentId) => router.push({ name: 'Standings', params: { tournamentId } });
const goToOpponentProfile = (playerId) => router.push({ name: 'GlobalPlayer', params: { playerId }});
const goToGame = (game) => {
  if (game && game.game_id) {
    router.push({ name: 'Game', params: { tournamentId: game.tournament_id, gameId: game.game_id }});
  }
};

const getPodiumColor = (rank) => {
  if (rank == 1) return 'amber';
  if (rank == 2) return 'blue-grey-lighten-3';
  if (rank == 3) return 'brown-lighten-2';
  return 'default';
};
const formatRatingChange = (change) => {
  if (change === null || change === undefined) return '–';
  const val = parseFloat(change);
  return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
};
const getRatingChangeColor = (change) => {
  if (change === null || change === undefined) return '';
  return parseFloat(change) > 0 ? 'text-success' : 'text-error';
};

</script>

<style scoped>
.list-item-hover:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  cursor: pointer;
}
.card-hover {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.wrap-text {
  white-space: normal;
}

.sticky-tabs {
  position: sticky;
  top: 64px;
  z-index: 100; 
}

.color-indicator-large {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border-color: rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}

.color-indicator-small {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border-color: rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}
</style>