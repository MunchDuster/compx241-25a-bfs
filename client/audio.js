const audioDirectory = 'assets/audio/';
const audioType = '.mp3';

let audioContext;
let gainNode;

let musicTrack;
let musicAudio;
let sfxAudio

function initializeAudioSystem() {
    audioContext = new AudioContext();
    gainNode = audioContext.createGain();
}

// volume control
function initializeVolumeSlider() {
    const volumeSlider = document.getElementById('volumeSlider');
    const setGain = () => {
        const volume = volumeSlider.value;
        console.log('setting volume: ' + volume);
        gainNode.gain.value = volume;
    };
    volumeSlider.addEventListener('input', setGain);
    setGain();
}
function hideTheExplanation() {
    const tip = document.querySelector('.whyCantIHearTheSong');
    tip.parentElement.removeChild(tip);
}


const deltaTimeSeconds = 0.01;
async function wait(seconds) {
    // dont make promises you cant keep
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
async function smoothVolumeChange(target, time) {
    const startVolume = volumeSlider.value;
    const speed = Math.abs(startVolume - target) / time;
    const delta = speed * deltaTimeSeconds;
    if (target > startVolume) {
        for(let v = startVolume; v < target; v += delta) {
            v = Math.min(target, v);
            volumeSlider.value = v;
            volumeSlider.dispatchEvent(new Event('input'));
            await wait(deltaTimeSeconds);
        }
    }
    else {
        for(let v = startVolume; v > target; v -= delta) {
            v = Math.max(target, v);
            volumeSlider.value = v;
            volumeSlider.dispatchEvent(new Event('input'));
            await wait(deltaTimeSeconds);
        }
    }
}

// uses a basic fade-out and fade-in to make the change less jarring
async function changeToInGameMusic() {
    console.log('changing music');
    const originalVolume = volumeSlider.value;
    await smoothVolumeChange(0, 2);
    musicTrack.mediaElement.src = audioDirectory + 'game-theme' + audioType;
    musicAudio.play();
    await smoothVolumeChange(originalVolume, 2);
}
function playAudio(audioName, looping=false) {
    console.log('playing audio: ' + audioName);
    const audioPath = audioDirectory + audioName + audioType;
    console.log(audioPath);
    const audio = new Audio(audioPath);
    const track = audioContext.createMediaElementSource(audio);

    if (looping) {
        track.mediaElement.loop = true;
    } 
    console.log(track);

    track.connect(gainNode).connect(audioContext.destination);
    audio.play();
    return {audio, track};
}

function onUserInteracted() {
    initializeAudioSystem();
    initializeVolumeSlider();
    hideTheExplanation();
    const {audio, track} = playAudio('intro', true);
    musicAudio = audio;
    musicTrack = track;
    console.log('music track is set to ' + musicTrack);
    window.removeEventListener('click', onUserInteracted);
}

// -- EVENTS --
// Sound must player after an interaction like a click, browser will not play it otherwise
window.addEventListener('click', onUserInteracted);


// -- EXPORTs --
window.playAudio = playAudio;
window.switchMusic = changeToInGameMusic;