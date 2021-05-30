const mapApiKey = "pk.eyJ1Ijoic291cmFiaHRoYWt1cjI3IiwiYSI6ImNrcDc5Y3Z4cTAzY2sybnJ6dWNqZmR0amcifQ.9qU2w9l23BbRn2DHijpf2A";
const transitApiKey = "CwIZIJs65o3ruL2pbvnE";
const mapBaseUrl = "https://api.mapbox.com/geocoding/v5/mapbox.places/";
const transitBaseUrl = "https://api.winnipegtransit.com/v3/trip-planner.json?";
const originForm = document.querySelector('.origin-form');
const destinationForm = document.querySelector('.destination-form');
const originInput = document.querySelector('.origin-input');
const destinationInput = document.querySelector('.destination-input');
const origins = document.querySelector('.origins');
const destinations = document.querySelector('.destinations');
const listElement = document.getElementsByTagName('LI')
const recommendedTrip = document.querySelector('.recommended-trip');
const alternativeTrip = document.querySelector('.alternative-trip');
const busContainer = document.querySelector('.bus-container');
const planTrip = document.querySelector('.plan-trip');
let inputData = [];

function getForwardGeocodeResults(searchString) {       // get a forward geocode
  return fetch(
    `${mapBaseUrl}${searchString}.json?bbox=-97.325875, 49.766204, -96.953987, 49.99275&limit=10&access_token=${mapApiKey}`
  )
    .then(response => {
      return response.json()
    })
}


function getTripPlannigResults(originLat, originLong, destinationLat, destinationLong) {     
  return fetch(
    `${transitBaseUrl}api-key=${transitApiKey}&origin=geo/${originLat},${originLong}&destination=geo/${destinationLat},${destinationLong}`
  )
    .then(response => {
      return response.json()
    })
    .catch(error => {
      busContainer.innerHTML = "No trips Found."
    })
}

originForm.addEventListener('submit', function (e) {      // submit form
  e.preventDefault();
  getForwardGeocodeResults(originInput.value)
    .then(search => {
      getDetailsOfSearchResults(search.features, origins);
      markResultAsSelected("origins");
    });
})

destinationForm.addEventListener('submit', function (e) {        // destination form
  e.preventDefault();
  getForwardGeocodeResults(destinationInput.value)
    .then(search => {
      getDetailsOfSearchResults(search.features, destinations);
      markResultAsSelected("destinations");
    });
})

function getDetailsOfSearchResults(searchResults, chosenList) {       // get details of all matched search results
  chosenList.innerHTML = "";
  if (searchResults.length === 0) {
    chosenList.innerHTML = "No Results Found."
  } else {
    searchResults.forEach(searchResult => {
      let longitude = searchResult.center[0];
      let latitude = searchResult.center[1];
      let result = searchResult.place_name.split(",").map(item => item.trim());
      insertResultsToHTML(longitude, latitude, result[0], result[1], chosenList);
    });
  }
}

function insertResultsToHTML(longitude, latitude, placeName, placeAddress, chosenList) {
  chosenList.insertAdjacentHTML('beforeend', `
  <li data-long=${longitude} data-lat=${latitude}>
    <div class="name">${placeName}</div>
    <div>${placeAddress}</div>
  </li>
  `)
}

function markResultAsSelected(chosenList) {            // add click event
  let list = document.querySelectorAll(`.${chosenList} li`);
  for (const li of list) {
    li.addEventListener('click', function (e) {
      e.preventDefault();
      for (const li of list) {
        if (li.classList.contains("selected")) {
          li.classList.remove("selected");
        }
      }
      e.target.closest("li").classList.add("selected");
      getDataOfSelecedResult(list, chosenList);
    })
  }
}

function getDataOfSelecedResult(list, chosenList) {        // get location coordinates
  for (const li of list) {
    if (li.classList.contains("selected")) {
      let lat = li.getAttribute('data-lat')
      let long = li.getAttribute('data-long');
      if (chosenList === "origins") {
        inputData.orgLat = lat;
        inputData.orgLong = long;
      } else if (chosenList === "destinations") {
        inputData.destLat = lat;
        inputData.destLong = long;
      }
      addEventListenerToPlanTrips(inputData);
    }
  }
}

function addEventListenerToPlanTrips(inputData) {                // add click event to plan trips
  if (Object.keys(inputData).length === 4) {
    planTrip.addEventListener('click', function (e) {
      e.preventDefault();
      e.target.removeEventListener(e.type, arguments.callee);
      if ((inputData.orgLat === inputData.destLat) && (inputData.orgLong === inputData.destLong)) {
        busContainer.innerHTML = "Your origin and destination are the same.";
      } else {
        busContainer.innerHTML = "";
        displayTrips(inputData.orgLat, inputData.orgLong, inputData.destLat, inputData.destLong);
      }
    })
  } else {
    planTrip.addEventListener('click', function () {
      busContainer.innerHTML = "Please Select origin and destination both to get trips.";
    })
  }
}

function displayTrips(originLat, originLong, destinationLat, destinationLong) {
  busContainer.insertAdjacentHTML('beforeend', `
    <h3>Recommended Trip</h3>
    <ul class="recommended-trip my-trip"></ul>
  `);
  let trip = "recommended-trip";
  getTripPlannigResults(originLat, originLong, destinationLat, destinationLong)
    .then(search => {
      if (search !== undefined) {
        if (search.plans.length === 0) {
          busContainer.innerHTML = "No Trips Found.";
        } else {
          for (let i = 0; i < search.plans.length; i++) {
            if ((search.plans[i].number === 2) && (search.plans[i].segments.length > 2)) {
              busContainer.insertAdjacentHTML('beforeend', `
            <h3>Alternative Trips</h3>
            <ul class="alternative-trip my-trip"></ul>
          `);
              trip = "alternative-trip";
            }
            if (search.plans[i].segments.length > 2) {
              getInfoForEachSegment(search.plans[i].segments, trip);
            }
          }
        }
      } else {
        busContainer.innerHTML = "No Trips Found.";
      }
    });
}

function getInfoForEachSegment(plans, trip) {         // get different pieces of information
  plans.forEach(segment => {
    if ((segment.type === "walk") && (plans.indexOf(segment) === 0)) {
      let description =
        `Walk for ${segment.times.durations.total} minutes to stop #${segment.to.stop.key} - ${segment.to.stop.name}`;
      insertTripsToHTML("walking", description, trip, "style=margin-top:40px;");
    } else if (segment.type === "ride") {
      if (segment.route.name === undefined) {
        let description =
          `Ride the ${segment.route.number} for ${segment.times.durations.total} minutes.`;
        insertTripsToHTML("bus", description, trip);
      } else {
        let description =
          `Ride the ${segment.route.name} for ${segment.times.durations.total} minutes.`;
        insertTripsToHTML("bus", description, trip);
      }
    } else if (segment.type === "transfer") {
      let description =
        `Transfer from stop #${segment.from.stop.key} - ${segment.from.stop.name} to stop #${segment.to.stop.key} - ${segment.to.stop.name}`;
      insertTripsToHTML("ticket-alt", description, trip);
    } else {
      let description =
        `Walk for ${segment.times.durations.total} minutes to your destination.`;
      insertTripsToHTML("walking", description, trip);
    }
  });
}

function insertTripsToHTML(type, description, trip, space) {               // display trip plans
  document.querySelector(`.${trip}`).insertAdjacentHTML('beforeend', `
  <li ${space}>
    <i class="fas fa-${type}" aria-hidden="true"></i>${description}
  </li>
  `)
}