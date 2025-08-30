// --- ESCENA Y CÁMARA ---
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x87CEEB);

const camara = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camara.position.set(60, 120, 60);
let camTarget = new THREE.Vector3(30, 0, 0);
camara.lookAt(camTarget);

// --- RENDERIZADOR ---
const renderizador = new THREE.WebGLRenderer({
  canvas: document.querySelector("#miCanvas"),
  antialias: true
});
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.shadowMap.enabled = true;
renderizador.shadowMap.type = THREE.PCFSoftShadowMap;

// --- CUBO CENTRAL ---
const geometriaCubo = new THREE.BoxGeometry(2, 2, 2);
const materialCubo = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const cubo = new THREE.Mesh(geometriaCubo, materialCubo);
cubo.position.set(0, 1, 0);
cubo.castShadow = true;
cubo.receiveShadow = true;
cubo.comida = 100;
cubo.agua = 100;
cubo.setComida = function(valor) { this.comida = Math.max(0, Math.min(100, valor)); };
cubo.setAgua = function(valor) { this.agua = Math.max(0, Math.min(100, valor)); };
escena.add(cubo);

// --- PLANO IRREGULAR (COLINAS SUAVES) ---
const radioPlano = 240;
const segmentosPlano = 128;
const geometriaPlano = new THREE.CircleGeometry(radioPlano, segmentosPlano);

function ruidoColinas(x, y) {
  return (
    Math.sin(x * 0.03) * 6 +
    Math.cos(y * 0.04) * 4 +
    Math.sin((x + y) * 0.015) * 8
  );
}

for (let i = 0; i < geometriaPlano.attributes.position.count; i++) {
  const x = geometriaPlano.attributes.position.getX(i);
  const y = geometriaPlano.attributes.position.getY(i);
  geometriaPlano.attributes.position.setZ(i, ruidoColinas(x, y));
}
geometriaPlano.computeVertexNormals();

const loader = new THREE.TextureLoader();
const texturaPlano = loader.load('assets/textures/Coast sand/coast_sand_rocks_02_diff_4k.jpg', t => {
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(16, 16);
});
const materialPlano = new THREE.MeshStandardMaterial({ map: texturaPlano, side: THREE.DoubleSide });
const plano = new THREE.Mesh(geometriaPlano, materialPlano);
plano.rotation.x = -Math.PI / 2;
plano.position.y = 0;
plano.receiveShadow = true;
escena.add(plano);

// --- LUZ PRINCIPAL Y AMBIENTAL ---
const luz = new THREE.DirectionalLight(0xffffff, 1);
luz.position.set(10, 10, 10);
luz.castShadow = true;
luz.shadow.mapSize.width = 2048;
luz.shadow.mapSize.height = 2048;
luz.shadow.camera.near = 1;
luz.shadow.camera.far = 1000;
luz.shadow.camera.left = -300;
luz.shadow.camera.right = 300;
luz.shadow.camera.top = 300;
luz.shadow.camera.bottom = -300;
escena.add(luz);

const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.7);
escena.add(luzAmbiente);

// --- ESFERA AMBIENTAL ---
const radioEsfera = 240;
const geometriaEsfera = new THREE.SphereGeometry(radioEsfera, 64, 64);
const materialEsfera = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  side: THREE.BackSide,
  transparent: true,
  opacity: 0.25
});
const esfera = new THREE.Mesh(geometriaEsfera, materialEsfera);
esfera.position.set(0, 0, 0);
escena.add(esfera);

// --- CICLO DÍA/NOCHE ---
const duracionDia = 15 * 60;
const duracionNoche = 10 * 60;
let tiempoCiclo = duracionDia * 0.05;
const radioLuz = radioEsfera * 1.1;
let anguloSol = 0;

