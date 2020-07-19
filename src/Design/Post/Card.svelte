<script>
  import { createEventDispatcher } from "svelte";

  export let titulo = "";
  export let imagen = "";
  export let descripcion = "";

  const dispatch = createEventDispatcher();

  function ver() {
    dispatch("ver-mas",{id:2,name:"name"});
  }

  function favorito(params) {
    dispatch("favorito");
  }
</script>

<div class="card" style="width:18res">
  <img src={imagen} alt={titulo} style="width:100%;height:200px" />
  <div class="card-body">
    <h5 class="card-title">{titulo}</h5>
    <p class="card-text">{descripcion}</p>
    <button on:click={ver} class="btn-primary">Ver mas...</button>
    <button on:click={favorito} class="btn-danger">Favorito</button>
  </div>
</div>
