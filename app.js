let isPluggedIn = false;
let speed = 0;
let heat = 0;
let coldShot = false;
let audioContext;
let fanGain;

const speedLabels = ['Off', 'Low airflow', 'High airflow'];
const heatLabels = ['Cool', 'Warm', 'Hot'];
const fanVolumes = [0, 0.12, 0.32];
const powerButton = document.querySelector('#power');
const speedButton = document.querySelector('#speed');
const heatButton = document.querySelector('#heat');
const coldButton = document.querySelector('#cold');
const display = document.querySelector('#display');
const scene = document.querySelector('#scene');
const status = document.querySelector('#status');

function getAudioContext() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    audioContext = new AudioContext();
  }
  if (audioContext.state !== 'running') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playPlugSound() {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const click = context.createOscillator();
  const envelope = context.createGain();
  click.type = 'triangle';
  click.frequency.setValueAtTime(isPluggedIn ? 540 : 320, now);
  click.frequency.exponentialRampToValueAtTime(isPluggedIn ? 180 : 120, now + 0.07);
  envelope.gain.setValueAtTime(0.22, now);
  envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  click.connect(envelope);
  envelope.connect(context.destination);
  click.start(now);
  click.stop(now + 0.08);
}

function updateSound(activeSpeed) {
  if (activeSpeed > 0 && !getAudioContext()) return;
  if (!fanGain && activeSpeed > 0) {
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.random() * 2 - 1;
    }

    const fan = audioContext.createBufferSource();
    fan.buffer = buffer;
    fan.loop = true;
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    fanGain = audioContext.createGain();
    fanGain.gain.value = 0;
    fan.connect(filter);
    filter.connect(fanGain);
    fanGain.connect(audioContext.destination);
    fan.start();
  }

  if (fanGain) {
    fanGain.gain.setTargetAtTime(fanVolumes[activeSpeed], audioContext.currentTime, 0.03);
  }
}

function render() {
  powerButton.textContent = isPluggedIn ? 'Unplug' : 'Plug in';
  powerButton.setAttribute('aria-pressed', String(isPluggedIn));
  speedButton.querySelector('.level').textContent = speed;
  heatButton.querySelector('.level').textContent = heat;
  speedButton.title = 'Airflow ' + speed + ' · ' + speedLabels[speed];
  heatButton.title = 'Temperature ' + heat + ' · ' + heatLabels[heat];
  speedButton.setAttribute('aria-label', speedButton.title);
  heatButton.setAttribute('aria-label', heatButton.title);

  const activeSpeed = isPluggedIn ? speed : 0;
  scene.dataset.plugged = String(isPluggedIn);
  scene.dataset.speed = activeSpeed;
  scene.dataset.heat = coldShot ? 0 : heat;
  coldButton.setAttribute('aria-pressed', String(coldShot));
  display.textContent = 'OFF';

  if (!isPluggedIn) {
    status.textContent = 'Unplugged · No airflow';
  } else if (speed === 0) {
    status.textContent = 'Connected · Airflow off';
  } else {
    const temperature = coldShot ? 'Cold shot' : heatLabels[heat];
    display.textContent = coldShot ? 'COLD' : temperature.toUpperCase();
    status.textContent = speedLabels[speed] + ' · ' + temperature;
  }
  updateSound(activeSpeed);
}

powerButton.addEventListener('click', () => {
  isPluggedIn = !isPluggedIn;
  playPlugSound();
  render();
});

speedButton.addEventListener('click', () => {
  speed = (speed + 1) % speedLabels.length;
  render();
});

heatButton.addEventListener('click', () => {
  heat = (heat + 1) % heatLabels.length;
  render();
});

coldButton.addEventListener('click', () => {
  coldShot = !coldShot;
  render();
});

render();
