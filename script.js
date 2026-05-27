const reportPanel = document.querySelector(".report-panel");
const openButtons = document.querySelectorAll("[data-open-report]");
const closeButtons = document.querySelectorAll("[data-close-report]");
const filterButtons = document.querySelectorAll("[data-filter]");
const sightingCards = document.querySelectorAll("[data-type]");
const useLocationButton = document.querySelector("[data-use-location]");
const proximityList = document.querySelector("[data-proximity-list]");
const locationStatus = document.querySelector("[data-location-status]");
const userDot = document.querySelector("[data-user-dot]");

const singaporeBounds = {
  minLat: 1.22,
  maxLat: 1.47,
  minLng: 103.6,
  maxLng: 104.05,
};

const sightings = [
  { agency: "NEA", type: "nea", title: "Tampines Central hawker perimeter", area: "Tampines Central", lat: 1.3521, lng: 103.9448, time: "18 min" },
  { agency: "TP", type: "tp", title: "Summons activity near bus lane", area: "Serangoon Road", lat: 1.3159, lng: 103.8588, time: "42 min" },
  { agency: "LTA", type: "lta", title: "PMD and shared-path checks", area: "Punggol PCN", lat: 1.3984, lng: 103.9072, time: "1 hr" },
  { agency: "SPF", type: "spf", title: "Public patrol visibility", area: "Orchard event area", lat: 1.3048, lng: 103.8318, time: "2 hr" },
  { agency: "NEA", type: "nea", title: "Smoking checks near interchange exits", area: "Jurong East", lat: 1.3331, lng: 103.7423, time: "3 hr" },
];

function setPanel(open) {
  if (!reportPanel) return;
  reportPanel.classList.toggle("open", open);
  reportPanel.setAttribute("aria-hidden", String(!open));
}

openButtons.forEach((button) => button.addEventListener("click", () => setPanel(true)));
closeButtons.forEach((button) => button.addEventListener("click", () => setPanel(false)));

reportPanel?.addEventListener("click", (event) => {
  if (event.target === reportPanel) setPanel(false);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    sightingCards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.type !== filter;
    });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setPanel(false);
});

function distanceKm(origin, point) {
  const earthRadius = 6371;
  const latDelta = ((point.lat - origin.lat) * Math.PI) / 180;
  const lngDelta = ((point.lng - origin.lng) * Math.PI) / 180;
  const lat1 = (origin.lat * Math.PI) / 180;
  const lat2 = (point.lat * Math.PI) / 180;
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function renderProximity(origin) {
  if (!proximityList) return;
  const sorted = sightings
    .map((sighting) => ({ ...sighting, distance: distanceKm(origin, sighting) }))
    .sort((a, b) => a.distance - b.distance);

  proximityList.innerHTML = sorted
    .map(
      (sighting) => `
        <article class="proximity-item">
          <span class="category-icon ${sighting.type === "tp" ? "red" : sighting.type === "lta" ? "amber" : sighting.type === "spf" ? "blue" : ""}">${sighting.agency}</span>
          <div>
            <h3>${sighting.title}</h3>
            <p>${sighting.area} - ${sighting.time} ago</p>
          </div>
          <strong>${sighting.distance.toFixed(1)} km</strong>
        </article>
      `
    )
    .join("");
}

function positionUserDot(coords) {
  if (!userDot) return;
  const left = ((coords.lng - singaporeBounds.minLng) / (singaporeBounds.maxLng - singaporeBounds.minLng)) * 100;
  const top = 100 - ((coords.lat - singaporeBounds.minLat) / (singaporeBounds.maxLat - singaporeBounds.minLat)) * 100;
  userDot.style.left = `${Math.max(4, Math.min(96, left))}%`;
  userDot.style.top = `${Math.max(4, Math.min(96, top))}%`;
  userDot.hidden = false;
}

const defaultOrigin = { lat: 1.3521, lng: 103.8198 };
renderProximity(defaultOrigin);

useLocationButton?.addEventListener("click", () => {
  if (!navigator.geolocation) {
    if (locationStatus) locationStatus.textContent = "Your browser does not support location access, so central Singapore distances are shown.";
    return;
  }

  if (locationStatus) locationStatus.textContent = "Requesting browser location permission...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const origin = { lat: position.coords.latitude, lng: position.coords.longitude };
      renderProximity(origin);
      positionUserDot({ lat: origin.lat, lng: origin.lng });
      if (locationStatus) locationStatus.textContent = "Distances now use your browser location. Reports remain area-level and approximate.";
    },
    () => {
      if (locationStatus) locationStatus.textContent = "Location access was not enabled. Showing distances from central Singapore instead.";
      renderProximity(defaultOrigin);
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
  );
});
