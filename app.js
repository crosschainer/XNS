var address = "";
var chainId = "xian-network-2";
var RPC = "https://node.xian.org";
var EXPLORER = "https://explorer.xian.org";
var contract = "con_name_service_final";
var registrationFee = 100;
const connectWalletButton = document.getElementById("connectWallet");
const addressSpan = document.getElementById("walletAddress");
const ownedNamesContainer = document.getElementById("ownedNamesContainer");
const nameCloud = document.getElementById("nameCloud");
const sendError = document.getElementById("sendError");
let typedInstance = null;
let mainName = null;
let records = [];
let isNameOwner = false;           // <--- ADDED
let currentSearchedName = "";      // <--- ADDED, store last search
let recordsInEditMode = false;     // <--- ADDED, track if we are editing

const placeholderExamples = [
    "Search for your Web3 name...",
    "elon",
    "microsoft",
    "facebook",
    "apple",
    "google",
    "tesla",
    "amazon",
    "xian",
    "blockchain",
    "crypto",
  ];

XianWalletUtils.init(RPC);

function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}

function fromHexString(hexString) {
    return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

function showResultBox() {
    let searchInput = document.getElementById("searchInput").value.trim();
    if (searchInput === "") return;

    // Input needs to be ASCII, ALNUM
    if (!/^[a-zA-Z0-9]+$/.test(searchInput)) {
        showToast("Invalid input. Only ASCII and numbers are allowed.", "error");
        return;
    }
    // Input needs to be 3-32 characters long
    if (searchInput.length < 3 || searchInput.length > 32) {
        showToast("Invalid input. Name must be between 3 and 32 characters long.", "error");
        return;
    }

    searchInput = searchInput.toLowerCase();
    currentSearchedName = searchInput; // <--- ADDED

     // Update ?name= in the URL (without reloading the page)
    const params = new URLSearchParams(window.location.search);
    params.set("name", searchInput);
    window.history.replaceState({}, "", `?${params.toString()}`);

    const resultBox = document.getElementById("resultBox");

    // Temporarily hide the content for a smoother transition
    resultBox.style.opacity = "0";
    resultBox.style.transform = "scale(0.95)";
    resultBox.style.visibility = "hidden"; // Hide it first

    // Replace Search Icon with Spinner to indicate loading
    document.getElementById("searchButton").innerHTML  = '<div class="spinner-border spinner-border-sm" role="status"></div>';

    // Fetch owner and expiry time
    let promises = Promise.all([execute_get_owner(searchInput), execute_get_expiry_time(searchInput), execute_get_main_name_to_address(searchInput)]);

    promises.then(([owner, expiryTime, mainNameToAddress]) => {
        owner = JSON.parse(owner).result;
        if (owner != "None") {
            owner = owner.replaceAll("'", "");
        }
        let shortenedOwner = owner.slice(0, 6) + "..." + owner.slice(-4);
        shortenedOwner = shortenedOwner === "None" ? "Unset" : shortenedOwner.replaceAll("'", "");
        expiryTime = JSON.parse(expiryTime).result;
        // Convert expiry time (2026-01-31 12:28:20) to days
        let expiryDate = new Date(expiryTime);
        let currentDate = new Date();
        let timeDifference = expiryDate.getTime() - currentDate.getTime();
        let daysDifference = timeDifference / (1000 * 3600 * 24);
        expiryTime = Math.ceil(daysDifference);
        mainNameToAddress = JSON.parse(mainNameToAddress).result;
        let shortenedMainNameToAddress = "";
        if (mainNameToAddress !== "None") {
            shortenedMainNameToAddress = mainNameToAddress.slice(0, 6) + "..." + mainNameToAddress.slice(-4);
            shortenedMainNameToAddress = shortenedMainNameToAddress === "None" ? "Unset" : shortenedMainNameToAddress.replaceAll("'", "");
        }
        else {
            shortenedMainNameToAddress = "Unset";
        }

        setTimeout(() => {
            if (owner !== "None") {
              isNameOwner = (address === owner); // <--- ADDED
                resultBox.innerHTML = `
                <div class="d-flex flex-column align-items-stretch gap-3">
                    <div class="d-flex align-items-start gap-2">
                        <span class="font-weight-bold">${searchInput.toLowerCase()}</span>
                        <div class="badge badge-danger">is owned!</div>
                    </div>
                    <div class="mb-0">
                        <div class="features">
                            <span class="feature-item">XNS Powered Name <i class="bi bi-question-circle ms-1"
     data-bs-toggle="popover"
     data-bs-trigger="hover focus"
     data-bs-html="true"
     data-bs-title="What is XNS Powered Name?"
     data-bs-content="
       - Can be used as a receiver in the Xian Wallet to solve the issue of accidentally sending to the wrong address.<br />
       - In the blockchain explorer, the address behind the name will appear as the name.<br />
       - The address behind the name can be found by their name on the explorer.<br />
       And more to come...
     ">
  </i></span>
                            <span class="feature-item">NFT ownership</span>
                        </div>
                    
                        <div class="d-flex gap-2 justify-content-between flex-column flex-md-row">
                            <div class="d-flex flex-column gap-1 flex-1">
                                <span class="text-muted">NFT Owner:</span>
                                <span class="font-weight-bold"><a href="${EXPLORER}/addresses/${owner}" target="_blank">${shortenedOwner}</a></span>
                                <button class="btn btn-success ${address === owner ? '': 'btn-disabled'}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="${address === owner ? '' : 'You are not the owner of this name'}" id="transfer-now">Transfer Ownership</button>
                            </div>
                            <div class="d-flex flex-column gap-1 flex-1">
                                <span class="text-muted">Expires in:</span>
                                <span class="font-weight-bold">${expiryTime} days</span>
                                <button class="btn btn-success ${address === owner ? '': 'btn-disabled'}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="${address === owner ? '' : 'You are not the owner of this name'}" id="renew-now">Add 365 Days (` + registrationFee + ` XIAN)</button>
                            </div>
                            <div class="d-flex flex-column gap-1 flex-1">
                                <span class="text-muted">Address behind name:</span>
                                <span class="font-weight-bold"><a href="${EXPLORER}/addresses/${mainNameToAddress}" target="_blank">${shortenedMainNameToAddress}</a></span>
                                <button class="btn btn-success ${address === owner ? '': 'btn-disabled'}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="${address === owner ? '' : 'You are not the owner of this name'}" id="change-address">Change to My Address</button>
                               
                            </div>
                        </div>
                         ${mainNameToAddress != 'None' ? '<a href="https://'+searchInput.toLowerCase()+'.xns.domains" style=" word-wrap: break-word; overflow: hidden; margin-top:20px; display:inline-block; text-decoration: underline;width:100%;" target="_blank">' + searchInput.toLowerCase() + '.xns.domains</a> <i class="bi bi-question-circle ms-1" style=" display: inline-block; vertical-align: super; " data-bs-toggle="popover" data-bs-trigger="hover focus" data-bs-html="true" data-bs-title="What is this URL?" data-bs-content="This URL provides a direct link to the explorer page of the address behind the name."> </i>' : ''}
                         <div id="recordsSection" class="records-section ${mainNameToAddress != 'None' ? '': 'mt-5'}">
                         <h5 class="text-white" style="
                                text-align: left;
                            ">Stored Data</h5>
                            <div id="recordsActions" class="mb-2">
    <!-- We will show/hide these programmatically depending on ownership and edit mode -->
    <button id="editRecordsBtn" class="btn btn-sm btn-outline-light me-2 d-none">Edit Data</button>
    <button id="addRecordBtn" class="btn btn-sm btn-outline-light me-2 d-none">Add Record</button>
    <button id="saveRecordsBtn" class="btn btn-sm btn-success me-2 d-none">Save</button>
    <button id="cancelEditBtn" class="btn btn-sm btn-secondary d-none">Cancel</button>
  </div>
                         <div class="border-radius-8">
                         <table class="table table-dark table-striped custom-table">
                           <thead>
                             <tr>
                               <th scope="col">Key</th>
                               <th scope="col">Value</th>

                               ${address === owner ? '<th scope="col">Actions</th>' : ''}
                             </tr>
                           </thead>
                           <tbody id="recordsTableBody">
                             <!-- Record rows will be dynamically injected here -->
                           </tbody>
                         </table>
                         </div>
                       </div>
                    </div>
                </div>
                `;
                if(document.querySelector("#renew-now") && address === owner) {
                    document.querySelector("#renew-now").addEventListener("click", () => renewName(searchInput));
                }
                if(document.querySelector("#change-address") && address === owner) {
                    document.querySelector("#change-address").addEventListener("click", () => changeAddress(searchInput));
                }
                if (document.querySelector("#transfer-now") && address === owner) {
                    document.querySelector("#transfer-now").addEventListener("click", () => {
                      openTransferOwnershipModal(searchInput);
                    });
                  }

                // Load on-chain records for this name.
                loadOnChainRecords();
                
                  
            } else if (owner == "None") {
              isNameOwner = false; // <--- ADDED
                resultBox.innerHTML = `
                <div class="d-flex flex-column align-items-stretch gap-3">
                    <div class="d-flex align-items-start gap-2">
                        <span class="font-weight-bold">${searchInput.toLowerCase()}</span>
                        <div class="badge badge-success">is available!</div>
                    </div>
                    <div class="mb-0">
                        <div class="features">
                            <span class="feature-item">XNS Powered Name <i class="bi bi-question-circle ms-1"
     data-bs-toggle="popover"
     data-bs-trigger="hover focus"
     data-bs-html="true"
     data-bs-title="What is XNS Powered Name?"
     data-bs-content="
       - Can be used as a receiver in the Xian Wallet to solve the issue of accidentally sending to the wrong address.<br />
       - In the blockchain explorer, the address behind the name will appear as the name.<br />
       - The address behind the name can be found by their name on the explorer.<br />
       And more to come...
     ">
  </i></span>
                            <span class="feature-item">NFT ownership</span>
                        </div>
                        <p class="mb-0 text-muted">You can mint this name for ${registrationFee} XIAN. It expires after 1 year, and needs to be renewed before or it will be available for others to mint.</p>
                    </div>
                    <div>
                        <button class="btn btn-success" id="mint-name">Mint Name</button>
                    </div>
                </div>
                `;

                document.querySelector("#mint-name").addEventListener("click", () => mintName(searchInput));

            }
            
            // Apply smooth appearance
            requestAnimationFrame(() => {
                resultBox.style.visibility = "visible"; // Make it visible
                resultBox.style.opacity = "1";
                resultBox.style.transform = "scale(1)";
            });
            
            // Reset Search Icon
            document.getElementById("searchButton").innerHTML = '<i class="bi bi-search"></i>';

            const popoverTriggerList = [].slice.call(
                document.querySelectorAll('[data-bs-toggle="popover"]')
              );
            
              popoverTriggerList.forEach((popoverTriggerEl) => {
                new bootstrap.Popover(popoverTriggerEl, {
                  // Optionally, customize your popover options here
                  placement: 'top', // or 'auto', 'right', etc.
                  container: 'body', 
                });
              });

               // Initialize tooltips
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });
        }, 100);
    });
}

