// Code credit: https://discourse.threejs.org/t/how-do-i-render-a-video-on-sphere-in-threejs/34003/4

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/////
///// Data
/////

// Global variables for video data
let videos = [];
let videoFramerate = 24;

// Load video data from JSON file
async function loadVideoData() {
  try {
    const response = await fetch("/assets/videos.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Parse date strings back to Date objects
    videos = data.videos.map((video) => ({
      ...video,
      dateStart: new Date(video.dateStart),
    }));

    videoFramerate = data.videoFramerate;

    return videos;
  } catch (error) {
    console.error("Failed to load video data:", error);
    // Fallback to empty array if loading fails
    videos = [];
    return videos;
  }
}

// videoFramerate is now loaded from JSON data

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
  d2.setTime(d2.getTime() + 1000 * s);
  return d2;
}

/////
///// three.js setup
/////

// Initialize Three.js with error handling
function initVideoSphere() {
  try {
    // Check WebGL support
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      throw new Error("WebGL not supported");
    }

    let scene = new THREE.Scene();

    let video_width = 800;
    let video_height = 600;

    let camera = new THREE.PerspectiveCamera(60, video_width / video_height, 1, 1000);
    camera.position.set(0, 0, 2);

    let renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(video_width, video_height);

    let video_sphere_box = document.getElementById("video-inner-box");
    if (!video_sphere_box) {
      throw new Error("Video container not found");
    }

    let canvasElement = video_sphere_box.appendChild(renderer.domElement);
    canvasElement.setAttribute("id", "canvas-video-sphere");

    return { scene, camera, renderer, video_width, video_height };
  } catch (error) {
    console.error("Failed to initialize video sphere:", error);
    showVideoSphereError(error.message);
    return null;
  }
}

