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
    clicks = 0;
    date = new Date();
    id = (Date.now() + '').slice(-10);
    constructor(coords, distance, duration) {
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const activity = this.type;
        const emoji = activity === 'running' ? '🏃🏻‍♂️' : '🚴🏼‍♂️';
        this.description = `${emoji} ${activity[0].toUpperCase()}${activity.slice(
            1
        )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }

    click() {
        this.clicks++;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elev) {
        super(coords, distance, duration);
        this.elev = elev;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

class App {
    #map;
    #mapZoomLevel = 14;
    #mapEvent;
    #workouts = [];

    constructor() {
        this._getPosition();
        form.addEventListener('submit', this._setPopUp.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
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
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

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

    _hideForm() {
        // prettier-ignore
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'));
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
            .setPopupContent(obj.description)
            .openPopup();
        this._renderWorkout(obj);
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
            workout = new Running(this.#mapEvent, distance, duration, cadence);
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
            workout = new Cycling(this.#mapEvent, distance, duration, elev);
            // Pushing object to workout array
            this.#workouts.push(workout);
            console.log(this.#workouts);
        }

        // Clearing input fields and hide form
        this._hideForm();

        return workout;
    }

    _renderWorkout(workout) {
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id
            }">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃🏻‍♂️' : '🚴🏼‍♂️'
            }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

        if (workout.type === 'running') {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">km/min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
        }

        if (workout.type === 'cycling') {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elev}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
        }

        form.insertAdjacentHTML('afterend', html);
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        // console.log(workoutEl);
        if (!workoutEl) return;
        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );
        // console.log(workout);
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });
        workout.click();
    }

    _newWorkout() { }
}

const app = new App();
