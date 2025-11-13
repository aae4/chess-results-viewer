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
    <v-list>
      <v-list-item
        prepend-icon="mdi-account-tie"
        title="Организатор и главный судья"
        subtitle="Вадим Жуков"
      ></v-list-item>
      <v-list-item
        href="https://vk.com/id2378017"
        target="_blank"
        prepend-icon="mdi-vk"
        title="Связаться с организатором ВКонтакте"
      ></v-list-item>
       <v-list-item
        href="https://vk.com/public159635559"
        target="_blank"
        prepend-icon="mdi-account-group-outline"
        title="Официальная группа клуба ВКонтакте"
      ></v-list-item>
      <v-list-item
        href="https://yandex.ru/maps/?text=Москва, проспект Мира, 43"
        target="_blank"
        prepend-icon="mdi-map-marker"
        title="Наш адрес: проспект Мира, д.43, Москва"
      ></v-list-item>
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