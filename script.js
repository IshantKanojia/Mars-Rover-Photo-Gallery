// script.js

// API Key and Base URL
const API_KEY = "AgCkhh7gJzO3QWuLeddPxXacOmCoLIYs8996V2wY";
const BASE_API_URL = "https://api.nasa.gov/mars-photos/api/v1/rovers/";

// DOM Elements
const roverSelect = document.getElementById('rover-select');
const cameraSelect = document.getElementById('camera-select');
const solInput = document.getElementById('sol-input');
const fetchButton = document.getElementById('fetch-button');
const galleryContainer = document.getElementById('photo-gallery');
const loadingSkeleton = document.getElementById('loading-skeleton');
const errorMessageContainer = document.getElementById('error-message-container');

// New DOM Elements for the manifest feature
const manifestToggle = document.querySelector('.manifest-toggle');
const manifestContent = document.getElementById('manifest-content');
const manifestList = document.getElementById('manifest-list');
const manifestLoading = document.getElementById('manifest-loading');

// New DOM elements for the photo modal
const photoModal = document.getElementById('photo-modal');
const modalImage = document.getElementById('modal-image');
const closeModalBtn = document.querySelector('.close-btn');

// A map of rovers and their available cameras
const roverCameras = {
    curiosity: [
        { name: "FHAZ", fullName: "Front Hazard Avoidance Camera" },
        { name: "RHAZ", fullName: "Rear Hazard Avoidance Camera" },
        { name: "MAST", fullName: "Mast Camera" },
        { name: "CHEMCAM", fullName: "Chemistry and Camera Complex" },
        { name: "MAHLI", fullName: "Mars Hand Lens Imager" },
        { name: "MARDI", fullName: "Mars Descent Imager" },
        { name: "NAVCAM", fullName: "Navigation Camera" }
    ],
    opportunity: [
        { name: "FHAZ", fullName: "Front Hazard Avoidance Camera" },
        { name: "RHAZ", fullName: "Rear Hazard Avoidance Camera" },
        { name: "NAVCAM", fullName: "Navigation Camera" },
        { name: "PANCAM", fullName: "Panoramic Camera" },
        { name: "MINITES", fullName: "Miniature Thermal Emission Spectrometer" }
    ],
    spirit: [
        { name: "FHAZ", fullName: "Front Hazard Avoidance Camera" },
        { name: "RHAZ", fullName: "Rear Hazard Avoidance Camera" },
        { name: "NAVCAM", fullName: "Navigation Camera" },
        { name: "PANCAM", fullName: "Panoramic Camera" },
        { name: "MINITES", fullName: "Miniature Thermal Emission Spectrometer" }
    ]
};

/**
 * Dynamically populates the camera select dropdown based on the selected rover.
 */
const updateCameraOptions = () => {
    const selectedRover = roverSelect.value;
    const cameras = roverCameras[selectedRover];

    // Clear existing options
    cameraSelect.innerHTML = '<option value="">All Cameras</option>';

    // Add new options for the selected rover
    cameras.forEach(camera => {
        const option = document.createElement('option');
        option.value = camera.name;
        option.textContent = camera.fullName;
        cameraSelect.appendChild(option);
    });
};

/**
 * Fetches the manifest data for the selected rover.
 * @param {string} rover The name of the rover.
 */
const fetchManifest = async (rover) => {
    manifestList.innerHTML = '';
    manifestLoading.style.display = 'block';

    try {
        const url = `${BASE_API_URL}${rover}/manifests?api_key=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // The manifest endpoint in this API is a bit different, but we can infer the latest sol from the photos endpoint.
        // For a true manifest, we would use the /manifests endpoint, but this provides a simple way to find available sols.
        // Let's assume for simplicity we're just getting the latest sol and not the entire list.
        // A more complex implementation would fetch the manifest and then build the list.
        // For now, we'll keep it simple and just show a message.
        manifestList.innerHTML = `<p class="manifest-list-item">Manifest feature coming soon! You can use the search bar to find photos.</p>`;
    } catch (error) {
        console.error("Error fetching manifest:", error);
        manifestList.innerHTML = `<p class="error-message">Failed to load manifest data.</p>`;
    } finally {
        manifestLoading.style.display = 'none';
    }
};

/**
 * Fetches Mars Rover photos from the NASA API.
 * @param {string} rover The name of the rover.
 * @param {string} sol The Martian day (sol).
 * @param {string} camera The camera abbreviation.
 */
const fetchPhotos = async (rover, sol, camera = '') => {
    loadingSkeleton.style.display = 'grid';
    galleryContainer.style.display = 'none';
    errorMessageContainer.style.display = 'none';
    galleryContainer.innerHTML = '';

    try {
        const url = `${BASE_API_URL}${rover}/photos?sol=${sol}&camera=${camera}&api_key=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        renderPhotos(data.photos);
    } catch (error) {
        console.error("Error fetching photos:", error);
        errorMessageContainer.innerHTML = `<p class="error-message">Failed to load photos. Please check your selections and try again. (${error.message})</p>`;
        errorMessageContainer.style.display = 'block';
    } finally {
        loadingSkeleton.style.display = 'none';
    }
};