function animar() {
  requestAnimationFrame(animar);

  tiempoCiclo += 1 / 60;
  const duracionTotal = duracionDia + duracionNoche;
  const progresoCiclo = (tiempoCiclo % duracionTotal) / duracionTotal;
  anguloSol = progresoCiclo * Math.PI * 2;

  const xSol = Math.cos(anguloSol) * radioLuz;
  const ySol = Math.sin(anguloSol) * radioLuz;
  luz.position.set(xSol, ySol, 0);
  luz.target.position.set(0, 0, 0);
  escena.add(luz.target);

  const colorDia = new THREE.Color(0x87CEEB);
  const colorNoche = new THREE.Color(0x0a0a33);
  const colorAmanecer = new THREE.Color(0xFF8C1A);

  const pctAmanecer = 0.05, pctDia = 0.45, pctAtardecer = 0.05, pctNoche = 0.45;
  const limAmanecer = pctAmanecer, limDia = limAmanecer + pctDia, limAtardecer = limDia + pctAtardecer;

  if (progresoCiclo < limAmanecer) {
    const t = progresoCiclo / pctAmanecer;
    const colorGradual = colorAmanecer.clone().lerp(colorDia, t);
    luz.intensity = 0.5 + 0.5 * t;
    luz.color.set(0xFFB347);
    luzAmbiente.intensity = 0.4 + 0.3 * t;
    escena.background = colorGradual;
  } else if (progresoCiclo < limDia) {
    luz.intensity = 1;
    luz.color.set(0xffffff);
    luzAmbiente.intensity = 0.7;
    escena.background = colorDia;
  } else if (progresoCiclo < limAtardecer) {
    const t = (progresoCiclo - limDia) / pctAtardecer;
    const colorGradual = colorDia.clone().lerp(colorAmanecer, t);
    luz.intensity = 1 - 0.5 * t;
    luz.color.set(0xFFB347);
    luzAmbiente.intensity = 0.7 - 0.3 * t;
    escena.background = colorGradual;
  } else {
    const t = (progresoCiclo - limAtardecer) / pctNoche;
    const colorGradual = colorAmanecer.clone().lerp(colorNoche, t);
    luz.intensity = 0.5 - 0.3 * t;
    luz.color.set(0x223366);
    luzAmbiente.intensity = 0.4 - 0.2 * t;
    escena.background = colorGradual;
  }

  renderizador.render(escena, camara);
}
animar();

// --- CONTROL DE CÁMARA ---
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// --- ALTURA DEL PLANO EN (x, z) ---
function alturaPlano(x, z) {
  return ruidoColinas(x, z);
}

// --- AJUSTE DE COLISIÓN PARA OBJETOS SOBRE EL PLANO IRREGULAR ---
// Limita la posición Y de cualquier objeto para que no baje del plano (con margen opcional)
function ajustarColisionPlano(objeto, margen = 0) {
  const alturaSuelo = alturaPlano(objeto.position.x, objeto.position.z);
  if (objeto.position.y < alturaSuelo + margen) {
    objeto.position.y = alturaSuelo + margen;
  }
}

// --- MODIFICA EL CONTROL DE CÁMARA PARA RESPETAR LA COLISIÓN DEL PLANO ---
function limitarCamaraEnEsfera() {
  const centro = camTarget;
  const radioMax = radioEsfera * 0.98;
  const radioMin = 5;
  const offset = camara.position.clone().sub(centro);
  let distancia = offset.length();

  if (distancia > radioMax) {
    offset.setLength(radioMax);
    camara.position.copy(centro.clone().add(offset));
  } else if (distancia < radioMin) {
    offset.setLength(radioMin);
    camara.position.copy(centro.clone().add(offset));
  }

  // Colisión con el plano irregular
  ajustarColisionPlano(camara, 2); // La cámara nunca baja del plano +2
}

renderizador.domElement.addEventListener('mousedown', function (e) {
  if (e.button === 0) {
    isDragging = true;
    previousMousePosition.x = e.clientX;
    previousMousePosition.y = e.clientY;
  }
});
renderizador.domElement.addEventListener('mouseup', function () {
  isDragging = false;
});
renderizador.domElement.addEventListener('mousemove', function (e) {
  if (isDragging) {
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    const velocidad = 0.01;
    const offset = camara.position.clone().sub(camTarget);
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(offset);

    spherical.theta -= deltaX * velocidad;
    spherical.phi -= deltaY * velocidad;
    spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi));

    const radioMax = radioEsfera * 0.98;
    const radioMin = 5;
    spherical.radius = Math.max(radioMin, Math.min(radioMax, spherical.radius));

    camara.position.copy(camTarget.clone().add(new THREE.Vector3().setFromSpherical(spherical)));
    camara.lookAt(camTarget);

    previousMousePosition.x = e.clientX;
    previousMousePosition.y = e.clientY;

    limitarCamaraEnEsfera();
  }
});
renderizador.domElement.addEventListener('wheel', function(e) {
  e.preventDefault();
  const offset = camara.position.clone().sub(camTarget);
  const zoomFactor = 1 + (e.deltaY > 0 ? 0.1 : -0.1);
  let newOffset = offset.clone().multiplyScalar(zoomFactor);

  const radioMax = radioEsfera * 0.98;
  const radioMin = 5;
  const newRadius = Math.max(radioMin, Math.min(radioMax, newOffset.length()));
  newOffset.setLength(newRadius);

  camara.position.copy(camTarget.clone().add(newOffset));
  camara.lookAt(camTarget);

  limitarCamaraEnEsfera();
}, { passive: false });
window.addEventListener('keydown', function(event) {
  const paso = 2;
  let dir = new THREE.Vector3();
  camara.getWorldDirection(dir);
  dir.y = 0;

  switch(event.key) {
    case 'ArrowLeft':
      camara.position.x -= paso;
      camTarget.x -= paso;
      break;
    case 'ArrowRight':
      camara.position.x += paso;
      camTarget.x += paso;
      break;
    case 'ArrowUp':
      camara.position.add(dir.clone().multiplyScalar(paso));
      camTarget.add(dir.clone().multiplyScalar(paso));
      break;
    case 'ArrowDown':
      camara.position.add(dir.clone().multiplyScalar(-paso));
      camTarget.add(dir.clone().multiplyScalar(-paso));
      break;
  }
  limitarCamaraEnEsfera();
});

