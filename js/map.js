const profileBtn = document.querySelector(".profile_info");
const closeBtn = document.querySelector(".close_btn");
const profileUsername = document.querySelector("#profile_username");
const profileModal = document.querySelector(".profile_modal");
const onSearchInput = document.getElementById("entered-location");
const locationBtn = document.getElementById("currentBtn");
const askBtnArea = document.querySelector(".btn_area");
let carMarker = [];
let stationMarkers = [];

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

// Initialize a map object
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

//Add button that asks for user's current location
function askLocation() {
  navigator.geolocation.getCurrentPosition(
    function (loc) {
      userLocation = [loc.coords.longitude, loc.coords.latitude];
      map.setCenter(userLocation);
      //As soon as user presses the button, show stations around user's current location
      getStations(userLocation);
    },
    function () {
      alert("We could not get your location"); // TODO: What to do when user disable location
    }
  );
}

/*====================Utilities: Construct HTML elements/*====================*/

/**
 * Construct a paragraph html element.
 * @param {String} content Content of the html element.
 * @param {String} classes Classes of the html element.
 * @param {String} onClickFunction Callback function of the html element.
 * @param {String} dataName Data name if there's data.
 * @param {*} data Data of this element.
 * @returns String, a paragraph html element.
 */
function makePElement(
  content,
  classes,
  onClickFunction = null,
  dataName = null,
  data = null
) {
  let res = `<p class="${classes}"`;
  if (onClickFunction != null) res += ` onclick="${onClickFunction}()"`;
  if (dataName != null) res += ` ${dataName}=${data}`;
  res += ">" + content + "</p>";
  return res;
}

/**
 * Construct a anchor html element.
 * @param {String} content Content of the html element.
 * @param {String} href Link of the html element.
 * @param {String} classes Classes of the html element.
 * @param {String} onClickFunction Callback function of the html element.
 * @param {String} dataName Data name if there's data.
 * @param {*} data Data of this element.
 * @returns String, a anchor html element.
 */
function makeAElement(
  content,
  href,
  classes,
  onClickFunction = null,
  dataName = null,
  data = null
) {
  let res = `<a href="${href}" class="${classes}"`;
  if (onClickFunction != null) res += ` onclick="${onClickFunction}()"`;
  if (dataName != null) res += ` ${dataName}=${data}`;
  res += ">" + content + "</a>";
  return res;
}

/**
 * Construct a unordered list element.
 * @param {Array} liContent The list elements as an array.
 * @param {String} classes Classes of the html element.
 * @returns String, a unordered list html element.
 */
function makeUlElement(liContent, classes, classes2) {
  let res = `<ul class="${classes}">`;
  for (const i in liContent) {
    const content = liContent[i];
    if (classes2 !== null) res += `<li class="${classes2}">${content}</li>`;
  }
  res += "</ul>";
  return res;
}

/**
 * Construct a division html element.
 * @param {String} content Content of the html element.
 * @param {String} classes Classes of the html element.
 * @param {String} onClickFunction Callback function of the html element.
 * @param {String} dataName Data name if there's data.
 * @param {*} data Data of this element.
 * @returns String, a division html element.
 */
function makeDivElement(
  content,
  classes,
  onClickFunction = null,
  dataName = null,
  data = null
) {
  let res = `<div class="${classes}"`;
  if (onClickFunction != null) res += ` onclick="${onClickFunction}()"`;
  if (dataName != null) res += ` ${dataName}=${data}`;
  res += ">" + content + "</div>";
  return res;
}

/**
 * Construct a button html element.
 * @param {String} content Content of the html element.
 * @param {String} classes Classes of the html element.
 * @param {String} onClickFunction Callback function of the html element.
 * @param {String} dataName Data name if there's data.
 * @param {*} data Data of this element.
 * @returns String, a button html element.
 */
function makeButtonElement(
  content,
  classes,
  onClickFunction = null,
  dataName = null,
  data = null
) {
  let res = `<button class="${classes}"`;
  if (onClickFunction != null) res += ` onclick="${onClickFunction}()"`;
  if (dataName != null) res += ` ${dataName}=${data}`;
  res += ">" + content + "</button>";
  return res;
}

/**
 *
 * @param {Array} connections An array of connections at the station.
 * @returns A list html element.
 */