function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer");

    // Create toast element
    const toast = document.createElement("div");
    toast.classList.add("toast", `toast-${type}`);

    // Add icon based on type
    const icon = type === "success" ? '<i class="bi bi-check-circle"></i>' : '<i class="bi bi-exclamation-triangle"></i>';
    toast.innerHTML = `${icon} ${message}`;

    // Append to container
    toastContainer.appendChild(toast);

    // Show animation
    setTimeout(() => toast.classList.add("show"), 100);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openTransferOwnershipModal(name) {
    // Store the current name in a global or local variable
    window.currentTransferName = name;
  
    // Create a modal instance and open it
    const modalElement = document.getElementById("transferOwnershipModal");
    const transferOwnershipModal = new bootstrap.Modal(modalElement);
    transferOwnershipModal.show();

    // Add event listener to the transfer button
    document.getElementById("confirmTransferButton").addEventListener("click", () => {
        const newOwnerAddress = document.getElementById("newOwnerInput").value.trim();
        
        transferNameToAddress(name, newOwnerAddress);
    });
  }
  

async function execute_get_owner(name) {
    let payload = {
          "sender": "",
          "contract": contract,
          "function": "get_owner",
          "kwargs": {
              "name": name
          }
      };
      let bytes = new TextEncoder().encode(JSON.stringify(payload));
      let hex = toHexString(bytes);
      let response = await fetch(RPC + '/abci_query?path="/simulate_tx/' + hex + '"');
      let data = await response.json();
      let decoded = atob(data.result.response.value);
      return decoded;
}

