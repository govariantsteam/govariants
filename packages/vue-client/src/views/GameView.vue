<script setup lang="ts">
  import * as requests from "../requests";
  import { ref } from "vue";

  const props = defineProps({
    gameId: String,
  });

  const fetch_result = ref(await requests.get(`/games/${props.gameId}`));
</script>

<template>
  <pre>
    <span>from /games/{{fetch_result.id}}</span>
    {{JSON.stringify(fetch_result, null, 2)}}
	</pre>
</template>

<style scoped>
  pre {
    text-align: left;
  }
</style>
