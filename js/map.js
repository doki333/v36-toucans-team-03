const profileBtn = document.querySelector(".profile_info");
const closeBtn = document.querySelector(".close_btn");
const editBtn = document.querySelector(".edit_btn");
const profileUsername = document.querySelector("#profile_username");
const profileModal = document.querySelector(".profile_modal");

profileBtn.addEventListener("click", () => {
  profileModal.classList.add("active");
});

closeBtn.addEventListener("click", () => {
  profileModal.classList.remove("active");
  profileUsername.disabled = true;
  editBtn.classList.remove("editing");
});

editBtn.addEventListener("click", () => {
  profileUsername.toggleAttribute("disabled");
  editBtn.classList.toggle("editing");
});
// Map Location
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FzaGFwb28iLCJhIjoiY2t5Z2p4MDRxMDllMjJwb2x3Z2p3eWlzNCJ9.ZpZ5fmYIFxhljKiga7DSXw';
const map = new mapboxgl.Map({
    container: 'map', 
    style: 'mapbox://styles/mapbox/streets-v11', 

});
// NavigationControl/Direction

const nav = new mapboxgl.NavigationControl({
  visualizePitch: true
})
map.addControl(nav, 'bottom-right')