function makeConnectionList(connections) {
  let connectionList = "";
  for (const j in connections) {
    const connection = connections[j];
    const content = [
      connection.ConnectionType.Title,
      connection.PowerKW + " kW",
      "Qty: " + connection.Quantity,
    ];
    connectionList += makeUlElement(content, "connection-info");
  }
  connectionList = makeDivElement(
    connectionList,
    "station-card-connection connection-wrapper"
  );
  return connectionList;
}

/*====================Utilities: Manipulate display/*====================*/

function hideElement(hideClass) {
  if (document.querySelector(hideClass).classList.contains("active")) {
    const stationCard = document.querySelector(hideClass);
    stationCard.classList.toggle("active");
  }
}

function showElement(showClass) {
  if (!document.querySelector(showClass).classList.contains("active")) {
    const stationCard = document.querySelector(showClass);
    stationCard.classList.toggle("active");
  }
}

function hideLayout(layout) {
  const isVisible = map.getLayoutProperty(layout, "visibility");
  if (isVisible === "visible") {
    map.setLayoutProperty(layout, "visibility", "none");
  }
}

function showLayout(layout) {
  const isNone = map.getLayoutProperty(layout, "visibility");
  if (isNone === "none") {
    map.setLayoutProperty(layout, "visibility", "visible");
  }
}

/*====================Utilities: End of utilities/*====================*/

function addMapLayer(id, type, geojson, paint, layout = null) {
  let input = {
    id: id,
    type: type,
    source: {
      type: "geojson",
      data: geojson,
    },
    paint: paint,
  };
  if (layout != null) {
    input = { ...input, layout: layout };
  }
  map.addLayer(input);
}

/**
 * Make a direction request using driving profile.
 * An arbitrary start will alwayas be the same (the location searched by users).
 * Only the end or destination will change.
 * @param {Array} end The end or destination.
 */
async function getRoute(end) {
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
    const layout = {
      "line-join": "round",
      "line-cap": "round",
      visibility: "visible",
    };
    const paint = {
      "line-color": "#D21941",
      "line-width": 6,
      "line-opacity": 0.75,
    };
    addMapLayer("route", "line", geojson, paint, layout);
    // let marker = carMarker.pop();
    // marker.setLngLat(userLocation);
    // carMarker.push(marker);
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

/**
 * Construct the station information html element
 * @param {Integer} i Index of the station.
 */
async function getDetail(i) {
  const json = stationJson[i];
  const stationCard = document.getElementById("station-card");

  let stationInfo = "";

  let title = json.AddressInfo.Title;
  if (json.OperatorInfo != null && json.OperatorInfo.Title != null) {
    title = json.OperatorInfo.Title;
  }
  if (title.indexOf("(") > 0) {
    title = title.substring(0, title.indexOf("(")).trimEnd();
  }

  stationInfo += makePElement(
    title +
      " " +
      makeAElement("&hookleftarrow;", "#", "close-detail", "closeDetail"),
    "station-card-title"
  );

  let usageType = "";
  if (json.UsageType != null && json.UsageType.Title != null) {
    usageType += json.UsageType.Title;
  }
  if (usageType != "") {
    usageType = makePElement(usageType, "station-card-usage-type");
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
    address = makePElement(address, "station-card-address");
    stationInfo += address;
  }

  if (json.AddressInfo.ContactTelephone1 != null) {
    stationInfo += makePElement(
      json.AddressInfo.ContactTelephone1,
      "station-card-number"
    );
  }
  if (
    json.AddressInfo.ContactTelephone1 == null &&
    json.AddressInfo.ContactTelephone2 != null
  ) {
    stationInfo += makePElement(
      json.AddressInfo.ContactTelephone2,
      "station-card-number"
    );
  }

  if (json.AddressInfo.RelatedURL != null) {
    stationInfo += makePElement(
      makeAElement(
        "Website",
        json.AddressInfo.RelatedURL,
        "station-card-website-link"
      ),
      "station-card-website"
    );
  }

  const connections = json.Connections;
  const connectionList = makeConnectionList(connections);

  stationInfo += connectionList;
  stationCard.innerHTML = stationInfo;

  //Add marker
  addIndicator([json.AddressInfo.Longitude, json.AddressInfo.Latitude]);
}

function addIndicator(loc) {
  let el = document.createElement("div");
  el.className = "indicator";
  new mapboxgl.Marker(el).setLngLat(loc).addTo(map);
}

function removeIndicator() {
  if (document.querySelector(".indicator")) {
    const oneMarker = document.querySelector(".indicator");
    oneMarker.remove();
  }
}

/**
 * Draw the stations on the map.
 * @param {JSON} json The json file fetched from Open Charge Map
 */
function drawStations(json) {
  // Remove previous search
  while (stationMarkers.length > 0) {
    let stationMarker = stationMarkers.pop();
    stationMarker.remove();
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
      let el = document.createElement("div");
      el.className = "station-marker";
      el.dataset.index = i;
      let marker = new mapboxgl.Marker(el).setLngLat(coord).addTo(map);
      stationMarkers.push(marker);
      let dist = loc.AddressInfo.Distance; // TODO: Looks like the distance retrieved from Open Charge Map is the straight line distance not distance of the route
      if (loc.AddressInfo.DistanceUnit == 2) {
        dist = Math.round((dist / 1.609) * 10) / 10;
      } else {
        dist = Math.round(dist * 10) / 10;
      }

      // TODO: Validation, values might be null or Unknown
      const connections = loc.Connections;
      const connectionList = makeConnectionList(connections);

      // Info and Nav buttons
      const infoButton = makeButtonElement(
        "Info",
        "station-detail station-button station-content",
        null,
        "data-index",
        i
      );
      const navButton = makeButtonElement(
        "Nav",
        "station-nav station-button station-content",
        null,
        "data-index",
        i
      );
      const buttons = makeDivElement(infoButton + navButton, "station-buttons");

      // Title
      const stationTitle = makePElement(title, "station-title");

      // Header = title + buttons
      const stationHeader = makeDivElement(
        stationTitle + buttons,
        "station-header"
      );

      // Distance
      const miles = makePElement(dist + "miles", "distance");

      // Connection wrapper
      const connectionWrapper = makeDivElement(
        connectionList,
        "connection-wrapper"
      );

      // Station Info
      const stationInfo = makeDivElement(
        miles + connectionWrapper,
        "station-info"
      );

      stationList += makeDivElement(stationHeader + stationInfo, "station");
    }
  }
  stations.innerHTML = `${stationList}`;
  // if (!stations.classList.contains("scroll-y")) {
  //   stations.classList.toggle("scroll-y");
  // }
  if (stations.classList.contains("add-padding")) {
    stations.classList.toggle("add-padding");
  }
}