// --- ÁRBOLES (TRONCOS Y COPAS) ---
const texturaTronco = loader.load('https://tse1.mm.bing.net/th/id/OIP.a_yJyDCrRphHeyTP9ECZbgHaLH?r=0&rs=1&pid=ImgDetMain&o=7&rm=3');
const texturaCopa = loader.load('https://static.vecteezy.com/system/resources/previews/018/815/321/non_2x/texture-of-green-leaves-green-background-pattern-vector.jpg');

 /**
  { x: 60,  z: 300 },
  { x: -70, z: 80 },
  { x: 60, z: -50 },
  { x: -120, z: -60 }, LISTO
  { x: 30,  z: -100 }, LISTO
  { x: 90, z: 30 },
  { x: 80,  z: 110 },
  { x: -60, z: -160 }, LISTO
  { x: 120, z: 40 },
  { x: 0,   z: 120 }
 */
const posicionesArboles = [
  { x: 60,  z: 300 },
  { x: -70, z: 80 },
  { x: 60, z: -50 },
  { x: -120, z: -60 },
  { x: 30,  z: -100 },
  { x: 90, z: 30 },
  { x: 80,  z: 110 },
  { x: -60, z: -160 },
  { x: 120, z: 40 },
  { x: 0,   z: 120 }
];
const troncos = [];
for (let i = 0; i < posicionesArboles.length; i++) {
  const pos = posicionesArboles[i];
  let altura = 20 + Math.random() * 10;
  let tamCopa = 15 + Math.random() * 5;
  let radioColision = tamCopa / 2;

  let valido = true;
  for (const t of troncos) {
    const dx = pos.x - t.x;
    const dz = pos.z - t.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < (radioColision + t.radioCopa + 2)) {
      valido = false;
      break;
    }
  }
  const distanciaCentro = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  if (distanciaCentro > radioPlano * 0.95) valido = false;

  if (valido) {
    const geometriaTroncoVar = new THREE.BoxGeometry(5, altura, 5);
    const materialTroncoTextura = new THREE.MeshStandardMaterial({ map: texturaTronco });
    const tronco = new THREE.Mesh(geometriaTroncoVar, materialTroncoTextura);
    const alturaSuelo = alturaPlano(pos.x, pos.z);

    // El tronco debe estar 1/8 de su altura por debajo del plano
    tronco.position.set(
      pos.x,
      alturaSuelo + (altura / 2) - (altura / 8),
      pos.z
    );
    tronco.castShadow = true;
    tronco.receiveShadow = true;
    escena.add(tronco);

    const cubosCopa = 10;
    const radioEsferaCopa = tamCopa / 2;
    const materialCopa = new THREE.MeshStandardMaterial({ map: texturaCopa });
    for (let j = 0; j < cubosCopa; j++) {
      const phi = Math.acos(-1 + (2 * j + 1) / cubosCopa);
      const theta = Math.PI * (1 + Math.sqrt(5)) * j;
      const x = pos.x + radioEsferaCopa * Math.sin(phi) * Math.cos(theta);
      const y = alturaSuelo + altura + radioEsferaCopa * Math.cos(phi);
      const z = pos.z + radioEsferaCopa * Math.sin(phi) * Math.sin(theta);

      const geometriaCuboCopa = new THREE.BoxGeometry(tamCopa / 2, tamCopa / 2, tamCopa / 2);
      const cuboCopa = new THREE.Mesh(geometriaCuboCopa, materialCopa);
      cuboCopa.position.set(x, y, z);
      cuboCopa.castShadow = true;
      cuboCopa.receiveShadow = true;
      escena.add(cuboCopa);
    }
    troncos.push({ x: pos.x, z: pos.z, radioCopa: tamCopa / 2 });
  }
}

