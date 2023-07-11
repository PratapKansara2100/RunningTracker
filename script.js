"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  constructor(coords, distance, duration) {
    this.date = new Date();
    this.id = (Date.now() + "").slice(-10);
    this.distance = distance;
    this.duration = duration;
    this.coords = coords; // [lat, lng]
    this.name;
    this.clicks = 0;
  }

  // prettier-ignore
  _createDesctiption() {
    this.description =`${this.type === "running"? "Run on": "Cycling trip on"} ${months[this.date.getMonth()]}  ${this.date.getDate()}`
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = "running";
  thirdAttriUnit = "min/km";
  fourthAttriUnit = "spm";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._paceSetter(); // not binding the this keyword as this will not just be a normal function call, this will be a method call on the this keyword in the function will point to the class itself
    this._createDesctiption();
  }

  // calculating the pace in min/km
  _paceSetter() {
    this.thirdAttri = this.duration / this.distance; // this is the pace it is just called speed
    return this.speed;
  }
}
class Cycling extends Workout {
  type = "cycling";
  thirdAttriUnit = "km/h";
  fourthAttriUnit = "m";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._speedSetter();
    this._createDesctiption();
  }

  // calculating the speed in km/hr
  _speedSetter() {
    return (this.thirdAttri = this.distance / (this.duration / 60));
  }
}

class App {
  #map;
  #mapEvent;
  #workoutsArr = [];

  // obj used to configure leaflet popup
  #popupConfig = {
    maxWidth: 250,
    minWidth: 100,
    autoClose: false, // the below 2 prevent the popup to disapper when a new marker is placed
    closeOnClick: false,
    className: "running-popup", // adds css class for styling the popups
  };

  constructor() {
    // get user's location
    navigator.geolocation.getCurrentPosition(this._renderMap.bind(this), () =>
      console.log("Good Luck")
    );

    // get date from local storage
    this._getLocalStorage();

    // add event listeners
    form.addEventListener("submit", this._showMarker.bind(this));
    inputType.addEventListener("change", this._switchWorkout.bind(this));
    containerWorkouts.addEventListener("click", this._panToWorkout.bind(this));
  }

  _renderMap(position) {
    const { latitude, longitude } = position.coords;

    // setting up the map to be displayed on website
    this.#map = L.map("map", {}).setView([latitude, longitude], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // event handler for the map
    this.#map.on("click", this._showForm.bind(this));

    this.#workoutsArr.forEach((workout) => {
      this._renderMarker(workout);
    });
  }

  // eventhandler for the map, shows the form
  _showForm(event) {
    this.#mapEvent = event;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  // eventhandler for the map, hides the form
  _hideForm() {
    form.classList.add("hidden");
  }

  // event handler for the form, submitting the form;
  _showMarker(e) {
    e.preventDefault();

    //helper func- validation
    const numAndPositive = function (...arr) {
      return arr.every(function (val) {
        return val > 0 && Number.isFinite(val);
      });
    };

    // get the data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    // validate the common data
    if (!numAndPositive(distance, duration)) {
      return alert("form inputs can only be numbers and mostly only positive ");
    }

    // if workout is running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (!numAndPositive(cadence))
        return alert("cadence needs to be a positive number");
      this.#workoutsArr.push(
        new Running([lat, lng], distance, duration, cadence) // add new object to the workout array
      );
    }

    // if workout is cycling, create that object
    else {
      const elevation = +inputElevation.value;
      if (!Number.isFinite(elevation))
        return alert("elevation needs to be a number");
      this.#workoutsArr.push(
        new Cycling([lat, lng], distance, duration, elevation) // add new object to the workout array
      );
    }

    // render the marker on map
    this._renderMarker(this.#workoutsArr.at(-1));

    // render workout in the list
    this._renderWorkoutList(this.#workoutsArr.at(-1));
    // clearing input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    // hiding the form
    this._hideForm();

    // save the workouts array in local storage

    this._setLocalStorage();
  }

  // render the marker on map
  _renderMarker(workout) {
    const [lat, lng] = workout.coords;
    L.marker([lat, lng], { riseOnHover: true })
      .addTo(this.#map)
      .bindPopup(L.popup(this.#popupConfig))
      .setPopupContent(
        (this.#workoutsArr.at(-1).type === "running" ? "🏃‍♂️ " : "🚴‍♀️ ") +
          this.#workoutsArr.at(-1).description
      )
      .openPopup();
  }

  //called after the form is submitted
  _renderWorkoutList(workout) {
    // rendering the most recently added obj to workoutArr
    const text = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title"> ${workout.description}</h2>
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
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.thirdAttri.toFixed(1)}</span>
        <span class="workout__unit">${workout.thirdAttriUnit}</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === "running" ? "🦶🏼" : "⛰"
        }</span>
        <span class="workout__value">${
          workout.type === "running" ? workout.cadence : workout.elevationGain
        }</span>
        <span class="workout__unit">${workout.fourthAttriUnit}</span>
      </div>
    </li>
    `;
    form.insertAdjacentHTML("afterend", text);
  }

  // event handler for form, switching the workout type
  _switchWorkout() {
    inputCadence.parentElement.classList.toggle("form__row--hidden");
    inputElevation.parentElement.classList.toggle("form__row--hidden");

    //changing the look of pop up according to the workout
    this.#popupConfig.className = `${inputType.value}-popup`;
  }

  _panToWorkout(x) {
    const el = x.target.closest(".workout");
    if (!el) return;
    const workout = this.#workoutsArr.find((work) => work.id === el.dataset.id);
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workoutsArr));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workoutsArr = data;
    this.#workoutsArr.forEach((workout) => {
      this._renderWorkoutList(workout);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const code = new App();