/**
 * Add message to the html element with id "stations" when no stations found.
 */
function stationsNotFound() {
  const stations = document.getElementById("stations");
  stations.innerHTML = makePElement(
    "Stations not found, please make sure your location is correct.",
    "station-not-found-message"
  );
  // if (stations.classList.contains("scroll-y")) {
  //   stations.classList.toggle("scroll-y");
  // }
  if (!stations.classList.contains("add-padding")) {
    stations.classList.toggle("add-padding");
  }
}

/**
 * Find chargers near some location.
 * @param {String} loc Parsed location entered by user.
 * Note: coordinates used by mapbox is (long, lat).
 * @param {Integer} numResult Number of stations to return.
 */
async function getStations(loc, numResult = 10) {
  // Convert the user entered location to coordinates
  const coordQuery = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${loc}.json?access_token=${mapboxgl.accessToken}`,
    { method: "GET" }
  );
  const coordJson = await coordQuery.json();
  if (coordJson.features.length == 0) {
    stationsNotFound();
    return;
  }
  userLocation = coordJson.features[0].center;
  map.setCenter(userLocation);
  let marker = carMarker.pop();
  marker.setLngLat(userLocation);
  carMarker.push(marker);

  const stationQuery = await fetch(
    `https://api.openchargemap.io/v3/poi/?key=${openchargemap_accessToken}&output=json&latitude=${userLocation[1]}&longitude=${userLocation[0]}&maxresults=${numResult}`
  );

  // the json file should contain num_result objects
  stationJson = await stationQuery.json();
  drawStations(stationJson);
}

/**
 * Find chargers near the user entered location
 */
async function search() {
  // Parse the location
  let loc = document
    .getElementById("entered-location")
    .value.trimStart()
    .trimEnd();
  loc = loc.replaceAll(" ", "%20");

  if (
    document.querySelector("#station-bookmark").classList.contains("active")
  ) {
    document.querySelector("#station-bookmark").classList.remove("active");
  }

  // TODO: location validation
  if (loc === "") {
    askLocation();
    return;
  }
  await getStations(loc);
  map.flyTo({
    zoom: 14,
  });
}

map.on("load", () => {
  // make an initial directions request that
  // starts and ends at the same location
  getRoute(userLocation);
  let el = document.createElement("div");
  el.className = "car-marker";
  let marker = new mapboxgl.Marker(el).setLngLat(userLocation).addTo(map);
  carMarker.push(marker);
});

