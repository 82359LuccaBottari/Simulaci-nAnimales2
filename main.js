// Crear la escena
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x87CEEB); // Azul claro

// Cámara perspectiva
const camara = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// Cambia la posición y el punto de enfoque para que NO esté centrada al origen
camara.position.set(60, 40, 60); // Por ejemplo, una vista desde un costado y arriba

// Punto de enfoque de la cámara (target)
let camTarget = new THREE.Vector3(30, 0, 0); // Inicialmente igual que tu lookAt
camara.lookAt(camTarget);

// Renderizador
const renderizador = new THREE.WebGLRenderer({
  canvas: document.querySelector("#miCanvas"),
  antialias: true
});
renderizador.setSize(window.innerWidth, window.innerHeight);

// Crear un cubo en el centro con atributos Comida y Agua
const geometriaCubo = new THREE.BoxGeometry(2, 2, 2);
const materialCubo = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Rojo
const cubo = new THREE.Mesh(geometriaCubo, materialCubo);
cubo.position.set(0, 1, 0);

// Atributos personalizados para el cubo
cubo.comida = 100; // valor inicial máximo
cubo.agua = 100;   // valor inicial máximo

// Métodos para modificar los atributos y mantenerlos en el rango 0-100
cubo.setComida = function(valor) {
  this.comida = Math.max(0, Math.min(100, valor));
};
cubo.setAgua = function(valor) {
  this.agua = Math.max(0, Math.min(100, valor));
};

escena.add(cubo);

// Crear un plano circular (disco) del doble del radio de la esfera
const radioPlano = 240; // Duplicado respecto al radio de la esfera (120 * 2)
const geometriaPlano = new THREE.CircleGeometry(radioPlano, 128);

// Cargar textura para el plano
const loader = new THREE.TextureLoader();
const texturaPlano = loader.load('assets/textures/Coast sand/coast_sand_rocks_02_diff_4k.jpg', function(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16); // Ajusta la repetición según el nuevo radio
});

// Crear material para el plano con la textura
const materialPlano = new THREE.MeshStandardMaterial({ 
  map: texturaPlano, 
  side: THREE.DoubleSide 
});
const plano = new THREE.Mesh(geometriaPlano, materialPlano);
plano.rotation.x = -Math.PI / 2;
plano.position.y = 0;
escena.add(plano);

// Agregar una luz para ver el cubo
const luz = new THREE.DirectionalLight(0xffffff, 1);
luz.position.set(10, 10, 10);
escena.add(luz);

// Luz ambiental
const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.7);
escena.add(luzAmbiente);

// Crear una esfera que envuelva completamente el plano
const radioEsfera = 240; // Ahora la esfera envuelve el plano
const geometriaEsfera = new THREE.SphereGeometry(radioEsfera, 64, 64);
const materialEsfera = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  side: THREE.BackSide, // Para que la esfera sea visible desde dentro
  transparent: true,
  opacity: 0.25 // Opcional: esfera semitransparente
});
const esfera = new THREE.Mesh(geometriaEsfera, materialEsfera);
esfera.position.set(0, 0, 0);
escena.add(esfera);

// Variables para el ciclo de día y noche
const duracionDia = 15 * 60;    // 15 minutos en segundos
const duracionNoche = 10 * 60;  // 10 minutos en segundos

// Iniciar la simulación de día
let tiempoCiclo = duracionDia * 0.05; // Justo después del amanecer, inicio del día

// Variables para animar la luz (sol)
const radioLuz = radioEsfera * 1.1; // Un poco fuera de la esfera
let anguloSol = 0; // Ángulo del sol en radianes

