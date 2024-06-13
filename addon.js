document.body.style.border = "5px solid red";

// Button to begin stats process
const button = document.createElement("button");
button.textContent = "Load stats";
button.style.position = "fixed";
button.style.top = "10px";
button.style.left = "10px";
document.body.appendChild(button);

// Load games list
const games = document.getElementsByClassName("games_list_tab");
const gameIdArray = Array.from(games).map(el => parseInt(el.id.match(/\d+/)[0]));
const gameObjects = gameIdArray.map(id => ({ id, items: [] }));
console.log(gameObjects);

let uri = window.location.href.split("#")[0];
let loggedItems = {};

async function loadGameInventory(id) {
  const newUrl = `${uri}#${id}`;
  window.location.href = newUrl;
  await waitForPageLoad();
  await loadItems();
}

function loadItems() {
  const maxValue = Number(document.getElementById("pagecontrol_max").innerText);
  const items = [...document.getElementsByClassName("inventory_item_link")].slice(0, 25);

  let currentIndex = 1;

  return new Promise(resolve => {
    async function loadNextItem() {
      if (currentIndex > maxValue) {
        resolve(); // call the callback when all items are loaded
        return;
      }
      await loadItem(currentIndex, items);
      currentIndex++;
      loadNextItem();
    }
    loadNextItem();
  });
}

function isElementHidden(element) {
  const style = window.getComputedStyle(element);
  return style.display === "none";
}

async function loadItem(index, items) {
  if (index > items.length) return; // exit if we've reached the end of the items array

  const href = items[index - 1].getAttribute("href");
  const newUrlItem = `${uri}${href}`;
  console.log(newUrlItem);
  window.location.href = newUrlItem;

  await waitForItemInfoLoad();

  let itemNameElement = "";
  if (!isElementHidden(document.getElementById("iteminfo0_item_name"))) {
    itemNameElement = document.getElementById("iteminfo0_item_name")
  } else {
    itemNameElement = document.getElementById("iteminfo1_item_name")
  }

  const itemName = itemNameElement ? itemNameElement.innerText : "Unknown Item";
  console.log(itemName);
  if (!loggedItems[newUrlItem]) {
    //console.log(itemName);
    loggedItems[newUrlItem] = true;
  }
}
function waitForPageLoad() {
  return new Promise(resolve => {
    const checkReady = () => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        setTimeout(checkReady, 500);
      }
    };
    checkReady();
  });
}

let loadedOnce = false;
let lastLoaded = 0;
function waitForItemInfoLoad() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timeout waiting for item info to load"));
    }, 10000); // 10 seconds timeout
    
    const observer = new MutationObserver((mutations, me) => {
      const iteminfo0 = document.getElementById("iteminfo0");
      const iteminfo1 = document.getElementById("iteminfo1");

      if (loadedOnce) {
        if (!isElementHidden(iteminfo0) && lastLoaded == 1) {
            clearTimeout(timeout);
            me.disconnect(); // stop observing
            resolve();
        }
        else if (!isElementHidden(iteminfo1) && lastLoaded == 0) {
            clearTimeout(timeout);
            me.disconnect(); // stop observing
            resolve();
        }
      } else {
        loadedOnce = true;
        if (!isElementHidden(iteminfo0)) {
          lastLoaded = 0;
        } else {
          lastLoaded = 1;
        }
        if ((iteminfo0 && iteminfo0.contains(document.getElementById("iteminfo0_item_name"))) ||
            (iteminfo1 && iteminfo1.contains(document.getElementById("iteminfo1_item_name")))) {
            clearTimeout(timeout);
            me.disconnect(); // stop observing
            resolve();
        }
      }

      if ((iteminfo0 && iteminfo0.contains(document.getElementById("iteminfo0_item_name"))) ||
          (iteminfo1 && iteminfo1.contains(document.getElementById("iteminfo1_item_name")))) {
        clearTimeout(timeout);
        me.disconnect(); // stop observing
        resolve();
      }
    });

    // Start observing the document for changes
    observer.observe(document, {
      childList: true,
      subtree: true
    });
  });
}

// Event listener for button click
button.addEventListener("click", async () => {
  const currentHash = window.location.hash;
  const currentId = currentHash ? parseInt(currentHash.replace("#", "")) : null;
  if (currentId) {
    await loadGameInventory(currentId);
  } else {
    console.log("No game ID found in the current URI.");
  }
});

//loadAllGameInventories();
