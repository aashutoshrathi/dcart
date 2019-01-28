const MarketPlace = artifacts.require("./Market.sol");

contract("Market", accounts => {
  const owner = accounts[0];
  const alphaUser = accounts[1];
  const betaUser = accounts[2];

  // Test to check creation of store
  it("is able to create store 🏬.", async () => {
    // Get instance of deployed contact
    const market = await MarketPlace.deployed();

    // Add store from alphaUser's account to the blockchain using addStore
    await market.addStore("Ramen Shop", alphaUser, 0, { from: alphaUser });

    // Get Store from stores mapping in blockchain
    const storeData = await market.stores.call(0);

    // Get all attributes from store object using destructuring
    const { storeOwner, storeName, storeSkuCount, storeBalance } = storeData;

    assert.equal("Ramen Shop", storeName, "🛒 Shop name is incorrect.");
    assert.equal(
      alphaUser,
      storeOwner,
      "👛 Address of Shop owner is incorrect."
    );
    assert.equal(0, storeSkuCount, "⚽ Item count for store is incorrect.");
    assert.equal(0, storeBalance, "🏦 Store Balance is incorrect.");
  });

  // Test to check if adding item in store is possible
  it("is able to add an item to owned store 🐟 🍚.", async () => {
    // Get instance of deployed contact
    const market = await MarketPlace.deployed();

    // Add Item to store generated in previous step
    await market.addItem("Fish Ramen", 1000, 2, 0, { from: alphaUser });

    const itemData = await market.fetchItem(0, 0);

    // Get all attributes from item object using destructuring
    const { name, sku, price } = itemData;

    assert.equal("Fish Ramen", name, "🍚 Item name is incorrect.");
    assert.equal(2, sku, "🐟 Item stock count is incorrect.");
    assert.equal(1000, price, "💱 Item price is incorrect.");
  });

  // Test to check if user is able to buy item
  it("is able to buy an item 🛒.", async () => {
    // Get instance of deployed contact
    const market = await MarketPlace.deployed();

    const itemData = await market.fetchItem(0, 0);

    // Get all attributes from store object using destructuring
    const { sku, price } = itemData;
    // Beta user buy item.
    await market.buyItem(0, 1, 0, { from: betaUser, value: price * 1 });

    // Fetch store balance after purchase
    const storeData = await market.stores.call(0);
    const { storeBalance } = storeData;

    assert.equal(1000, storeBalance, "🏬 Updated store balance is incorrect.");
  });

  // Test to check if user is able to view past orders.
  it("is able to view past orders 📚.", async () => {
    // Get instance of deployed contact
    const market = await MarketPlace.deployed();
    // Add Item to store generated in previous step
    await market.addItem("Octo Ramen", 1000, 2, 0, { from: alphaUser });

    const itemData = await market.fetchItem(0, 0);

    // Get all attributes from store object using destructuring
    const { price } = itemData;
    // Beta user buy item.
    await market.buyItem(1, 1, 0, { from: betaUser, value: price * 1 });

    // Get order details using store and itemID for a particular user.
    const order = await market.getOrderDetails(0, 0, { from: betaUser });
    const quantityBought = order[0];
    const priceWhenBought = order[1];

    assert.equal(1000, priceWhenBought, "🏬 Buying price is incorrect.");
    assert.equal(1, quantityBought, "🏬 Quantity bought is incorrect.");
  });

  // Test to check if user is able to withdraw balance from owned store
  it("is able withdraw money from owned store 💰.", async () => {
    // Get instance of deployed contact
    const market = await MarketPlace.deployed();
    await market.withdrawStoreBalance(0, 1000, { from: alphaUser });
    const bal = await market.getStoreBalance(0, { from: alphaUser });
    assert.equal(1000, bal, "🏬 Withdrawal is incorrect.");
  });

  // Test to check if one can get total storecount
  it("is able to get store count 🔢.", async () => {
    // Get instance of deployed contact
    const market = await MarketPlace.deployed();
    const storeCount = await market.getStoreCount.call();
    assert.equal(1, storeCount, "🔢 Store count is incorrect.");
  });

  // Test to check if admin can freeze store
  it("is able to freeze market ❄️", async () => {
    // Get instance of deployed contact
    const market = await MarketPlace.deployed();
    const frozen = await market.isAdmin.call(owner);
    assert.equal(true, frozen, "❄️ Market freeze is incorrect.");
  });
});
