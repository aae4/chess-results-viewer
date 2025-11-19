<template>
  <v-dialog v-model="dialog" max-width="480" scrollable>
    <v-card rounded="xl" class="pb-2">
      <v-card-item class="pt-6 pb-2">
        <template #prepend>
           <v-avatar color="primary" variant="tonal" size="large" class="mr-2">
             <v-icon icon="mdi-message-alert-outline" color="primary"></v-icon>
           </v-avatar>
        </template>
        <v-card-title class="text-h5 font-weight-bold">Обратная связь</v-card-title>
        <template #append>
          <v-btn icon="mdi-close" variant="text" color="medium-emphasis" @click="dialog = false"></v-btn>
        </template>
      </v-card-item>

      <v-card-text class="pa-4 pt-0">
        <p class="text-body-2 text-medium-emphasis mb-6 pl-2">
          Сайт работает в режиме <strong class="text-primary">Бета-тестирования</strong>. 
          Мы будем благодарны, если вы сообщите об ошибках или предложите идеи по улучшению.
        </p>

        <v-list lines="two" class="pa-0">
          <v-list-item
            :href="yandexFormUrl"
            target="_blank"
            rounded="lg"
            class="mb-2 py-3"
            color="primary"
            link
          >
            <template #prepend>
              <v-icon icon="mdi-form-select" size="large" color="primary" class="mr-4"></v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">Сообщить об ошибке</v-list-item-title>
            <v-list-item-subtitle>Заполнить простую форму (Yandex)</v-list-item-subtitle>
            <template #append>
              <v-icon icon="mdi-open-in-new" size="small" color="medium-emphasis"></v-icon>
            </template>
          </v-list-item>
          <v-list-item
            :href="developerSocialUrl"
            target="_blank"
            rounded="lg"
            class="mb-2 py-3"
            color="primary"
            link
          >
            <template #prepend>
              <v-icon icon="mdi-send-circle" size="large" color="primary" class="mr-4"></v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">Написать разработчику</v-list-item-title>
            <v-list-item-subtitle>Личное сообщение в Telegram</v-list-item-subtitle>
            <template #append>
              <v-icon icon="mdi-open-in-new" size="small" color="medium-emphasis"></v-icon>
            </template>
          </v-list-item>

<!--           <v-list-item
            :href="`mailto:${developerEmail}`"
            rounded="lg"
            class="py-3"
            color="primary"
            link
          >
            <template #prepend>
              <v-icon icon="mdi-email-outline" size="large" color="grey-darken-1" class="mr-4"></v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">Отправить Email</v-list-item-title>
            <v-list-item-subtitle>{{ developerEmail }}</v-list-item-subtitle>
          </v-list-item> -->

        </v-list>
      </v-card-text>
      <!-- <v-card-actions class="justify-end px-4">
        <v-btn color="primary" variant="text" @click="dialog = false">Закрыть</v-btn>
      </v-card-actions> -->
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const yandexFormUrl = 'https://forms.yandex.ru/u/691dd17ce010db355d2b0712'; 
const developerSocialUrl = 'https://t.me/LioNsGaT'; 
const developerEmail = 'email@email.com';
</script>