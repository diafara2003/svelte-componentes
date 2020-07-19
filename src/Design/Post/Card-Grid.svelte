<script>
  import Card from "./Card.svelte";

  export let post = [];
</script>

<div class="row p-2">

  {#each post as p}
    <div class="col-sm-4">
      <Card titulo={p.titulo} imagen={p.imagen} descripcion={p.descripcion} />
    </div>
  {/each}
</div>
