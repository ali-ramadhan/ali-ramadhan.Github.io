// Code credit: https://discourse.threejs.org/t/how-do-i-render-a-video-on-sphere-in-threejs/34003/4

import * as THREE from "../node_modules/three/build/three.module.js";
import {OrbitControls} from "../node_modules/three/examples/jsm/controls/OrbitControls.js";

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
            "Diurnal cycle": {
                // GPS @ Mankato, KS: Very close to the geographical center of the contiguous states.
                "latitude": 39.78723,
                "longitude": -98.21005,
                "color": "red",
                "title": "The diurnal cycle",
                "text": `As the sun pass over land it heats up the atmosphere. Looking at the surface air temperature, it almost looks like a beating heart.
                        Peak daily temperatures usually occur 3-4 hours after high noon.
                        The diurnal cycle is especially prominent in high desert regions such as the Tibetan and Andean Plateaus.`
            },
            "Polar Vortex": {
                "latitude": 82.4987, // Same latitude as Alert, NU
                "longitude": -123.11934, // Same longitude as Vancouver, BC
                "color": "gold",
                "title": "The polar vortex",
                "text": `Strong circumpolar winds encircle the North Pole high up in the stratosphere (15-50 km high), trapping a huge mass of cold air.
                        This feature of the atmosphere's circulation is called the polar vortex and another one exists at the South Pole too as well as on some other planets!
                        The polar vortex can weaken allowing the Arctic air to escape and bring frigid temperatures to Canada and the United States like it did on December 30, 2018.`
            },
            "Extratropics": {
                // GPS @ 10° south of Adak, AK.
                "latitude": 41.87395,
                "longitude": -176.63402,
                "color": "red",
                "title": "Extratropical weather",
                "text": `The weather of the extratropics is highly variable due to the constant clashing of cold polar air masses from the north and warm tropical air masses from the south,
                         which leads to the creation of weather fronts. The jet stream flows eastward driving weather patterns and storms towards the east as well.
                         You can see this here as the temperature patterns get advected eastward.`
            },
            "Tropics": {
                // GPS @ 30° west of Managua, Nicaragua
                "latitude": 12.13282,
                "longitude": -116.2504,
                "color": "green",
                "title": "Tropical weather",
                "text": `The weather of the tropics is less variable than the extratropics.
                         This is due to the relatively constant amount of solar radiation they receive throughout the year.
                         The warm ocean also provides a constant source of warm moist air which inhibits weather systems from forming.
                         You can still get powerful thunderstorms and monsoons over land, but the tropical ocean is pretty quiet.`
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
            "Hurricane Harvey": {
                // GPS @ Rockport, TX where Hurricane Harvey made landfall.
                "latitude": 28.02077,
                "longitude": -97.05601,
                "color": "green",
                "title": "Hurricane Harvey",
                "text": `Here you can see where Hurricane Harvey made landfall near Rockport, Texas on August 25, 2017.
                         It was a Category 4 hurricane with maximum sustained winds of 130 mph, making it the strongest hurricane to hit the United States since Hurricane Charley in 2004.
                         It dumped over 40 inches of rain in some areas and caused an estimated $125 billion in damage, making it one of the costliest hurricanes in U.S. history.`
            },
            "ITCZ": {
                // GPS @ 20° west of Cartago, Costa Rica
                "latitude": 9.86444,
                "longitude": -83.91944,
                "color": "brown",
                "title": "The InterTropical Convergence Zone (ITCZ)",
                "text": `The Intertropical Convergence Zone (ITCZ) is a region near the equator where trade winds from the northern and southern hemispheres converge.
                         This leads to high precipitation rates, especially visible here over the Pacific.
                         The ITCZ is a critical source of precipitation for many equatorial regions and drives ocean currents.
                         It's location and intensity is sensitive to changes in climate and is expected to shift in response to climate change.`
            },
            "Tropical precipitation": {
                // GPS @ Mbuji-Mayi, Democratic Republic of the Congo
                "latitude": -6.13603,
                "longitude": 23.58979,
                "color": "brown",
                "title": "Tropical precipitation",
                "text": `Powerful thunderstorms tend to form near the equator due to the abundance of warm moist air, intense solar radiation, and atmospheric convergence of the trade winds.
                         You can see this happening almost every day over the Congo basin.`
            },
            "Orographic precipitation": {
                // GPS @ Prince Rupert, BC
                "latitude": 54.31507,
                "longitude": -130.32098,
                "color": "brown",
                "title": "Orographic precipitation",
                "text": `Here the prevailing winds bring moist air from the Pacific Ocean and over the Rocky Mountains, where it cools and condenses into clouds as it rises.
                         This leads to heavy precipitation, especially over the coastal Pacific Northwest due to the how steep the mountains are and how close they are to the coast.
                         You can see several storms hitting the coast and dissipating before they get a chance to penetrate inland.`
            }
            // Monsoons?
            // Another tropical cyclone over China?
            // Another one hitting Baja California?
        }
    },

    {
        "title": "Sea surface temperature",
        "src": "https://raw.githubusercontent.com/ali-ramadhan/artifact-sandbox/main/sst_vp9_good_crf32.webm",
        "dateStart": new Date("2019-01-01T00:00:00"),
        "framePeriod": 24 * 3600,
        "colorbar": "img/colorbars/sst_colorbar.png",
        "tooltips": {
            "Gulf stream": {
                // GPS @ 10° east of Cambridge, MA
                "latitude": 42.3751,
                "longitude":  -71.10561,
                "color": "gold",
                "title": "The Gulf Stream",
                "text": `Here you can see the Gulf Stream, a warm ocean current that flows from the Gulf of Mexico to the North Atlantic.
                         By transporting warm water from the tropics to higher latitudes, it moderates the climate of Western Europe.
                         You can see the strong temperature gradient between the cold waters of the North Atlantic and warmer waters southward.`
            },
            "ACC": {
                // GPS @ Marion Island, South Africa
                "latitude": -46.90337,
                "longitude": 37.75452,
                "color": "gold",
                "title": "The Antarctic Circumpolar Current (ACC)",
                "text": `Strong eastward winds encircle Antarctica clockwise and without any land to stop them the winds spin up the strongest ocean current on Earth.
                         The ACC acts as a barrier to the mixing of warm and cold waters, allowing the Antarctic to maintain its huge ice sheet.
                         You can see the strong temperature gradient between the cold waters of the Southern Ocean and warmer waters northward.`
            }
        }
    },

    {
        "title": "Ocean current speed",
        "src": "https://raw.githubusercontent.com/ali-ramadhan/artifact-sandbox/main/ocean_speed_vp9_good_crf32.webm",
        "dateStart": new Date("2020-01-01T00:00:00"),
        "framePeriod": 24 * 3600,
        "colorbar": "img/colorbars/ocean_speed_colorbar.png",
        "tooltips": {
            "Gulf stream": {
                // GPS @ 10° east of Cambridge, MA
                "latitude": 42.3751,
                "longitude":  -71.10561,
                "color": "gold",
                "title": "The Gulf Stream",
                "text": `Here you can see the Gulf Stream, a warm ocean current that flows from the Gulf of Mexico to the North Atlantic.
                         By transporting warm water from the tropics to higher latitudes, it moderates the climate of Western Europe.`
            },
            "ACC": {
                // GPS @ Marion Island, South Africa
                "latitude": 0,
                "longitude": 37.75452,
                "color": "gold",
                "title": "The Antarctic Circumpolar Current",
                "text": `Strong eastward winds encircle Antarctica clockwise and without any land to stop them the winds spin up the strongest ocean current on Earth.
                         The ACC acts as a barrier to the mixing of warm and cold waters, allowing the Antarctic to maintain its huge ice sheet.`
            },
            "Agulhaus rings": {
                // GPS @ Cape Town, South Africa
                "latitude": -33.92584,
                "longitude": 18.42322,
                "color": "gold",
                "title": "Agulhaus rings",
                "text": `Agulhas rings are large, swirling masses of water that are shed from the Agulhas Current off the coast of South Africa.
                         The rings transport warm, salty water and nutrients from the Indian Ocean into the Atlantic Ocean. They also look pretty.`
            },
            // Kuroshio?
            // Gyres?
        }
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

// Initialize Three.js with error handling
function initVideoSphere() {
    try {
        // Check WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            throw new Error('WebGL not supported');
        }

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
        if (!video_sphere_box) {
            throw new Error('Video container not found');
        }
        
        let canvasElement = video_sphere_box.appendChild(renderer.domElement);
        canvasElement.setAttribute("id", "canvas-video-sphere");

        return { scene, camera, renderer, video_width, video_height };
    } catch (error) {
        console.error('Failed to initialize video sphere:', error);
        showVideoSphereError(error.message);
        return null;
    }
}

