// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Mock Safe contracts for local testing
 * Simplified versions of the actual Safe contracts for development
 */

contract MockSafeSingleton {
    string public constant NAME = "Mock Safe";
    string public constant VERSION = "1.4.1";
    
    mapping(address => uint256) public nonces;
    mapping(address => address[]) public owners;
    mapping(address => uint256) public thresholds;
    
    event SafeSetup(address indexed initiator, address[] owners, uint256 threshold);
    
    function setup(
        address[] calldata _owners,
        uint256 _threshold,
        address to,
        bytes calldata data,
        address fallbackHandler,
        address paymentToken,
        uint256 payment,
        address payable paymentReceiver
    ) external {
        require(_owners.length > 0, "No owners provided");
        require(_threshold > 0 && _threshold <= _owners.length, "Invalid threshold");
        
        owners[address(this)] = _owners;
        thresholds[address(this)] = _threshold;
        
        emit SafeSetup(msg.sender, _owners, _threshold);
    }
    
    function getOwners() external view returns (address[] memory) {
        return owners[address(this)];
    }
    
    function getThreshold() external view returns (uint256) {
        return thresholds[address(this)];
    }
    
    function nonce() external view returns (uint256) {
        return nonces[address(this)];
    }
}

contract MockSafeProxyFactory {
    address public immutable singleton;
    
    event ProxyCreation(address indexed proxy, address singleton);
    
    constructor(address _singleton) {
        singleton = _singleton;
    }
    
    function createProxy(address _singleton, bytes memory initializer) 
        public 
        returns (MockSafeProxy proxy) 
    {
        proxy = new MockSafeProxy(_singleton);
        if (initializer.length > 0) {
            (bool success,) = address(proxy).call(initializer);
            require(success, "Initialization failed");
        }
        emit ProxyCreation(address(proxy), _singleton);
    }
    
    function createProxyWithNonce(
        address _singleton,
        bytes memory initializer,
        uint256 saltNonce
    ) public returns (MockSafeProxy proxy) {
        bytes32 salt = keccak256(abi.encodePacked(keccak256(initializer), saltNonce));
        proxy = new MockSafeProxy{salt: salt}(_singleton);
        if (initializer.length > 0) {
            (bool success,) = address(proxy).call(initializer);
            require(success, "Initialization failed");
        }
        emit ProxyCreation(address(proxy), _singleton);
    }
}

contract MockSafeProxy {
    address private immutable singleton;
    
    constructor(address _singleton) {
        singleton = _singleton;
    }
    
    fallback() external payable {
        address target = singleton;
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), target, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}