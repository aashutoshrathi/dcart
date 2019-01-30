pragma solidity ^0.5.0;

import "./SafeMath.sol";
import "./Ownable.sol";
import "./Stoppable.sol";

/** @title Market. */
contract Market is Ownable, Stoppable {
  using SafeMath for uint;
  uint skuCount = 0;
  uint storeCount = 0;
  
  // for circuit breaker
  bool public stopped = false;
  
  // User Structure
  struct User{
    string name;
    mapping(uint => mapping(uint => uint)) orders;
    // storeID => itemID => quantity
  }

  /** @dev User Structure defines user.
  */
  struct Store {
    address payable storeOwner;
    string storeName;
    uint storeSkuCount;
    uint storeBalance;
    mapping (uint=>Item) storeItems;
  }

  /** @dev Item defines one item.
  */
  struct Item {
    string name;
    string ipfsImage;
    uint sku;
    uint price;
  }

  mapping(uint => Store) public stores;
  mapping(address => bool) public isAdmin;
  mapping(address => User) public people;

  event ForSale(uint _sku, uint _storeID, string _name, uint _quantity);
  event Sold(uint _sku, uint _storeID, uint _quantity);
  event AdminAdded(address _user);
  event AdminRemoved(address _user);
  event StoreAdded(address _owner, string _name, uint _skuCount);
  event StoreRemoved(address _user);
  event StoreBalanceWithdrawn(uint _storeID, uint balanceToWithdraw);
  event ItemDeleted(uint _storeID, uint _sku);

  // Verifires caller's address
  modifier verifyCaller (address _address) { 
    require (msg.sender == _address); 
    _;
  }

  // Checks if store exists or not
  modifier checkStoreExistence(uint _storeID) {
    require(_storeID <= storeCount, "Invalid StoreID provided");
    _;
  }

  modifier checkOwnerOfStore(address _storeOwner, uint _storeID) {
    // Why I removed fallback string?
    // https://github.com/ethereum/solidity/issues/3971
    require (_storeOwner == stores[_storeID].storeOwner);
    _;
  }
  // Checks if user paid enough
  modifier paidEnough(uint _totalPrice) { 
    require(msg.value >= _totalPrice); 
    _;
  }
  
  modifier checkQuantity(uint _quantity, uint _storeID, uint _itemCode) {
    require(_quantity <= stores[_storeID].storeItems[_itemCode].sku, "Not sufficient quantity available");
    _;
  }
  
  constructor() public {
    isAdmin[owner] = true;
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
  
  function getOrderDetails(uint _storeID, uint _itemCode)
    public
    view
    returns(uint, uint)
  {
    uint quantity = people[msg.sender].orders[_storeID][_itemCode];
    uint price = stores[_storeID].storeItems[_itemCode].price;
    return(quantity, price);
  }

  function addItem(string memory _name, uint _price, uint _sku, uint _storeID, string memory _imageHash) public 
    checkOwnerOfStore(msg.sender, _storeID)
    stopInEmergency()
  {
    require(bytes(_name).length <= 20, "Please keep name under 20 chars"); // This makes sure that we don't end up using infinite gas
    skuCount = SafeMath.add(skuCount, 1);
    uint count = stores[_storeID].storeSkuCount; // increase overall items count
    stores[_storeID].storeItems[count].name = _name;
    stores[_storeID].storeItems[count].price = _price;
    stores[_storeID].storeItems[count].sku = _sku;
    stores[_storeID].storeItems[count].ipfsImage = _imageHash;
    stores[_storeID].storeSkuCount = SafeMath.add(count, 1); // increase overall items count
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
    paidEnough(SafeMath.mul(stores[_storeID].storeItems[_sku].price, _quantity))
  {
    uint transactAmount = SafeMath.mul(stores[_storeID].storeItems[_sku].price, _quantity);
    stores[_storeID].storeItems[_sku].sku = SafeMath.sub(stores[_storeID].storeItems[_sku].sku,  _quantity);
    stores[_storeID].storeBalance = SafeMath.add(stores[_storeID].storeBalance, transactAmount);
    people[msg.sender].orders[_storeID][_sku] = SafeMath.add(people[msg.sender].orders[_storeID][_sku], _quantity);
    emit Sold(_sku, _storeID, _quantity);
  }
  
  function withdrawStoreBalance(uint _storeID, uint amountToWithdraw)
    public
    payable
    stopInEmergency()
    checkOwnerOfStore(msg.sender, _storeID)
  {
    require(amountToWithdraw <= stores[_storeID].storeBalance);
    stores[_storeID].storeOwner.transfer(amountToWithdraw);
    stores[_storeID].storeBalance = SafeMath.sub(stores[_storeID].storeBalance, amountToWithdraw);
    emit StoreBalanceWithdrawn(_storeID, amountToWithdraw);
  }
  
  function fetchItem(uint _sku, uint _storeID)
    stopInEmergency()
    public 
    view
    returns (string memory name, uint sku, uint price, string memory image) 
  {
    Item memory item = stores[_storeID].storeItems[_sku];
    name = item.name;
    sku = item.sku;
    price = item.price;
    image = item.ipfsImage;
    return (name, sku, price, image);
  }

  function addStore(string memory _name, address payable _storeOwner, uint _storeSkuCount) 
    public
    stopInEmergency()
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
    returns(string memory, address, uint)
  {
    Store memory store = stores[_storeID];
    return (store.storeName, store.storeOwner, store.storeSkuCount);
  }
  
  function getStoreBalance(uint _storeID)
    public
    view
    stopInEmergency()
    returns(uint)
  {
    return stores[_storeID].storeBalance;
  }

  // If nothing is mathced do this.
  function() external {
    revert();
  }
}
