pragma solidity ^0.5.0;

import "./SafeMath.sol";
import "./Ownable.sol";
import "./Stoppable.sol";

contract Market is Ownable, Stoppable {
  using SafeMath for uint;
  uint skuCount = 0;
  uint storeCount = 0;
  
  // for circuit breaker
  bool public stopped = false;

  struct Store {
    address payable storeOwner;
    string storeName;
    uint storeSkuCount;
    uint balance;
    mapping (uint=>Item) storeItems;
  }

  enum State {ItemForSale, Sold, Shipped, Recieved}

  struct Item {
    string name;
    uint sku;
    uint price;
    State state;
  }

  mapping(uint => Store) public stores;
  mapping(address => bool) public isAdmin;

  event ForSale(uint _sku, uint _storeID, string _name, uint _quantity);
  event Sold(uint _sku, uint _storeID, uint _quantity);
  event AdminAdded(address _user);
  event AdminRemoved(address _user);
  event StoreAdded(address _owner, string _name, uint _skuCount);
  event StoreRemoved(address _user);
  event StoreBalanceWithdrawn(uint _storeID, uint balanceToWithdraw);
  event ItemDeleted(uint _storeID, uint _sku);

  modifier verifyCaller (address _address) { 
    require (msg.sender == _address); 
    _;
  }

  modifier checkStoreExistence(uint _storeID) {
    require(_storeID <= storeCount, "Invalid StoreID provided");
    _;
  }

  modifier checkOwnerOfStore(address _storeOwner, uint _storeID) {
    require (_storeOwner == stores[_storeID].storeOwner, "You don't Permissions to temper with someone else's store");
    _;
  }

  modifier paidEnough(uint _totalPrice) { 
    require(msg.value >= _totalPrice); 
    _;
  }

  modifier checkQuantity(uint _quantity, uint _storeID, uint _itemCode) {
    require(_quantity <= stores[_storeID].storeItems[_itemCode].sku, "Not sufficient quantity available");
    _;
  }

  modifier ItemForSale(uint _sku, uint _storeID) {
    require(stores[_storeID].storeItems[_sku].state == State.ItemForSale, "Item not for sale :(");
    _;
  }

  modifier sold(uint _sku, uint _storeID) {
    require(stores[_storeID].storeItems[_sku].state == State.Sold, "Error selling item.");
    _;
  }

  constructor() public {
    // skuCount = 0;
  }
  
  function getStoreItemCount(uint _storeID)
    public
    view
    returns(uint)
  {
      return stores[_storeID].storeSkuCount;
  }
  
  function getStoreCount()
    public
    view
    returns(uint)
  {
      return storeCount;
  }

  function addItem(string memory _name, uint _price, uint _sku, uint _storeID) public 
    checkOwnerOfStore(msg.sender, _storeID)
    stopInEmergency()
  {
    require(bytes(_name).length <= 20, "Please keep name under 20 chars"); // This makes sure that we don't end up using infinite gas
    skuCount = SafeMath.add(skuCount, 1); // increase overall items count
    stores[_storeID].storeSkuCount = SafeMath.add(stores[_storeID].storeSkuCount, 1); // increase overall items count
    stores[_storeID].storeItems[skuCount].name = _name;
    stores[_storeID].storeItems[skuCount].price = _price;
    stores[_storeID].storeItems[skuCount].sku = _sku;
    emit ForSale(skuCount, _storeID, _name, _sku);
  }

  function deleteItem(uint _sku, uint _storeID) public 
    checkOwnerOfStore(msg.sender, _storeID)
    stopInEmergency()
  {
    delete stores[_storeID].storeItems[_sku];
    emit ItemDeleted(_storeID, _sku);
  }

  function buyItem(uint _sku, uint _quantity, uint _storeID)
    public
    payable
    stopInEmergency()
    ItemForSale(_sku, _storeID)
    paidEnough(SafeMath.mul(stores[_storeID].storeItems[_sku].price, _quantity))
  {
    uint transactAmount = SafeMath.mul(stores[_storeID].storeItems[_sku].price, _quantity);
    stores[_storeID].storeItems[_sku].sku = SafeMath.sub(stores[_storeID].storeItems[_sku].sku,  _quantity);
    stores[_storeID].balance = SafeMath.add(stores[_storeID].balance, transactAmount);
    emit Sold(_sku, _storeID, _quantity);
  }
  
  function withdrawStoreBalance(uint _storeID, uint amountToWithdraw)
    public
    payable
    stopInEmergency()
    checkOwnerOfStore(msg.sender, _storeID)
  {
    require(amountToWithdraw <= stores[_storeID].balance);
    stores[_storeID].storeOwner.transfer(amountToWithdraw);
    stores[_storeID].balance = SafeMath.sub(stores[_storeID].balance, amountToWithdraw);
    emit StoreBalanceWithdrawn(_storeID, amountToWithdraw);
  }
  
  function fetchItem(uint _sku, uint _storeID)
    stopInEmergency()
    public 
    view
    returns (string memory name, uint sku, uint price, uint state) 
  {
    Item memory item = stores[_storeID].storeItems[_sku];
    name = item.name;
    sku = item.sku;
    price = item.price;
    state = uint(item.state);
    return (name, sku, price, state);
  }

  function addStore(string memory _name, address payable _storeOwner, uint _storeSkuCount) 
    public
    stopInEmergency()
    onlyOwner()
  {
    require(bytes(_name).length <= 20, "Please keep name under 20 charachters"); // This makes sure that we don't end up using infinite gas.
    stores[storeCount].storeName = _name;
    stores[storeCount].storeOwner = _storeOwner;
    stores[storeCount].storeSkuCount = _storeSkuCount;
    storeCount = SafeMath.add(storeCount, 1);
    emit StoreAdded(_storeOwner, _name, _storeSkuCount);
  }
  
  function freezeMarket() 
    public
    onlyOwner()
  {
    stopped = true;      
  }
  
  function resumeMarket()
    public
    onlyOwner()
  {
    stopped = false;
  }
  
  function withdrawAll() 
    public
    onlyOwner()
    onlyInEmergency()
  {
    owner.transfer(address(this).balance);
  }
  
  function addAdmin(address _user)
    public
    stopInEmergency()
    onlyOwner()
  {
    isAdmin[_user] = true;
    emit AdminAdded(_user);
  }
  
  function removeAdmin(address _user)
    public
    onlyOwner()
    stopInEmergency()
  {
    isAdmin[_user] = false;
    emit AdminAdded(_user);
  }
  
  
  function getStore(uint _storeID)
    public
    view
    checkStoreExistence(_storeID)
    returns(string memory name, address owner)
  {
    Store memory store = stores[_storeID];
    return (store.storeName, store.storeOwner);
  }
  
  function getStoreBalance(uint _storeID)
    public
    view
    stopInEmergency()
    checkOwnerOfStore(msg.sender, _storeID)
    returns(uint)
  {
    return stores[_storeID].balance;
  }

  // If nothing is mathced do this.
  function() external {
    revert();
  }

}
