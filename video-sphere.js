// Code credit: https://discourse.threejs.org/t/how-do-i-render-a-video-on-sphere-in-threejs/34003/4

import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import {OrbitControls} from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import {CSS2DRenderer, CSS2DObject} from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/renderers/CSS2DRenderer.js";

// three.js setup

let scene = new THREE.Scene();

let video_width = 800
let video_height = 600

let camera = new THREE.PerspectiveCamera(60, video_width / video_height, 1, 1000);
camera.position.set(0, 0, 2);

let renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setSize(video_width, video_height);

let video_sphere_box = document.getElementById('video-inner-box');
let canvasElement = video_sphere_box.appendChild(renderer.domElement);
canvasElement.setAttribute("id", "canvas-video-sphere");

let controls = new OrbitControls(camera, renderer.domElement);
// controls.enableZoom = false;
// controls.enablePan = false;

let g = new THREE.SphereGeometry(1, 128, 64);
g.rotateY(-0.5 * Math.PI);
let m = new THREE.MeshBasicMaterial();
let o = new THREE.Mesh(g, m);
scene.add(o);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0px";
labelRenderer.domElement.style.pointerEvents = "none";
document.body.appendChild(labelRenderer.domElement);

window.addEventListener("resize", onWindowResize);

animate();

function animate() {
    requestAnimationFrame(animate);
    labelRenderer.render(scene, camera);
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = video_width / video_height;
    camera.updateProjectionMatrix();

    renderer.setSize(video_width, video_height);
    labelRenderer.setSize(this.window.innerWidth, this.window.innerHeight);
}

// dat.gui setup

var options = {
    playback_rate: 1.0,
};

var gui = new dat.GUI();

var video_options = gui.addFolder('Video');
video_options.add(options, 'playback_rate', 0.0, 5.0, 0.1).name('Playback rate')
    .onChange(
        function () {
            let video = document.getElementById('video');
            video.playbackRate = options.playback_rate;
        }
    )

video_options.open();

// video sphere setup

let video = document.getElementById('video');
video.play();
video.defaultPlaybackRate = 1.0;
video.playbackRate = options.playback_rate;

let videoTex = new THREE.VideoTexture(video);
m.map = videoTex;
m.needsUpdate = true;

let videoTitle = document.getElementById("video-title");
let videoCaption = document.getElementById("video-caption");

// Saved all videos at 24 FPS so that 1 second video time = 1 day simulation time.
const framerate = 24;

video.addEventListener('timeupdate', function () {
    let frameNum = Math.floor(framerate * video.currentTime);
    videoCaption.innerHTML = `Frame ${frameNum}`;
});

let videos = [
    {
        "title": "Temperature",
        "src": "https://raw.githubusercontent.com/ali-ramadhan/artifact-sandbox/main/temperature.mp4"
    },
    {
        "title": "Precipitation",
        "src": "https://raw.githubusercontent.com/ali-ramadhan/artifact-sandbox/main/precip.webm"
    }
]

let currentVideo = 0;

function selectVideo(n) {
    video.pause();
    videoTitle.innerHTML = videos[n]["title"];
    video.src = videos[n]["src"];
    video.play();    
}

let leftArrow = document.getElementById('left-arrow');
let rightArrow = document.getElementById('right-arrow');

// Proper modulo function. % is actually the remainder function.
function mod(n, m) {
    return ((n % m) + m) % m;
}

leftArrow.addEventListener('click', (event) => {
    currentVideo = mod(currentVideo - 1, videos.length);
    selectVideo(currentVideo);
});

rightArrow.addEventListener('click', (event) => {
    currentVideo = mod(currentVideo + 1, videos.length);
    selectVideo(currentVideo);
});

function deg2rad(theta) {
    return theta * (Math.PI / 180);
}

function sind(theta) {
    return Math.sin(deg2rad(theta));
}

function cosd(theta) {
    return Math.cos(deg2rad(theta));
}

function latlon2xyz(lat, lon) {
    let x = sind(90 - lat) * cosd(90 - lon);
    let y = sind(90 - lat) * sind(90 - lon);
    let z = cosd(90 - lat);

    // The north pole of the three.js sphere corresponds to 0, 0 degrees.
    // So we apply +90 degree rotation about the x-axis.
    let x2 = x;
    let y2 = z;
    let z2 = y;
    
    return [x2, y2, z2];
}

let lat_BOS = 42; // 42.3601;
let lon_BOS = -71; // -71.0589;

let [x_BOS, y_BOS, z_BOS] = latlon2xyz(lat_BOS, lon_BOS);

console.log(`BOS = (lat=${lat_BOS}, lon=${lon_BOS}) -> (x=${x_BOS}, y=${y_BOS}, z=${z_BOS})`)

const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

const _geo = new THREE.CircleGeometry(0.05, 25);
const _mat = new THREE.MeshBasicMaterial({color: 0xFF0000, transparent: true, opacity: 0.5});
const _mesh = new THREE.Mesh(_geo, _mat);
_mesh.position.set(x_BOS, y_BOS, z_BOS);
_mesh.lookAt(1.1*x_BOS, 1.1*y_BOS, 1.1*z_BOS);
scene.add(_mesh);

const p = document.createElement('p');
p.className = "tooltip";
const pContainer = document.createElement("div");
pContainer.appendChild(p);
const cPointLabel = new CSS2DObject(pContainer);
scene.add(cPointLabel);

const mousePos = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

window.addEventListener("mousemove", function(e) {
    let canvasBounds = document.getElementById("canvas-video-sphere").getBoundingClientRect();
    mousePos.x = ((e.clientX - canvasBounds.left) / (canvasBounds.right - canvasBounds.left)) * 2 - 1;
    mousePos.y = -((e.clientY - canvasBounds.top) / (canvasBounds.bottom - canvasBounds.top)) * 2 + 1;

    console.log(`client = (x=${e.clientX}, y=${e.clientY}}) | mousePos = (x=${mousePos.x}, y=${mousePos.y})`)

    raycaster.setFromCamera(mousePos, camera);

    const intersects = raycaster.intersectObject(_mesh);

    console.log(`intersecting ${intersects.length} things`)

    if (intersects.length > 0) {
         p.ClassName = "tooltip show";
         p.textContent = "Hello!!";
    } else {
        p.textContent = "Find me!!";
    }
});
