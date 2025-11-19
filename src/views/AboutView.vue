<template>
  <div>
    <v-card class="pa-2">
      <v-row>
        <v-col cols="12" md="6">
          <v-card-item>
            <v-card-title class="text-h4 font-weight-bold">О клубе</v-card-title>
          </v-card-item>
          <v-card-text class="text-body-1">
            <p class="mb-4">
              "Шахматы на Проспекте Мира, 43" — это московский шахматный клуб, который регулярно проводит турниры по классическим шахматам, а так же турниры с контролем времени блиц и рапид.
            </p>
            <p class="mb-4">
              Всю информацию и расписание можно узнать на странице клуба Вконтаке.
            </p>
          </v-card-text>
          <v-divider></v-divider>
          <!-- Секция Организатора -->
          <v-list class="py-0">
            <v-list-subheader class="text-uppercase font-weight-bold text-caption mt-2">Контакты клуба</v-list-subheader>
            
            <v-list-item prepend-icon="mdi-account-tie" title="Вадим Жуков" subtitle="Организатор и главный судья">
              <template #prepend>
                <v-icon color="primary"></v-icon> <!-- Цветная иконка -->
              </template>
            </v-list-item>

            <v-list-item
              href="https://vk.com/id2378017"
              target="_blank"
              prepend-icon="mdi-email-edit-outline"
              title="Связаться с организатором"
              subtitle="Личные сообщения ВКонтакте"
              link
              rounded="lg" 
            >
              <template #prepend><v-icon color="blue"></v-icon></template> <!-- Цвет бренда VK -->
              <template #append><v-icon size="small" color="medium-emphasis">mdi-open-in-new</v-icon></template>
            </v-list-item>

            <v-list-item
              href="https://vk.com/public159635559"
              target="_blank"
              prepend-icon="mdi-account-group"
              title="Группа клуба"
              subtitle="Официальное сообщество ВКонтакте"
              link
              rounded="lg"
            >
              <template #prepend><v-icon color="blue"></v-icon></template>
              <template #append><v-icon size="small" color="medium-emphasis">mdi-open-in-new</v-icon></template>
            </v-list-item>

            <v-list-item
              href="https://yandex.ru/maps/?text=Москва, проспект Мира, 43"
              target="_blank"
              prepend-icon="mdi-map-marker"
              title="Москва, проспект Мира, д.43"
              subtitle="Наш адрес"
              link
              rounded="lg"
            >
              <template #prepend><v-icon color="error"></v-icon></template> <!-- Красная метка как на картах -->
              <template #append><v-icon size="small" color="medium-emphasis">mdi-open-in-new</v-icon></template>
            </v-list-item>
          </v-list>

          <v-divider class="my-2"></v-divider>

          <!-- Секция Разработчика -->
          <v-list class="py-0">
            <v-list-subheader class="d-flex align-center">
              <span class="text-uppercase font-weight-bold text-caption mr-2">О сайте</span>
              <v-chip size="x-small" color="amber" variant="flat" class="font-weight-bold">BETA</v-chip>
            </v-list-subheader>

            <v-list-item prepend-icon="mdi-code-tags-check" title="Разработка и поддержка" subtitle="Вопросы по работе сайта и статистике">
               <template #prepend><v-icon color="grey-darken-1"></v-icon></template>
            </v-list-item>

            <v-list-item
              href="https://t.me/LioNsGaT" 
              target="_blank"
              prepend-icon="mdi-send-circle"
              title="Написать разработчику"
              subtitle="Telegram"
              link
              rounded="lg"
            >
              <template #prepend><v-icon color="light-blue"></v-icon></template>
              <template #append><v-icon size="small" color="medium-emphasis">mdi-open-in-new</v-icon></template>
            </v-list-item>
          </v-list>
        </v-col>
        <v-col cols="12" md="6">
          <a
            href="https://yandex.ru/maps/?text=Москва, проспект Мира, 43"
            target="_blank"
            rel="noopener noreferrer"
            class="map-link"
          >
            <v-img
              src="./map_desktop.png"
              aspect-ratio="1.7"
              cover
              class="rounded-lg elevation-2"
            ></v-img>
          </a>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>