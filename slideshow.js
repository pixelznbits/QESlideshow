let images = [];
let currentIndex = 0;
let currentIndexB = 0;
let slideshowActive = false;
let slideshowInterval;
let size;
let sizeB;
let animID;
let prevAnimID;
let img;
let imgB;
let prevTimeStamp = 0;
let imageALoaded = false;
let imageALoading = false;
let imageBLoading = false;
let imageBLoaded = false;
let audioBuffer;
let audioLoaded = false;
let windowWidth = screen.width;
let windowHeight = screen.height;
const musicFile = document.getElementById('musicFile');
const audioPlayer = document.getElementById('audioPlayer');
let audioContext;
let source;


const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");


let startShowTimer;

canvas.width = windowWidth;
canvas.height = windowHeight;
let slideStart;


function nextImage() {
    currentIndexB = currentIndex;
    currentIndex = (currentIndex + 1) % images.length;
    imageALoaded = false;
    imageBLoaded = false;
    imageALoading = false;
    imageBLoading = false;
    slideStart = Date.now();
}

document.getElementById("files").addEventListener("change", function(event) {
    const files = event.target.files;
    uploadImages(files);

});

function uploadImages(files) {
    for (const file of files) {
        images.push({
            name: file.name,
            date: file.lastModified,
            src: URL.createObjectURL(file), // create a URL for the image
            // Add more metadata as needed
        });
    }

    updateImageList();
}

function updateImageList() {
    const imageList = document.getElementById("images");
    imageList.innerHTML = "";

    for (const image of images) {
        imageList.innerHTML += `<li>${image.name} - ${formatDate(image.date)}</li>`;
    }
}

function sortImages() {
    const sortType = document.getElementById('sortType').value;

    if (sortType === 'filename') {
        images.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'date') {
        images.sort((a, b) => a.date - b.date);
    }

    updateImageList();
}

function slideshow(timeStamp) {
    const fadeDurationInSeconds = parseInt(document.getElementById("fadeLength").value, 10);
    const intervalInSeconds = parseInt(document.getElementById("slideshowInterval").value, 10);
    const intervalInMSeconds = intervalInSeconds * 1000;
    const fadeDuration = fadeDurationInSeconds * 1000;
    const frameRate = parseFloat(document.getElementById("frameRate").value);
    const frameInterval = 1000 / frameRate;

    function setSize(image) {



        const aspectRatio = image.width / image.height;

        let canvasWidth, canvasHeight, offsetX, offsetY;

        if (windowWidth / aspectRatio > windowHeight) {
            // Use full window height, adjust width accordingly
            canvasHeight = windowHeight;
            canvasWidth = windowHeight * aspectRatio;
            offsetX = (windowWidth - canvasWidth) / 2;
            offsetY = 0;
        } else {
            // Use full window width, adjust height accordingly
            canvasWidth = windowWidth;
            canvasHeight = windowWidth / aspectRatio;
            offsetX = 0;
            offsetY = (windowHeight - canvasHeight) / 2;
        }
        return {
            offsetX,
            offsetY,
            canvasWidth,
            canvasHeight
        }
    }
    if (audioLoaded == true) {
        playAudio(audioBuffer);
        audioLoaded = false;
    }
    if (imageALoading == false) {
        img = new Image();

        img.onload = function() {
            size = setSize(img);
            imageALoaded = true;
        }
        img.src = images[currentIndex].src;
        imageALoading = true;
    }
    if (imageBLoading == false) {
        imgB = new Image();

        imgB.onload = function() {

            sizeB = setSize(imgB);
            imageBLoaded = true;
        }
        imgB.src = images[currentIndexB].src
        imageBLoading = true;
    }


    ctx.globalAlpha = 0;
    let outAlpha = 1;
    let inAlpha = 1;




    if (imageALoaded == true && imageBLoaded == true) {
        console.log("both loaded?")
        if (timeStamp - prevTimeStamp >= frameInterval) {
            prevTimeStamp = timeStamp;

            let elapsed = Date.now() - slideStart;

            inAlpha = Math.min(1, elapsed / fadeDuration);
            ctx.clearRect(0, 0, windowWidth, windowHeight);

            if (currentIndexB !== currentIndex) {

                ctx.globalAlpha = 1 - inAlpha;
                ctx.drawImage(imgB, sizeB.offsetX, sizeB.offsetY, sizeB.canvasWidth, sizeB.canvasHeight);


            }



            ctx.globalAlpha = inAlpha;
            ctx.drawImage(img, size.offsetX, size.offsetY, size.canvasWidth, size.canvasHeight);
        }
    }
    if (Date.now() - slideStart >= intervalInMSeconds) {
        nextImage();

    }

    animID = requestAnimationFrame(slideshow);



}




function startSlideshow() {




    if (images.length > 0 && !slideshowActive) {


        startShowTimer = Date.now();
        slideStart = Date.now();
        slideshowActive = true;
        if (source && audioLoaded == false) {
            audioLoaded = true;
        }
    
    currentIndex = 0;
    currentIndexB = 0;
    imageALoaded = false;
    imageALoading = false;
    imageBLoading = false;
    imageBLoaded = false;

    let animID = requestAnimationFrame(slideshow);
    canvas.requestFullscreen();
    windowWidth = screen.width;
    windowHeight = screen.height;
    document.getElementById("slideshow-container").style.display = "flex";
    document.getElementById("start-slideshow-button").style.display = "none";

}
}

function endSlideshow() {
    if (slideshowActive) {
        stopAudio();
        slideshowActive = false;
        document.getElementById("slideshow-container").style.display = "none";
        document.getElementById("start-slideshow-button").style.display = "block";



    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

window.addEventListener("resize", function() {
    if (slideshowActive && !document.fullscreenElement || !document.webkitFullscreenElement || !document.mozFullScreenElement || !document.msFullscreenElement) {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
    }
});

document.addEventListener("keydown", function(event) {
    if (slideshowActive && event.key === "Escape") {

        endSlideshow();
    }
});


function loadMusic() {
    musicFile.click();
}
musicFile.addEventListener('change', function() {
    console.log("music?")
    const music = musicFile.files[0];
    if (music) {
        loadAndPlayAudio(music);
    }
});

function loadAndPlayAudio(music) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const audioData = e.target.result;
        initAudioContext();
        decodeAudioData(audioData);
    };

    reader.readAsArrayBuffer(music);
}

function initAudioContext() {
    audioContext = new(window.AudioContext || window.webkitAudioContext)();
}

function decodeAudioData(audioData) {
    audioContext.decodeAudioData(audioData, function(buffer) {
        audioBuffer = buffer;
        audioLoaded = true;
    });
}

function playAudio(buffer) {
    source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function stopAudio() {
    if (source) {
        source.stop();
    }
}
