/* =====================================================================
   XNS – very‑light client‑side router
   ---------------------------------------------------------------------
   ▸ No full‑page reloads. We simply toggle display of the two big blocks
     (#mainContent and #marketplaceContainer).
   ▸ Keeps the hash (#market) in sync so the page is bookmarkable and the
     browser Back/Forward buttons still work – but *without* a reload.
   =====================================================================*/

// main sections
const mainContent          = document.getElementById("mainContent");
const marketplaceContainer = document.getElementById("marketplaceContainer");

// helper toggles ---------------------------------------------------------
function showHomeView() {
  marketplaceContainer.classList.add("d-none");
  mainContent.classList.remove("d-none");
}

async function showMarketplaceView(page = 1) {
  mainContent.classList.add("d-none");
  marketplaceContainer.classList.remove("d-none");
  await renderMarketplace(page);  // your existing renderer
}

// ----------------------------------------------------------------------------
//  NAV – “Marketplace” link added in the HTML with id="marketplaceLink"
// ----------------------------------------------------------------------------

const mpNav = document.getElementById("marketplaceLink");
if (mpNav) {
  mpNav.addEventListener("click", (e) => {
    e.preventDefault();
    if (location.hash !== "#market") {
      history.pushState({ view:"market" }, "", "#market");
    }
    if (window.location.search) {
        // If there are search parameters, remove them
        history.replaceState({}, "", window.location.pathname + "#market");
        }
    showMarketplaceView();
  });
}

const logoLink = document.getElementById("logoLink");
if (logoLink) {
  logoLink.addEventListener("click", (e) => {
    e.preventDefault();
    history.replaceState({}, "", window.location.pathname + "#");
    showHomeView();
    });
}

// ----------------------------------------------------------------------------
//  restore view on back/forward ---------------------------------------------
// ----------------------------------------------------------------------------
window.addEventListener("popstate", () => {
  if (location.hash === "#market") {
    showMarketplaceView();
   
  } else {
    showHomeView();
  }
});

// ----------------------------------------------------------------------------
//  initial view (on first load / F5) ----------------------------------------
// ----------------------------------------------------------------------------
if (location.hash === "#market") {
    window.location.search = "";
  showMarketplaceView();
  // Always remove search parameters from the URL
  
} else {
  showHomeView();
}

// ----------------------------------------------------------------------------
//  optional: whenever you cancel a listing or buy a name from the table,      
//  call refreshMarketplace() so the list updates without leaving the view.    
// ----------------------------------------------------------------------------
async function refreshMarketplace() {
  if (!marketplaceContainer.classList.contains("d-none")) {
    await renderMarketplace(mpPage); // mpPage is the current page index
  }
}

// ---------------------------------------------------------------------------
//  hook the existing XNS flow so list updates instantly ---------------------
// ---------------------------------------------------------------------------
//  Place calls like `refreshMarketplace()` after successful list/cancel/buy
//  inside your existing handlers (sell-modal confirm, cancel-listing click,
//  buy-now click, etc.).
// ---------------------------------------------------------------------------
