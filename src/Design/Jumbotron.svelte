<script>
  import { onMount, onDestroy, beforeUpdate, afterUpdate, tick } from "svelte";
  export let nombre;

  let mostrar;

  function entrar() {
    mostrar = true;
  }
  function salir() {
    mostrar = false;
  }

  //creacion
  //scripts
  //onMount
  //onDestroy



  //actualizacion del DOM
  //beforeUpdate
  //afterUpdate
  //tick
</script>

<style>
  h2 {
    color: red;
    text-decoration: underline;
    font-weight: bold;
  }

  p {
    text-align: justify;
    color: blue;
    text-transform: uppercase;
    font-style: italic;
  }
</style>

<div class="jumbotron mt-4 p-3" on:mouseenter={entrar} on:mouseleave={salir}>
  <h1>{nombre}</h1>

  <h2>
    <slot name="subtitulo">
      <h2>Subtitulo</h2>
    </slot>
  </h2>

  <p>
    <slot name="parrafo" />
  </p>

  <slot {mostrar} />
</div>
