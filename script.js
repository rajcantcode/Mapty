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

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    dispStr;
    constructor(coords, distance, duration, dispStr) {
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
        this.dispStr = dispStr;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence, dispStr) {
        super(coords, distance, duration, dispStr);
        this.cadence = cadence;
        this.calcPace();
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elev, dispStr) {
        super(coords, distance, duration, dispStr);
        this.elev = elev;
        this.calcSpeed();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

class App {
    #map;
    #mapEvent;
    #workouts = [];

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
        // console.log(this);
        this.#mapEvent = [lat, lng];
        console.log(this.#mapEvent);
    }

    _setPopUp(e) {
        e.preventDefault();
        const obj = this._submitform();
        L.marker(obj.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    className: `${obj.type}-popup`,
                    closeOnClick: false,
                })
            )
            .setPopupContent(obj.dispStr)
            .openPopup();
    }

    _submitform() {
        // Get data from form
        const activity = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        let workout;

        // Helper functions to Check if data is valid
        const validInpts = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        // Creating display strings for workouts
        const date = new Date();
        const month = months[date.getMonth()];
        const emoji = activity === 'running' ? '🏃🏻‍♂️' : '🚴‍♀️';
        const str = `${emoji} ${activity[0].toUpperCase()}${activity.slice(
            1
        )} on ${month} ${date.getDate()}`;

        // If running, then create running object
        if (activity === 'running') {
            const cadence = +inputCadence.value;

            // Checking if data is valid
            if (
                !validInpts(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            )
                return alert('Inputs have to be positive numbers');

            // Creating individual object
            workout = new Running(
                this.#mapEvent,
                distance,
                duration,
                cadence,
                str
            );
            // Pushing object to workout array
            this.#workouts.push(workout);
            console.log(this.#workouts);
        }

        // If cycling, then create cycling object
        if (activity === 'cycling') {
            const elev = +inputElevation.value;

            // Checking if data is valid
            if (
                !validInpts(distance, duration, elev) ||
                !allPositive(distance, duration)
            )
                return alert('Inputs have to be positive numbers');

            // Creating individual object
            workout = new Cycling(
                this.#mapEvent,
                distance,
                duration,
                elev,
                str
            );
            // Pushing object to workout array
            this.#workouts.push(workout);
            console.log(this.#workouts);
        }

        // Clearing input fields
        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
            '';
        return workout;
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout() { }
}

const app = new App();
