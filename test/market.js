const MarketPlace = artifacts.require("./Market.sol");

contract("Market", accounts => {
  it("...should store the value 89.", async () => {
    const marketInstance = await MarketPlace.deployed();

    // Set value of 89
    await marketInstance.set(89, { from: accounts[0] });

    // Get stored value
    const checkVal = await marketInstance.get.call();

    assert.equal(checkVal, 89, "The value 89 was not stored.");
  });
});
