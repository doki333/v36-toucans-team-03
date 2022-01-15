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