// --- SELECCIÓN DE OBJETOS (SOLO CUBOS Y TRONCOS) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let objetoSeleccionado = null;
let marcadorSeleccion = null;

const objetosSeleccionables = [cubo];
escena.traverse(obj => {
  if (
    obj.isMesh &&
    obj.geometry instanceof THREE.BoxGeometry &&
    obj !== cubo &&
    obj.material.map === texturaTronco
  ) {
    objetosSeleccionables.push(obj);
  }
});

// --- TEXTO FLOTANTE PARA ATRIBUTOS DEL CUBO Y POSICIÓN DE TRONCOS ---
let etiquetaCubo = null;
let etiquetaTronco = null;

function crearEtiquetaCubo(objeto) {
  if (etiquetaCubo) {
    document.body.removeChild(etiquetaCubo);
    etiquetaCubo = null;
  }
  if (objeto !== cubo) return;

  etiquetaCubo = document.createElement('div');
  etiquetaCubo.style.position = 'absolute';
  etiquetaCubo.style.background = 'rgba(0,0,0,0.7)';
  etiquetaCubo.style.color = '#fff';
  etiquetaCubo.style.padding = '8px 14px';
  etiquetaCubo.style.borderRadius = '8px';
  etiquetaCubo.style.fontFamily = 'Arial, sans-serif';
  etiquetaCubo.style.fontSize = '16px';
  etiquetaCubo.style.pointerEvents = 'none';
  etiquetaCubo.style.zIndex = 10;
  etiquetaCubo.innerHTML = `Hambre: ${cubo.comida}<br>Agua: ${cubo.agua}`;
  document.body.appendChild(etiquetaCubo);

  function actualizarPosicionEtiqueta() {
    if (!etiquetaCubo || objetoSeleccionado !== cubo) return;
    const vector = cubo.position.clone();
    vector.project(camara);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    etiquetaCubo.style.left = `${x - etiquetaCubo.offsetWidth / 2}px`;
    etiquetaCubo.style.top = `${y - etiquetaCubo.offsetHeight - 20}px`;
    requestAnimationFrame(actualizarPosicionEtiqueta);
  }
  actualizarPosicionEtiqueta();
}

function crearEtiquetaTronco(objeto) {
  if (etiquetaTronco) {
    document.body.removeChild(etiquetaTronco);
    etiquetaTronco = null;
  }
  // Solo mostrar si es un tronco de árbol
  if (
    !objeto.isMesh ||
    !(objeto.geometry instanceof THREE.BoxGeometry) ||
    objeto.material.map !== texturaTronco
  ) return;

  etiquetaTronco = document.createElement('div');
  etiquetaTronco.style.position = 'absolute';
  etiquetaTronco.style.background = 'rgba(0,0,0,0.7)';
  etiquetaTronco.style.color = '#fff';
  etiquetaTronco.style.padding = '8px 14px';
  etiquetaTronco.style.borderRadius = '8px';
  etiquetaTronco.style.fontFamily = 'Arial, sans-serif';
  etiquetaTronco.style.fontSize = '16px';
  etiquetaTronco.style.pointerEvents = 'none';
  etiquetaTronco.style.zIndex = 10;
  etiquetaTronco.innerHTML = `X: ${objeto.position.x.toFixed(2)}<br>Z: ${objeto.position.z.toFixed(2)}`;
  document.body.appendChild(etiquetaTronco);

  function actualizarPosicionEtiqueta() {
    if (!etiquetaTronco || objetoSeleccionado !== objeto) return;
    const vector = objeto.position.clone();
    vector.project(camara);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    etiquetaTronco.style.left = `${x - etiquetaTronco.offsetWidth / 2}px`;
    etiquetaTronco.style.top = `${y - etiquetaTronco.offsetHeight - 20}px`;
    requestAnimationFrame(actualizarPosicionEtiqueta);
  }
  actualizarPosicionEtiqueta();
}