function showVideoSphereError(message) {
  const video_sphere_box = document.getElementById("video-inner-box");
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

// Initialize video sphere with data loading
async function initVideoSphereWithData() {
  try {
    // Load video data first
    await loadVideoData();

    // Check if we have videos before initializing
    if (videos.length === 0) {
      console.warn("No video data available, skipping video sphere initialization");
      return;
    }

    // Initialize Three.js sphere
    const sphereInit = initVideoSphere();
    if (!sphereInit) {
      console.warn("Video sphere initialization failed, skipping setup");
      return;
    }

    setupVideoSphere(sphereInit);
  } catch (error) {
    console.error("Failed to initialize video sphere:", error);
  }
}

// Setup the video sphere with the initialized Three.js components
function setupVideoSphere(sphereInit) {
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

  // Track visibility to pause rendering when off-screen
  let isVisible = true;
  let animationFrameId = null;

  // Set up IntersectionObserver to pause rendering when off-screen
  const videoSphereContainer = document.getElementById("video-sphere-container");
  if (videoSphereContainer && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animationFrameId) {
            animate();
          }
        });
      },
      { threshold: 0 }
    );
    observer.observe(videoSphereContainer);
  }

  animate();

  function animate() {
    if (!isVisible) {
      animationFrameId = null;
      return;
    }
    animationFrameId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = video_width / video_height;
    camera.updateProjectionMatrix();

    renderer.setSize(video_width, video_height);
  }

  /////
  ///// Toggle controls setup
  /////

  let videoCaption = document.getElementById("video-caption");
  let colorbar = document.getElementById("colorbar");
  let toggleTimestampBtn = document.getElementById("toggle-timestamp");
  let toggleColorbarBtn = document.getElementById("toggle-colorbar");

  // Toggle timestamp visibility
  if (toggleTimestampBtn && videoCaption) {
    toggleTimestampBtn.addEventListener("click", function () {
      videoCaption.classList.toggle("hidden");
      toggleTimestampBtn.classList.toggle("active");
    });
  }

  // Toggle colorbar visibility
  if (toggleColorbarBtn && colorbar) {
    toggleColorbarBtn.addEventListener("click", function () {
      colorbar.classList.toggle("hidden");
      toggleColorbarBtn.classList.toggle("active");
    });
  }

  /////
  ///// video sphere setup
  /////

  let video = document.getElementById("video");
  if (!video) {
    console.error("Video element not found");
    showVideoSphereError("Video element not found");
  } else {
    // Add video error handling
    video.addEventListener("error", function (e) {
      console.error("Video loading error:", e);
      showVideoSphereError("Failed to load video content");
    });

    video.addEventListener("loadeddata", function () {
      // Video loaded successfully
    });

    video.defaultPlaybackRate = 1.0;
    video.playbackRate = 1.0;

    let videoTex = new THREE.VideoTexture(video);
    sphereMeshMaterial.map = videoTex;
    sphereMeshMaterial.needsUpdate = true;

    let tooltipMeshGroup = new THREE.Group();

    function selectVideo(n) {
      // Prevent simultaneous video switches
      if (isLoadingVideo) {
        return;
      }

      try {
        isLoadingVideo = true;
        video.pause();

        let videoTitle = document.getElementById("video-title");
        if (videoTitle) {
          videoTitle.innerHTML = videos[n]["title"];
        }

        // Update both source elements for multi-format support
        const sources = video.querySelectorAll("source");
        if (sources.length >= 2) {
          sources[0].src = videos[n]["src_av1"]; // AV1 for modern browsers
          sources[1].src = videos[n]["src_h264"]; // H.264 fallback for older Safari
        } else {
          console.error("Video sources not found");
        }

        video.load(); // Reload video to pick new sources

        // Handle play promise properly
        video.play()
          .then(() => {
            isLoadingVideo = false;
          })
          .catch((error) => {
            console.error("Video play failed:", error);
            isLoadingVideo = false;
            // Don't destroy the sphere for play errors - they're often temporary
          });

        let colorbar = document.getElementById("colorbar");
        if (colorbar) {
          colorbar.src = videos[n]["colorbar"];
        }

        tooltipMeshGroup.clear();
      } catch (error) {
        console.error("Error selecting video:", error);
        isLoadingVideo = false;
        // Only show error UI for fatal errors, not temporary play issues
      }

      for (const [name, tooltip] of Object.entries(videos[n]["tooltips"])) {
        let tooltipLatitude = tooltip["latitude"];
        let tooltipLongitude = tooltip["longitude"];

        let [tooltipX, tooltipY, tooltipZ] = latlon2xyz(tooltipLatitude, tooltipLongitude);

        let tooltipGeometry = new THREE.CircleGeometry(0.05, 25);
        let tooltipMaterial = new THREE.MeshBasicMaterial({
          color: tooltip["color"],
          transparent: true,
          opacity: 0.5,
        });
        let tooltipMesh = new THREE.Mesh(tooltipGeometry, tooltipMaterial);

        tooltipMesh.name = name;
        tooltipMesh.position.set(tooltipX, tooltipY, tooltipZ);
        tooltipMesh.lookAt(1.1 * tooltipX, 1.1 * tooltipY, 1.1 * tooltipZ); // Make the circle flat on the sphere.

        tooltipMeshGroup.add(tooltipMesh);
      }

      scene.add(tooltipMeshGroup);
    }

    let currentVideo = 0;
    let isLoadingVideo = false;
    selectVideo(0);

    let leftArrow = document.getElementById("left-arrow");
    let rightArrow = document.getElementById("right-arrow");

    leftArrow.addEventListener("click", () => {
      currentVideo = mod(currentVideo - 1, videos.length);
      selectVideo(currentVideo);
    });

    rightArrow.addEventListener("click", () => {
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

    // Cache DOM references and state outside the event handler
    const tooltip = document.getElementById("video-tooltip");
    const tooltipTitleEl = tooltip.querySelector(".tooltip-title");
    const tooltipTextEl = tooltip.querySelector(".tooltip-text");
    const canvas = document.getElementById("canvas-video-sphere");
    let currentTooltipName = null;

    window.addEventListener("mousemove", function (e) {
      let mousePosition = new THREE.Vector2();
      let canvasBounds = canvas.getBoundingClientRect();
      mousePosition.x =
        ((e.clientX - canvasBounds.left) / (canvasBounds.right - canvasBounds.left)) * 2 - 1;
      mousePosition.y =
        -((e.clientY - canvasBounds.top) / (canvasBounds.bottom - canvasBounds.top)) * 2 + 1;

      raycaster.setFromCamera(mousePosition, camera);
      let intersects = raycaster.intersectObject(tooltipMeshGroup);

      if (intersects.length > 0) {
        let tooltipName = intersects[0].object.name;

        // Only update content if tooltip changed
        if (tooltipName !== currentTooltipName) {
          let tooltipTitle = videos[currentVideo]["tooltips"][tooltipName]["title"];
          let tooltipText = videos[currentVideo]["tooltips"][tooltipName]["text"];

          tooltipTitleEl.textContent = tooltipTitle;
          tooltipTextEl.textContent = tooltipText;
          currentTooltipName = tooltipName;
        }

        // Always update position and visibility
        tooltip.style.display = "block";
        tooltip.style.left = e.clientX + 15 + "px";
        tooltip.style.top = e.clientY + "px";
      } else {
        tooltip.style.display = "none";
        currentTooltipName = null;
      }
    });
  } // End of video element check
} // End of setupVideoSphere function

// Initialize when the DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initVideoSphereWithData);
} else {
  // DOM is already ready
  initVideoSphereWithData();
}
