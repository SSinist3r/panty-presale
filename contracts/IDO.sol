pragma solidity ^0.6.0;

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, 'SafeMath: addition overflow');

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, 'SafeMath: subtraction overflow');
    }

    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, 'SafeMath: multiplication overflow');

        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, 'SafeMath: division by zero');
    }

    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, 'SafeMath: modulo by zero');
    }

    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

interface IBEP20 {
    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address _owner, address spender) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool ok);
}

contract PantySale {
    using SafeMath for uint256;

    IBEP20 public PANTY;

    address payable public owner;

    uint256 public startDate = 1621331210; // Tuesday, 18 May 2021 10:00:00 AM UTC
    uint256 public endDate = 1621504010; // Thursday, 20 May 2021 02:15:00 PM UTC

    uint256 public tokenPrice = 125 * 10**15;                   // $0.125
    uint256 public totalTokensToSell = 10**24;                  // 1M PANTY tokens for sell
    uint256 public pantyPerBnb = 48 * 10**20;                    // 1 BNB = 4800 PANTY
    uint256 public totalSold;

    bool public saleEnded;
    
    mapping(address => uint256) public pantyPerAddresses;

    event tokensBought(address indexed user, uint256 amountSpent, uint256 amountBought, string tokenName, uint256 date);
    event tokensClaimed(address indexed user, uint256 amount, uint256 date);

    modifier checkSaleRequirements(uint256 buyAmount) {
        require(now >= startDate && now < endDate, 'Presale time passed');
        require(saleEnded == false, 'Sale ended');
        require(
            buyAmount > 0 && buyAmount <= unsoldTokens() && PANTY.balanceOf(address(this)) >= buyAmount,
            'Insufficient buy amount'
        );
        _;
    }

    constructor(
        address _PANTY
    ) public {
        owner = msg.sender;
        PANTY = IBEP20(_PANTY);
    }

    // Function to buy PANTY using BNB token
    function buyWithBNB(uint256 buyAmount) public payable checkSaleRequirements(buyAmount) {
        uint256 amount = calculateBNBAmount(buyAmount);
        require(msg.value >= amount, 'Insufficient BNB pay amount');
        
        pantyPerAddresses[msg.sender] = pantyPerAddresses[msg.sender].add(buyAmount);
        totalSold = totalSold.add(buyAmount);
        PANTY.transfer(msg.sender, buyAmount);
        emit tokensBought(msg.sender, amount, buyAmount, 'BNB', now);
    }

    //function to change the owner
    //only owner can call this function
    function changeOwner(address payable _owner) public {
        require(msg.sender == owner);
        owner = _owner;
    }

    // function to set the presale start date
    // only owner can call this function
    function setStartDate(uint256 _startDate) public {
        require(msg.sender == owner && saleEnded == false);
        startDate = _startDate;
    }

    // function to set the presale end date
    // only owner can call this function
    function setEndDate(uint256 _endDate) public {
        require(msg.sender == owner && saleEnded == false);
        endDate = _endDate;
    }

    // function to set the total tokens to sell
    // only owner can call this function
    function setTotalTokensToSell(uint256 _totalTokensToSell) public {
        require(msg.sender == owner);
        totalTokensToSell = _totalTokensToSell;
    }

    // function to set the total tokens to sell
    // only owner can call this function
    function setTokenPricePerBNB(uint256 _pantyPerBnb) public {
        require(msg.sender == owner);
        pantyPerBnb = _pantyPerBnb;
    }

    //function to end the sale
    //only owner can call this function
    function endSale() public {
        require(msg.sender == owner && saleEnded == false);
        saleEnded = true;
    }

    //function to withdraw collected tokens by sale.
    //only owner can call this function

    function withdrawCollectedTokens() public {
        require(msg.sender == owner);
        owner.transfer(address(this).balance);
    }

    //function to withdraw unsold tokens
    //only owner can call this function

    function withdrawUnsoldTokens() public {
        require(msg.sender == owner);
        uint256 unsoldTokens = unsoldTokens();
        require(unsoldTokens > 0);
        PANTY.transfer(owner, unsoldTokens);
    }

    //function to return the amount of unsold tokens
    function unsoldTokens() public view returns (uint256) {
        return totalTokensToSell.sub(totalSold);
    }

    //function to calculate the quantity of PANTY token based on the PANTY price of `tokenName` and its `bnbAmount`
    function calculatePANTYAmount(uint256 bnbAmount) public view returns (uint256) {
        uint256 pantyAmount = pantyPerBnb.mul(bnbAmount).div(10**18);
        return pantyAmount;
    }

    //function to calculate the quantity of `tokenName` needed using its PANTY price to buy `buyAmount` of PANTY tokens.
    function calculateBNBAmount(uint256 tokenAmount) public view returns (uint256) {
        require(pantyPerBnb > 0, "PANTY price per BNB should be greater than 0");
        uint256 bnbAmount = tokenAmount.mul(10**18).div(pantyPerBnb);
        return bnbAmount;
    }
}
