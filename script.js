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

// let map, mapEvent;
// Implementing form functionality

class App {
    constructor() {

    }

    #getPosition() {

    }

    #loadMap() {

    }

    #showForm() {

    }

    #toggleElevationField() {

    }

    #newWorkout() {

    }

}
const submitForm = function (e) {
    // e.preventDefault();
    const activity = inputType.value;
    const distance = inputDistance.value;
    const duration = inputDuration.value;
    const cadence = inputCadence.value;
    const date = new Date();
    const month = months[date.getMonth()];
    const emoji = activity == 'Running' ? '🚴‍♀️' : '🏃🏻‍♂️';
    const str = `${emoji} ${activity[0].toUpperCase()}${activity.slice(
        1
    )} on ${month} ${date.getDate()}`;
    inputDistance.value = inputDuration.value = inputCadence.value = '';
    return str;
};

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            const { latitude } = position.coords;
            const { longitude } = position.coords;
            console.log(latitude, longitude);
            console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

            const coords = [latitude, longitude];
            const map = L.map('map').setView(coords, 15);

            L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            // L.marker(coords).addTo(map)
            //     .bindPopup(`Blast 1 💥`)
            //     .openPopup();

            let i = 1;
            const setPopUp = function (coords, popUpStr) {
                L.marker(coords)
                    .addTo(map)
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
            };
            // setPopUp(coords);
            map.on('click', function (mapE) {
                const { lat, lng } = mapE.latlng;
                // setPopUp([lat, lng]);

                // Form element
                form.classList.remove('hidden');
                inputDistance.focus();
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    let popUpStr = submitForm();
                    setPopUp([lat, lng], popUpStr);
                });
            });
            // console.dir(map.on());
        },
        function () {
            alert('Please grant location access');
        }
    );
}

// Toggle elevation and cadence
inputType.addEventListener('change', function () {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});
