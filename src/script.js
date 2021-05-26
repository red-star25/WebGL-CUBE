import "./styles.css";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import Stats from "three/examples/jsm/libs/stats.module";
/**
 * Global Variables
 */
let forward = false,
  backward = false,
  left = false,
  right = false;
let canJump = false;
const velocity = new THREE.Vector3();
const objects = [];
let raycaster;
const vertex = new THREE.Vector3();
const jumpAudio = new Audio("/sound/jump.wav");
const bgAudio = new Audio("/sound/bgMusic.mp3");

/**
 * Scene
 */
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xff0000, 0, 750);
scene.background = new THREE.Color("#8B0000");

/**
 * Floor
 */
let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  side: THREE.DoubleSide,
  flatShading: THREE.FlatShading,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI * 0.5;
let position = floorGeometry.attributes.position;

for (let i = 0, l = position.count; i < l; i++) {
  vertex.fromBufferAttribute(position, i);

  vertex.x += Math.random() * 20 - 10;
  vertex.y += Math.random() * 2;
  vertex.z += Math.random() * 20 - 10;

  position.setXYZ(i, vertex.x, vertex.y, vertex.z);
}
floorGeometry = floorGeometry.toNonIndexed();
scene.add(floor);

/**
 * Random Cube
 */
const randomCubeGeometry = new THREE.BoxBufferGeometry(20, 20, 20);

for (let i = 0; i < 500; i++) {
  const randomCubeMaterial = new THREE.MeshStandardMaterial();
  const object = new THREE.Mesh(randomCubeGeometry, randomCubeMaterial);
  object.position.x = Math.floor(Math.random() * 20 - 10) * 20;
  object.position.y = Math.floor(Math.random() * 20) * 20 + 10;
  object.position.z = Math.floor(Math.random() * 20 - 10) * 20;

  object.material.color = new THREE.Color(
    "#" + Math.floor(Math.random() * 16777215).toString(16)
  );
  scene.add(object);
  objects.push(object);
}

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024),
  (directionalLight.shadow.camera.far = 15);
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  20000
);

camera.position.y = 10;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const menuPanel = document.getElementById("menuPanel");
const startButton = document.getElementById("startButton");
startButton.addEventListener(
  "click",
  function () {
    controls.lock();
  },
  false
);

window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}

/**
 * Stats
 */
const stats = Stats();
document.body.appendChild(stats.dom);

/**
 * Pointer Lock Control
 */

const controls = new PointerLockControls(camera, renderer.domElement);

controls.addEventListener("lock", () => {
  menuPanel.style.display = "none";
  bgAudio.play();
});
controls.addEventListener("unlock", () => {
  menuPanel.style.display = "block";
  bgAudio.pause();
});

document.body.addEventListener("click", () => {
  if (canJump === true) {
    jumpAudio.play();
    velocity.y += 350;
  }
  canJump = false;
});

const onKeyUp = (key) => {
  switch (key.code) {
    case "KeyW":
      forward = false;
      break;

    case "KeyA":
      left = false;
      break;

    case "KeyS":
      backward = false;
      break;

    case "KeyD":
      right = false;
      break;

    default:
      break;
  }
};
const onKeyDown = (key) => {
  switch (key.code) {
    case "KeyW":
      forward = true;
      break;

    case "KeyA":
      left = true;
      break;

    case "KeyS":
      backward = true;
      break;

    case "KeyD":
      right = true;
      break;

    case "Space":
      if (canJump === true) {
        jumpAudio.play();
        velocity.y += 350;
      }
      canJump = false;
    default:
      break;
  }
};

document.addEventListener("keyup", onKeyUp);
document.addEventListener("keydown", onKeyDown);

raycaster = new THREE.Raycaster(
  new THREE.Vector3(),
  new THREE.Vector3(0, -1, 0),
  0,
  10
);

/**
 * Time
 */
const clock = new THREE.Clock();
let prevTime = performance.now();

//Animation
const tick = () => {
  const time = performance.now();
  const delta = (time - prevTime) / 1000;
  var moveDistance = 50 * delta;
  velocity.y -= 9.8 * 100.0 * delta;

  if (controls.isLocked) {
    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;
    const intersections = raycaster.intersectObjects(objects);
    const onObject = intersections.length > 0;

    if (forward) {
      controls.moveForward(moveDistance);
    }
    if (backward) {
      controls.moveForward(-moveDistance);
    }
    if (left) {
      controls.moveRight(-moveDistance);
    }
    if (right) {
      controls.moveRight(moveDistance);
    }

    if (onObject) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }
    controls.getObject().position.y += velocity.y * delta;

    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;
      canJump = true;
    }
  }
  prevTime = time;
  stats.begin();
  stats.update();

  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
