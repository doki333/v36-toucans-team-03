const profileBtn = document.querySelector(".profile_info");
const closeBtn = document.querySelector(".close_btn");
const profileUsername = document.querySelector("#profile_username");
const profileModal = document.querySelector(".profile_modal");

profileBtn.addEventListener("click", () => {
  profileModal.classList.add("active");
});

closeBtn.addEventListener("click", () => {
  profileModal.classList.remove("active");
});

// Map Location
openchargemap_accessToken = "ba0bdea1-7220-4e1c-a3e1-60deca08d26a";
mapboxgl.accessToken =
  "pk.eyJ1Ijoic2FzaGFwb28iLCJhIjoiY2t5Z2p4MDRxMDllMjJwb2x3Z2p3eWlzNCJ9.ZpZ5fmYIFxhljKiga7DSXw";

// An arbitrary starting point, will be change to user's location later
let userLocation = [-122.662323, 45.523751];
let stationJson = {};

// Ask for user's current location
navigator.geolocation.getCurrentPosition(
  function (loc) {
    userLocation = [loc.coords.longitude, loc.coords.latitude];
    map.setCenter(userLocation);
  },
  function () {
    alert("Could not get your location"); // TODO: What to do when user disable location
  }
);

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: userLocation,
  zoom: 12,
});

async function getRoute(end) {
  // make a directions request using driving profile
  // an arbitrary start will always be the same
  // only the end or destination will change
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
    { method: "GET" }
  );
  // extract the json body content
  const json = await query.json();
  // choose the best route
  const data = json.routes[0];
  const route = data.geometry.coordinates;
  // make the following object fot "setData" for route
  const geojson = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: route,
    },
  };
  // if the route already exists on the map, we'll reset it using setData
  if (map.getSource("route")) {
    map.getSource("route").setData(geojson);
  }
  // otherwise, we'll make a new request
  else {
    map.addLayer({
      id: "route",
      type: "line",
      source: {
        type: "geojson",
        data: geojson,
      },
      // TODO: Style
      layout: {
        "line-join": "round",
        "line-cap": "round",
        visibility: "visible",
      },
      paint: {
        "line-color": "#3887be",
        "line-width": 5,
        "line-opacity": 0.75,
      },
    });
  }
  // add turn instructions
  const instructions = document.getElementById("instructions");
  const steps = data.legs[0].steps;

  let tripInstructions = "";
  for (const step of steps) {
    tripInstructions += `<li>${step.maneuver.instruction}</li>`;
  }
  instructions.innerHTML = `<p>Trip duration: ${Math.floor(
    data.duration / 60
  )} min <a href="#" class="close-instructions" onclick="closeInstructions()">&times;</a></p><ol>${tripInstructions}</ol>`;
}

// Argument: the json file fetched from Open Charger Map
function drawStations(json) {
  // Remove previous search
  let counter = 0;
  while (map.getLayer("station" + counter)) {
    map.removeLayer("station" + counter).removeSource("station" + counter);
    counter++;
  }

  // Add new search
  let uniqueTitles = [];
  const stations = document.getElementById("stations");
  let stationList = "";
  for (const i in json) {
    const loc = json[i];
    const title = loc.AddressInfo.Title;
    if (!uniqueTitles.includes(title)) {
      uniqueTitles.push(title);
      const coord = [loc.AddressInfo.Longitude, loc.AddressInfo.Latitude];
      map.addLayer({
        id: "station" + i,
        type: "circle",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Point",
                  coordinates: coord,
                },
              },
            ],
          },
        },
        paint: {
          // TODO: Style of the marker?
          "circle-radius": 10,
          "circle-color": "#f30",
        },
      });
      let dist = loc.AddressInfo.Distance; // TODO: Looks like the distance retrieved from Open Charge Map is the straight line distance not distance of the route
      if (loc.AddressInfo.DistanceUnit == 2) {
        dist = Math.round((dist / 1.609) * 10) / 10;
      } else {
        dist = Math.round(dist * 10) / 10;
      }
      let connectionList = ``;
      const connections = loc.Connections;

      // TODO: Validation, values might be null or Unknown
      for (const j in connections) {
        const connection = connections[j];
        connectionList += `<ul class="connection-info station-content" data-index=${i}><li class="station-content" data-index=${i}>${connection.ConnectionType.Title}</li><li class="station-content" data-index=${i}>${connection.PowerKW} kW</li><li class="station-content" data-index=${i}>Qty: ${connection.Quantity}</li></ul>`;
      }
      stationList +=
        `<div class="station station-content" data-index=${i}><p class="station-title station-content" data-index=${i}>${title}</p><div class="station-info station-content" data-index=${i}><p class="distance station-content" data-index=${i}>${dist} miles</p><div class="connection-wrapper station-content" data-index=${i}>` +
        connectionList +
        `</div></div></div>`;
    }
  }
  stations.innerHTML = `${stationList}`;
}

