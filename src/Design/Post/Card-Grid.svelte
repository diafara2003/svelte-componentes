<script>
  import Card from "./Card.svelte";

  export let post = [];

  function verMas(e) {
    alert("ver mas");
    console.log(e);
  }

  function marcarFavorito() {
    alert("favorito");
  }
</script>

<div class="row p-2">

  {#each post as p}
    <div class="col-sm-4">
      <Card
        titulo={p.titulo}
        i
        imagen={p.imagen}
        descripcion={p.descripcion}
        on:ver-mas={verMas}
        on:favorito={marcarFavorito} />
    </div>
  {/each}
</div>