function eliminarEtiquetaCubo() {
  if (etiquetaCubo) {
    document.body.removeChild(etiquetaCubo);
    etiquetaCubo = null;
  }
}
function eliminarEtiquetaTronco() {
  if (etiquetaTronco) {
    document.body.removeChild(etiquetaTronco);
    etiquetaTronco = null;
  }
}

// Modifica la función crearMarcador para mostrar la etiqueta correspondiente
function crearMarcador(objeto) {
  if (objeto === plano || objeto === esfera) {
    eliminarEtiquetaCubo();
    eliminarEtiquetaTronco();
    return;
  }
  if (marcadorSeleccion) {
    escena.remove(marcadorSeleccion);
    marcadorSeleccion.geometry.dispose();
    marcadorSeleccion.material.dispose();
    marcadorSeleccion = null;
  }
  const radio = objeto.geometry.boundingSphere
    ? objeto.geometry.boundingSphere.radius * objeto.scale.x * 1.2
    : 5;
  const geometry = new THREE.RingGeometry(radio * 0.95, radio, 64);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
  marcadorSeleccion = new THREE.Mesh(geometry, material);
  marcadorSeleccion.rotation.x = -Math.PI / 2;
  marcadorSeleccion.position.set(objeto.position.x, alturaPlano(objeto.position.x, objeto.position.z) + 0.1, objeto.position.z);
  escena.add(marcadorSeleccion);

  if (objeto === cubo) {
    crearEtiquetaCubo(objeto);
    eliminarEtiquetaTronco();
  } else if (
    objeto.isMesh &&
    objeto.geometry instanceof THREE.BoxGeometry &&
    objeto.material.map === texturaTronco
  ) {
    crearEtiquetaTronco(objeto);
    eliminarEtiquetaCubo();
  } else {
    eliminarEtiquetaCubo();
    eliminarEtiquetaTronco();
  }
}

// Modifica el evento de click para eliminar ambas etiquetas si no hay selección
renderizador.domElement.addEventListener('click', function (event) {
  const rect = renderizador.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camara);
  const intersecciones = raycaster.intersectObjects(objetosSeleccionables, false);

  if (intersecciones.length > 0) {
    const objeto = intersecciones[0].object;
    objetoSeleccionado = objeto;
    crearMarcador(objetoSeleccionado);

    const direccion = new THREE.Vector3().subVectors(objeto.position, camara.position).normalize();
    const nuevaPos = objeto.position.clone().add(direccion.clone().multiplyScalar(-20));
    nuevaPos.y = Math.max(nuevaPos.y, alturaPlano(nuevaPos.x, nuevaPos.z) + 5);

    let pasos = 30, paso = 0;
    const posInicial = camara.position.clone();
    const targetInicial = camTarget.clone();
    const posFinal = nuevaPos;
    const targetFinal = objeto.position.clone();

    function moverCamara() {
      paso++;
      const t = paso / pasos;
      camara.position.lerpVectors(posInicial, posFinal, t);
      camTarget.lerpVectors(targetInicial, targetFinal, t);
      camara.lookAt(camTarget);
      limitarCamaraEnEsfera();
      if (paso < pasos) requestAnimationFrame(moverCamara);
    }
    moverCamara();
  } else {
    objetoSeleccionado = null;
    if (marcadorSeleccion) {
      escena.remove(marcadorSeleccion);
      marcadorSeleccion.geometry.dispose();
      marcadorSeleccion.material.dispose();
      marcadorSeleccion = null;
    }
    eliminarEtiquetaCubo();
    eliminarEtiquetaTronco();
  }
});

// --- NUBES SIMPLES ---
function crearNube(x, y, z, escala = 1) {
  const geometriaNube = new THREE.SphereGeometry(6 * escala, 16, 16);
  const materialNube = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85
  });
  const nube = new THREE.Mesh(geometriaNube, materialNube);
  nube.position.set(x, y, z);

  // HABILITAR SOMBRAS EN LA NUBE PRINCIPAL
  nube.castShadow = true;
  nube.receiveShadow = false;

  // Añadir esferas pequeñas para dar forma de nube
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.SphereGeometry((3 + Math.random() * 3) * escala, 16, 16);
    const mesh = new THREE.Mesh(geo, materialNube);
    mesh.position.set(
      x + (Math.random() - 0.5) * 12 * escala,
      y + (Math.random() - 0.5) * 4 * escala,
      z + (Math.random() - 0.5) * 8 * escala
    );
    // HABILITAR SOMBRAS EN LAS SUB-NUBES
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    nube.add(mesh);
  }
  escena.add(nube);
  return nube;
}

