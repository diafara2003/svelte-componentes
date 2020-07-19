<script>
  export let control;
  export let value;
  export let placeholder;
  export let type;
  export let nombre;
  export let id;
</script>

<div class="form group">
  <label {id}>{nombre}</label>

  {#if control === 'textarea'}
    <textarea
      {id}
      {placeholder}
      {value}
      on:input
      rows="10"
      cols="30"
      class="form-control" />
  {:else}
    <input {type} {id} {placeholder} {value} on:input class="form-control" />
  {/if}

</div>