// Argument: parsed location entered by user, number of stations to return
// Note: coordinates used by mapbox is (long, lat)
async function getStations(loc, numResult = 10) {
  // Convert the user entered location to coordinates
  const coordQuery = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${loc}.json?access_token=${mapboxgl.accessToken}`,
    { method: "GET" }
  );
  const coordJson = await coordQuery.json();
  userLocation = coordJson.features[0].center;
  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: userLocation,
        },
      },
    ],
  };
  if (map.getLayer("point")) {
    map.setCenter(userLocation).getSource("point").setData(geojson);
  } else {
    map
      .removeLayer("point")
      .removeSource("point")
      .setCenter(userLocation)
      .addLayer({
        id: "point",
        type: "circle",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Point",
                  coordinates: userLocation,
                },
              },
            ],
          },
        },
        paint: {
          // TODO: Style
          "circle-radius": 10,
          "circle-color": "#3887be",
        },
      });
  }

  const stationQuery = await fetch(
    `https://api.openchargemap.io/v3/poi/?key=${openchargemap_accessToken}&output=json&latitude=${userLocation[1]}&longitude=${userLocation[0]}&maxresults=${numResult}`
  );

  // the json file should contain num_result objects
  stationJson = await stationQuery.json();
  drawStations(stationJson);
}

const search = function () {
  let loc = document
    .getElementById("entered-location")
    .value.trimStart()
    .trimEnd();
  loc = loc.replaceAll(" ", "%20");
  if (loc === "") {
    return;
  }
  getStations(loc);
};

map.on("load", () => {
  // make an initial directions request that
  // starts and ends at the same location
  getRoute(userLocation);

  // Add starting point to the map
  map.addLayer({
    id: "point",
    type: "circle",
    source: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: userLocation,
            },
          },
        ],
      },
    },
    paint: {
      // TODO: Style
      "circle-radius": 10,
      "circle-color": "#3887be",
    },
  });

  // allow the user to click the map and update the location of the destination
  map.on("click", (event) => {
    // get the coordinates where the mouse clicked
    const coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);
    const end = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: coords,
          },
        },
      ],
    };
    if (map.getLayer("end")) {
      map.getSource("end").setData(end);
    } else {
      map.addLayer({
        id: "end",
        type: "circle",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Point",
                  coordinates: coords,
                },
              },
            ],
          },
        },
        paint: {
          // TODO: Style
          "circle-radius": 10,
          "circle-color": "#f30",
        },
      });
    }
    getRoute(coords);
  });
});

const onPressEnter = (event) => {
  let key = event.key || event.keyCode;

  if (key === "Enter" || key === 13) {
    search();
  }
};

const onSearch = document.querySelector(".search");
const onSearchInput = document.getElementById("entered-location");

onSearch.addEventListener("click", search);
onSearchInput.addEventListener("keydown", onPressEnter);

// TODO: Optimize
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("station-content")) {
    const i = event.target.getAttribute("data-index");
    const loc = stationJson[i];
    const coord = [loc.AddressInfo.Longitude, loc.AddressInfo.Latitude];
    getRoute(coord);
    const stations = document.querySelector(".stations");
    stations.classList.toggle("hide");
    const instructions = document.querySelector(".instructions");
    instructions.classList.toggle("active");
    if (isVisible === "none") {
      map.setLayoutProperty("route", "visibility", "visible");
    }
  }
});

const closeInstructions = function () {
  console.log("close");
  const stations = document.querySelector(".stations");
  stations.classList.toggle("hide");
  const instructions = document.querySelector(".instructions");
  instructions.classList.toggle("active");
  const isVisible = map.getLayoutProperty("route", "visibility");
  if (isVisible === "visible") {
    map.setLayoutProperty("route", "visibility", "none");
  }
};

// NavigationControl/Direction

const nav = new mapboxgl.NavigationControl({
  visualizePitch: true,
});
map.addControl(nav, "bottom-right");
