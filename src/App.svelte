<script>
  import Header from "./Design/Header.svelte";
  import CardGrid from "./Design/Post/Card-Grid.svelte";
  import Inputcustom from "./Design/Inputcustom.svelte";
  import Jumbotron from "./Design/Jumbotron.svelte";

  let titulo = "";
  let descripcion = "";
  let imagen = "";

  let post = [
    {
      titulo: "Londres",
      descripcion: "Big ben",
      imagen:
        "https://cdn.pixabay.com/photo/2014/11/13/23/34/london-530055_1280.jpg"
    },
    {
      titulo: "Paris",
      descripcion: "torre effel",
      imagen:
        "https://cdn.pixabay.com/photo/2015/05/15/14/27/eiffel-tower-768501_1280.jpg"
    },
    {
      titulo: "Alemania",
      descripcion: "centro",
      imagen:
        "https://media.istockphoto.com/photos/empty-brandenburg-gate-during-the-covid19-crisis-picture-id1214542835"
    }
  ];

  function agregarPost() {
    const nuevoPost = {
      id: Math.random.toString(),
      titulo: titulo,
      descripcion: descripcion,
      imagen: imagen
    };

    post = [nuevoPost, ...post];
  }
</script>

<Header titulo="componente" />
<div class="container">

  <Jumbotron nombre="Hello" let:mostrar>
    <span slot="subtitulo">Desde span</span>

    <p slot="parrafo">Desde un parrafo</p>
    {#if mostrar}
      <div>
        <hr />
        <button class="btn-danger">boton</button>
      </div>
    {:else}
      <h2>coloca el cursor aca</h2>
    {/if}

  </Jumbotron>

  <CardGrid {post} />

  <form on:submit|preventDefault={agregarPost}>
    <Inputcustom
      type="text"
      nombre="Titulo"
      id="titulo"
      placeholder="titulo"
      value={titulo}
      on:input={event => (titulo = event.target.value)} />

    <Inputcustom
      type="text"
      nombre="Imagen"
      id="imagen"
      placeholder="imagen"
      value={imagen}
      on:input={event => (imagen = event.target.value)} />

    <Inputcustom
      control="textarea"
      nombre="Descripcion"
      id="descripcion"
      placeholder="descripcion"
      value={descripcion}
      on:input={event => (descripcion = event.target.value)} />

    <button type="submit" class="btn btn-info">Guardar</button>
  </form>
</div>
