
// source: https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
function detectMob() {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];

    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}
console.log('is mobile ', detectMob());

// scale menu UI up
if (detectMob()) {
    // document.querySelector('.slidecontainer').style.transform = 'scale(2.4) translate(50%, 425%)';
    // document.querySelector('h1').style.transform = 'scale(2) translate(12.5%, 25%)';
    // document.getElementById('start-menu').style.transform = 'scale(3) translate(13%, 35%)';
    document.querySelector('body').style.transform = 'scale(3) translate(0, 35%)';
    // document.querySelector('body').style.overflow = 'hidden';
}