// index.js

// point at your three hero images
const photos = [
    'mainpagephotos/biglittlemain.jpg',
    'mainpagephotos/bonfiremain.jpg',
    'mainpagephotos/image3.jpg'
];

// …rest of your code stays the same…


const events = [
    { id:1, name:'Spring 2025 Gala', date:'Friday, May 5th', price:1500 }
];

let idx = 0;
let autoInterval;
let resumeTimeout;

function autoAdvance() {
    goToSlide(idx + 1);
}

function startAuto() {
    autoInterval = setInterval(autoAdvance, 3000);
}

function pauseAuto() {
    clearInterval(autoInterval);
    clearTimeout(resumeTimeout);
    resumeTimeout = setTimeout(startAuto, 5000);
}

function goToSlide(i) {
    const track = document.getElementById('carouselTrack');
    idx = (i + photos.length) % photos.length;
    const slide = track.children[idx];
    track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
    updateDots();
}

// build carousel + dots + event listeners
function loadCarousel() {
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('carouselDots');

    photos.forEach((src, i) => {
        // slide
        const img = document.createElement('img');
        img.src = src;
        track.appendChild(img);

        // dot
        const dot = document.createElement('button');
        dot.addEventListener('click', () => {
            goToSlide(i);
            pauseAuto();
        });
        dotsContainer.appendChild(dot);
    });

    updateDots();

    // prev/next buttons
    document.querySelector('.carousel-btn.prev')
        .addEventListener('click', () => { goToSlide(idx - 1); pauseAuto(); });
    document.querySelector('.carousel-btn.next')
        .addEventListener('click', () => { goToSlide(idx + 1); pauseAuto(); });

    // manual drag/scroll = pause
    track.addEventListener('pointerdown', pauseAuto);
    track.addEventListener('scroll', pauseAuto);

    startAuto();
}

function updateDots() {
    const dots = document.querySelectorAll('#carouselDots button');
    dots.forEach((d, i) => {
        d.classList.toggle('active', i === idx);
    });
}

function loadEvents() {
    const list = document.getElementById('eventList');
    events.forEach(e => {
        const div = document.createElement('div');
        div.className = 'event';
        div.innerHTML = `
      <h3>${e.name}</h3>
      <p>${e.date}</p>
      <button onclick="buyTicket(${e.id})">
        Buy Ticket ($${(e.price/100).toFixed(2)})
      </button>
    `;
        list.appendChild(div);
    });
}

function buyTicket(eventId) {
    alert('stub: start payment flow for event ' + eventId);
}

document.addEventListener('DOMContentLoaded', () => {
    loadCarousel();
    loadEvents();
});
