// Mapsy Client Application Logic
// Handles interactive mapping, filtering, search query parsing, reviews, and community validations.

// Default center: BINUS University Bandung (Paskal)
const KAMPUS_BINUS_COORDS = { lat: -6.9151, lng: 107.5935 };
const BASE_API_URL = window.location.origin; // Same origin hosting

// Application State
let appState = {
    user: JSON.parse(localStorage.getItem('sm_user')) || null,
    token: localStorage.getItem('sm_token') || null,
    map: null,
    markers: [],
    places: [],
    activePlace: null,
    selectedTags: [],
    selectedPrice: null,
    searchActive: false,
    userLocation: KAMPUS_BINUS_COORDS,
    ratingSelection: 5
};

// Initialize application on load
document.addEventListener('DOMContentLoaded', () => {
    try { initLucideIcons(); } catch (e) { console.error("Error loading Lucide icons:", e); }
    try { initMap(); } catch (e) { console.error("Error initializing Leaflet map:", e); }
    try { initAuthUI(); } catch (e) { console.error("Error initializing Auth UI:", e); }
    try { initEventListeners(); } catch (e) { console.error("Error binding event listeners:", e); }
    try { fetchPlaces(); } catch (e) { console.error("Error fetching places:", e); }
});

// Initialize Lucide Icons
function initLucideIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Show toast notifications
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastMsg.textContent = message;
    
    // Set icon based on notification type
    if (type === 'success') {
        toastIcon.setAttribute('data-lucide', 'check-circle');
        toastIcon.className = 'w-4 h-4 text-emerald-400 flex-shrink-0';
    } else if (type === 'error') {
        toastIcon.setAttribute('data-lucide', 'alert-circle');
        toastIcon.className = 'w-4 h-4 text-rose-400 flex-shrink-0';
    } else {
        toastIcon.setAttribute('data-lucide', 'info');
        toastIcon.className = 'w-4 h-4 text-blue-400 flex-shrink-0';
    }
    
    initLucideIcons();

    toast.classList.remove('hidden');
    // Force reflow
    toast.offsetHeight;
    
    // Slide up
    toast.classList.remove('translate-y-12');
    toast.classList.add('translate-y-0');

    setTimeout(() => {
        toast.classList.add('translate-y-12');
        toast.classList.remove('translate-y-0');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Initialize Leaflet Map centered on Bandung ITB
function initMap() {
    if (typeof L === 'undefined') {
        console.warn("Leaflet (L) is not loaded. Map initialization skipped.");
        return;
    }
    // Attempt to get user's actual location if they allow it
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                appState.userLocation = { lat: userLat, lng: userLng };
                if (appState.map) {
                    appState.map.setView([userLat, userLng], 15);
                    
                    // Create or move user location marker
                    updateUserLocationMarker(userLat, userLng);
                    
                    // Fetch places around new location
                    fetchPlaces();
                }
            },
            (error) => {
                console.log("Geolocation fallback to default coords:", error.message);
            },
            { enableHighAccuracy: true }
        );
    }

    appState.map = L.map('map', {
        zoomControl: false // Disable default zoom control to reposition it
    }).setView([appState.userLocation.lat, appState.userLocation.lng], 15);

    // Reposition zoom control to top right (avoiding floating button overlap)
    L.control.zoom({
        position: 'topright'
    }).addTo(appState.map);

    // OpenStreetMap default tiles (Completely free, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(appState.map);

    // Add a marker for Campus Hub center
    const campusIcon = L.divIcon({
        className: 'campus-marker',
        html: `<div class="w-8 h-8 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center animate-ping absolute"></div>
               <div class="w-4 h-4 rounded-full bg-indigo-500 border border-white relative shadow-lg flex items-center justify-center">
                   <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
               </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
    
    L.marker([KAMPUS_BINUS_COORDS.lat, KAMPUS_BINUS_COORDS.lng], { icon: campusIcon })
        .addTo(appState.map)
        .bindTooltip("Kampus BINUS Bandung", { permanent: false, direction: 'top' });
}

// Fetch all places from backend, applying quick filter tags/price if active
async function fetchPlaces() {
    try {
        const center = appState.map ? appState.map.getCenter() : appState.userLocation;
        let url = `${BASE_API_URL}/api/places?lat=${center.lat}&lng=${center.lng}&radius=8000`;
        
        if (appState.selectedTags.length > 0) {
            url += `&tags=${encodeURIComponent(appState.selectedTags.join(','))}`;
        }
        if (appState.selectedPrice !== null) {
            url += `&price=${appState.selectedPrice}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
            appState.places = data.places;
            renderMarkers();

        } else {
            showToast("Gagal memuat daftar lokasi.", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Terjadi kesalahan koneksi database.", "error");
    }
}

// Unsplash curated images dictionary mapping for high-quality visuals
const CATEGORY_IMAGES = {
    coffee: [
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80"
    ],
    food: [
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80"
    ],
    print: [
        "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=500&q=80"
    ],
    library: [
        "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=500&q=80"
    ],
    default: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=500&q=80"
};

function getPlaceImageUrl(place) {
    if (place.image_url && place.image_url.trim().startsWith("http")) {
        return place.image_url;
    }
    
    // Fallback based on name keyword and tag mapping
    const nameLower = place.name.toLowerCase();
    const tagsCombined = place.tags ? place.tags.map(t => t.name.toLowerCase()).join(" ") : "";
    
    // Helper to get image based on index to keep it deterministic per place
    const getDeterministicImage = (list, id) => {
        return list[id % list.length];
    };
    
    if (nameLower.includes("kopi") || nameLower.includes("coffee") || nameLower.includes("cafe") || nameLower.includes("kafe") || tagsCombined.includes("wi-fi")) {
        return getDeterministicImage(CATEGORY_IMAGES.coffee, place.id);
    }
    if (nameLower.includes("nasi") || nameLower.includes("warung") || nameLower.includes("makan") || nameLower.includes("mcd") || nameLower.includes("kfc") || nameLower.includes("kantin") || tagsCombined.includes("affordable") || nameLower.includes("warmindo")) {
        return getDeterministicImage(CATEGORY_IMAGES.food, place.id);
    }
    if (nameLower.includes("print") || nameLower.includes("fotocopy") || nameLower.includes("jilid") || tagsCombined.includes("printer")) {
        return getDeterministicImage(CATEGORY_IMAGES.print, place.id);
    }
    if (nameLower.includes("buku") || nameLower.includes("perpustakaan") || nameLower.includes("library") || nameLower.includes("kineruku") || tagsCombined.includes("quiet")) {
        return getDeterministicImage(CATEGORY_IMAGES.library, place.id);
    }
    
    return CATEGORY_IMAGES.default;
}

function calculateMatchScore(place) {
    let score = 0;
    let factors = 0;

    // 1. Rating contribution (Weight: 30%)
    const rating = parseFloat(place.avg_rating) || 4.0;
    score += (rating / 5) * 30;
    factors += 30;

    // 2. Price Match contribution (Weight: 20%)
    let priceScore = 0;
    if (appState.selectedPrice !== null) {
        if (place.avg_price_tier <= appState.selectedPrice) {
            priceScore = 100;
        } else {
            priceScore = Math.max(0, 100 - (place.avg_price_tier - appState.selectedPrice) * 35);
        }
    } else {
        if (place.avg_price_tier === 1) priceScore = 100;
        else if (place.avg_price_tier === 2) priceScore = 85;
        else if (place.avg_price_tier === 3) priceScore = 60;
        else priceScore = 40;
    }
    score += (priceScore / 100) * 20;
    factors += 20;

    // 3. Distance contribution (Weight: 20%)
    let distanceScore = 40;
    if (place.distance_meters !== null && place.distance_meters !== undefined) {
        const dist = place.distance_meters;
        if (dist <= 1000) distanceScore = 100;
        else if (dist <= 3000) distanceScore = 85;
        else if (dist <= 5000) distanceScore = 65;
    } else {
        distanceScore = 75;
    }
    score += (distanceScore / 100) * 20;
    factors += 20;

    // 4. Tag Match contribution (Weight: 30%)
    let tagScore = 70;
    if (appState.selectedTags.length > 0) {
        const matches = appState.selectedTags.filter(filterTag => 
            place.tags && place.tags.some(t => t.name.toLowerCase() === filterTag.toLowerCase())
        );
        tagScore = (matches.length / appState.selectedTags.length) * 100;
    } else {
        if (place.tags && place.tags.length > 0) {
            const sumConfidence = place.tags.reduce((acc, t) => acc + (t.confidence || 0), 0);
            tagScore = Math.min(100, 70 + sumConfidence * 5);
        }
    }
    score += (tagScore / 100) * 30;
    factors += 30;

    const finalPercentage = Math.round((score / factors) * 100);
    return Math.min(100, Math.max(30, finalPercentage));
}



// Render markers on the map
function renderMarkers() {
    if (typeof L === 'undefined' || !appState.map) return;
    // Clear existing markers
    appState.markers.forEach(m => appState.map.removeLayer(m));
    appState.markers = [];

    appState.places.forEach(place => {
        // Create custom divIcon for pins
        const isActive = appState.activePlace && appState.activePlace.id === place.id;
        const randomDelay = (Math.random() * 2).toFixed(1);
        const iconHtml = `
            <div class="custom-pin-wrapper">
                <div class="custom-pin ${isActive ? 'active' : ''}"></div>
                <div class="custom-pin-pulse" style="animation-delay: -${randomDelay}s"></div>
            </div>
        `;
        
        const pinIcon = L.divIcon({
            className: 'custom-div-icon',
            html: iconHtml,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

        const marker = L.marker([place.latitude, place.longitude], { icon: pinIcon })
            .addTo(appState.map);

        // Tooltip showing name
        marker.bindTooltip(`
            <div class="bg-slate-900 border border-slate-800 text-slate-100 p-1.5 rounded-lg text-xs font-semibold">
                ${place.name}
            </div>
        `, { direction: 'top', offset: [0, -30], opacity: 0.95 });

        // Click handler to load details
        marker.on('click', () => {
            selectPlace(place.id, marker);
        });

        appState.markers.push(marker);
    });
}

// Handle query search
async function handleQuerySearch(query) {
    if (!query.trim()) {
        appState.searchActive = false;
        document.getElementById('resultsCountBanner').classList.add('hidden');
        resetQuickBadges();
        fetchPlaces();
        return;
    }

    try {
        const res = await fetch(`${BASE_API_URL}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                center: appState.map ? appState.map.getCenter() : appState.userLocation,
                radius: 8000
            })
        });
        const data = await res.json();

        if (data.success) {
            appState.places = data.places;
            appState.searchActive = true;
            
            // Highlight parsed tags in quick badges
            updateQuickBadgesFromParsed(data.parsed.tags, data.parsed.maxPriceTier);

            // Render search results
            renderMarkers();

            
            // Update results banner
            const banner = document.getElementById('resultsCountBanner');
            const bannerText = document.getElementById('resultsCountText');
            bannerText.textContent = `Ditemukan ${data.places.length} lokasi cocok`;
            banner.classList.remove('hidden');
            
            if (data.places.length > 0) {
                // Fly to the first search result with a closer zoom
                const first = data.places[0];
                appState.map.flyTo([first.latitude, first.longitude], 17, { duration: 1.5 });
                
                // Automatically open the details sheet (reviews, description)
                setTimeout(() => {
                    selectPlace(first.id);
                }, 800); // Slight delay so the map movement feels natural before sheet pops up

                showToast(`Pencarian berhasil mengekstrak tag: [${data.parsed.tags.join(', ')}]`, "success");
            } else {
                showToast("Tidak ada lokasi yang sesuai dengan kata kunci.", "info");
            }
        } else {
            showToast("Pencarian gagal.", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Koneksi ke server terputus.", "error");
    }
}

// Update the badge button UI based on search parsing results
function updateQuickBadgesFromParsed(tags, priceTier) {
    appState.selectedTags = [...tags];
    appState.selectedPrice = priceTier;

    const badges = document.querySelectorAll('.badge-btn');
    badges.forEach(btn => {
        const btnTag = btn.getAttribute('data-tag');
        const btnPrice = btn.getAttribute('data-price');

        let isActive = false;
        if (btnTag && tags.includes(btnTag)) {
            isActive = true;
        }
        if (btnPrice && priceTier !== null && parseInt(btnPrice) === priceTier) {
            isActive = true;
        }

        if (isActive) {
            btn.classList.remove('bg-slate-900/80', 'border-slate-800', 'text-slate-300');
            btn.classList.add('bg-blue-600', 'border-blue-500', 'text-white');
        } else {
            btn.classList.add('bg-slate-900/80', 'border-slate-800', 'text-slate-300');
            btn.classList.remove('bg-blue-600', 'border-blue-500', 'text-white');
        }
    });
}

// Reset all quick badge button styles
function resetQuickBadges() {
    appState.selectedTags = [];
    appState.selectedPrice = null;
    const badges = document.querySelectorAll('.badge-btn');
    badges.forEach(btn => {
        btn.classList.add('bg-slate-900/80', 'border-slate-800', 'text-slate-300');
        btn.classList.remove('bg-blue-600', 'border-blue-500', 'text-white');
    });
}

// Handle Place Selection and Load details
async function selectPlace(placeId, marker = null) {
    try {
        const res = await fetch(`${BASE_API_URL}/api/places/${placeId}`);
        const data = await res.json();
        
        if (data.success) {
            appState.activePlace = data.place;
            
            // Mark all markers as inactive and active marker as active
            const pins = document.querySelectorAll('.custom-pin');
            pins.forEach(pin => pin.classList.remove('active'));
            if (marker) {
                const element = marker.getElement();
                if (element) {
                    const pin = element.querySelector('.custom-pin');
                    if (pin) pin.classList.add('active');
                }
            }

            // Populate details bottom sheet
            populateBottomSheet(data.place);
            
            // Show bottom sheet
            showBottomSheet();
        } else {
            showToast("Gagal memuat rincian lokasi.", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Koneksi gagal saat memuat rincian.", "error");
    }
}

// Populate Bottom Sheet UI Elements
function populateBottomSheet(place) {
    // Calc distance (rough text or straight calculation)
    let distanceMeters = 0;
    if (typeof L !== 'undefined' && place.latitude) {
        distanceMeters = Math.round(
            L.latLng(appState.userLocation.lat, appState.userLocation.lng).distanceTo(L.latLng(place.latitude, place.longitude))
        );
    }

    const coverImg = document.getElementById('placeCoverImg');
    if (coverImg) {
        coverImg.src = getPlaceImageUrl(place);
    }
    document.getElementById('placeName').textContent = place.name;
    document.getElementById('placeDistance').textContent = `${distanceMeters} m dari Lokasi Anda`;
    document.getElementById('placeDescription').textContent = place.description;
    
    // Rating
    document.getElementById('placeRatingVal').textContent = place.avg_rating > 0 ? place.avg_rating : "0.0";
    document.getElementById('placeReviewCount').textContent = `${place.reviews.length} ulasan`;

    // Price tier symbols
    const priceText = "Rp ".repeat(place.avg_price_tier || 1).trim();
    const priceTier = document.getElementById('placePriceTier');
    priceTier.textContent = priceText;
    // Set color based on price tier
    priceTier.className = "text-xs font-extrabold px-2 py-0.5 rounded-md ";
    if (place.avg_price_tier === 1) {
        priceTier.classList.add("text-emerald-400", "bg-emerald-950/50", "border", "border-emerald-900/30");
    } else if (place.avg_price_tier === 2) {
        priceTier.classList.add("text-blue-400", "bg-blue-950/50", "border", "border-blue-900/30");
    } else {
        priceTier.classList.add("text-amber-400", "bg-amber-950/50", "border", "border-amber-900/30");
    }

    // Google Maps Navigation URL (Using place name so Google Maps shows the actual place, not just coordinates)
    const searchQuery = encodeURIComponent(place.name + ' Bandung');
    document.getElementById('navGoogleBtn').href = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;

    // Load Tags with vote counts
    const tagListContainer = document.getElementById('placeTagList');
    tagListContainer.innerHTML = '';

    // Standard list of tags with their corresponding display names and emojis
    const tagRegistry = [
        { id: 1, name: 'Quiet', label: 'Quiet (Tenang)', emoji: '🤫' },
        { id: 2, name: 'Good Wi-Fi', label: 'Good Wi-Fi', emoji: '📶' },
        { id: 3, name: 'Many charging ports', label: 'Many charging ports (Banyak Colokan)', emoji: '🔌' },
        { id: 4, name: '24 hours', label: '24 Hours (Buka 24 Jam)', emoji: '⏰' },
        { id: 5, name: 'Printer nearby', label: 'Printer nearby (Dekat Print/FC)', emoji: '🖨️' }
    ];

    tagRegistry.forEach(registryTag => {
        // Find if this tag exists in the place's active tags
        const activeTag = place.tags.find(t => t.name.toLowerCase() === registryTag.name.toLowerCase());
        const confidence = activeTag ? activeTag.confidence : 0;
        
        const row = document.createElement('div');
        row.className = `flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            confidence > 0 
                ? 'bg-slate-900/40 border-slate-800 text-slate-100' 
                : 'bg-slate-950/20 border-slate-900/50 text-slate-400'
        }`;
        
        row.innerHTML = `
            <div class="flex items-center gap-2 text-xs font-semibold">
                <span class="text-base">${registryTag.emoji}</span>
                <span>${registryTag.label}</span>
                ${confidence > 0 ? `<span class="bg-blue-950/50 text-blue-400 border border-blue-900/40 text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ml-1">${confidence} upvotes</span>` : ''}
            </div>
            
            <div class="flex items-center gap-1.5">
                <button onclick="voteTag(${place.id}, ${registryTag.id}, 'up')" class="p-1.5 hover:bg-slate-800 active:scale-90 text-slate-400 hover:text-emerald-400 rounded-lg transition-all" title="Upvote tag">
                    <i data-lucide="thumbs-up" class="w-4 h-4"></i>
                </button>
                <button onclick="voteTag(${place.id}, ${registryTag.id}, 'down')" class="p-1.5 hover:bg-slate-800 active:scale-90 text-slate-400 hover:text-rose-400 rounded-lg transition-all" title="Downvote tag">
                    <i data-lucide="thumbs-down" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        tagListContainer.appendChild(row);
    });

    // Populate Reviews
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = '';

    if (place.reviews && place.reviews.length > 0) {
        place.reviews.forEach(review => {
            const dateStr = new Date(review.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const card = document.createElement('div');
            card.className = "bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex flex-col gap-2";
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <span class="font-bold text-xs text-slate-200">${review.username}</span>
                        ${review.campus ? `<span class="text-[9px] bg-slate-800 text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded ml-1.5">${review.campus}</span>` : ''}
                    </div>
                    <span class="text-[10px] text-slate-500">${dateStr}</span>
                </div>
                <div class="flex items-center text-amber-500 gap-0.5">
                    ${`<i data-lucide="star" class="w-3 h-3 fill-current"></i>`.repeat(review.rating)}
                    ${`<i data-lucide="star" class="w-3 h-3 text-slate-700"></i>`.repeat(5 - review.rating)}
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">${review.comment}</p>
            `;
            reviewsList.appendChild(card);
        });
    } else {
        reviewsList.innerHTML = `
            <div class="text-center py-6 border border-dashed border-slate-850 rounded-xl">
                <i data-lucide="message-square" class="w-8 h-8 text-slate-600 mx-auto mb-2"></i>
                <p class="text-xs text-slate-500 font-semibold">Belum ada ulasan mahasiswa.</p>
                <p class="text-[10px] text-slate-600">Jadilah yang pertama untuk membagikan info!</p>
            </div>
        `;
    }

    initLucideIcons();
}

// Show/Hide Bottom Sheet
function showBottomSheet() {
    const sheet = document.getElementById('bottomSheet');
    if (window.innerWidth >= 768) {
        // Desktop left-in
        sheet.classList.remove('md:-translate-x-[460px]');
    } else {
        // Mobile bottom-up
        sheet.classList.remove('translate-y-full');
    }
}

function hideBottomSheet() {
    const sheet = document.getElementById('bottomSheet');
    if (window.innerWidth >= 768) {
        sheet.classList.add('md:-translate-x-[460px]');
    } else {
        sheet.classList.add('translate-y-full');
    }
    
    // De-activate marker pin
    const pins = document.querySelectorAll('.custom-pin');
    pins.forEach(pin => pin.classList.remove('active'));
    appState.activePlace = null;
}

// Handle Tag validation Voting
async function voteTag(placeId, tagId, direction) {
    if (!appState.user) {
        showToast("Silakan masuk (login) terlebih dahulu untuk memvalidasi tag.", "info");
        openAuthModal();
        return;
    }

    try {
        const res = await fetch(`${BASE_API_URL}/api/places/${placeId}/tags/${tagId}/vote`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({
                vote: direction,
                userId: appState.user.id
            })
        });
        const data = await res.json();
        
        if (data.success) {
            showToast("Terima kasih! Suara Anda berhasil disimpan.", "success");
            // Refresh details
            selectPlace(placeId);
        } else {
            showToast(data.error || "Gagal menyimpan validasi.", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Terjadi kesalahan jaringan.", "error");
    }
}

// Auth Dialog functions
function initAuthUI() {
    const btnInitials = document.getElementById('authBtnInitials');
    if (appState.user) {
        if(btnInitials) {
            btnInitials.textContent = appState.user.username.charAt(0).toUpperCase();
            btnInitials.classList.remove('hidden');
        }
    } else {
        if(btnInitials) {
            btnInitials.classList.add('hidden');
        }
    }
}

function openAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
}

function toggleAuthForms(toRegister = true) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const title = document.getElementById('authModalTitle');
    const desc = document.getElementById('authModalDesc');

    if (toRegister) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        title.textContent = "Daftar Mapsy";
        desc.textContent = "Daftar untuk berkontribusi validasi info & review mahasiswa.";
    } else {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        title.textContent = "Masuk ke Mapsy";
        desc.textContent = "Dapatkan akses untuk memberikan ulasan & validasi tag lokasi.";
    }
}

// Handle User Logout
function handleLogout() {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
        localStorage.removeItem('sm_user');
        localStorage.removeItem('sm_token');
        appState.user = null;
        appState.token = null;
        initAuthUI();
        showToast("Anda telah keluar.", "info");
        
        // Hide review form if active
        document.getElementById('reviewForm').classList.add('hidden');
        
        // Refresh bottom sheet details to update upvote capabilities
        if (appState.activePlace) {
            selectPlace(appState.activePlace.id);
        }
    }
}

// Star Rating rating UI bindings
function updateStarRatingUI(value) {
    appState.ratingSelection = value;
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach((star, index) => {
        if (index < value) {
            star.classList.add('text-amber-400');
            star.classList.remove('text-slate-600');
        } else {
            star.classList.remove('text-amber-400');
            star.classList.add('text-slate-600');
        }
    });
}

// Add user location marker on the map
function updateUserLocationMarker(lat, lng) {
    if (!appState.userMarker) {
        // Create a blue dot for the user's location
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)] relative">
                     <div class="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                   </div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        appState.userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(appState.map);
        appState.userMarker.bindTooltip("Lokasi Anda", { permanent: false, direction: 'top' });
    } else {
        // Move existing marker
        appState.userMarker.setLatLng([lat, lng]);
    }
}

// Locate Me button click handler
function handleLocateMe() {
    const btn = document.getElementById('fabLocateMe');
    // Add loading animation
    btn.innerHTML = '<i data-lucide="loader-2" class="w-6 h-6 animate-spin text-blue-400"></i>';
    initLucideIcons();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                appState.userLocation = { lat: userLat, lng: userLng };
                if (appState.map) {
                    appState.map.setView([userLat, userLng], 15);
                    updateUserLocationMarker(userLat, userLng);
                    fetchPlaces(); // Fetch places around the new location
                }
                
                // Restore button icon
                btn.innerHTML = '<i data-lucide="crosshair" class="w-6 h-6"></i>';
                initLucideIcons();
                showToast("Lokasi berhasil diperbarui!", "success");
            },
            (error) => {
                console.error(error);
                btn.innerHTML = '<i data-lucide="crosshair" class="w-6 h-6"></i>';
                initLucideIcons();
                showToast("Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin diberikan.", "error");
            },
            { enableHighAccuracy: true }
        );
    } else {
        btn.innerHTML = '<i data-lucide="crosshair" class="w-6 h-6"></i>';
        initLucideIcons();
        showToast("Browser tidak mendukung GPS.", "error");
    }
}

// Bind all Event Listeners
function initEventListeners() {
    // Locate Me button
    const locateBtn = document.getElementById('fabLocateMe');
    if (locateBtn) {
        locateBtn.addEventListener('click', handleLocateMe);
    }

    // Close sheet
    document.getElementById('closeSheetBtn').addEventListener('click', hideBottomSheet);



    // Search bar submit
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('searchInput');
        handleQuerySearch(input.value);
    });

    // Clear search
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        handleQuerySearch('');
    });

    // --- ADD PLACE MODAL LOGIC (UGC) ---
    document.getElementById('fabAddPlace').addEventListener('click', () => {
        if (!appState.user) {
            showToast("Harap login terlebih dahulu untuk menambah tempat baru.", "info");
            openAuthModal();
            return;
        }
        document.getElementById('addPlaceModal').classList.add('active');
    });

    document.getElementById('closeAddPlaceModal').addEventListener('click', () => {
        document.getElementById('addPlaceModal').classList.remove('active');
    });

    document.getElementById('addPlaceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!appState.user || !appState.token) {
            showToast("Silakan login terlebih dahulu untuk menambah tempat baru.", "info");
            openAuthModal();
            return;
        }

        const name = document.getElementById('newPlaceName').value.trim();
        const desc = document.getElementById('newPlaceDesc').value.trim();
        const tag = document.getElementById('newPlaceTag').value;
        const priceEl = document.getElementById('newPlacePrice');
        const avgPriceTier = priceEl ? parseInt(priceEl.value) : (tag.includes("Affordable") ? 1 : 2);
        const imgEl = document.getElementById('newPlaceImageUrl');
        const imageUrl = imgEl ? imgEl.value.trim() : "";
        
        const center = appState.map.getCenter();

        try {
            const res = await fetch(`${BASE_API_URL}/api/places`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${appState.token}`
                },
                body: JSON.stringify({
                    name,
                    description: desc,
                    latitude: center.lat,
                    longitude: center.lng,
                    avgPriceTier,
                    tagName: tag,
                    imageUrl
                })
            });
            const data = await res.json();

            if (data.success) {
                showToast("Tempat baru berhasil dikontribusikan!", "success");
                
                // Reset and close
                document.getElementById('addPlaceForm').reset();
                document.getElementById('addPlaceModal').classList.remove('active');

                // Reload places from server
                await fetchPlaces();

                // Select the newly added place
                if (data.place && data.place.id) {
                    // Pan map to new place coordinates
                    appState.map.flyTo([center.lat, center.lng], 16, { duration: 1.2 });
                    setTimeout(() => {
                        selectPlace(data.place.id);
                    }, 1300);
                }
            } else {
                showToast(data.error || "Gagal menambahkan tempat baru.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Terjadi kesalahan koneksi database.", "error");
        }
    });

    // Quick filter badges click
    const badges = document.querySelectorAll('.badge-btn');
    badges.forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.getAttribute('data-tag');
            const price = btn.getAttribute('data-price');

            // If badge is already selected, unselect it
            if (price) {
                const targetPrice = parseInt(price);
                if (appState.selectedPrice === targetPrice) {
                    appState.selectedPrice = null;
                    btn.classList.add('bg-slate-900/80', 'border-slate-800', 'text-slate-300');
                    btn.classList.remove('bg-blue-600', 'border-blue-500', 'text-white');
                } else {
                    appState.selectedPrice = targetPrice;
                    // remove other price highlights
                    document.querySelectorAll('.badge-btn[data-price]').forEach(pb => {
                        pb.classList.add('bg-slate-900/80', 'border-slate-800', 'text-slate-300');
                        pb.classList.remove('bg-blue-600', 'border-blue-500', 'text-white');
                    });
                    btn.classList.remove('bg-slate-900/80', 'border-slate-800', 'text-slate-300');
                    btn.classList.add('bg-blue-600', 'border-blue-500', 'text-white');
                }
            } else {
                const idx = appState.selectedTags.indexOf(tag);
                if (idx > -1) {
                    appState.selectedTags.splice(idx, 1);
                    btn.classList.add('bg-slate-900/80', 'border-slate-800', 'text-slate-300');
                    btn.classList.remove('bg-blue-600', 'border-blue-500', 'text-white');
                } else {
                    appState.selectedTags.push(tag);
                    btn.classList.remove('bg-slate-900/80', 'border-slate-800', 'text-slate-300');
                    btn.classList.add('bg-blue-600', 'border-blue-500', 'text-white');
                }
            }

            fetchPlaces();
        });
    });

    // Header Auth Button
    document.getElementById('authBtn').addEventListener('click', () => {
        if (appState.user) {
            handleLogout();
        } else {
            openAuthModal();
        }
    });

    // Close Auth modal
    document.getElementById('closeAuthModal').addEventListener('click', closeAuthModal);
    
    // Toggle Auth modes
    document.getElementById('toggleAuthMode').addEventListener('click', () => toggleAuthForms(true));
    document.getElementById('toggleAuthModeReg').addEventListener('click', () => toggleAuthForms(false));

    // Submit Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        try {
            const res = await fetch(`${BASE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('sm_user', JSON.stringify(data.session.user));
                localStorage.setItem('sm_token', data.session.token);
                appState.user = data.session.user;
                appState.token = data.session.token;
                
                initAuthUI();
                closeAuthModal();
                showToast(`Selamat datang kembali, ${data.session.user.username}!`, "success");
                
                // Reset inputs
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';

                // Refresh active details if open
                if (appState.activePlace) {
                    selectPlace(appState.activePlace.id);
                }
            } else {
                showToast(data.error || "Login gagal. Pastikan email & password benar.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Masalah koneksi auth.", "error");
        }
    });

    // Submit Register form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const campus = document.getElementById('regCampus').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        if (password.length < 6) {
            showToast("Kata sandi minimal 6 karakter.", "error");
            return;
        }

        try {
            const res = await fetch(`${BASE_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username, campus })
            });
            const data = await res.json();

            if (data.success) {
                showToast("Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.", "success");
                
                // Toggle back to login
                toggleAuthForms(false);
                document.getElementById('loginEmail').value = email;
                
                // Reset inputs
                document.getElementById('regUsername').value = '';
                document.getElementById('regCampus').value = '';
                document.getElementById('regEmail').value = '';
                document.getElementById('regPassword').value = '';
            } else {
                showToast(data.error || "Pendaftaran gagal.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Masalah koneksi register.", "error");
        }
    });

    // Write Review Button
    document.getElementById('writeReviewBtn').addEventListener('click', () => {
        if (!appState.user) {
            showToast("Silakan login terlebih dahulu untuk menulis ulasan.", "info");
            openAuthModal();
            return;
        }
        
        const form = document.getElementById('reviewForm');
        form.classList.toggle('hidden');
        updateStarRatingUI(5); // Reset stars to 5
    });

    // Cancel review
    document.getElementById('cancelReviewBtn').addEventListener('click', () => {
        document.getElementById('reviewForm').classList.add('hidden');
    });

    // Star rating buttons binding
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const val = parseInt(star.getAttribute('data-val'));
            updateStarRatingUI(val);
        });
    });

    // Submit Review form
    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!appState.user) return;

        const comment = document.getElementById('reviewComment').value;
        const rating = appState.ratingSelection;

        if (!comment.trim()) {
            showToast("Komentar ulasan tidak boleh kosong.", "error");
            return;
        }

        try {
            const res = await fetch(`${BASE_API_URL}/api/places/${appState.activePlace.id}/reviews`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${appState.token}`
                },
                body: JSON.stringify({
                    rating,
                    comment,
                    userId: appState.user.id,
                    username: appState.user.username
                })
            });
            const data = await res.json();

            if (data.success) {
                showToast("Ulasan berhasil dikirim!", "success");
                
                // Reset and hide form
                document.getElementById('reviewComment').value = '';
                document.getElementById('reviewForm').classList.add('hidden');
                
                // Refresh place details
                selectPlace(appState.activePlace.id);
            } else {
                showToast(data.error || "Gagal mengirim ulasan.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Terjadi kesalahan jaringan.", "error");
        }
    });
}

// Make voteTag accessible in window context for dynamically inserted HTML click triggers
window.voteTag = voteTag;
