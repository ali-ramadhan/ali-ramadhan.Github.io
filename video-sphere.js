// Code credit: https://discourse.threejs.org/t/how-do-i-render-a-video-on-sphere-in-threejs/34003/4

import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import {
    OrbitControls
} from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";

// three.js setup

let scene = new THREE.Scene();

let video_width = 800
let video_height = 600

let camera = new THREE.PerspectiveCamera(60, video_width / video_height, 1, 1000);
camera.position.set(0, 0, 10);

let renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setSize(video_width, video_height);

let video_sphere_box = document.getElementById('video-inner-box');
let canvasElement = video_sphere_box.appendChild(renderer.domElement);
canvasElement.setAttribute("id", "canvas-video-sphere");

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;

let g = new THREE.SphereGeometry(5, 128, 64);
g.rotateY(-0.5 * Math.PI);
let m = new THREE.MeshBasicMaterial();
let o = new THREE.Mesh(g, m);
scene.add(o);

window.addEventListener("resize", onWindowResize);

animate();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = video_width / video_height;
    camera.updateProjectionMatrix();

    renderer.setSize(video_width, video_height);
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

let video_sources = {
    'precipitation': "https://raw.githubusercontent.com/ali-ramadhan/artifact-sandbox/main/precip.webm",
    'temperature': "https://raw.githubusercontent.com/ali-ramadhan/artifact-sandbox/main/temperature.mp4"
}

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