async function execute_get_expiry_time(name) {
    let payload = {
          "sender": "",
          "contract": contract,
          "function": "get_expiry_time",
          "kwargs": {
              "name": name
          }
      };
      let bytes = new TextEncoder().encode(JSON.stringify(payload));
      let hex = toHexString(bytes);
      let response = await fetch(RPC + '/abci_query?path="/simulate_tx/' + hex + '"');
      let data = await response.json();
      let decoded = atob(data.result.response.value);
      return decoded;
}

async function get_current_main_name() {
    let payload = {
          "sender": "",
          "contract": contract,
          "function": "get_address_to_main_name",
          "kwargs": {
              "address": address
          }
      };
      let bytes = new TextEncoder().encode(JSON.stringify(payload));
      let hex = toHexString(bytes);
      let response = await fetch(RPC + '/abci_query?path="/simulate_tx/' + hex + '"');
      let data = await response.json();
      let decoded = atob(data.result.response.value);
      return decoded;
}

async function execute_get_main_name_to_address(name) {
    let payload = {
            "sender": "",
            "contract": contract,
            "function": "get_main_name_to_address",
            "kwargs": {
                "name": name
            }
        };
        let bytes = new TextEncoder().encode(JSON.stringify(payload));
        let hex = toHexString(bytes);
        let response = await fetch(RPC + '/abci_query?path="/simulate_tx/' + hex + '"');
        let data = await response.json();
        let decoded = atob(data.result.response.value);
        return decoded;
}

