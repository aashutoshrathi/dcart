
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

  modifier verifyCaller (address _address) { 
    require (msg.sender == _address); 
    _;
  }
  
  modifier checkOwnerOfStore(address _storeOwner, uint _storeID) {
    require (_storeOwner == stores[_storeID].storeOwner, "No Permissions to temper with someone else's store");
    _;
  }
  
  modifier paidEnough(uint _totalPrice) { require(msg.value >= _totalPrice); _;}
  modifier checkValue(uint _sku, uint _storeID) {
    _;
    uint _price = stores[_storeID].storeItems[_sku].price;
    uint amountToRefund = msg.value - _price;
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
    require(stores[_storeID].storeItems[_sku].state == State.Sold, "Item Sold!");
    _;
  }

  constructor() public {
    skuCount = 0;
  }

  function addItem(string memory _name, uint _price, uint _sku, uint _storeID) public 
    checkOwnerOfStore(msg.sender, _storeID)
    stopInEmergency()
  {
    require(bytes(_name).length <= 20, "Please keep name under 20 chars"); // This makes sure that we don't end up using infinite gas
    skuCount = SafeMath.add(skuCount, 1); // increase overall items count
    stores[_storeID].storeItems[skuCount].name = _name;
    stores[_storeID].storeItems[skuCount].price = _price;
    stores[_storeID].storeItems[skuCount].sku = _sku;
    emit ForSale(skuCount, _storeID, _name, _sku);
  }

  function buyItem(uint _sku, uint _quantity, uint _storeID)
    public
    payable
    stopInEmergency()
    checkValue(_sku, _storeID)
    ItemForSale(_sku, _storeID)
    paidEnough(SafeMath.mul(stores[_storeID].storeItems[_sku].price, _quantity))
  {
    stores[_storeID].storeItems[_sku].sku = SafeMath.sub(stores[_storeID].storeItems[_sku].sku,  _quantity);
    emit Sold(_sku, _storeID, _quantity);
  }

  function fetchItem(uint _sku, uint _storeID) public view returns (string memory name, uint sku, uint price, uint state) {
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
    require(bytes(_name).length <= 20, "Please keep name under 20 chars"); // This makes sure that we don't end up using infinite gas
    storeCount = SafeMath.add(storeCount, 1);
    stores[storeCount].storeName = _name;
    stores[storeCount].storeOwner = _storeOwner;
    stores[storeCount].storeSkuCount = _storeSkuCount;
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
    
}
