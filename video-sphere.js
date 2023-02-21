// Code credit: https://discourse.threejs.org/t/how-do-i-render-a-video-on-sphere-in-threejs/34003/4

import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import {OrbitControls} from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";

/////
///// Data
/////

let videos = [
    {
        "title": "Surface air temperature",
        "src": "https://raw.githubusercontent.com/ali-ramadhan/artifact-sandbox/main/temperature_vp9_good_crf42.webm",
        "dateStart": new Date("2018-12-01T00:00:00"),
        "framePeriod": 3600,
        "colorbar": "img/colorbars/temperature_colorbar.png",
        "tooltips": {
            "Mankato, KS": {
                "latitude": 39.78723,
                "longitude": -98.21005,
                "color": "red",
                "title": "The diurnal cycle",
                "text": `As the sun pass over land it heats up the atmosphere. Looking at the surface air temperature, it almost looks like a beating heart.
                        Peak daily temperatures usually occur 3-4 hours after high noon.
                        The diurnal cycle is especially prominent in high desert regions such as the Tibetan and Andean Plateaus.`
            },
            "Polar Vortex": {
                "latitude": 82.4987,
                "longitude": -123.11934,
                "color": "gold",
                "title": "The polar vortex",
                "text": `Strong circumpolar winds encircle the North Pole high up in the stratosphere (15-50 km high), trapping a huge mass of cold air.
                        This feature of the atmosphere's circulation is called the polar vortex and another one exists at the South Pole too as well as on some other planets!
                        The polar vortex can weaken allowing the Arctic air to escape and bring frigid temperatures to Canada and the United States like it did on December 30, 2018.`
            }
        }
    },

    {
        "title": "Precipitation",
        "src": "https://raw.githubusercontent.com/ali-ramadhan/artifact-sandbox/main/precipitation_vp9_good_crf54.webm",
        "dateStart": new Date("2017-08-16T00:00:00"),
        "framePeriod": 3600,
        "colorbar": "img/colorbars/precipitation_colorbar.png",
        "tooltips": {
            "Edmonton": {
                "latitude": 53.5461,
                "longitude": -113.4937,
                "color": "green",
                "title": "Edmonton!!!",
                "text": "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
            },
            "Vegas": {
                "latitude": 19.4326,
                "longitude": -99.1332,
                "color": "brown",
                "title": "Mexico City",
                "text": "<b>Lorem ipsum</b> dolor sit amet, <i>consectetur adipiscing elit</i>, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."
            }
        }
    },

    {
        "title": "Sea surface temperature",
        "src": "https://raw.githubusercontent.com/ali-ramadhan/artifact-sandbox/main/sst_vp9_good_crf32.webm",
        "dateStart": new Date("2019-01-01T00:00:00"),
        "framePeriod": 24 * 3600,
        "colorbar": "img/colorbars/sst_colorbar.png",
        "tooltips": {}
    },

    {
        "title": "Ocean current speed",
        "src": "https://raw.githubusercontent.com/ali-ramadhan/artifact-sandbox/main/ocean_speed_vp9_good_crf32.webm",
        "dateStart": new Date("2020-01-01T00:00:00"),
        "framePeriod": 24 * 3600,
        "colorbar": "img/colorbars/ocean_speed_colorbar.png",
        "tooltips": {}
    }
]

// Saved all videos at 24 FPS so that 1 second video time = 1 day simulation time.
const videoFramerate = 24;

/////
///// Utils
/////

// Proper modulo function. % is actually the remainder function.
function mod(n, m) {
    return ((n % m) + m) % m;
}

function deg2rad(theta) {
    return theta * (Math.PI / 180);
}

function sind(theta) {
    return Math.sin(deg2rad(theta));
}

function cosd(theta) {
    return Math.cos(deg2rad(theta));
}

function addSeconds(d, s) {
    let d2 = structuredClone(d);
    d2.setTime(d2.getTime() + (1000*s));
    return d2;
}

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

// sphere.rotateX(Math.PI / 4); // Center on North America.
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
    show_caption: false,
    show_colorbar: false
};

let video_options = gui.addFolder('Video options');

video_options.add(options, 'playback_rate', 0.0, 5.0, 0.1).name('Playback rate').onChange(function () {
    let video = document.getElementById('video');
    video.playbackRate = options.playback_rate;
})

video_options.add(options, 'show_caption').name('Show timestamp').onChange(function () {
    let videoCaption = document.getElementById("video-caption");
    if (options.show_caption) {
        videoCaption.style.display = "block";
    } else {
        videoCaption.style.display = "none";
    }
})

