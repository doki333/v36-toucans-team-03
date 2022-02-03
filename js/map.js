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
let openchargemap_accessToken = "ba0bdea1-7220-4e1c-a3e1-60deca08d26a";
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

map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: false,
    },
    showAccuracyCircle: false,
    // When active the map will receive updates to the device's location as it changes.
    trackUserLocation: true,
    // Draw an arrow next to the location dot to indicate which direction the device is heading.
    showUserHeading: true,
  }),
  "bottom-right"
);

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
  )} min <a href="#" class="close-instructions" onclick="closeInstructions()">&hookleftarrow;</a><button type="button" class="bm_btn" lng=${
    end[0]
  } lat=${end[1]}>☆</button></p><ol>${tripInstructions}</ol>`;
  if (localStorage.getItem("@locationBM")) {
    const isBookmarked = JSON.parse(localStorage.getItem("@locationBM"));
    for (let l of isBookmarked) {
      if (l.location[0] === end[0] && l.location[1] === end[1]) {
        document.querySelector(".bm_btn").innerText = "★";
      }
    }
  }
}

async function getDetail(i) {
  const json = stationJson[i];
  console.log(json);
  // choose the best route

  const stationCard = document.getElementById("station-card");

  let stationInfo = "";

  let title = json.AddressInfo.Title;
  if (json.OperatorInfo != null && json.OperatorInfo.Title != null) {
    title = json.OperatorInfo.Title;
  }
  if (title.indexOf("(") > 0) {
    title = title.substring(0, title.indexOf("(")).trimEnd();
  }
  stationInfo += `<p class="station-card-title">${title} <a href="#" class="close-detail" onclick="closeDetail()">&hookleftarrow;</a></p>`;

  let usageType = "";
  if (json.UsageType != null) {
    if (json.UsageType.Title != null) {
      usageType += json.UsageType.Title;
    }
  }
  if (usageType != "") {
    usageType = `<p class="station-card-usage-type">` + usageType + "</p>";
    stationInfo += usageType;
  }

  let address = "";
  if (json.AddressInfo.AddressLine1 != null) {
    address += `${json.AddressInfo.AddressLine1}`;
    if (json.AddressInfo.Town != null) {
      address += `, ${json.AddressInfo.Town}`;
    }
    if (json.AddressInfo.StateOrProvince != null) {
      address += `, ${json.AddressInfo.StateOrProvince}`;
    }
    if (json.AddressInfo.Postcode != null) {
      address += ` ${json.AddressInfo.Postcode}`;
    }
  }
  if (address != "") {
    address = `<p class="station-card-address">` + address + "</p>";
    stationInfo += address;
  }

  if (json.AddressInfo.ContactTelephone1 != null) {
    console.log(json.AddressInfo.ContactTelephone1);
    stationInfo += `<p class="station-card-number">${json.AddressInfo.ContactTelephone1}</p>`;
  }
  if (
    json.AddressInfo.ContactTelephone1 == null &&
    json.AddressInfo.ContactTelephone2 != null
  ) {
    stationInfo += `<p class="station-card-number">${json.AddressInfo.ContactTelephone2}</p>`;
  }

  if (json.AddressInfo.RelatedURL != null) {
    stationInfo += `<p class="station-card-website"><a class="station-card-website-link" href="${json.AddressInfo.RelatedURL}">${json.AddressInfo.RelatedURL}</a></p>`;
  }

  let connectionList = ``;
  const connections = json.Connections;

  // TODO: Validation, values might be null or Unknown
  for (const j in connections) {
    const connection = connections[j];
    connectionList += `<ul class="connection-info"><li>${connection.ConnectionType.Title}</li><li>${connection.PowerKW} kW</li><li>Qty: ${connection.Quantity}</li></ul>`;
  }
  connectionList =
    `<div class="station-card-connection connection-wrapper">` +
    connectionList +
    `</div>`;

  stationInfo += connectionList;
  stationCard.innerHTML = stationInfo;
}

// Argument: the json file fetched from Open Charger Map
function drawStations(json) {
  // Remove previous search
  let counter = 0;
  while (counter <= 10) {
    if (map.getLayer("station" + counter)) {
      map.removeLayer("station" + counter).removeSource("station" + counter);
    }
    counter++;
  }

  // Add new search
  let uniqueTitles = [];
  const stations = document.getElementById("stations");
  let stationList = "";
  for (const i in json) {
    const loc = json[i];
    let title = loc.AddressInfo.Title;
    if (loc.OperatorInfo != null && loc.OperatorInfo.Title != null) {
      title = loc.OperatorInfo.Title;
    }
    if (title.indexOf("(") > 0) {
      title = title.substring(0, title.indexOf("(")).trimEnd();
    }
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
        connectionList += `<ul class="connection-info"><li>${connection.ConnectionType.Title}</li><li>${connection.PowerKW} kW</li><li>Qty: ${connection.Quantity}</li></ul>`;
      }
      stationList +=
        `<div class="station"><div class="station-header"><p class="station-title">${title}</p><div class="station-buttons"><button class="station-detail station-button station-content" data-index=${i}>Info</button><button class="station-nav station-button station-content" data-index=${i}>Nav</button></div></div><div class="station-info"><p class="distance">${dist} miles</p><div class="connection-wrapper">` +
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

  if (
    document.querySelector("#station-bookmark").classList.contains("active")
  ) {
    document.querySelector("#station-bookmark").classList.remove("active");
  }
  if (document.querySelector(".stations").classList.contains("hide")) {
    const stations = document.querySelector(".stations");
    stations.classList.toggle("hide");
  }
  if (document.querySelector(".station-card").classList.contains("active")) {
    const stationCard = document.querySelector(".station-card");
    stationCard.classList.toggle("active");
  }
  if (document.querySelector(".instructions").classList.contains("active")) {
    const instructions = document.querySelector(".instructions");
    instructions.classList.toggle("active");
  }
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

// document.querySelector(".station-list").addEventListener("click", () => {
//   const bookmark_list = JSON.parse(localStorage.getItem("@locationBM"));
//   const stations = document.querySelector(".stations");
//   stations.classList.toggle("hide");
//   const instructions = document.querySelector(".instructions");
//   instructions.classList.toggle("hide");
//   const bM = document.querySelector(".station-bookmark");
//   bM.classList.toggle("active");
//   console.log(bookmark_list);
//   if (bookmark_list) {
//     bM.innerHTML = "";
//     for (list of bookmark_list) {
//       bM.innerHTML += `
//       <ul>
//         <li class="bookmark_thing" title=${list.title}>${list.title}<p style="color: #19d3ab; display: inline">★</p></li>
//       </ul>`;
//     }
//   } else if (!bookmark_list) {
//     bM.innerHTML += `
//     <ul>
//       <li>Nothing!</li>
//     </ul>`;
//   }
// });
// TODO: Optimize
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("station-nav")) {
    const i = event.target.getAttribute("data-index");
    const loc = stationJson[i];
    const coord = [loc.AddressInfo.Longitude, loc.AddressInfo.Latitude];
    getRoute(coord);
    const stations = document.querySelector(".stations");
    stations.classList.toggle("hide");
    const instructions = document.querySelector(".instructions");
    instructions.classList.toggle("active");
    const isNone = map.getLayoutProperty("route", "visibility");
    if (isNone === "none") {
      map.setLayoutProperty("route", "visibility", "visible");
    }
  }
  if (event.target.classList.contains("bm_btn")) {
    document.querySelector(".bookmark_modal").classList.add("active");
    const long = Number(event.target.getAttribute("lng"));
    const lati = Number(event.target.getAttribute("lat"));
    document.querySelector(".add_btn").setAttribute("long", long);
    document.querySelector(".add_btn").setAttribute("lati", lati);
  }
  if (event.target.classList.contains("bookmark_thing")) {
    const storageList = JSON.parse(localStorage.getItem("@locationBM"));
    const name = event.target.getAttribute("title");
    for (let s of storageList) {
      if (s.title === name) {
        getRoute(s.location);
        const stations = document.querySelector(".stations");
        stations.classList.toggle("hide");
        const instructions = document.querySelector(".instructions");
        instructions.classList.toggle("active");
        const isNone = map.getLayoutProperty("route", "visibility");
        if (isNone === "none") {
          map.setLayoutProperty("route", "visibility", "visible");
        }
      }
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

const closeDetail = function () {
  console.log("close");
  const stations = document.querySelector(".stations");
  stations.classList.toggle("hide");
  const card = document.querySelector(".station-card");
  card.classList.toggle("active");
  const isVisible = map.getLayoutProperty("route", "visibility");
  if (isVisible === "visible") {
    map.setLayoutProperty("route", "visibility", "none");
  }
};

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("station-detail")) {
    const i = event.target.getAttribute("data-index");
    getDetail(i);
    const stations = document.querySelector(".stations");
    stations.classList.toggle("hide");
    const card = document.querySelector(".station-card");
    card.classList.toggle("active");
    console.log(card);
  }
});

