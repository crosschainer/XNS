## Overview

XNS is a decentralized naming system that replaces long, unreadable addresses with short, memorable names. Each name is minted as an NFT and can store additional metadata. To simplify integration, external dApps should use the provided helper functions instead of reading the raw on-chain state. This ensures that expiry logic and data normalization are properly handled. Please use the TX simulator API to run these read-only functions off-chain.

The key read functions available are (Run these functions using the TX simulator API, off-chain!):

1. **`get_data`** – Retrieves metadata stored with a given name.
2. **`get_address_to_main_name`** – Given a wallet address, returns the main name associated with that address (or `"None"` if none is set).
3. **`get_main_name_to_address`** – Given a main name, returns the associated wallet address (or `"None"` if no address is set).

---

## Why Use These Functions?

- **Expiry Awareness:**  
  Raw state does not account for name expiry. The helper functions filter out expired names so that you always work with valid data.

- **Data Normalization:**  
  The functions process and format the raw state into a consistent dictionary (or string) that’s easier to work with.

- **Additional Metadata:**  
  Names can store extra custom fields. The `get_data` function returns this metadata in a structured format.

---

### 1. `get_address_to_main_name`

**Purpose:**  
Resolves a wallet address to the main name currently associated with it.

**Parameters:**  
- `address` (string): The wallet address to look up.

**Returns:**  
- The main name (string) used by that address, or `"None"` if no valid main name is set.

**Example Request Payload:**

```json
{
  "sender": "",
  "contract": "con_name_service_final",
  "function": "get_address_to_main_name",
  "kwargs": {
    "address": "0x123...abc"
  }
}
```

**Example Response:**

```json
{
  "result": "exampleName"
}
```

*or*

```json
{
  "result": "None"
}
```

---

### 2. `get_main_name_to_address`

**Purpose:**  
Resolves a main name to its associated wallet address.

**Parameters:**  
- `name` (string): The main name to look up.

**Returns:**  
- The wallet address (string) associated with the name, or `"None"` if the name is not mapped to any address.

**Example Request Payload:**

```json
{
  "sender": "",
  "contract": "con_name_service_final",
  "function": "get_main_name_to_address",
  "kwargs": {
    "name": "exampleName"
  }
}
```

**Example Response:**

```json
{
  "result": "0x123...abc"
}
```

*or*

```json
{
  "result": "None"
}
```

---

### 3. `get_data`

**Purpose:**  
Retrieves all metadata stored with a specific name.

**Parameters:**  
- `name` (string): The name whose metadata you want to retrieve.

**Returns:**  
- Any additional custom key-value pairs stored with the name.

**Example Request Payload:**

```json
{
  "sender": "",
  "contract": "con_name_service_final",
  "function": "get_data",
  "kwargs": {
    "name": "exampleName"
  }
}
```

**Example Response:**

```json
{
  "result": {
    "customField1": "value1",
    "customField2": "value2"
  }
}
```

---

## Integration Tips

- **Always use these helper functions** instead of querying raw state. They encapsulate expiry logic and return normalized data.

- **Error Handling:**  
  If any function returns `"None"`, ensure your dApp handles it gracefully (e.g., by prompting the user to mint a name or displaying a placeholder).

- **Data Parsing:**  
  The `get_data` function returns a dictionary containing custom metadata. Your dApp can use these fields to provide richer user experiences.

---

## Conclusion

By integrating with XNS through the helper functions `get_data`, `get_address_to_main_name`, and `get_main_name_to_address`, external dApps can reliably resolve names and associated metadata while abstracting away the complexity of raw state handling and expiry checks. This streamlined approach ensures that you always work with accurate, up-to-date data.