function mintName(name) {
    if(address === "") {
        showToast("Please connect your wallet first", "error");
        return;
    }
    document.querySelector("#mint-name").innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
    XianWalletUtils.sendTransaction(
        "currency",            // contract name
        "approve",            // method/function name
        {                      // kwargs (method arguments)
            "to": contract,
            "amount": registrationFee
        },
        // If needed you can put a custom stamp amount here as an additional arg like
        // 100
    ).then(result => {
        if (result.errors) {
            showToast('Approval Transaction failed', 'error');
            document.querySelector("#mint-name").innerHTML = 'Mint Name';
        } else {
            XianWalletUtils.sendTransaction(
                contract,
                "mint_name",
                {
                    "name": name
                }
            ).then(result => {
                if (result.errors) {
                    showToast('Purchase Transaction failed', 'error');
                    document.querySelector("#mint-name").innerHTML = 'Mint Name';
                } else {
                    showToast('Transaction successful', 'success');
                    showResultBox();
                    showOwnedNames(address);
                    document.querySelector("#mint-name").innerHTML = 'Mint Name';
                }
            });
        }
    }).catch(error => {
        document.querySelector("#mint-name").innerHTML = 'Mint Name';
    });
}

function renewName(name) {
    if(address === "") {
        showToast("Please connect your wallet first", "error");
        return;
    }
    document.querySelector("#renew-now").innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
    XianWalletUtils.sendTransaction(
        "currency",            // contract name
        "approve",            // method/function name
        {                      // kwargs (method arguments)
            "to": contract,
            "amount": registrationFee
        },
        // If needed you can put a custom stamp amount here as an additional arg like
        // 100
    ).then(result => {
        if (result.errors) {
            showToast('Approval Transaction failed', 'error');
            document.querySelector("#renew-now").innerHTML = 'Add 365 Days (' + registrationFee + ' XIAN)';
        } else {
            XianWalletUtils.sendTransaction(
                contract,
                "renew_name",
                {
                    "name": name
                }
            ).then(result => {
                if (result.errors) {
                    showToast('Renewal Transaction failed', 'error');
                    document.querySelector("#renew-now").innerHTML = 'Add 365 Days (' + registrationFee + ' XIAN)';
                } else {
                    showToast('Renewal Transaction successful', 'success');
                    showResultBox();
                    document.querySelector("#renew-now").innerHTML = 'Add 365 Days (' + registrationFee + ' XIAN)';
                }
            });
        }
    }).catch(error => {
        document.querySelector("#renew-now").innerHTML = 'Add 365 Days (' + registrationFee + ' XIAN)';
    });
}

function changeAddress(name) {
    if(address === "") {
        showToast("Please connect your wallet first", "error");
        return;
    }
    document.querySelector("#change-address").innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
    XianWalletUtils.sendTransaction(
        contract,
        "set_main_name_to_caller",
        {
            "name": name
        }
    ).then(result => {
        if (result.errors) {
            showToast('Change Address Transaction failed', 'error');
            document.querySelector("#change-address").innerHTML = 'Change to My Address';
        } else {
            showToast('Change Address Transaction successful', 'success');
            showResultBox();
            document.querySelector("#change-address").innerHTML = 'Change to My Address';
        }
    }).catch(error => {
        document.querySelector("#change-address").innerHTML = 'Change to My Address';
    });
}