document.querySelector(".close_button").addEventListener("click", () => {
  document.querySelector(".bookmark_modal").classList.remove("active");
  document.querySelector(".bookmark_control").value = "";
});

document.querySelector(".add_btn").addEventListener("click", (event) => {
  const long = Number(event.target.getAttribute("long"));
  const lati = Number(event.target.getAttribute("lati"));
  let isEmpty = JSON.parse(localStorage.getItem("@locationBM"));
  if (isEmpty === null) {
    isEmpty = [];
    const title = document.querySelector(".bookmark_control").value;
    const location_number = [long, lati];
    const entry = {
      title: title,
      location: location_number,
    };
    isEmpty.push(entry);
    localStorage.setItem("@locationBM", JSON.stringify(isEmpty));
  } else if (isEmpty !== null) {
    isEmpty.push({
      title: document.querySelector(".bookmark_control").value,
      location: [long, lati],
    });
    localStorage.setItem("@locationBM", JSON.stringify(isEmpty));
  }
  document.querySelector(".bookmark_modal").classList.remove("active");
  document.querySelector(".bookmark_control").value = "";
  document.querySelector(".bm_btn").innerText = "★";
});

// NavigationControl/Direction/ Bookmark

const nav = new mapboxgl.NavigationControl({
  visualizePitch: true,
});
map.addControl(nav, "bottom-right");

