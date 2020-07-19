<script>
  export let titulo = "";
  export let imagen = "";
  export let descripcion = "";
</script>

<div class="card" style="width:18res">
  <img src={imagen} alt="{titulo}" style="width:100%;height:200px"/>

  <div class="card-body">
    <h5 class="card-title">{titulo}</h5>
    <p class="card-text">{descripcion}</p>
  </div>
</div>
