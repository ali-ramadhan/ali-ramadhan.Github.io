window.addEventListener("DOMContentLoaded", function(e) {

  // Original JavaScript code by Chirp Internet: chirpinternet.eu
  // Please acknowledge use of this code by including this header.

  for (let n = 1; n <= 5; n++) {
    let slideshow = document.getElementById(`slideshow${n}`);
    let arr = slideshow.getElementsByTagName("div");
    let fadeComplete = function(e) { slideshow.appendChild(arr[0]); };
    for(let i = 0; i < arr.length; i++) {
      arr[i].addEventListener("animationend", fadeComplete, false);
    }
  }

}, false);
