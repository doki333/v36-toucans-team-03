const logoPage = document.querySelector(".page_wrapper").classList.add("hide");
const profileSection = document
  .querySelector(".header")
  .classList.remove("hide");
const navigationSection = document
  .querySelector(".navigation")
  .classList.remove("hide");
const floating = document.querySelector(".menu").classList.remove("hide");
const mapSection = document.querySelector("#map").classList.remove("hide");

let auth0 = null;

const configureClient = async () => {
  auth0 = await createAuth0Client({
    domain: "dev-85im-vam.us.auth0.com",
    client_id: "flAYL3lteKQBIzRoxo3E7emwuiy13jei",
  });
};

const processLoginState = async () => {
  // Check code and state parameterss
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {
    // Process the login state
    await auth0.handleRedirectCallback();
    // Use replaceState to redirect the user away and remove the querystring parameterss
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

const updateUI = async () => {
  const isAuthenticated = await auth0.isAuthenticated();
  document.getElementsByClassName("signOut_btn").disabled = !isAuthenticated;
  // NEW - add logic to show/hide gated content after authenticationnnn
  if (isAuthenticated) {
    //if user is authenticated, hide the logo page and let map be revealed
    logoPage.classList.add("hide");
    profileSection.classList.remove("hide");
    navigationSection.classList.remove("hide");
    floating.classList.remove("hide");
    mapSection.classList.remove("hide");

    //  UserInfo
    const userInfo = await auth0.getUser();
    document.querySelector(
      "#profile_username"
    ).innerText = `${userInfo.nickname}`;
    document.querySelector("#profile_email").value = `${userInfo.email}`;
    document.querySelector("#user_photo").src = `${userInfo.picture}`;
  } else {
    logoPage.classList.remove("hide");
    profileSection.classList.add("hide");
    navigationSection.classList.add("hide");
    floating.classList.add("hide");
    mapSection.classList.add("hide");
  }
};
window.onload = async () => {
  await configureClient();
  await processLoginState();
  updateUI();
};

const login = async () => {
  await auth0.loginWithRedirect({
    redirect_uri: window.location.href,
  });
};

const logout = () => {
  auth0.logout({
    returnTo: window.location.href,
  });
};

document.querySelector(".start_btn").addEventListener("click", () => {
  login();
});

document.querySelector(".signOut_btn").addEventListener("click", () => {
  logout();
});