// Crear varias nubes en posiciones y alturas aleatorias
const nubes = [];
for (let i = 0; i < 8; i++) {
  const angulo = Math.random() * Math.PI * 2;
  const radio = 120 + Math.random() * 80;
  const x = Math.cos(angulo) * radio;
  const z = Math.sin(angulo) * radio;
  const y = 80 + Math.random() * 40;
  const escala = 0.8 + Math.random() * 1.2;
  nubes.push(crearNube(x, y, z, escala));
}

// --- ANIMACIÓN DE NUBES (opcional, para movimiento suave) ---
function animarNubes() {
  for (let i = 0; i < nubes.length; i++) {
    nubes[i].position.x += 0.02 * (i % 2 === 0 ? 1 : -1);
    if (nubes[i].position.x > 200) nubes[i].position.x = -200;
    if (nubes[i].position.x < -200) nubes[i].position.x = 200;
  }
}
const animarOriginal = animar;
animar = function() {
  animarNubes();
  animarOriginal();
};

// --- SIMULACIÓN DE DESPLAZAMIENTO DEL CUBO COMO ANIMAL ---
let direccionAnimal = new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize();
let velocidadAnimal = 0.7; // Puedes ajustar la velocidad
let tiempoCambioDireccion = 0;
let tiempoEspera = 0;

// Función para verificar colisión con árboles
function colisionaConArbol(x, z, margen = 4) {
  for (const t of escena.children) {
    if (
      t.isMesh &&
      t.geometry instanceof THREE.BoxGeometry &&
      t.material.map === texturaTronco
    ) {
      const dx = t.position.x - x;
      const dz = t.position.z - z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      // Considera el radio del tronco y un margen de seguridad
      if (dist < margen + 2.5) return true;
    }
  }
  return false;
}

// Función para mover el cubo como un animal
function moverCuboAnimal(dt) {
  // Cambia de dirección aleatoriamente cada cierto tiempo o si choca
  tiempoCambioDireccion -= dt;
  if (tiempoCambioDireccion <= 0 || tiempoEspera > 0) {
    if (tiempoEspera > 0) {
      tiempoEspera -= dt;
      return;
    }
    // Nueva dirección aleatoria
    direccionAnimal = new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize();
    tiempoCambioDireccion = 2 + Math.random() * 2; // Cambia cada 2-4 segundos
  }

  // Calcula nueva posición tentativa
  let nuevoX = cubo.position.x + direccionAnimal.x * velocidadAnimal;
  let nuevoZ = cubo.position.z + direccionAnimal.y * velocidadAnimal;

  // Limita dentro del radio del plano
  const distanciaCentro = Math.sqrt(nuevoX * nuevoX + nuevoZ * nuevoZ);
  if (distanciaCentro > radioPlano * 0.95) {
    // Rebota hacia el centro
    const v = new THREE.Vector2(-nuevoX, -nuevoZ).normalize();
    direccionAnimal = v;
    tiempoCambioDireccion = 0.5;
    return;
  }

  // Evita árboles
  if (colisionaConArbol(nuevoX, nuevoZ)) {
    // Espera un poco y cambia dirección
    tiempoEspera = 0.5 + Math.random() * 0.5;
    direccionAnimal = new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize();
    return;
  }

  // Calcula la altura del plano en la nueva posición
  const alturaSuelo = alturaPlano(nuevoX, nuevoZ);

  // Si el cubo bajaría por debajo del plano, no se mueve
  if ((cubo.position.y + 0.01) < alturaSuelo) {
    // Cambia dirección si intenta bajar por debajo del plano
    direccionAnimal = new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize();
    tiempoCambioDireccion = 0.5;
    return;
  }

  // Mueve el cubo y ajústalo siempre sobre el plano
  cubo.position.x = nuevoX;
  cubo.position.z = nuevoZ;
  cubo.position.y = alturaSuelo + 1; // Siempre sobre el plano

  // Si está seleccionado, actualiza la etiqueta flotante
  if (objetoSeleccionado === cubo && etiquetaCubo) crearEtiquetaCubo(cubo);
}

// --- INTEGRAR EN EL CICLO DE ANIMACIÓN ---
let ultimoTiempo = performance.now();
const animarOriginalNubes = animar;
animar = function() {
  const ahora = performance.now();
  const dt = (ahora - ultimoTiempo) / 1000;
  ultimoTiempo = ahora;

  moverCuboAnimal(dt);
  animarNubes();
  animarOriginalNubes();
};



