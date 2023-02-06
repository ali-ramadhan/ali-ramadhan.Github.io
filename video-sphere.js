// Code credit: https://discourse.threejs.org/t/how-do-i-render-a-video-on-sphere-in-threejs/34003/4

import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import {OrbitControls} from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";

/////
///// three.js setup
/////

let scene = new THREE.Scene();

let video_width = 800;
let video_height = 600;

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
controls.enableRotate = true;
controls.enableZoom = false;
controls.enablePan = false;

let sphere = new THREE.SphereGeometry(1, 128, 64);
let sphereMeshMaterial = new THREE.MeshBasicMaterial();
let sphereMesh = new THREE.Mesh(sphere, sphereMeshMaterial);
scene.add(sphereMesh);

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

/////
///// dat.gui setup
/////

let gui = new dat.GUI();

let options = {
    playback_rate: 1.0,
};

let video_options = gui.addFolder('Video');

video_options.add(options, 'playback_rate', 0.0, 5.0, 0.1).name('Playback rate')
    .onChange(
        function () {
            let video = document.getElementById('video');
            video.playbackRate = options.playback_rate;
        }
    )

video_options.open();

/////
///// video sphere setup
/////

let video = document.getElementById('video');
video.play();
video.defaultPlaybackRate = 1.0;
video.playbackRate = options.playback_rate;

let videoTex = new THREE.VideoTexture(video);
sphereMeshMaterial.map = videoTex;
sphereMeshMaterial.needsUpdate = true;

let videoTitle = document.getElementById("video-title");
let videoCaption = document.getElementById("video-caption");

// Saved all videos at 24 FPS so that 1 second video time = 1 day simulation time.
const framerate = 24;

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}

video.addEventListener('timeupdate', function () {
    let dateStart = new Date("2015-08-01T00:00:00");
    let frameNum = Math.floor(framerate * video.currentTime);
    let dateFrame = dateStart.addHours(frameNum);
    videoCaption.textContent = `${dateFrame.toISOString().slice(0, -8)}Z`;
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

// The north pole of the three.js sphere corresponds to 0, 0 degrees.
// So we apply +90 degree rotation about the x-axis.
function latlon2xyz(lat, lon) {
    let x = sind(90 - lat) * cosd(-lon);
    let y = sind(90 - lat) * sind(-lon);
    let z = cosd(90 - lat);

    let x2 = x;
    let y2 = z;
    let z2 = y;
    
    return [x2, y2, z2];
}

let lat_BOS = 42; // 42.3601;
let lon_BOS = -71; // -71.0589;

let [x_BOS, y_BOS, z_BOS] = latlon2xyz(lat_BOS, lon_BOS);

console.log(`BOS = (lat=${lat_BOS}, lon=${lon_BOS}) -> (x=${x_BOS}, y=${y_BOS}, z=${z_BOS})`)

// const axesHelper = new THREE.AxesHelper(2);
// scene.add(axesHelper);

const _geo = new THREE.CircleGeometry(0.05, 25);
const _mat = new THREE.MeshBasicMaterial({color: 0xFF0000, transparent: true, opacity: 0.5});
const _mesh = new THREE.Mesh(_geo, _mat);
_mesh.position.set(x_BOS, y_BOS, z_BOS);
_mesh.lookAt(1.1*x_BOS, 1.1*y_BOS, 1.1*z_BOS);
scene.add(_mesh);

const mousePos = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

window.addEventListener("mousemove", function(e) {
    let canvasBounds = document.getElementById("canvas-video-sphere").getBoundingClientRect();
    mousePos.x = ((e.clientX - canvasBounds.left) / (canvasBounds.right - canvasBounds.left)) * 2 - 1;
    mousePos.y = -((e.clientY - canvasBounds.top) / (canvasBounds.bottom - canvasBounds.top)) * 2 + 1;

    // console.log(`client = (x=${e.clientX}, y=${e.clientY}}) | mousePos = (x=${mousePos.x}, y=${mousePos.y})`)

    raycaster.setFromCamera(mousePos, camera);

    const intersects = raycaster.intersectObject(_mesh);

    // console.log(`intersecting ${intersects.length} things`);

    let tooltip = document.getElementById("video-tooltip");

    if (intersects.length > 0) {
        tooltip.style.zIndex = 10;
        tooltip.style.display = "inline-block";
        tooltip.style.position = "absolute";
        tooltip.style.left = (e.pageX + 15) + 'px';
        tooltip.style.top = e.pageY + 'px';
        tooltip.style.background = "rgba(255, 255, 255, 0.9)";
        tooltip.style.border = "1px solid black";
        tooltip.style.borderRadius = "5px";
        tooltip.style.padding = "0.3em";
        tooltip.style.width = "400px";

        let tooltipTitle = "Tooltip title goes here";
        let tooltipText = "<b>Lorem ipsum</b> dolor sit amet, <i>consectetur adipiscing elit</i>, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

        let tooltipTitleDiv = document.createElement("div");
        let tooltipTextDiv = document.createElement("div");

        tooltipTitleDiv.style.fontSize = "large";
        tooltipTitleDiv.style.fontWeight = "bold";
        tooltipTitleDiv.style.lineHeight = 1.2;
        tooltipTitleDiv.innerHTML = tooltipTitle;

        tooltipTextDiv.style.fontSize = "medium";
        tooltipTextDiv.style.lineHeight = 1;
        tooltipTextDiv.innerHTML = tooltipText;

        tooltip.replaceChildren(tooltipTitleDiv, tooltipTextDiv);
    } else {
        tooltip.style.display = "none";
    }
});
