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
let statsPerGame = {};

// Helpers
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false; // arrays are not the same length, so they can't be equal
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false; // found a mismatch, so arrays are not equal
    }
  }

  return true; // arrays are equal
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadGameInventory(id) {
  const newUrl = `${uri}#${id}`;
  window.location.href = newUrl;
  const maxValue = Number(document.getElementById("pagecontrol_max").innerText);
  for (let i = 1; i < maxValue; i++) {
    await waitForPageLoad();
    await loadItems();
    console.log(statsPerGame);
    document.getElementById("pagebtn_next").click();
  }
}

let previousItems = [];
function getVisibleInventoryItems() {
  let nodes = document.querySelectorAll('div.inventory_page:not([style*="display: none;"])')[0].childNodes;
  let uri = [];
  let nodesArray = Array.from(nodes);
  for (let i = 0; i < nodesArray.length; i++) {
    uri.push("#" + nodesArray[i].firstChild.id);
  }
  return uri;
}
async function loadItems() {
  let items = getVisibleInventoryItems();
  //console.log(currentItems);

  while (arraysEqual(previousItems, items)) {
    //console.log("wait...", previousItems, items);
    await sleep(500);

    items = getVisibleInventoryItems();
    //console.log(currentItems);
  }

  await sleep(1000);
  previousItems = items;

  let currentIndex = 1;
  let lastIndex = -1;

  return new Promise(resolve => {
    async function loadNextItem() {
      const count = document.getElementsByClassName("inventory_page")[2].childElementCount - document.getElementsByClassName("itemHolder disabled").length;
      if (currentIndex > count) {
        resolve(); // call the callback when all items are loaded
        return;
      }
      lastIndex = await loadItem(currentIndex, items, lastIndex);
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

async function loadItem(index, items, lastIndex) {
  //if (index > items.length) return; // exit if we've reached the end of the items array

  const href = items[index - 1];//.getAttribute("href");
  //console.log(href);
  const newUrlItem = `${uri}${href}`;
  //console.log(newUrlItem);
  window.location.href = newUrlItem;

  await waitForItemInfoLoad();

  if (lastIndex === -1) {
    if (document.getElementById("iteminfo0_item_name").innerText === "") {
      itemNameElement = document.getElementById("iteminfo1_item_name")
      lastIndex = 1;
    } else {
      itemNameElement = document.getElementById("iteminfo0_item_name")
      lastIndex = 0;
    }
  }
  else {
    if (lastIndex == 0) {
      itemNameElement = document.getElementById("iteminfo1_item_name")
      lastIndex = 1;
    } else {
      itemNameElement = document.getElementById("iteminfo0_item_name")
      lastIndex = 0;
    }
  }

  const itemName = itemNameElement ? itemNameElement.innerText : "Unknown Item";
  //console.log(itemName, document.getElementById("iteminfo0_item_name"), document.getElementById("iteminfo1_item_name"));
  if (!statsPerGame[itemName]) {
    statsPerGame[itemName] = 1;
  } else {
    statsPerGame[itemName]++;
  }

  if (!loggedItems[newUrlItem]) {
    //console.log(itemName);
    loggedItems[newUrlItem] = true;
  }
  return lastIndex;
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
