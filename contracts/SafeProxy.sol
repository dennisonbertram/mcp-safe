// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SafeProxy {
    address public implementation;
    address public owner;
    
    constructor(address _implementation) {
        implementation = _implementation;
        owner = msg.sender;
    }
    
    function setImplementation(address _implementation) public {
        require(msg.sender == owner, "Not owner");
        implementation = _implementation;
    }
}