// Animación
function animar() {
  requestAnimationFrame(animar);

  // Actualizar ciclo de día y noche
  tiempoCiclo += 1 / 60; // Aproximadamente 1 frame = 1/60 seg

  // Calcular duración total del ciclo (día+noche)
  const duracionTotal = duracionDia + duracionNoche;
  const progresoCiclo = (tiempoCiclo % duracionTotal) / duracionTotal;

  // El sol da una vuelta completa en cada ciclo día+noche
  anguloSol = progresoCiclo * Math.PI * 2;

  // Calcular posición de la luz direccional (sol)
  const xSol = Math.cos(anguloSol) * radioLuz;
  const ySol = Math.sin(anguloSol) * radioLuz;
  const zSol = 0;
  luz.position.set(xSol, ySol, zSol);
  luz.target.position.set(0, 0, 0);
  escena.add(luz.target);

  // Definir colores
  const colorDia = new THREE.Color(0x87CEEB);      // Celeste
  const colorNoche = new THREE.Color(0x0a0a33);    // Azul oscuro
  const colorAmanecer = new THREE.Color(0xFF8C1A); // Naranja oscuro

  // Porcentaje de cada fase
  const pctAmanecer = 0.05;
  const pctDia = 0.45;
  const pctAtardecer = 0.05;
  const pctNoche = 0.45;

  // Límites de cada fase
  const limAmanecer = pctAmanecer;
  const limDia = limAmanecer + pctDia;
  const limAtardecer = limDia + pctAtardecer;
  // Noche: resto del ciclo

  // Cambiar intensidad, color y fondo según el ciclo
  if (progresoCiclo < limAmanecer) {
    // Amanecer (gradual hacia día)
    const t = progresoCiclo / pctAmanecer;
    const colorGradual = colorAmanecer.clone().lerp(colorDia, t);
    luz.intensity = 0.5 + 0.5 * t;
    luz.color.set(0xFFB347);
    luzAmbiente.intensity = 0.4 + 0.3 * t;
    escena.background = colorGradual;
  } else if (progresoCiclo < limDia) {
    // Día
    luz.intensity = 1;
    luz.color.set(0xffffff);
    luzAmbiente.intensity = 0.7;
    escena.background = colorDia;
  } else if (progresoCiclo < limAtardecer) {
    // Atardecer (gradual hacia noche)
    const t = (progresoCiclo - limDia) / pctAtardecer;
    const colorGradual = colorDia.clone().lerp(colorAmanecer, t);
    luz.intensity = 1 - 0.5 * t;
    luz.color.set(0xFFB347);
    luzAmbiente.intensity = 0.7 - 0.3 * t;
    escena.background = colorGradual;
  } else {
    // Noche (gradual desde atardecer)
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

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Usa el mismo radio para la esfera y para limitar la cámara
// (ya está definido arriba como radioEsfera = 240)

// Limita la posición de la cámara para que no salga de la esfera
function limitarCamaraEnEsfera() {
  const centro = camTarget;
  const radioMax = radioEsfera * 0.98;
  const radioMin = 5;

  // Vector desde el centro (target) a la cámara
  const offset = camara.position.clone().sub(centro);
  let distancia = offset.length();

  // Limitar la distancia
  if (distancia > radioMax) {
    offset.setLength(radioMax);
    camara.position.copy(centro.clone().add(offset));
  } else if (distancia < radioMin) {
    offset.setLength(radioMin);
    camara.position.copy(centro.clone().add(offset));
  }
}

renderizador.domElement.addEventListener('mousedown', function (e) {
  if (e.button === 0) { // Solo botón izquierdo
    isDragging = true;
    previousMousePosition.x = e.clientX;
    previousMousePosition.y = e.clientY;
  }
});

renderizador.domElement.addEventListener('mouseup', function () {
  isDragging = false;
});

// --- ROTACIÓN CON EL MOUSE ---
renderizador.domElement.addEventListener('mousemove', function (e) {
  if (isDragging) {
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    const velocidad = 0.01;
    // Offset relativo al target actual
    const offset = camara.position.clone().sub(camTarget);
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(offset);

    spherical.theta -= deltaX * velocidad;
    spherical.phi -= deltaY * velocidad;
    spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi));

    // Limitar el radio de la cámara para que no salga de la esfera
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

// Zoom con la rueda del ratón
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

// Permitir mover la cámara con total libertad usando las flechas direccionales
window.addEventListener('keydown', function(event) {
  const paso = 2;
  let dir = new THREE.Vector3();
  camara.getWorldDirection(dir);
  dir.y = 0; // Movimiento en plano XZ

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
  // No actualices lookAt aquí, ya lo hace el mouse/zoom
});

// Crear un rectángulo (tronco) sobre el plano
const geometriaTronco = new THREE.BoxGeometry(5, 30, 5);
const materialTronco = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Marrón

// Función para obtener una posición aleatoria dentro del radio del plano
function posicionAleatoriaEnPlano(radio) {
  const angulo = Math.random() * 2 * Math.PI;
  const distancia = Math.random() * (radio * 0.95); // 0.95 para evitar el borde
  const x = Math.cos(angulo) * distancia;
  const z = Math.sin(angulo) * distancia;
  return { x, z };
}

// Cargar textura para los troncos
const texturaTronco = loader.load('https://tse1.mm.bing.net/th/id/OIP.a_yJyDCrRphHeyTP9ECZbgHaLH?r=0&rs=1&pid=ImgDetMain&o=7&rm=3');

// Cargar textura para las copas (cubos verdes)
const texturaCopa = loader.load('https://static.vecteezy.com/system/resources/previews/018/815/321/non_2x/texture-of-green-leaves-green-background-pattern-vector.jpg');

// Crear y agregar 10 troncos dispersos aleatoriamente, con altura variable entre 20 y 30, sin superposición
const troncos = [];
const radioTronco = 2.5;
const maxTamCopa = 20;
const minDistancia = (maxTamCopa / 2) * 2 + 2; // Diámetro máximo de copa + margen

for (let i = 0; i < 10; i++) {
  let pos, valido, intentos = 0;
  let altura = 20 + Math.random() * 10;
  let tamCopa = 15 + Math.random() * 5;
  let radioColision = tamCopa / 2;

  do {
    valido = true;
    pos = posicionAleatoriaEnPlano(radioPlano);
    for (const t of troncos) {
      const dx = pos.x - t.x;
      const dz = pos.z - t.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < (radioColision + t.radioCopa + 2)) {
        valido = false;
        break;
      }
    }
    intentos++;
    if (intentos > 100) break;
  } while (!valido);

  if (valido) {
    const geometriaTroncoVar = new THREE.BoxGeometry(5, altura, 5);
    const materialTroncoTextura = new THREE.MeshStandardMaterial({ map: texturaTronco });
    const tronco = new THREE.Mesh(geometriaTroncoVar, materialTroncoTextura);
    tronco.position.set(pos.x, altura / 2, pos.z);
    escena.add(tronco);

    // --- COPA: 10 cubos apilados en forma de esfera ---
    const cubosCopa = 10;
    const radioEsferaCopa = tamCopa / 2;
    const materialCopa = new THREE.MeshStandardMaterial({ map: texturaCopa });
    for (let j = 0; j < cubosCopa; j++) {
      // Distribuir los cubos en la superficie de una esfera usando coordenadas esféricas
      const phi = Math.acos(-1 + (2 * j + 1) / cubosCopa); // de 0 a PI
      const theta = Math.PI * (1 + Math.sqrt(5)) * j; // ángulo dorado

      const x = pos.x + radioEsferaCopa * Math.sin(phi) * Math.cos(theta);
      const y = altura + radioEsferaCopa * Math.cos(phi);
      const z = pos.z + radioEsferaCopa * Math.sin(phi) * Math.sin(theta);

      const geometriaCuboCopa = new THREE.BoxGeometry(tamCopa / 2, tamCopa / 2, tamCopa / 2);
      const cuboCopa = new THREE.Mesh(geometriaCuboCopa, materialCopa);
      cuboCopa.position.set(x, y, z);
      escena.add(cuboCopa);
    }

    troncos.push({ x: pos.x, z: pos.z, radioCopa: tamCopa / 2 });
  }
}



