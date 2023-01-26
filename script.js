'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class App {
    #map;
    #mapEvent;

    constructor() {
        this._getPosition();
        form.addEventListener('submit', this._setPopUp.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('Please grant location access');
                }
            );
        }
    }

    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        console.log(latitude, longitude);
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, 15);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        this.#map.on('click', this._helper.bind(this));
    }

    _helper(mapE) {
        form.classList.remove('hidden');
        inputDistance.focus();
        const { lat, lng } = mapE.latlng;
        console.log(this);
        this.#mapEvent = [lat, lng];
        console.log(this.#mapEvent);
    }

    _setPopUp(e) {
        e.preventDefault();
        const coords = this.#mapEvent;
        const popUpStr = this._submitform();
        L.marker(coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    className: `running-popup`,
                    closeOnClick: false,
                })
            )
            .setPopupContent(popUpStr)
            .openPopup();
    }

    _submitform() {
        const activity = inputType.value;
        const distance = inputDistance.value;
        const duration = inputDuration.value;
        const cadence = inputCadence.value;
        const date = new Date();
        const month = months[date.getMonth()];
        const emoji = activity === 'running' ? '🏃🏻‍♂️' : '🚴‍♀️';
        const str = `${emoji} ${activity[0].toUpperCase()}${activity.slice(
            1
        )} on ${month} ${date.getDate()}`;
        inputDistance.value = inputDuration.value = inputCadence.value = '';
        return str;
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout() { }
}

const app = new App();
