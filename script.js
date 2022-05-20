"use strict";

// * Setting up variables and extracting HTML elements

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  id = Date.now() + "".split(-7);
  date = new Date();

  constructor(coords, distance, duration) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _setDescription() {
    // prettier-ignore
    const months = [
    "January","February","March","April","May","June","July","August","September","October","November","December"];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = Number((this.distance / (this.duration / 60)).toFixed(2));
    return this.speed;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = Number((this.duration / this.distance).toFixed(2));
    return this.pace;
  }
}

class App {
  #map;
  #mapEvent;
  #workout = [];
  #mapZoomLevel = 13;
  constructor() {
    this._getPosition();
    // extract data from local storage
    this._getLocalStorage();
    inputType.addEventListener("change", this._toggleElevationField);
    form.addEventListener("submit", this._newWorkout.bind(this));
    containerWorkouts.addEventListener("click", this._moveMap.bind(this));
  }

  // * To get current location of User
  _getPosition() {
    navigator.geolocation?.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("For the application to work, it needs access to your location.");
      }
    );
  }

  // * Displays The Map
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coord = [latitude, longitude];

    // Displays the map using Leaflet library
    this.#map = L.map("map").setView(coord, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    // to load existing workout data on the map after the map loads
    this.#workout.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  // * To listen to an event when user clicks anywhere on the map
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  // * Change form input type for running and workout
  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  // * Listen to enter key when form is active
  _newWorkout(e) {
    e.preventDefault();

    const inputOnlyNum = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));

    const inputOnlyPosNum = (...inputs) => inputs.every((input) => input > 0);

    // get data from the form
    let workout;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    // If workout is running, then store in running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !inputOnlyNum(distance, duration, cadence) ||
        !inputOnlyPosNum(distance, duration, cadence)
      )
        alert("Enter only positive numbers");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout is cycling, then store in cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !inputOnlyNum(distance, duration, elevation) ||
        !inputOnlyPosNum(distance, duration)
      )
        alert("Enter only positive numbers");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // add to new object to the workout array
    this.#workout.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + Clear the inputs
    this._hideForm();

    // set local storage for all the workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          closeOnEscapeKey: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id=${workout.id}>
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === "running") {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>`;
    }

    if (workout.type === "cycling") {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
      `;
    }

    form.insertAdjacentHTML("afterend", html);
  }
  _moveMap(e) {
    const workoutEle = e.target.closest(".workout");

    if (!workoutEle) return;

    const workout = this.#workout.find((w) => w.id === workoutEle.dataset.id);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    this.#workout = data;
    this.#workout.forEach((work) => {
      this._renderWorkout(work);
    });
  }
}

const app = new App();