const onPressEnter = (event) => {
  let key = event.key || event.keyCode;
  if (key === "Enter" || key === 13) {
    hideLayout("route");
    removeIndicator();
    hideElement(".station-card");
    hideElement(".instructions");
    search();
    showElement(".stations");
  }
};

const onSearch = document.querySelector(".search");

onSearchInput.addEventListener("keydown", onPressEnter);
onSearchInput.addEventListener("keyup", () => {
  if (onSearchInput.value.trimStart().trimEnd() === "") {
    onSearch.innerText = "📍";
  } else {
    onSearch.innerText = "Go";
  }
});

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("search")) {
    hideLayout("route");
    removeIndicator();
    hideElement(".station-card");
    hideElement(".instructions");
    search();
    showElement(".stations");
  } else if (event.target.classList.contains("station-detail")) {
    const i = event.target.getAttribute("data-index");
    removeIndicator();
    getDetail(i);
    hideElement(".stations");
    showElement(".station-card");
  } else if (event.target.classList.contains("station-marker")) {
    const i = event.target.getAttribute("data-index");
    const loc = stationJson[i];
    const coord = [loc.AddressInfo.Longitude, loc.AddressInfo.Latitude];
    removeIndicator();
    hideElement(".station-card");
    hideElement(".stations");
    addIndicator(coord);
    getRoute(coord);
    showElement(".instructions");
    showLayout("route");
  } else if (event.target.classList.contains("station-nav")) {
    const i = event.target.getAttribute("data-index");
    const loc = stationJson[i];
    const coord = [loc.AddressInfo.Longitude, loc.AddressInfo.Latitude];
    addIndicator(coord);
    getRoute(coord);
    hideElement(".stations");
    showElement(".instructions");
    showLayout("route");
    map.flyTo({
      center: coord,
      zoom: 15,
    });
  } else if (event.target.classList.contains("bm_btn")) {
    showElement(".bookmark_modal");
    const long = Number(event.target.getAttribute("lng"));
    const lati = Number(event.target.getAttribute("lat"));
    document.querySelector(".add_btn").setAttribute("long", long);
    document.querySelector(".add_btn").setAttribute("lati", lati);
    if (event.target.innerText === "★") {
      hideElement(".bookmark_modal");
      removeBookmark([long, lati]);
    }
  } else if (event.target.classList.contains("bookmark_thing")) {
    const name = event.target.innerText.split("\n")[0];
    const storageList = JSON.parse(localStorage.getItem("@locationBM"));
    console.log(storageList);
    for (let s of storageList) {
      if (s.title === name) {
        getRoute(s.location);
        hideElement(".station-bookmark");
        showElement(".instructions");
        showLayout("route");
        map.flyTo({
          center: s.location,
          zoom: 13,
        });
      }
    }
  } else if (event.target.classList.contains("station-list")) {
    bringBookmark();
    if (map.getLayer("route")) hideLayout("route");
  } else if (event.target.classList.contains("close_button")) {
    hideElement(".bookmark_modal");
    document.querySelector(".bookmark_control").value = "";
  } else if (event.target.classList.contains("add_btn")) {
    const long = Number(event.target.getAttribute("long"));
    const lati = Number(event.target.getAttribute("lati"));
    let isEmpty = JSON.parse(localStorage.getItem("@locationBM"));
    settingLocalStorage(isEmpty, [long, lati]);
    hideElement(".bookmark_modal");
    document.querySelector(".bookmark_control").value = "";
    document.querySelector(".bm_btn").innerText = "★";
  }
});

function removeBookmark(location) {
  const isSaved = JSON.parse(localStorage.getItem("@locationBM"));
  const wantToDelete = isSaved.find((e) => {
    return e.location[0] === location[0] && e.location[1] === location[1];
  });
  const deleteIndex = isSaved.indexOf(wantToDelete);
  isSaved.splice(deleteIndex, 1);
  localStorage.setItem("@locationBM", JSON.stringify(isSaved));
  document.querySelector(".bm_btn").innerText = "☆";
}

const closeInstructions = function () {
  removeIndicator();
  hideElement(".instructions");
  showElement(".stations");
  hideLayout("route");
};

const closeDetail = function () {
  removeIndicator();
  hideElement(".station-card");
  showElement(".stations");
  hideLayout("route");
};

// NavigationControl/Direction/ Bookmark

