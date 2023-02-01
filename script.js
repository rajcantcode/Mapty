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
    #toEdit = false;
    #mapEvent;
    #workouts = [];
    #markers = [];

    constructor() {
        // Get user's position
        this._getPosition();

        // Get data from local storage
        this._getLocalStorage();

        // Attach event handlers
        form.addEventListener('submit', this._setPopUp.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
        containerWorkouts.addEventListener('click', this._deleteWorkout.bind(this));
        containerWorkouts.addEventListener('click', this._editWorkout.bind(this));
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
        // console.log(latitude, longitude);
        // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        this.#map.on('click', this._helper.bind(this));
        this.#workouts.forEach(workout => this._setPopUpLS(workout));
    }

    _helper(mapE) {
        form.classList.remove('hidden');
        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
            '';
        inputDistance.focus();
        const { lat, lng } = mapE.latlng;
        // console.log(this);
        this.#mapEvent = [lat, lng];
        // console.log(this.#mapEvent);
    }

    _hideForm() {
        // prettier-ignore
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'));
    }

    _setPopUpLS(obj) {
        const marker = L.marker(obj.coords)
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
        this.#markers.push({ id: obj.id, marker });
    }

    _setPopUp(e) {
        e.preventDefault();
        if (this.#toEdit) return;

        const obj = this._submitform();
        const marker = L.marker(obj.coords)
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
        console.log(marker._popup._content);
        this.#markers.push({ id: obj.id, marker });
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
            // console.log(this.#workouts);
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
            // console.log(this.#workouts);
        }

        // Clearing input fields and hide form
        this._hideForm();

        // Pushing objects in local storage
        this._setLocalStorage();

        return workout;
    }

    _renderWorkout(workout, append = true) {
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id
            }">
            <div class="controls absolute">
            <h4 class="edit">edit</h4>
            <h4 class="cross">x</h4>
          </div>
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
            <span class="workout__unit">km/hr</span>
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

        if (append) form.insertAdjacentHTML('afterend', html);
        return html.substring(68, 1086);
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl) return;
        // console.log(this.#workouts);
        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });
        // workout.click();
    }

    _deleteWorkout(e) {
        if (!e.target.classList.contains('cross')) return;

        // Get id and set display to none of that workout
        const workoutEl = e.target.closest('.workout');
        workoutEl.style.display = 'none';

        // With that id, filter the array
        const temp = this.#workouts.filter(
            work => work.id !== workoutEl.dataset.id
        );
        this.#workouts = temp;
        // console.log(this.#workouts);
        this._setLocalStorage();

        // Remove marker of that workout
        const markerObj = this.#markers.find(
            mark => mark.id === workoutEl.dataset.id
        );
        markerObj.marker.remove();
    }

    _editWorkout(e) {
        if (!e.target.classList.contains('edit')) return;

        this.#toEdit = true;

        // Get the target element
        const workoutEl = e.target.closest('.workout');

        // Display form, the form should contain all the values of the element which was selected by the user to edit
        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );
        form.classList.remove('hidden');
        inputType.value = workout.type;
        inputDistance.value = workout.distance;
        inputDuration.value = workout.duration;
        if (workout.type === 'running') {
            inputCadence.closest('.form__row').classList.remove('form__row--hidden');
            inputElevation.closest('.form__row').classList.add('form__row--hidden');
            inputCadence.value = workout.cadence;
        } else {
            inputElevation
                .closest('.form__row')
                .classList.remove('form__row--hidden');
            inputCadence.closest('.form__row').classList.add('form__row--hidden');
            inputElevation.value = workout.elev;
        }

        // Once the user submits form, with new changes display them on the element, and on marker
        let t = this;
        form.addEventListener('submit', function () {
            if (!t.#toEdit) return;
            // Setting toEdit to false again
            t.#toEdit = false;

            // Getting index of workout that was selected from workouts array
            const index = t.#workouts.findIndex(
                workout => workout.id === workoutEl.dataset.id
            );
            // Creating new object with editted values
            const editedWorkout = t._submitform();
            // Assigning coords of the selected object to new object
            editedWorkout.coords = t.#workouts[index].coords;
            // Adding the new updated object in place of old object
            t.#workouts[index] = t.#workouts.pop();
            // Generating html for the new workout
            const html = t._renderWorkout(editedWorkout, false);
            workoutEl.innerHTML = '';
            workoutEl.innerHTML = html;
            t._setLocalStorage();
        });
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data);
        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach(workout => this._renderWorkout(workout));
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
    _newWorkout() { }
}

const app = new App();