function transferNameToAddress(name, recipient) {
    sendError.style.display = 'none';
    if (recipient === "") {
        sendError.innerHTML = 'Recipient address is required!';
        sendError.style.display = 'block';
        return;
    }

    let xnsFoundAddress = document.getElementById('xnsFoundAddress');
    if (xnsFoundAddress.innerHTML !== '') {
        recipient = xnsFoundAddress.innerHTML.replaceAll("'", "");
    }

    if (recipient.length !== 64) {
        sendError.innerHTML = 'Invalid recipient address!';
        sendError.style.display = 'block';
        return;
    }

    document.querySelector("#confirmTransferButton").innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
    XianWalletUtils.sendTransaction(
        contract,
        "transfer",
        {
            "name": name,
            "to": recipient
        }
    ).then(result => {
        // Close the modal
        const modalElement = document.getElementById("transferOwnershipModal");
        const transferOwnershipModal = bootstrap.Modal.getInstance(modalElement);
        transferOwnershipModal.hide();

        if (result.errors) {
            showToast('Transfer Transaction failed', 'error');
            document.querySelector("#confirmTransferButton").innerHTML = 'Transfer';
        } else {
            showToast('Transfer Transaction successful', 'success');
            showResultBox();
            showOwnedNames(address);
            document.querySelector("#confirmTransferButton").innerHTML = 'Transfer';
        }
    }).catch(error => {
        document.querySelector("#confirmTransferButton").innerHTML = 'Transfer';
    });
}

async function check_expiry_of_names(names) {
    if (names.length === 0) return [];

    // Construct the GraphQL query dynamically
    let conditions = names.map(name => `{ key: { equalTo: "${contract}.expiry_times:${name}" } }`).join(", ");
    
    const query = `
        query expiryDates {
            allStates(
                filter: { or: [ ${conditions} ] }
            ) {
                edges {
                    node {
                        key
                        value
                    }
                }
            }
        }
    `;

    try {
        const data = await graphqlFetch(query);
        const edges = data.allStates?.edges || [];

        let validNames = [];
        const now = new Date();

        edges.forEach(edge => {
            const keyParts = edge.node.key.split(":");
            const name = keyParts[1]; // Extract the name from "con_name_service_final.expiry_times:<name>"
            const expiryTime = new Date(edge.node.value);

            if (expiryTime > now) {
                console.log("Name", name, "expires on", expiryTime, "now is", now, "so it's valid");
                validNames.push(name); // Only keep non-expired names
            }
        });

        return validNames;
    } catch (error) {
        console.error("Error fetching expiry dates:", error);
        return [];
    }
}


