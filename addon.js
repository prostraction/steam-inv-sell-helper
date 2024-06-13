document.body.style.border = "5px solid red";

// Load games list
const games = document.getElementsByClassName("games_list_tab");
const gameIdArray = Array.from(games).map(el => parseInt(el.id.match(/\d+/)[0]));
const gameObjects = gameIdArray.map(id => ({ id, items: [] }));
console.log(gameObjects);

// Helper function to wait for page load
function waitForPageLoad(callback) {
  let timeout = 0;
  const interval = setInterval(() => {
    const itemName = document.getElementById("iteminfo0_item_name");
    if (itemName && itemName.innerText.trim() !== "") {
      clearInterval(interval);
      callback();
    }
    timeout += 100;
    if (timeout > 10000) {
      clearInterval(interval);
      console.error("Page load timeout");
    }
  }, 100);
}

// Load each game inventory
let uri; // declare uri here
let loggedItems = {}

for (const id of gameIdArray) {
  // Load new game inventory
  uri = window.location.href.split("#")[0];
  const newUrl = uri + '#' + id;
  window.location.href = newUrl;

  // Wait until the new page is fully loaded
  waitForPageLoad(() => {
    loadItems();
  });
}

function loadItems() {
  // Load all items in page:
  
  const maxValue = Number(document.getElementById("pagecontrol_max").innerText);
  for (let i = 1; i <= maxValue; i++) {
    const items = [...document.getElementsByClassName("inventory_item_link")].slice(0, 25);
    loadItem(0, items);
    //InventoryNextPage();
  }
}

function loadItem(index, items) {
  if (index >= items.length) return;
  const href = items[index].getAttribute("href");
  const newUrlItem = uri + href;
  console.log(newUrlItem);
  window.location.href = newUrlItem;

  waitForPageLoad(() => {
    const itemName = document.getElementById("iteminfo0_item_name").innerText;
    if (!loggedItems[newUrlItem]) {
      console.log(itemName);
      loggedItems[newUrlItem] = true;
    }
    loadItem(index + 1, items);
  });
}