const input = document.querySelector("input[type=text]");
const overlay = document.querySelector(".overlay");

function showFloater() {
  body.classList.add("show-floater");
}

function closeFloater() {
  if (body.classList.contains("show-floater")) {
    body.classList.remove("show-floater");
  }
}
input.addEventListener("focusin", showFloater);
overlay.addEventListener("click", closeFloater);
// =========================
const bookmarksList = document.querySelector(".bookmarks-list");
const bookmarkForm = document.querySelector(".bookmark-form");
const bookmarkInput = bookmarkForm.querySelector("input[type=text]");
const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
const apiURL = "https://opengraph.io/api/1.0/site";
const appID = "5900185f9b8ad70f00f5f8bd";

fillList(bookmarks);

function createBookmark(e) {
  e.preventDefault();

  if (!bookmarkInput.value) {
    alert("Gotta add a link!");
    return;
  }
  const url = encodeURIComponent(bookmarkInput.value);
  // add a new bookmark to the bookmarks

  fetch(`${apiURL}/${url}?app_id=${appID}`)
    .then((response) => response.json())
    .then((data) => {
      const title = bookmarkInput.value;
      const bookmark = {
        title: data.hybridGraph.title,
        image: data.hybridGraph.image,
        link: data.hybridGraph.url,
      };
      bookmarks.push(bookmark);
      fillList(bookmarks);
      storeBookmarks(bookmarks);
      bookmarkForm.reset();
    })
    .catch((error) => {
      alert(
        'There was a problem retrieving the information. Please try again. Make sure to include the "http://"'
      );
    });
}

function fillList(bookmarks = []) {
  const bookmarksHtml = bookmarks
    .map((bookmark, i) => {
      return `
    <a href="${bookmark.link}" class="bookmark" data-id="${i}" target="_blank">
      <div class="img" style="background-image:url('${bookmark.image}')"></div>
      <div class="title">${bookmark.title}</div>
      <span class="fa fa-trash"></span>
    </a>
  `;
    })
    .join("");
  bookmarksList.innerHTML = bookmarksHtml;
}

function removeBookmark(e) {
  e.preventDefault();
  if (!e.target.matches(".fa-trash")) return;
  // find the index
  const index = e.target.parentNode.dataset.id;
  // remove from the bookmarks using splice
  bookmarks.splice(index, 1);
  // fill the list
  fillList(bookmarks);
  // store back to localStorage
  storeBookmarks(bookmarks);
}

function storeBookmarks(bookmarks = []) {
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
}
bookmarkForm.addEventListener("submit", createBookmark);
bookmarksList.addEventListener("click", removeBookmark);
