// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Box {
    uint256 private _value;
    event ValueChanged(uint256 newValue);

    function store(uint256 newValue) public {
        _value = newValue;
        emit ValueChanged(newValue);
    }

    function retrieve() public view returns (uint256) {
        return _value;
    }
}


//TEST CONTRACT TO RUN HARDHAT