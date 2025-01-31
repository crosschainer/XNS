var address = "";
var chainId = "xian-testnet-12";
var RPC = "https://testnet.xian.org";
var EXPLORER = "https://testnet-explorer.xian.org";
var contract = "con_zyx";
var registrationFee = 1;
const connectWalletButton = document.getElementById("connectWallet");
const addressSpan = document.getElementById("walletAddress");
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
    const searchInput = document.getElementById("searchInput").value.trim();
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
                resultBox.innerHTML = `
                <div class="d-flex flex-column align-items-stretch gap-3">
                    <div class="d-flex align-items-start gap-2">
                        <span class="font-weight-bold">${searchInput.toLowerCase()}</span>
                        <div class="badge badge-danger">is owned!</div>
                    </div>
                    <div class="mb-0">
                        <div class="features">
                            <span class="feature-item">XNS Powered Name</span>
                            <span class="feature-item">NFT ownership</span>
                        </div>
                    
                        <div class="d-flex gap-2 justify-content-between flex-column flex-md-row">
                            <div class="d-flex flex-column gap-1">
                                <span class="text-muted">Owner:</span>
                                <span class="font-weight-bold"><a href="${EXPLORER}/addresses/${owner}" target="_blank">${shortenedOwner}</a></span>
                                ${address === owner ? '<button class="btn btn-success" id="transfer-now">Transfer Ownership</button>' : ``}
                            </div>
                            <div class="d-flex flex-column gap-1">
                                <span class="text-muted">Expires in:</span>
                                <span class="font-weight-bold">${expiryTime} days</span>
                                ${address === owner ? '<button class="btn btn-success" id="renew-now">Add 365 Days (' + registrationFee + ' XIAN)</button>' : ``}
                            </div>
                            <div class="d-flex flex-column gap-1">
                                <span class="text-muted">Address behind name:</span>
                                <span class="font-weight-bold"><a href="${EXPLORER}/addresses/${mainNameToAddress}" target="_blank">${shortenedMainNameToAddress}</a></span>
                                ${address === owner ? '<button class="btn btn-success" id="change-address">Change to My Address</button>' : ``}
                            </div>
                        </div>
                    </div>
                </div>
                `;
                if(document.querySelector("#renew-now")) {
                    document.querySelector("#renew-now").addEventListener("click", () => renewName(searchInput));
                }
                if(document.querySelector("#change-address")) {
                    document.querySelector("#change-address").addEventListener("click", () => changeAddress(searchInput));
                }
                if (document.querySelector("#transfer-now")) {
                    document.querySelector("#transfer-now").addEventListener("click", () => {
                      openTransferOwnershipModal(searchInput);
                    });
                  }
                  
            } else if (owner == "None") {
                resultBox.innerHTML = `
                <div class="d-flex flex-column align-items-stretch gap-3">
                    <div class="d-flex align-items-start gap-2">
                        <span class="font-weight-bold">${searchInput.toLowerCase()}</span>
                        <div class="badge badge-success">is available!</div>
                    </div>
                    <div class="mb-0">
                        <div class="features">
                            <span class="feature-item">XNS Powered Name</span>
                            <span class="feature-item">NFT ownership</span>
                        </div>
                        <p class="mb-0 text-muted">You can mint this name for 1 XIAN. It expires after 1 year, and needs to be renewed before or it will be available for others to mint.</p>
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
        if (newOwnerAddress === "") {
            showToast("Please enter a valid address", "error");
            return;
        }
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
    XianWalletUtils.sendTransaction(
        "currency",            // contract name
        "approve",            // method/function name
        {                      // kwargs (method arguments)
            "to": contract,
            "amount": 1
        },
        // If needed you can put a custom stamp amount here as an additional arg like
        // 100
    ).then(result => {
        if (result.errors) {
            showToast('Approval Transaction failed', 'error');
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
                } else {
                    showToast('Transaction successful', 'success');
                    showResultBox();
                }
            });
        }
    });
}

function renewName(name) {
    if(address === "") {
        showToast("Please connect your wallet first", "error");
        return;
    }
    XianWalletUtils.sendTransaction(
        "currency",            // contract name
        "approve",            // method/function name
        {                      // kwargs (method arguments)
            "to": contract,
            "amount": 1
        },
        // If needed you can put a custom stamp amount here as an additional arg like
        // 100
    ).then(result => {
        if (result.errors) {
            showToast('Approval Transaction failed', 'error');
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
                } else {
                    showToast('Renewal Transaction successful', 'success');
                    showResultBox();
                }
            });
        }
    });
}

function changeAddress(name) {
    if(address === "") {
        showToast("Please connect your wallet first", "error");
        return;
    }
    XianWalletUtils.sendTransaction(
        contract,
        "set_main_name_to_caller",
        {
            "name": name
        }
    ).then(result => {
        if (result.errors) {
            showToast('Change Address Transaction failed', 'error');
        } else {
            showToast('Change Address Transaction successful', 'success');
            showResultBox();
        }
    });
}

function transferNameToAddress(name, address) {
    if(address === "") {
        showToast("Please connect your wallet first", "error");
        return;
    }
    XianWalletUtils.sendTransaction(
        contract,
        "transfer",
        {
            "name": name,
            "to": address
        }
    ).then(result => {
        // Close the modal
        const modalElement = document.getElementById("transferOwnershipModal");
        const transferOwnershipModal = bootstrap.Modal.getInstance(modalElement);
        transferOwnershipModal.hide();
        
        if (result.errors) {
            showToast('Transfer Transaction failed', 'error');
        } else {
            showToast('Transfer Transaction successful', 'success');
            showResultBox();
        }
    });
}


function connectWallet() {
    XianWalletUtils.requestWalletInfo()
    .then(info => {
        
        if (info.locked) {
            showToast('Please unlock your wallet', 'error');
            return;
        }
        if (info.chainId !== chainId) {
            showToast('Please switch to the testnet network in your wallet', 'error');
            return;
        }
        address = info.address;
        connectWalletButton.classList.add("d-none");
        addressSpan.textContent = address.slice(0, 6) + "..." + address.slice(-4);
        addressSpan.classList.remove("d-none");
        if (document.querySelector("#searchInput").value.trim() !== "") {
            showResultBox();
        }
    })
    .catch(error => {
        showToast('Xian Wallet Chrome extension not installed or not responding', 'error');
    });
}


document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("searchButton").addEventListener("click", showResultBox);
document.getElementById("searchInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        showResultBox();
    }
});