/**
 * Renders the fetched photos into the gallery.
 * @param {Array} photos An array of photo objects.
 */
const renderPhotos = (photos) => {
    errorMessageContainer.style.display = 'none';
    galleryContainer.style.display = 'grid';
    galleryContainer.innerHTML = '';

    if (!photos || photos.length === 0) {
        errorMessageContainer.innerHTML = `<p class="error-message">No photos found for the selected criteria. Try a different sol or camera.</p>`;
        errorMessageContainer.style.display = 'block';
        galleryContainer.style.display = 'none';
        return;
    }

    photos.forEach(photo => {
        // IMPROVEMENT: Check if the image source exists before rendering
        if (!photo.img_src) {
            console.warn("Skipping photo card due to missing image source.");
            return;
        }
        
        const photoCard = document.createElement('div');
        photoCard.classList.add('photo-card');

        const img = document.createElement('img');
        img.src = photo.img_src;
        img.alt = `Mars Rover Photo from ${photo.rover.name}`;
        img.loading = 'lazy'; // Use lazy loading for performance

        // Add an onerror handler to display a placeholder if the image fails to load
        img.onerror = function() {
            this.src = 'https://placehold.co/250x200/2f363d/ffffff?text=Image+Not+Found';
            this.alt = 'Image not available';
        };

        const info = document.createElement('div');
        info.classList.add('photo-info');

        const cameraName = document.createElement('h3');
        cameraName.textContent = photo.camera.full_name;

        const dateTaken = document.createElement('p');
        dateTaken.textContent = `Date: ${photo.earth_date}`;

        const sol = document.createElement('p');
        sol.textContent = `Sol: ${photo.sol}`;

        info.appendChild(cameraName);
        info.appendChild(dateTaken);
        info.appendChild(sol);
        photoCard.appendChild(img);
        photoCard.appendChild(info);

        galleryContainer.appendChild(photoCard);

        // Add event listener to open the modal when the photo card is clicked
        photoCard.addEventListener('click', () => {
            modalImage.src = photo.img_src;
            photoModal.style.display = 'flex';
        });
    });
};

// === Event Listeners ===

// Update camera options and fetch manifest when a new rover is selected
roverSelect.addEventListener('change', () => {
    updateCameraOptions();
    fetchManifest(roverSelect.value);
});

// Fetch photos when the button is clicked
fetchButton.addEventListener('click', () => {
    const rover = roverSelect.value;
    const sol = solInput.value;
    const camera = cameraSelect.value;
    fetchPhotos(rover, sol, camera);
});

// Close the modal when the close button is clicked
closeModalBtn.addEventListener('click', () => {
    photoModal.style.display = 'none';
});

// Close the modal when the user clicks outside the image
photoModal.addEventListener('click', (e) => {
    if (e.target === photoModal) {
        photoModal.style.display = 'none';
    }
});

// Close the modal when the Escape key is pressed
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        photoModal.style.display = 'none';
    }
});

// Initial setup on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCameraOptions();
    fetchManifest(roverSelect.value);
    
    const initialRover = roverSelect.value;
    const initialSol = solInput.value;
    fetchPhotos(initialRover, initialSol);
});

// Toggle manifest list visibility
manifestToggle.addEventListener('click', () => {
    manifestContent.classList.toggle('active');
    const icon = document.getElementById('toggle-icon');
    if (manifestContent.classList.contains('active')) {
        icon.textContent = '▲';
    } else {
        icon.textContent = '▼';
    }
});