const nav = new mapboxgl.NavigationControl({
  visualizePitch: true,
});
map.addControl(nav, "bottom-right");

function bringBookmark() {
  if (document.querySelector(".instructions")) hideElement(".instructions");
  if (document.querySelector(".station-card")) hideElement(".station-card");
  if (document.querySelector(".stations")) hideElement(".stations");
  showElement(".station-bookmark");
  const bookmark_list = JSON.parse(localStorage.getItem("@locationBM"));
  const bM = document.querySelector(".station-bookmark");
  if (bookmark_list.length !== 0) {
    makeBookmarkList(bookmark_list);
  } else {
    bM.innerHTML = `
      <ul>
        <li>Nothing!</li>
      </ul>`;
  }
}

function makeBookmarkList(array) {
  let list = "";
  let empty = [];
  for (a of array) {
    const title = a.title + makePElement("★", "starShape");
    empty.push(title);
    if (empty.length === array.length)
      list += makeUlElement(empty, "", "bookmark_thing");
  }
  const bookmarkDiv = document.querySelector(".station-bookmark");
  bookmarkDiv.innerHTML = list;
  return list;
}
function settingLocalStorage(storage, [long, lati]) {
  if (storage === null) {
    storage = [];
    const entry = {
      title: document.querySelector(".bookmark_control").value,
      location: [long, lati],
    };
    storage.push(entry);
    localStorage.setItem("@locationBM", JSON.stringify(storage));
  } else if (storage !== null) {
    storage.push({
      title: document.querySelector(".bookmark_control").value,
      location: [long, lati],
    });
    localStorage.setItem("@locationBM", JSON.stringify(storage));
  }
}

// const input = document.querySelector("input[type=text]");
// const overlay = document.querySelector(".overlay");

// function showFloater() {
//   body.classList.add("show-floater");
// }

// function closeFloater() {
//   if (body.classList.contains("show-floater")) {
//     body.classList.remove("show-floater");
//   }
// }
// input.addEventListener("focusin", showFloater);
// overlay.addEventListener("click", closeFloater);
// // =========================
// const bookmarksList = document.querySelector(".bookmarks-list");
// const bookmarkForm = document.querySelector(".bookmark-form");
// const bookmarkInput = bookmarkForm.querySelector("input[type=text]");
// const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
// const apiURL = "https://opengraph.io/api/1.0/site";
// const appID = "5900185f9b8ad70f00f5f8bd";

// fillList(bookmarks);

// function createBookmark(e) {
//   e.preventDefault();

//   if (!bookmarkInput.value) {
//     alert("Gotta add a link!");
//     return;
//   }
//   const url = encodeURIComponent(bookmarkInput.value);
//   // add a new bookmark to the bookmarks

//   fetch(`${apiURL}/${url}?app_id=${appID}`)
//     .then((response) => response.json())
//     .then((data) => {
//       const title = bookmarkInput.value;
//       const bookmark = {
//         title: data.hybridGraph.title,
//         image: data.hybridGraph.image,
//         link: data.hybridGraph.url,
//       };
//       bookmarks.push(bookmark);
//       fillList(bookmarks);
//       storeBookmarks(bookmarks);
//       bookmarkForm.reset();
//     })
//     .catch((error) => {
//       alert(
//         'There was a problem retrieving the information. Please try again. Make sure to include the "http://"'
//       );
//     });
// }

// function fillList(bookmarks = []) {
//   const bookmarksHtml = bookmarks
//     .map((bookmark, i) => {
//       return `
//     <a href="${bookmark.link}" class="bookmark" data-id="${i}" target="_blank">
//       <div class="img" style="background-image:url('${bookmark.image}')"></div>
//       <div class="title">${bookmark.title}</div>
//       <span class="fa fa-trash"></span>
//     </a>
//   `;
//     })
//     .join("");
//   bookmarksList.innerHTML = bookmarksHtml;
// }

// function removeBookmark(e) {
//   e.preventDefault();
//   if (!e.target.matches(".fa-trash")) return;
//   // find the index
//   const index = e.target.parentNode.dataset.id;
//   // remove from the bookmarks using splice
//   bookmarks.splice(index, 1);
//   // fill the list
//   fillList(bookmarks);
//   // store back to localStorage
//   storeBookmarks(bookmarks);
// }

// function storeBookmarks(bookmarks = []) {
//   localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
// }
// bookmarkForm.addEventListener("submit", createBookmark);
// bookmarksList.addEventListener("click", removeBookmark);