function showVideoSphereError(message) {
    const video_sphere_box = document.getElementById('video-inner-box');
    if (video_sphere_box) {
        video_sphere_box.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 600px; background: #f0f0f0; color: #666; text-align: center; border-radius: 8px;">
                <div>
                    <h3>Video Sphere Unavailable</h3>
                    <p>${message}</p>
                    <small>This feature requires WebGL support</small>
                </div>
            </div>
        `;
    }
}

const sphereInit = initVideoSphere();
if (!sphereInit) {
    // Exit early if initialization failed - for modules we can't return at top level
    console.warn('Video sphere initialization failed, skipping setup');
} else {
    
const { scene, camera, renderer, video_width, video_height } = sphereInit;

// Canvas element is created by initVideoSphere function
// let canvasElement = document.getElementById('canvas-video-sphere');

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

// video_options.open();

/////
///// video sphere setup
/////

let video = document.getElementById('video');
if (!video) {
    console.error('Video element not found');
    showVideoSphereError('Video element not found');
} else {

// Add video error handling
video.addEventListener('error', function(e) {
    console.error('Video loading error:', e);
    showVideoSphereError('Failed to load video content');
});

video.addEventListener('loadeddata', function() {
    console.log('Video loaded successfully');
});

video.defaultPlaybackRate = 1.0;
video.playbackRate = options.playback_rate;

let videoTex = new THREE.VideoTexture(video);
sphereMeshMaterial.map = videoTex;
sphereMeshMaterial.needsUpdate = true;

let tooltipMeshGroup = new THREE.Group();

function selectVideo(n) {
    try {
        video.pause();

        let videoTitle = document.getElementById("video-title");
        if (videoTitle) {
            videoTitle.innerHTML = videos[n]["title"];
        }

        video.src = videos[n]["src"];
        video.play().catch(error => {
            console.error('Video play failed:', error);
            showVideoSphereError('Failed to play video');
        });

        let colorbar = document.getElementById("colorbar");
        if (colorbar) {
            colorbar.src = videos[n]["colorbar"];
        }

        tooltipMeshGroup.clear();
    } catch (error) {
        console.error('Error selecting video:', error);
        showVideoSphereError('Failed to switch video');
    }

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

leftArrow.addEventListener('click', () => {
    currentVideo = mod(currentVideo - 1, videos.length);
    selectVideo(currentVideo);
});

rightArrow.addEventListener('click', () => {
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

} // End of video element check

} // End of sphereInit else block