async function graphqlFetch(query, variables = {}) {
    try {
      const response = await fetch(RPC + "/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
  
      if (!response.ok) {
        throw new Error(`GraphQL request failed with status ${response.status}`);
      }
  
      const json = await response.json();
  
      if (json.errors) {
        // If GraphQL returned errors, throw the first one or handle accordingly
        throw new Error(json.errors[0]?.message || "GraphQL Error");
      }
  
      return json.data;
    } catch (error) {
      console.error("GraphQL Fetch Error:", error);
      throw error; // re-throw so the caller can handle it
    }
  }

async function showOwnedNames(userAddress) {
    mainName = await get_current_main_name();
    mainName = JSON.parse(mainName).result.replaceAll("'", "");

    if (ownedNamesContainer.classList.contains("d-none")) {
        ownedNamesContainer.classList.remove("d-none");
    }

    nameCloud.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';

    // 1. Call fetchOwnedNames
    let names = await fetchOwnedNames(userAddress);

    // 2. Check expiry of list of names and remove expired names
    names = await check_expiry_of_names(names);

    nameCloud.innerHTML = ""; // clear previous
  
    // 3. If no names, show a message
    if (!names || names.length === 0) {
      nameCloud.innerHTML = `<p class="text-muted">You don't own any names yet.</p>`;
      return;
    }
  
    // 4. Create pill elements for each name
    names.forEach((name) => {
      const pill = document.createElement("span");
      pill.classList.add("name-pill");
      if (name === mainName) {
        pill.classList.add("main-name");
      }
      pill.textContent = name;
  
      // Optional: clicking a name triggers a name detail function
      pill.addEventListener("click", () => {
        stopTypedPlaceholder();

        document.getElementById("searchInput").value = name;
        showResultBox();
      });
      nameCloud.appendChild(pill);
    });
  }

  async function fetchOwnedNames(userAddress) {
    // 1. Create the query with a $prefix variable
    const query = `
      query ownedNames($prefix: String!) {
        allStates(
          filter: {
            and: {
              key: { startsWith: $prefix }
              value: { equalTo: "1" }
            }
          }
        ) {
          edges {
            node {
              key
              value
            }
          }
        }
      }
    `;
  
    // 2. Build the prefix: "con_name_service_final.balances:<userAddress>"
    const prefix = contract + ".balances:" + userAddress;
  
    // 3. Call graphqlFetch
    const data = await graphqlFetch(query, { prefix });
  
    // 4. Extract keys from the result
    const edges = data.allStates?.edges || [];
  
    // 5. Parse out the XNS name from each key
    const names = edges.map((edge) => {
      const key = edge.node.key; // e.g. "con_name_service_final.balances:7067...:xnsname"
      const parts = key.split(":");
      // parts[0] => "con_name_service_final.balances"
      // parts[1] => user address
      // parts[2] => xns name
      return parts[2];
    });
  
    return names;
  }

function connectWallet() {
    // We show a loading spinner while the wallet is being connected
    document.querySelector("#connectWallet").innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
    XianWalletUtils.requestWalletInfo()
    .then(info => {
        
        if (info.locked) {
            showToast('Please unlock your wallet', 'error');
            return;
        }
        if (info.chainId == "xian-network-2") {
            chainId = "xian-network-2";
            RPC = "https://node.xian.org";
            EXPLORER = "https://explorer.xian.org";
            contract = "con_name_service_final";
            registrationFee = 100;
        }
        if (info.chainId == "xian-testnet-12") {
            chainId = "xian-testnet-12";
            RPC = "https://testnet.xian.org";
            EXPLORER = "https://testnet-explorer.xian.org";
            contract = "con_name_service";
            registrationFee = 1;
        }
        address = info.address;
        connectWalletButton.classList.add("d-none");
        addressSpan.textContent = address.slice(0, 6) + "..." + address.slice(-4);
        addressSpan.classList.remove("d-none");
        if (document.querySelector("#searchInput").value.trim() !== "") {
            showResultBox();
        }
        showOwnedNames(address);
        
    })
    .catch(error => {
        showToast('Xian Wallet Chrome extension not installed or not responding', 'error');
        document.querySelector("#connectWallet").innerHTML = 'Connect';
    });
    document.querySelector("#connectWallet").innerHTML = 'Connect';
}

function startTypedPlaceholder() {
    const searchInput = document.getElementById("searchInput");
    const typedPlaceholder = document.getElementById("typedPlaceholder");
  
    // If user typed or arrived via ?name, skip the typed effect
    if (searchInput.value.trim()) {
      typedPlaceholder.style.display = "none";
      return;
    }
  
    // Otherwise, set up the typing animation
    typedInstance = new Typed("#typedPlaceholder", {
      strings: placeholderExamples,
      typeSpeed: 30,
      backSpeed: 30,
      backDelay: 1200,
      loop: true,
      showCursor: true,
      smartBackspace: true,
      onComplete: (self) => {
        // If user starts typing mid-animation, we can hide or stop typed
        // We'll handle that below in the 'input' event as well
      }
    });
  
    // If user starts typing, hide the typed placeholder
    searchInput.addEventListener("input", () => {
      if (searchInput.value.trim()) {
        stopTypedPlaceholder();
      }
    });
  }

  function stopTypedPlaceholder() {
    const typedPlaceholder = document.getElementById("typedPlaceholder");
    typedPlaceholder.style.display = "none";
  
    if (typedInstance) {
      typedInstance.destroy();
      typedInstance = null;
    }
  }

  async function getXNSAddress(){
    let name = document.getElementById('newOwnerInput').value;
    let xns_found = document.querySelector('.xns-found');
    document.getElementById('xnsFoundAddress').innerHTML = '';
    xns_found.style.display = 'none';
    if (name === '') return;
    if (name.length < 3) return;
    if (name.length > 32) return;
    if (!/^[a-zA-Z0-9]+$/.test(name)) {
        return;
    }
    let address = await execute_get_main_name_to_address(name);
    address = JSON.parse(address).result;
    if (address === "None") {
        return;
    }
    xns_found.style.display = 'block';
    document.getElementById('xnsFoundAddress').innerHTML = address;

}

// Renders the records table.
function renderRecords(records) {
    const tableBody = document.getElementById('recordsTableBody');
    tableBody.innerHTML = '';
    Object.entries(records).forEach(([key, value], index) => {  
      const row = document.createElement('tr');
      if (value.editMode) {
        // Render inline editing form for this record.
        row.innerHTML = `
          <td>
            <input type="text" class="form-control form-control-sm" value="${key}" data-index="${index}" data-field="key">
          </td>
          <td>
            <input type="text" class="form-control form-control-sm" value="${value}" data-index="${index}" data-field="value">
          </td>
          
        `;
      } else {
        row.innerHTML = `
          <td>${key}</td>
          <td>${value}</td>
          
        `;
      }
      tableBody.appendChild(row);
    });
    if (Object.keys(records).length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="2" class="text-center">No records found</td>';
        tableBody.appendChild(row);
    }
  }
  function renderRecords(recordsObj) {
    // recordsObj is an object: { key1: val1, key2: val2, ... }
  
    const tableBody = document.getElementById('recordsTableBody');
    if (!tableBody) return; // in case we're on the "available" view
  
    tableBody.innerHTML = '';
  
    // Keys sorted or unsorted? You decide
    const keys = Object.keys(recordsObj);
  
    if (keys.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="3" class="text-center">No records found</td>';
      tableBody.appendChild(row);
      return;
    }
  
    keys.forEach((key) => {
      const value = recordsObj[key];
      
      const row = document.createElement('tr');
  
      if (recordsInEditMode && isNameOwner) {
        // Render input fields
        row.innerHTML = `
          <td>
            <input type="text" class="form-control form-control-sm record-key" value="${key}">
          </td>
          <td>
            <input type="text" class="form-control form-control-sm record-value" value="${value}">
          </td>
          <td>
            <button class="btn btn-sm btn-outline-danger delete-record-btn">Delete</button>
          </td>
        `;
      } else {
        // Just show read-only
        row.innerHTML = `
          <td>${key}</td>
          <td>${value}</td>
          ${isNameOwner ? '<td style="width: 100px;"></td>' : ''}
        `;
      }
  
      // If in edit mode, set up delete button
      if (recordsInEditMode && isNameOwner) {
        const deleteBtn = row.querySelector('.delete-record-btn');
        deleteBtn.addEventListener('click', () => {
          // Remove from records object
          delete recordsObj[key];
          renderRecords(recordsObj);
        });
      }
  
      tableBody.appendChild(row);
    });
  }
  
  // We use this after we fetch on-chain data
  async function loadOnChainRecords() {
    try {
      const nameToLoad = document.getElementById("searchInput").value.trim();
      if (!nameToLoad) return;
  
      let payload = {
        "sender": "",
        "contract": contract,
        "function": "get_data",
        "kwargs": {
          "name": nameToLoad
        }
      };
  
      let bytes = new TextEncoder().encode(JSON.stringify(payload));
      let hex = toHexString(bytes);
      let response = await fetch(RPC + '/abci_query?path="/simulate_tx/' + hex + '"');
      let data = await response.json();
      let decoded = atob(data.result.response.value);
      decoded = JSON.parse(decoded);
      
      let onChainRecords = decoded["result"];      // This is the string from the contract
      onChainRecords = onChainRecords.replaceAll("'", '"'); 
      onChainRecords = JSON.parse(onChainRecords); // Convert to object
  
      // `records` is a global
      records = onChainRecords || {};
  
      // Now that we have the records, show them
      renderRecords(records);
  
      // Show/hide the "Edit/Add/Save/Cancel" buttons if user is the owner
      const editBtn = document.getElementById('editRecordsBtn');
      const addBtn = document.getElementById('addRecordBtn');
      const saveBtn = document.getElementById('saveRecordsBtn');
      const cancelBtn = document.getElementById('cancelEditBtn');
  
      if (editBtn) {
        if (isNameOwner) {
          editBtn.classList.remove('d-none');
        } else {
          editBtn.classList.add('d-none');
        }
        // Hide save/cancel by default
        saveBtn.classList.add('d-none');
        cancelBtn.classList.add('d-none');
  
        // Setup event listeners only once
        editBtn.onclick = () => toggleRecordsEdit(true);
        cancelBtn.onclick = () => {
          showResultBox();
          toggleRecordsEdit(false);
        }
        saveBtn.onclick = saveEditedRecords;
        addBtn.onclick = addNewRecordRow;
      }
    } catch (error) {
      console.error("Error loading on-chain records:", error);
    }
  }
  
  // Toggles the entire table into/out-of edit mode
  function toggleRecordsEdit(enableEdit) {
    recordsInEditMode = enableEdit;
  
    const editBtn = document.getElementById('editRecordsBtn');
    const addBtn = document.getElementById('addRecordBtn');
    const saveBtn = document.getElementById('saveRecordsBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
  
    if (enableEdit) {
      editBtn.classList.add('d-none');
      addBtn.classList.remove('d-none');
      saveBtn.classList.remove('d-none');
      cancelBtn.classList.remove('d-none');
    } else {
      editBtn.classList.remove('d-none');
      addBtn.classList.add('d-none');
      saveBtn.classList.add('d-none');
      cancelBtn.classList.add('d-none');
    }
  
    // Re-render
    renderRecords(records);
  }
  
  // Adds a blank row to the records so user can define a new key-value
  function addNewRecordRow() {
    // We'll add a dummy key with a random name to avoid collisions
    let newKey = `new_key_${Math.floor(Math.random() * 9999)}`;
    records[newKey] = "new_value";
    renderRecords(records);
  }
  
  // When the user clicks "Save," gather all rows from the table, 
  // build the updated records object, and send it with setData.
  function saveEditedRecords() {
    // Rebuild `records` from the table rows:
    const tableBody = document.getElementById('recordsTableBody');
    const rows = tableBody.querySelectorAll('tr');
  
    // We'll build a new object, then swap out the global `records`.
    let newRecords = {};
  
    rows.forEach(row => {
      const keyInput = row.querySelector('.record-key');
      const valueInput = row.querySelector('.record-value');
  
      if (keyInput && valueInput) {
        let k = keyInput.value.trim();
        let v = valueInput.value.trim();
        if (k) {
          newRecords[k] = v;
        }
      }
    });
  
    // Now call setData on the contract
    setData(currentSearchedName, newRecords);
  }
  
  // The existing setData function in your code 
  function setData(name, data={}) {
    if(address === "") {
      showToast("Please connect your wallet first", "error");
      return;
    }
    XianWalletUtils.sendTransaction(
      contract,
      "set_data",
      {
        "name": name,
        "data": data
      }
    ).then(result => {
      if (result.errors) {
        showToast('Set Data Transaction failed', 'error');
      } else {
        showToast('Set Data Transaction successful', 'success');
        // Re-load result box to see updated records
        toggleRecordsEdit(false);
        showResultBox();
      }
    }).catch(error => {
      console.error(error);
    });
  }
  

const mintStartDate = new Date("2025-02-07T13:00:00Z"); 
const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");

function updateCountdown() {
  const now = new Date();
  // Use your chain's block time or an API if you want better accuracy.
  const diff = mintStartDate - now;

  if (diff <= 0) {
    // Countdown is over, enable minting
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    // Optionally clear interval
    clearInterval(countdownInterval);
    return;
  }

  // Calculate time left
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  daysEl.textContent = String(d).padStart(2, "0");
  hoursEl.textContent = String(h).padStart(2, "0");
  minutesEl.textContent = String(m).padStart(2, "0");
  secondsEl.textContent = String(s).padStart(2, "0");
}

// Update every second
const countdownInterval = setInterval(updateCountdown, 1000);
updateCountdown(); // initial call

// If date is before mint start date, show countdown
if (new Date() < mintStartDate) {
  document.getElementById("countdownContainer").classList.remove("d-none");
}


document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("searchButton").addEventListener("click", showResultBox);
document.getElementById("searchInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        showResultBox();
    }
});
document.getElementById('newOwnerInput').addEventListener('input', getXNSAddress);

document.addEventListener("DOMContentLoaded", () => {
    // Check the URL for ?name=someName
    const params = new URLSearchParams(window.location.search);
    const nameFromUrl = params.get("name");
    if (nameFromUrl) {
      // Populate search input
      document.getElementById("searchInput").value = nameFromUrl.trim();
      // Immediately show result box for that name
      showResultBox();
    }

    // Start rotating placeholder if there's no name loaded
    startTypedPlaceholder();

  });