video_options.add(options, 'show_colorbar').name('Show colorbar').onChange(function () {
    let colorbar = document.getElementById("colorbar");
    if (options.show_colorbar) {
        colorbar.style.display = "block";
    } else {
        colorbar.style.display = "none";
    }
})

video_options.open();

/////
///// video sphere setup
/////

let video = document.getElementById('video');
video.defaultPlaybackRate = 1.0;
video.playbackRate = options.playback_rate;

let videoTex = new THREE.VideoTexture(video);
sphereMeshMaterial.map = videoTex;
sphereMeshMaterial.needsUpdate = true;

let tooltipMeshGroup = new THREE.Group();

function selectVideo(n) {
    video.pause();

    let videoTitle = document.getElementById("video-title");
    videoTitle.innerHTML = videos[n]["title"];
    
    video.src = videos[n]["src"];
    video.play();

    let colorbar = document.getElementById("colorbar");
    colorbar.src = videos[n]["colorbar"];

    tooltipMeshGroup.clear();

    for (const [name, tooltip] of Object.entries(videos[n]["tooltips"])) {
        let tooltipLatitude = tooltip["latitude"];
        let tooltipLongitude = tooltip["longitude"];
    
        let [tooltipX, tooltipY, tooltipZ] = latlon2xyz(tooltipLatitude, tooltipLongitude);
    
        let tooltipGeometry = new THREE.CircleGeometry(0.05, 25);
        let tooltipMaterial = new THREE.MeshBasicMaterial({color: tooltip["color"], transparent: true, opacity: 0.5});
        let tooltipMesh = new THREE.Mesh(tooltipGeometry, tooltipMaterial);
    
        tooltipMesh.name = name;
        tooltipMesh.position.set(tooltipX, tooltipY, tooltipZ);
        tooltipMesh.lookAt(1.1*tooltipX, 1.1*tooltipY, 1.1*tooltipZ); // Make the circle flat on the sphere.
    
        tooltipMeshGroup.add(tooltipMesh);
    }
    
    scene.add(tooltipMeshGroup);
}

let currentVideo = 0;
selectVideo(0);

let leftArrow = document.getElementById('left-arrow');
let rightArrow = document.getElementById('right-arrow');

leftArrow.addEventListener('click', (event) => {
    currentVideo = mod(currentVideo - 1, videos.length);
    selectVideo(currentVideo);
});

rightArrow.addEventListener('click', (event) => {
    currentVideo = mod(currentVideo + 1, videos.length);
    selectVideo(currentVideo);
});

function updateVideoCaption() {
    let dateStart = videos[currentVideo]["dateStart"];
    let framePeriod = videos[currentVideo]["framePeriod"];
    let frameNum = Math.floor(videoFramerate * video.currentTime);
    let dateFrame = addSeconds(dateStart, frameNum * framePeriod);

    let videoCaption = document.getElementById("video-caption");
    videoCaption.textContent = `${dateFrame.toISOString().slice(0, -8)}Z`;
}

setInterval(updateVideoCaption, 1000 / videoFramerate);

// Convert geographical (lat, lon) corresponds to (x, y, z) three.js coordinates on our sphere.
function latlon2xyz(lat, lon) {
    let x = sind(90 - lat) * cosd(-lon);
    let y = sind(90 - lat) * sind(-lon);
    let z = cosd(90 - lat);
    
    // Switching y and z corresponds to a +90 degree rotation around the x-axis.
    return [x, z, y];
}

const raycaster = new THREE.Raycaster();

window.addEventListener("mousemove", function(e) {
    let mousePosition = new THREE.Vector2();
    let canvasBounds = document.getElementById("canvas-video-sphere").getBoundingClientRect();
    mousePosition.x = ((e.clientX - canvasBounds.left) / (canvasBounds.right - canvasBounds.left)) * 2 - 1;
    mousePosition.y = -((e.clientY - canvasBounds.top) / (canvasBounds.bottom - canvasBounds.top)) * 2 + 1;

    raycaster.setFromCamera(mousePosition, camera);
    let intersects = raycaster.intersectObject(tooltipMeshGroup);

    let tooltip = document.getElementById("video-tooltip");

    if (intersects.length > 0) {
        let tooltipName = intersects[0].object.name;

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

        let tooltipTitle = videos[currentVideo]["tooltips"][tooltipName]["title"];
        let tooltipText = videos[currentVideo]["tooltips"][tooltipName]["text"];

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
